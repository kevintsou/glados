"""Minimal stdio MCP client for the local mcp-atlassian server.

Starts the server the same way Claude Code does (command, args, cwd and env from
~/.claude.json), so it uses the same Confluence login; no token is read here.
"""
import json
import os
import re
import subprocess
import threading


def _server_config():
    cfg = json.load(open(os.path.expanduser("~/.claude.json"), encoding="utf-8"))
    if "mcp-atlassian" in cfg.get("mcpServers", {}):
        return cfg["mcpServers"]["mcp-atlassian"]
    for project in cfg.get("projects", {}).values():
        if "mcp-atlassian" in project.get("mcpServers", {}):
            return project["mcpServers"]["mcp-atlassian"]
    raise SystemExit("mcp-atlassian is not configured in ~/.claude.json")


class Mcp:
    def __init__(self):
        c = _server_config()
        env = dict(os.environ)
        env.update(c.get("env", {}))
        self.p = subprocess.Popen([c["command"], *c.get("args", [])], cwd=c.get("cwd"), env=env,
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # drain stderr so the server never blocks on a full pipe
        threading.Thread(target=lambda: [None for _ in self.p.stderr], daemon=True).start()
        self.n = 0
        self._rpc("initialize", {"protocolVersion": "2024-11-05", "capabilities": {},
                                 "clientInfo": {"name": "glados-confluence-sync", "version": "1"}})
        self._send({"jsonrpc": "2.0", "method": "notifications/initialized"})

    def _send(self, msg):
        self.p.stdin.write((json.dumps(msg, ensure_ascii=False) + "\n").encode("utf-8"))
        self.p.stdin.flush()

    def _rpc(self, method, params):
        self.n += 1
        rid = self.n
        self._send({"jsonrpc": "2.0", "id": rid, "method": method, "params": params})
        while True:
            line = self.p.stdout.readline()
            if not line:
                raise RuntimeError("mcp-atlassian closed the connection")
            try:
                msg = json.loads(line)
            except ValueError:
                continue
            if msg.get("id") == rid:
                if "error" in msg:
                    raise RuntimeError(msg["error"])
                return msg["result"]

    def read(self, uri):
        r = self._rpc("resources/read", {"uri": uri})
        return json.loads(r["contents"][0]["text"])

    def page(self, pid):
        return self.read(f"confluence://pages/{pid}")["page"][0]

    def call(self, name, args):
        r = self._rpc("tools/call", {"name": name, "arguments": args})
        text = "".join(c.get("text", "") for c in r.get("content", []))
        return r.get("isError", False), text

    def descendants(self, root_id, site):
        # the children resource stops at 25 items; CQL does not
        err, text = self.call("searchPages", {"cql": f"ancestor = {root_id}", "limit": 1000, "site": site})
        res = json.loads(text)
        if err or not res.get("success", True) or len(res["pages"]) < res.get("total", 0):
            raise RuntimeError(f"descendant search incomplete: {text[:300]}")
        return res["pages"]

    def current_version(self, pid, title, site):
        # the page read does not return the version; an update with a stale one
        # is refused with the current number and changes nothing
        err, text = self.call("updatePage", {"pageId": pid, "version": 1, "title": title,
                                             "content": "<p>x</p>", "site": site})
        m = re.search(r"Current version is: (\d+)", text)
        if not m:
            raise RuntimeError(f"version probe for {pid} did not conflict: {text[:300]}")
        return int(m.group(1))

    def close(self):
        self.p.stdin.close()
        self.p.terminate()
