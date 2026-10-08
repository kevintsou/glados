"""Reproduce the assessment's read-only observations; write only the requested report.

No firmware generation, build, UART/ICE access, or original code-base scan is run.
The missing-package case changes one Python function in this process, then restores it.
"""

import argparse
import copy
import hashlib
import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path
import subprocess
import sys

sys.dont_write_bytecode = True


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git_info(root):
    def run(*args):
        result = subprocess.run(
            ["git", "-C", str(root), *args], capture_output=True,
            text=True, encoding="utf-8", errors="replace", check=True,
        )
        return result.stdout.strip()
    return {"root": str(root), "head": run("rev-parse", "HEAD"),
            "working_tree_status": run("status", "--short").splitlines()}


def input_files(root):
    paths = {root / "bcgen.py", root / "projects" / "ps5910.json"}
    for rel in ("core", "catalog", "bootcode_ai", "checklist", "projects/ps5910/reg"):
        paths.update(p for p in (root / rel).rglob("*")
                     if p.is_file() and "__pycache__" not in p.parts and p.suffix != ".pyc")
    for rel in ("settings.json", "projects/ps5910/reg.json"):
        if (root / rel).is_file():
            paths.add(root / rel)
    return sorted(paths, key=lambda p: p.relative_to(root).as_posix())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bcgen-root", type=Path, required=True)
    parser.add_argument("--glados-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    root = args.bcgen_root.resolve()
    glados = args.glados_root.resolve()
    output = args.output.resolve()
    for repo in (root.parent.parent, glados):
        if output == repo or repo in output.parents:
            parser.error("Store this assessment outside both repositories.")

    files = input_files(root)
    before = {p.relative_to(root).as_posix(): digest(p) for p in files}
    doc_names = ["nodes/P0.md", "nodes/P1.md", "nodes/P2.md", "nodes/P3.md",
                 "framework/02_workflow.md", "framework/03_artifacts.md",
                 "framework/05_checks.md", "framework/07_project_profile.md",
                 "framework/08_open_questions.md", "impl/tools.md", "projects/E39.md"]
    doc_before = {rel: digest(glados / rel) for rel in doc_names}
    sys.path.insert(0, str(root))
    from core import buildgen, codepkg, generate, project, reghdr
    from core.catalog import load_catalog
    from core.util import message

    sample = json.loads((root / "projects/ps5910.json").read_text(encoding="utf-8"))
    catalog = load_catalog()
    package = codepkg.load_package()
    observations = []
    for case in ("sample", "simulation_only", "arm", "missing_package"):
        candidate = copy.deepcopy(sample)
        original = codepkg.load_package
        if case == "simulation_only":
            candidate["basic"]["platforms"] = ["ASIC_SIMULATION"]
        if case == "arm":
            candidate["basic"]["cpu"] = "arm"
        if case == "missing_package":
            codepkg.load_package = lambda path=None: {
                "path": None, "version": None, "modules": {}, "messages": [
                    message("warning", "CODE-PKG-NONE", "in-process missing-package probe", "")]
            }
        try:
            result = project.check_project(candidate, catalog)
            modules = (result.get("code_package") or {}).get("modules", [])
            observations.append({
                "case": case, "synthetic": case != "sample",
                "config_ok": result["ok"],
                "errors": [m["code"] for m in result["messages"] if m["level"] == "error"],
                "warnings": [m["code"] for m in result["messages"] if m["level"] == "warning"],
                "target_descriptors": buildgen.targets(candidate["basic"]),
                "actual_ic_build_supported_by_current_generator":
                    candidate["basic"]["cpu"] == "andes" and bool(buildgen.targets(candidate["basic"])),
                "linker_count": len(result["link"]["lds"]),
                "selected_module_metadata": modules,
                "selected_module_status_counts": dict(Counter(m["status"] for m in modules)),
            })
        finally:
            codepkg.load_package = original

    checked, rendered = generate.generate(sample, catalog)
    generation = {"config_ok": checked["ok"], "disk_generation_executed": False}
    if rendered is not None:
        snapshot = json.loads(rendered["project.json"])
        generation.update({
            "rendered_file_count": len(rendered),
            "note": "Rendered files exclude package/CPU/template/register files copied by write_output.",
            "snapshot_generated_with": snapshot.get("generated_with"),
            "build_sh_has_pipefail": "pipefail" in rendered["build.sh"],
            "build_sh_ends_with_exit_zero": rendered["build.sh"].rstrip().endswith("exit 0"),
        })
    after = {p.relative_to(root).as_posix(): digest(p) for p in files}
    doc_after = {rel: digest(glados / rel) for rel in doc_names}
    changed = [rel for rel in before if before[rel] != after[rel]]
    changed_docs = [rel for rel in doc_before if doc_before[rel] != doc_after[rel]]
    report = {
        "format": "bcgen-glados-assessment-observations/v1",
        "observed_at": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds"),
        "formal_glados_evidence": False,
        "scope": "Read-only local configuration probes and in-memory rendering; no board or build validation.",
        "repositories": {"glados": git_info(glados), "bct_knowledge_base": git_info(root.parent.parent)},
        "package_version": package["version"],
        "package_module_status_counts": dict(Counter(m["status"] for m in package["modules"].values())),
        "sample_basic": sample["basic"],
        "sample_code_override_count": len(sample.get("code", {})),
        "sample_hal_function_count": len((sample.get("hal") or {}).get("functions", {})),
        "sample_register_header_count": len(list(reghdr.reg_dir("ps5910").rglob("*.h"))),
        "observations": observations,
        "in_memory_generation": generation,
        "input_files_sha256": before,
        "glados_document_sha256": doc_before,
        "input_files_changed_during_probe": changed,
        "glados_documents_changed_during_probe": changed_docs,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "cases": len(observations),
                      "input_files_changed": changed, "glados_documents_changed": changed_docs},
                     ensure_ascii=True))


if __name__ == "__main__":
    main()
