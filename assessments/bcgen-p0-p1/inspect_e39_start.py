"""Read-only probe: what bcgen's importer reports for the E39 start point.

Runs bcgen's existing import, config check, target and pitfall functions against
an explicitly given ws_fw/src_root (BCGEN_SRC_ROOT), and reads the DS-5 .cproject
next to it as the reference for build configurations. Nothing is generated, built
or written except the requested report.
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.dont_write_bytecode = True


def digest_bytes(data):
    return hashlib.sha256(data).hexdigest()


def digest(path):
    return digest_bytes(path.read_bytes())


def git(root, *args):
    result = subprocess.run(["git", "-C", str(root), *args], capture_output=True,
                            text=True, encoding="utf-8", errors="replace", check=True)
    return result.stdout.strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--bcgen-root", required=True, type=Path, help="bct_knowledge_base/tools/bcgen")
    ap.add_argument("--src-root", required=True, type=Path, help="start-point repo's ws_fw/src_root")
    ap.add_argument("--ic", default="ps5037")
    ap.add_argument("--expect-commit", help="refuse to run unless the start-point HEAD starts with this")
    ap.add_argument("--output", required=True, type=Path)
    args = ap.parse_args()

    bcgen_root, src_root = args.bcgen_root.resolve(), args.src_root.resolve()
    out = args.output.resolve()
    src_repo = Path(git(src_root, "rev-parse", "--show-toplevel"))
    for repo in (bcgen_root, src_repo):
        if out.is_relative_to(repo):
            sys.exit(f"--output must be outside {repo}")
    head = git(src_repo, "rev-parse", "HEAD")
    if args.expect_commit and not head.startswith(args.expect_commit):
        sys.exit(f"start point HEAD is {head}, expected {args.expect_commit}")

    # bcgen resolves src_root when core is imported; pin it before the import.
    os.environ["BCGEN_SRC_ROOT"] = str(src_root)
    sys.path.insert(0, str(bcgen_root))
    from core import buildgen, importer, pitfalls
    from core.catalog import feature_index, load_catalog
    from core.project import check_project

    proj_dir = src_root / "proj" / args.ic
    ws_fw = src_root.parent
    cproject = ws_fw / ".cproject"
    catalog = load_catalog()
    result = importer.import_project(args.ic, catalog)
    project, notes = result["project"], result["notes"]
    check = check_project(project, catalog)
    applicable = pitfalls.applicable_pitfalls(project["basic"]["cpu"], project["basic"]["series"],
                                              project["features"])

    untracked = git(src_repo, "status", "--short", "--untracked-files=all", "--", "ws_fw/src_root").splitlines()
    package = bcgen_root / "bootcode_ai"
    statuses = Counter(json.loads(p.read_text(encoding="utf-8")).get("status")
                       for p in sorted((package / "modules").glob("*/module.json")))
    kat_defines = sum(len(re.findall(r"#define\s+KAT_\w+_EN\b", p.read_text(encoding="utf-8", errors="replace")))
                      for p in proj_dir.rglob("*.h"))
    cproject_text = cproject.read_text(encoding="utf-8", errors="replace")
    configurations = sorted(set(re.findall(r'<configuration\b[^>]*\bname="([^"]+)"', cproject_text)))

    bcgen_inputs = [bcgen_root / "bcgen.py", *sorted((bcgen_root / "core").glob("*.py")),
                    *sorted((bcgen_root / "catalog").glob("*.json")), bcgen_root / "checklist" / "pitfalls.md"]
    src_inputs = [cproject, *sorted((proj_dir / "scat").iterdir()), proj_dir / "startup.s",
                  proj_dir / "config" / "conf.h"]

    report = {
        "format": "bcgen-e39-start-observations/v1",
        "observed_at": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds"),
        "formal_glados_evidence": False,
        "scope": "Read-only import/check/target/pitfall calls on the E39 start point; no generation, build or board run.",
        "repositories": {
            "bct_knowledge_base": {"root": str(bcgen_root), "head": git(bcgen_root, "rev-parse", "HEAD"),
                                   "working_tree_status": git(bcgen_root, "status", "--short").splitlines()},
            "start_point": {"root": str(src_repo), "head": head,
                            "branch": git(src_repo, "branch", "--show-current"),
                            "tracked_changes_under_ws_fw": git(src_repo, "status", "--short", "--untracked-files=no",
                                                               "--", "ws_fw").splitlines(),
                            "untracked_files_under_src_root": len(untracked),
                            "untracked_c_files_under_src_root": [u for u in untracked if u.endswith(".c")]},
        },
        "package_version": (package / "VERSION").read_text(encoding="utf-8").strip(),
        "package_module_status_counts": dict(statuses),
        "importer": {
            "basic": project["basic"],
            "memory": project["memory"],
            "features": project["features"],
            "catalog_feature_count": len(feature_index(catalog)),
            "code_functions": sorted(project["code"]),
            "params": project["params"],
            "efuse_files": sorted((project.get("efuse") or {}).get("files") or {}),
            "notes": [{k: n[k] for k in ("level", "code", "msg")} for n in notes],
        },
        "check_project": {"ok": check.get("ok"),
                          "messages": [{k: m[k] for k in ("level", "code", "msg")} for m in check.get("messages", [])]},
        "bcgen_targets_from_import": [t["name"] for t in buildgen.targets(project["basic"])],
        "applicable_pitfalls": [{"id": p["id"], "title": p["title"], "checks": p["checks"]}
                                for p in applicable],
        "start_point_facts": {
            "ds5_configurations": configurations,
            "scat_files": sorted(p.name for p in (proj_dir / "scat").iterdir()),
            "importer_markers_present": {name: (proj_dir / "scat" / name).is_file()
                                         for name in ("build_exclude_boot.cfg", "build_exclude_sandaru.cfg",
                                                      "burner.ld", "burner.scat")},
            "kat_en_defines_in_proj": kat_defines,
        },
        "input_sha256": {
            "bcgen": {str(p.relative_to(bcgen_root)).replace("\\", "/"): digest(p) for p in bcgen_inputs},
            "start_point": {str(p.relative_to(src_repo)).replace("\\", "/"): digest(p) for p in src_inputs if p.is_file()},
        },
    }
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
