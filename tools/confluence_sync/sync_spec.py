"""Sync the GLADOS docs at HEAD to the Confluence "GLADOS Spec" page tree.

    python -I -X utf8 tools/confluence_sync/sync_spec.py build   # read Confluence, write the plan; changes nothing
    python -I -X utf8 tools/confluence_sync/sync_spec.py push    # apply the plan; rerun to resume after a failure

See README.md next to this file.
"""
import argparse
import datetime
import hashlib
import html
import html.entities
import json
import pathlib
import posixpath
import re
import subprocess
import sys
import tempfile
import urllib.parse
import xml.dom.minidom

import markdown
from bs4 import BeautifulSoup, NavigableString

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from mcpclient import Mcp  # noqa: E402

ROOT_ID = "1130727668"
SITE = "confluence2"
SPACE = "IPFWI"
GH = "https://github.com/kevintsou/glados"
ROOT_TITLE = "GLADOS Spec｜GitHub 完整版 {version}"
DIAGRAM_PAGE = "GLADOS Spec｜05 流程圖"
# pages outside the tree that link to the root page by title
EXTRA_LINKERS = ["1112671398"]
GROUPS = {"BC": "07.BC bcgen 待辦", "OBC": "07.OBC openBCT 待辦", "SK": "07.SK Skills 待辦"}
CARD_NOTE = "<p><em>待辦狀態為本次 commit 的快照；後續認領、更新與完成狀態以 GitHub 共用來源為準。</em></p>"

ap = argparse.ArgumentParser()
ap.add_argument("mode", choices=["build", "push"])
ap.add_argument("--all", action="store_true", help="update every page, not only the ones that changed")
ap.add_argument("--work", default=str(pathlib.Path(tempfile.gettempdir()) / "glados-confluence-sync"))
args = ap.parse_args()
REPO = pathlib.Path(__file__).resolve().parents[2]
WORK = pathlib.Path(args.work)
CACHE, OUT = WORK / "cache", WORK / "out"


def git(*a):
    return subprocess.run(["git", "-C", str(REPO), *a], capture_output=True, text=True,
                          encoding="utf-8", check=True).stdout


def blob(path):
    """The file as committed at HEAD (not the working tree, which may differ or use CRLF)."""
    return subprocess.run(["git", "-C", str(REPO), "show", f"HEAD:{path}"], capture_output=True, check=True).stdout


def text_of(path):
    return blob(path).decode("utf-8").replace("\r\n", "\n")


# ---- storage-format helpers

def esc(s):
    return html.escape(s, quote=True)


def cdata(s):
    return "<![CDATA[" + s.replace("]]>", "]]]]><![CDATA[>") + "]]>"


def page_link(title, text, anchor=None):
    a = f' ac:anchor="{esc(anchor)}"' if anchor else ""
    return (f'<ac:link{a}><ri:page ri:content-title="{esc(title)}" ri:space-key="{SPACE}" />'
            f"<ac:plain-text-link-body>{cdata(text)}</ac:plain-text-link-body></ac:link>")


def anchor_link(anchor, text):
    return f'<ac:link ac:anchor="{esc(anchor)}"><ac:plain-text-link-body>{cdata(text)}</ac:plain-text-link-body></ac:link>'


def anchor_macro(name):
    return (f'<ac:structured-macro ac:name="anchor" ac:schema-version="1">'
            f'<ac:parameter ac:name="">{esc(name)}</ac:parameter></ac:structured-macro>')


TOC = ('<ac:structured-macro ac:name="toc" ac:schema-version="1">'
       '<ac:parameter ac:name="maxLevel">4</ac:parameter></ac:structured-macro>')
LANG = {"bash": "bash", "powershell": "powershell", "json": "js", "js": "js", "sql": "sql", "yaml": "yml", "yml": "yml"}


def code_macro(text, lang=""):
    return (f'<ac:structured-macro ac:name="code" ac:schema-version="1">'
            f'<ac:parameter ac:name="language">{LANG.get(lang, "none")}</ac:parameter>'
            f"<ac:plain-text-body>{cdata(text)}</ac:plain-text-body></ac:structured-macro>")


def slug(text, seen):
    # GitHub's heading anchors, so links written for GitHub keep working
    s = re.sub(r"[^\w\- ]", "", text.strip().lower()).replace(" ", "-")
    base, n = s, 1
    while s in seen:
        s, n = f"{base}-{n}", n + 1
    seen.add(s)
    return s


def well_formed(x):
    x = re.sub(r"&(\w+);", lambda m: m.group(0) if m.group(1) in ("amp", "lt", "gt", "quot", "apos")
               else f"&#{html.entities.name2codepoint[m.group(1)]};", x)
    xml.dom.minidom.parseString('<r xmlns:ac="a" xmlns:ri="b">' + x + "</r>")


# ---- read the live tree

def walk():
    m = Mcp()
    try:
        root = m.page(ROOT_ID)
        found = [{"id": ROOT_ID, "title": root["title"]}] + m.descendants(ROOT_ID, SITE)
        tree = {}
        for p in found:
            body = root["body"] if p["id"] == ROOT_ID else m.page(p["id"])["body"]
            (CACHE / f"{p['id']}.xml").write_text(body, encoding="utf-8")
            src = re.search(r'原始文件：<a href="[^"]*/blob/[0-9a-f]{40}/([^"]+)"', body)
            up = re.search(r'上層：<ac:link><ri:page ri:content-title="([^"]+)"', body)
            tree[p["id"]] = {"title": p["title"], "source": src.group(1) if src else None,
                             "parent_title": html.unescape(up.group(1)) if up else None}
        by_title = {v["title"]: k for k, v in tree.items()}
        for v in tree.values():
            v["parent"] = by_title.get(v.pop("parent_title"))
        last = re.search(r"Last synced: ([0-9a-f]{40})", root["body"])
        return tree, last.group(1) if last else None
    finally:
        m.close()


def build():
    CACHE.mkdir(parents=True, exist_ok=True)
    if OUT.exists():
        for f in OUT.glob("*.xml"):
            f.unlink()
    OUT.mkdir(parents=True, exist_ok=True)
    commit = git("rev-parse", "HEAD").strip()
    files = set(git("ls-files").split())
    readme = text_of("README.md")
    version = re.search(r"目前是 \*\*(v[\d.]+)\*\*", readme).group(1)
    date = datetime.date.today().isoformat()
    tree, old_commit = walk()
    old_root = tree[ROOT_ID]["title"]
    new_root = ROOT_TITLE.format(version=version)
    old_version = re.search(r"(v[\d.]+)$", old_root).group(1)
    title_of = {pid: v["title"].replace(old_root, new_root) for pid, v in tree.items()}
    page_of_src = {v["source"]: pid for pid, v in tree.items() if v["source"]}
    group = {v["title"].split("｜", 1)[1]: pid for pid, v in tree.items()}

    def h1(path):
        return next(l[2:].strip() for l in text_of(path).splitlines() if l.startswith("# "))

    new = {}
    for f in sorted(files):
        if f in page_of_src or not f.endswith(".md") or f.startswith("tools/"):
            continue
        if f.startswith("framework/"):
            new[f] = (group["01 框架規格"], "GLADOS Spec｜01." + h1(f))
        elif f.startswith("notes/"):
            new[f] = (group["06.B 實作工作說明" if "工作說明" in h1(f) else "06.A 版本提案與閱讀筆記"], "GLADOS Spec｜筆記 " + h1(f))
        elif f.startswith("docs/coordination/tasks/"):
            new[f] = (group[GROUPS[pathlib.Path(f).stem.split("-")[0]]], "GLADOS Spec｜" + h1(f))
        else:
            print("WARNING: no page and no placement rule for", f)
    src_title = {s: title_of[pid] for s, pid in page_of_src.items()}
    src_title.update({s: t for s, (_, t) in new.items()})
    src_title["README.md"] = new_root

    img_width = {}
    for f in CACHE.glob("*.xml"):
        for w, fn in re.findall(r'<ac:image[^>]*ac:width="(\d+)"[^>]*><ri:attachment ri:filename="([^"]+)"',
                                f.read_text(encoding="utf-8")):
            img_width[fn] = w

    def resolve(src, href):
        if re.match(r"^[a-z]+://|^mailto:", href):
            return ("url", href)
        path, _, frag = href.partition("#")
        frag = urllib.parse.unquote(frag)
        if not path:
            return ("anchor", frag)
        target = posixpath.normpath(posixpath.join(posixpath.dirname(src), urllib.parse.unquote(path)))
        if target.startswith(".."):
            return ("ext", target.lstrip("./"))
        for t in (target, target + "/README.md"):
            if t in src_title:
                return ("page", src_title[t], frag or None)
        kind = "tree" if path.endswith("/") or (REPO / target).is_dir() else "blob"
        return ("url", f"{GH}/{kind}/{commit}/{target}" + (f"#{frag}" if frag else ""))

    def ext_text(path, text):
        return f"<code>{esc(path)}</code>" if text.strip() in (path, path.split("/", 1)[-1]) else f"{esc(text)}（<code>{esc(path)}</code>）"

    def md_to_storage(src, text):
        # nested lists: the docs indent by 2, python-markdown wants 4
        lines, fence = [], False
        for line in text.split("\n"):
            if line.strip().startswith("```"):
                fence = not fence
            elif not fence:
                ind = len(line) - len(line.lstrip(" "))
                line = " " * (ind * 2) + line[ind:]
            lines.append(line)
        soup = BeautifulSoup(markdown.markdown("\n".join(lines), extensions=["tables", "fenced_code", "sane_lists"]),
                             "html.parser")
        ph = {}

        def put(node, x):
            key = f"@@PH{len(ph)}@@"
            ph[key] = x
            node.replace_with(NavigableString(key))

        for pre in soup.find_all("pre"):
            code = pre.find("code")
            lang = code["class"][0].replace("language-", "") if code and code.get("class") else ""
            put(pre, code_macro((code or pre).get_text(), lang))
        for img in soup.find_all("img"):
            fn = posixpath.basename(img.get("src", ""))
            if not fn.endswith(".svg"):
                print("WARNING: image not converted", src, img)
                continue
            png = fn[:-4] + ".png"  # the diagrams page holds a PNG of every SVG
            put(img, f'<ac:image ac:alt="{esc(img.get("alt", ""))}" ac:width="{img_width.get(png, "1000")}">'
                     f'<ri:attachment ri:filename="{png}"><ri:page ri:content-title="{esc(DIAGRAM_PAGE)}" '
                     f'ri:space-key="{SPACE}" /></ri:attachment></ac:image>')
        for a in soup.find_all("a"):
            text, r = a.get_text(), resolve(src, a.get("href", ""))
            if r[0] == "page":
                put(a, page_link(r[1], text, r[2]))
            elif r[0] == "anchor":
                put(a, anchor_link(r[1], text))
            elif r[0] == "ext":
                put(a, ext_text(r[1], text))
            else:
                a["href"] = r[1]
        seen = set()
        for h in soup.find_all(re.compile(r"^h[1-6]$")):
            key = f"@@PH{len(ph)}@@"
            ph[key] = anchor_macro(slug(h.get_text(), seen))
            h.insert_before(NavigableString(key))
        s = re.sub(r"<(br|hr|img)([^>]*?)/?>", r"<\1\2 />", soup.decode(formatter="minimal"))
        for k, v in ph.items():
            s = s.replace(k, v)
        return s

    def footer(src=None):
        f = (f'<hr /><p><strong>同步來源：</strong><a href="{GH}/tree/{commit}">kevintsou/glados</a> &middot; {version} '
             f"&middot; GitHub commit <code>{commit}</code> &middot; 同步日期：{date}（Asia/Taipei）</p>")
        if src:
            sha = hashlib.sha256(blob(src)).hexdigest()
            f += f'<p>原始文件：<a href="{GH}/blob/{commit}/{src}">{esc(src)}</a><br />來源檔案 SHA-256：<code>{sha}</code></p>'
        return f + f"<p>Last synced: {commit}</p>"

    def refresh(body):
        # title, commit, version and date only; for pages whose content is not regenerated
        body = body.replace(old_root, new_root)
        if old_commit:
            body = body.replace(old_commit, commit)
        body = body.replace(f"&middot; {old_version} &middot;", f"&middot; {version} &middot;")
        body = re.sub(r'<a href="https://github\.com/kevintsou/glados/blob/[0-9a-f]{40}/(?:\.\./)+([^"]+)">([^<]*)</a>',
                      lambda m: ext_text(m.group(1), m.group(2)), body)
        return re.sub(r"同步日期：\d{4}-\d\d-\d\d", f"同步日期：{date}", body)

    def lead_in(pid):
        # header, intro and child list of the live page, up to its first macro
        old = (CACHE / f"{pid}.xml").read_text(encoding="utf-8")
        return refresh(re.split(r'<ac:structured-macro ac:name="(?:toc|anchor|code)"', old, maxsplit=1)[0])

    def doc(src, prefix):
        text = text_of(src)
        fm = ""
        if text.startswith("---\n"):
            _, fmtext, text = text.split("---", 2)
            fm = code_macro(fmtext.strip("\n") + "\n", "yaml")
        return prefix + TOC + fm + md_to_storage(src, text) + footer(src)

    def child_list(pid, extra):
        kids = sorted([title_of[k] for k, v in tree.items() if v["parent"] == pid] + extra)
        return "<ul>" + "".join(f"<li>{page_link(t, t.split('｜', 1)[1])}</li>" for t in kids) + "</ul>"

    plan = []

    def emit(op, fn, body, **kw):
        (OUT / fn).write_text(body, encoding="utf-8")
        plan.append({"op": op, "file": fn, **kw})

    emit("update", "root.xml", lead_in(ROOT_ID) + TOC + md_to_storage("README.md", readme) + footer("README.md"),
         id=ROOT_ID, title=new_root)
    new_by_parent = {}
    for src, (parent, title) in new.items():
        new_by_parent.setdefault(parent, []).append(title)
        header = (f"<p>上層：{page_link(title_of[parent], title_of[parent])} &middot; {page_link(new_root, '完整規格首頁')}</p>"
                  + (CARD_NOTE if src.startswith("docs/coordination/") else ""))
        emit("create", "new_" + src.replace("/", "_") + ".xml", doc(src, header), parent=parent, title=title)
    for pid, v in tree.items():
        if pid == ROOT_ID:
            continue
        src = v["source"]
        if src and src not in files:
            print("WARNING: source deleted, page left as is:", src, v["title"])
            continue
        live = (CACHE / f"{pid}.xml").read_text(encoding="utf-8")
        live_sha = re.search(r"來源檔案 SHA-256：<code>([0-9a-f]{64})</code>", live)
        stale = src and (not live_sha or live_sha.group(1) != hashlib.sha256(blob(src)).hexdigest())
        if not (args.all or stale or pid in new_by_parent or old_root != new_root):
            continue
        if src and src.endswith(".md"):
            body = doc(src, lead_in(pid))
        elif src or v["parent"]:  # diagram and schema pages, group pages
            body = refresh((CACHE / f"{pid}.xml").read_text(encoding="utf-8"))
            if src:
                body = re.sub(r"(來源檔案 SHA-256：<code>)[0-9a-f]{64}", lambda m: m.group(1) + hashlib.sha256(blob(src)).hexdigest(), body)
        else:
            continue  # hand-written pages under the root are left alone
        if pid in new_by_parent:
            body = re.sub(r"<h2>子頁目錄</h2><ul>.*?</ul>",
                          lambda _: "<h2>子頁目錄</h2>" + child_list(pid, new_by_parent[pid]), body, count=1, flags=re.S)
        emit("update", f"{pid}.xml", body, id=pid, title=title_of[pid])
    if old_root != new_root:
        m = Mcp()
        try:
            for pid in EXTRA_LINKERS:
                p = m.page(pid)
                if old_root in p["body"]:
                    emit("update", f"linker_{pid}.xml", p["body"].replace(old_root, new_root), id=pid, title=p["title"])
        finally:
            m.close()

    bad = 0
    for p in plan:
        try:
            well_formed((OUT / p["file"]).read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            bad += 1
            print("BAD XML", p["file"], e)
    (WORK / "plan.json").write_text(json.dumps({"commit": commit, "ops": plan}, ensure_ascii=False, indent=1), encoding="utf-8")
    (WORK / "done.json").unlink(missing_ok=True)
    print(f"{old_root} ({(old_commit or '?')[:7]}) -> {new_root} ({commit[:7]})")
    print(f"plan: {len(plan)} ops, {sum(p['op'] == 'create' for p in plan)} new pages; bad xml: {bad}; work dir: {WORK}")
    if bad:
        sys.exit(1)


def push():
    plan = json.loads((WORK / "plan.json").read_text(encoding="utf-8"))
    if plan["commit"] != git("rev-parse", "HEAD").strip():
        sys.exit("HEAD moved since build; run build again")
    donef = WORK / "done.json"
    done = json.loads(donef.read_text(encoding="utf-8")) if donef.exists() else {}
    m = Mcp()
    try:
        for i, p in enumerate(plan["ops"]):
            key = p.get("id") or p["title"]
            if key in done:
                continue
            body = (OUT / p["file"]).read_text(encoding="utf-8")
            if p["op"] == "create":
                err, text = m.call("createPage", {"spaceKey": SPACE, "title": p["title"], "content": body,
                                                  "parentId": p["parent"], "site": SITE})
            else:
                v = m.current_version(p["id"], p["title"], SITE)
                err, text = m.call("updatePage", {"pageId": p["id"], "version": v + 1, "title": p["title"],
                                                  "content": body, "site": SITE})
            if err or '"success":false' in text.replace(" ", ""):
                sys.exit(f"FAILED at op {i} ({key}): {text[:600]}")
            done[key] = True
            donef.write_text(json.dumps(done, ensure_ascii=False, indent=1), encoding="utf-8")
            print("ok", i, p["op"], p["title"])
    finally:
        m.close()
    print(f"done {len(done)}/{len(plan['ops'])}")


build() if args.mode == "build" else push()
