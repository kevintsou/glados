// Renders every diagram spec in src/*.mjs to <id>.svg in this folder.
// Layout: ELK (layered, orthogonal edges). Drawing: plain SVG, no foreignObject,
// so the files render the same on GitHub, in browsers and in image viewers.
//
//   cd diagrams && npm install && node build.mjs
import ELK from "elkjs/lib/elk.bundled.js";
import { readdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const FONT = "'PingFang TC','Noto Sans TC','Microsoft JhengHei','Noto Sans CJK TC',system-ui,-apple-system,'Segoe UI',sans-serif";

// ---------- theme ----------------------------------------------------------
const C = {
  ink: "#0F172A", text: "#1E293B", sub: "#475569", muted: "#64748B", line: "#E2E8F0",
  step: { fill: "#EEF4FF", stroke: "#6B8DD6", tag: "#3B5BAA" },
  gate: { fill: "#FFF4E6", stroke: "#E8933B", text: "#8A4B0F" },
  human: { fill: "#FFF4E6", stroke: "#E8933B", text: "#8A4B0F" },
  rule: { fill: "#F3F0FF", stroke: "#9A84D8", text: "#43307A" },
  record: { fill: "#EBFBEE", stroke: "#51A86A", text: "#1E5631" },
  ext: { fill: "#F8FAFC", stroke: "#AAB4C3", text: "#475569" },
  edge: { normal: "#64748B", back: "#D6336C", wait: "#94A3B8", strong: "#334155" },
  group: { fill: "#F8FAFC", stroke: "#CBD5E1", text: "#334155" },
};

// ---------- text measurement (no browser; generous on purpose) -------------
function charW(c, size, bold) {
  const cp = c.codePointAt(0);
  let w;
  if (cp >= 0x2e80) w = 1.0;                       // CJK and full-width punctuation
  else if ("ilj.,:;|!'`".includes(c)) w = 0.3;
  else if ("ftrI()[]{} -".includes(c)) w = 0.38;
  else if ("mwMW".includes(c)) w = 0.86;
  else if (c >= "A" && c <= "Z") w = 0.68;
  else if (c >= "0" && c <= "9") w = 0.58;
  else if ("→↻–—".includes(c)) w = 0.9;
  else w = 0.56;
  return w * size * (bold ? 1.07 : 1);
}
const textW = (s, size, bold = false) => [...s].reduce((a, c) => a + charW(c, size, bold), 0);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const lines = (v) => (v == null ? [] : Array.isArray(v) ? v : String(v).split("\n"));

// ---------- node sizing ------------------------------------------------------
const T = { title: 15, sub: 13, tag: 12, label: 12.5 };
const LH = { title: 21, sub: 19 };
function sizeNode(n) {
  const title = lines(n.title), sub = lines(n.sub);
  const titleW = Math.max(0, ...title.map((t) => textW(t, T.title, true)));
  const tagW = n.tag ? textW(n.tag, T.tag, true) + 14 : 0;
  const row1 = titleW + (n.tag ? tagW + 8 : 0);
  const subW = Math.max(0, ...sub.map((t) => textW(t, T.sub)));
  const padX = { gate: 30, human: 18, decision: 22, record: 18, ext: 20 }[n.kind] ?? 16;
  let w = Math.max(row1, subW) + padX * 2;
  let h = 14 + title.length * LH.title + sub.length * LH.sub + 12;
  if (n.kind === "record") h += 14;
  w = Math.max(w, n.kind === "ext" ? 110 : 128);
  return { w: Math.ceil(w), h: Math.ceil(h), title, sub, tagW };
}

// ---------- shapes -----------------------------------------------------------
const HEX = 16, CYL = 7;
function shapePath(n) {
  const { x, y, width: w, height: h } = n;
  switch (n.kind) {
    case "gate": case "human-gate": {
      const i = HEX;
      return `<path d="M${x + i},${y} H${x + w - i} L${x + w},${y + h / 2} L${x + w - i},${y + h} H${x + i} L${x},${y + h / 2} Z"`;
    }
    case "record": {
      const r = CYL, rx = w / 2;
      return `<path d="M${x},${y + r} A${rx},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${rx},${r} 0 0 1 ${x},${y + h - r} Z M${x},${y + r} A${rx},${r} 0 0 0 ${x + w},${y + r}"`;
    }
    case "ext": return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(h / 2, 22)}"`;
    case "decision": return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(h / 2, 22)}"`;
    case "state": return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"`;
    default: return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"`;
  }
}
const palette = (k) => ({ step: C.step, state: C.step, gate: C.gate, human: C.human, rule: C.rule, decision: C.rule, record: C.record, ext: C.ext, wait: C.ext }[k] ?? C.step);

// Move an edge end point from the layout box onto the drawn outline.
function snap(pt, n, axis) {
  const { x, y, width: w, height: h } = n, cx = x + w / 2, cy = y + h / 2;
  if (n.kind === "gate" || n.kind === "human-gate") {
    if (axis === "h") { const k = HEX * Math.min(1, Math.abs(pt.y - cy) / (h / 2)); return { ...pt, x: pt.x < cx ? x + k : x + w - k }; }
    if (pt.x < x + HEX) { const d = (h / 2) * (1 - (pt.x - x) / HEX); return { ...pt, y: pt.y < cy ? cy - (h / 2 - d) : cy + (h / 2 - d) }; }
    if (pt.x > x + w - HEX) { const d = (h / 2) * (1 - (x + w - pt.x) / HEX); return { ...pt, y: pt.y < cy ? cy - (h / 2 - d) : cy + (h / 2 - d) }; }
    return pt;
  }
  if (n.kind === "record" && axis === "v") {
    const t = Math.max(0, 1 - ((pt.x - cx) / (w / 2)) ** 2), e = CYL * Math.sqrt(t);
    return { ...pt, y: pt.y < cy ? y + CYL - e : y + h - CYL + e };
  }
  if ((n.kind === "ext" || n.kind === "decision") && axis === "h") {
    const r = Math.min(h / 2, 22);
    const dy = Math.abs(pt.y - cy); if (dy >= r && h / 2 > r) return pt;
    const inset = r - Math.sqrt(Math.max(0, r * r - Math.max(0, dy - (h / 2 - r)) ** 2));
    return { ...pt, x: pt.x < cx ? x + inset : x + w - inset };
  }
  return pt;
}

function roundedPath(pts, r = 8) {
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1], q = pts[i], s = pts[i + 1];
    const l1 = Math.hypot(q.x - p.x, q.y - p.y), l2 = Math.hypot(s.x - q.x, s.y - q.y);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const a = { x: q.x - ((q.x - p.x) / l1) * rr, y: q.y - ((q.y - p.y) / l1) * rr };
    const b = { x: q.x + ((s.x - q.x) / l2) * rr, y: q.y + ((s.y - q.y) / l2) * rr };
    d += ` L${a.x},${a.y} Q${q.x},${q.y} ${b.x},${b.y}`;
  }
  const z = pts[pts.length - 1];
  return d + ` L${z.x},${z.y}`;
}

// ---------- drawing ------------------------------------------------------------
function drawNode(n, ox, oy) {
  const p = palette(n.kind), g = { ...n, x: n.x + ox, y: n.y + oy };
  const dash = n.kind === "wait" ? ` stroke-dasharray="5 4"` : "";
  const sw = n.kind === "gate" ? 1.8 : n.kind === "decision" ? 1.6 : 1.3;
  let out = `${shapePath(g)} fill="${p.fill}" stroke="${p.stroke}" stroke-width="${sw}"${dash} filter="url(#sh)"/>`;
  const cx = g.x + g.width / 2;
  let ty = g.y + 14 + (n.kind === "record" ? 7 : 0);
  const titleColor = p.text ?? C.ink;
  n._m.title.forEach((t, i) => {
    const base = ty + 15 + i * LH.title;
    if (n.tag && i === 0) {
      const tw = textW(t, T.title, true), total = n._m.tagW + 8 + tw, left = cx - total / 2;
      out += `<rect x="${left}" y="${base - 14}" width="${n._m.tagW}" height="19" rx="9.5" fill="${C.step.tag}"/>`;
      out += `<text x="${left + n._m.tagW / 2}" y="${base}" font-size="${T.tag}" font-weight="700" fill="#fff" text-anchor="middle">${esc(n.tag)}</text>`;
      out += `<text x="${left + n._m.tagW + 8}" y="${base}" font-size="${T.title}" font-weight="700" fill="${C.ink}">${esc(t)}</text>`;
    } else {
      out += `<text x="${cx}" y="${base}" font-size="${T.title}" font-weight="700" fill="${titleColor}" text-anchor="middle">${esc(t)}</text>`;
    }
  });
  ty += n._m.title.length * LH.title;
  n._m.sub.forEach((t, i) => {
    out += `<text x="${cx}" y="${ty + 14 + i * LH.sub}" font-size="${T.sub}" fill="${n.kind === "step" || n.kind === "state" ? C.sub : titleColor}" text-anchor="middle" opacity="0.92">${esc(t)}</text>`;
  });
  return out;
}

const placed = []; // label boxes already drawn in the current diagram
const hit = (a, b) => a.x < b.x + b.w + 4 && b.x < a.x + a.w + 4 && a.y < b.y + b.h + 4 && b.y < a.y + a.h + 4;
function drawEdge(e, byId, ox, oy) {
  const style = e.style ?? "normal", color = C.edge[style];
  let out = "", lab = "", poly = [];
  for (const s of e.sections ?? []) {
    const pts = [s.startPoint, ...(s.bendPoints ?? []), s.endPoint].map((p) => ({ x: p.x + ox, y: p.y + oy }));
    const src = byId[e.sources[0]], dst = byId[e.targets[0]];
    const absBox = (n) => ({ ...n, x: n.abs.x, y: n.abs.y });
    const ax0 = pts[0].x === pts[1].x ? "v" : "h", ax1 = pts.at(-1).x === pts.at(-2).x ? "v" : "h";
    pts[0] = snap(pts[0], absBox(src), ax0);
    pts[pts.length - 1] = snap(pts.at(-1), absBox(dst), ax1);
    const dash = style === "back" ? ` stroke-dasharray="6 4"` : style === "wait" ? ` stroke-dasharray="3 4"` : "";
    const w = style === "strong" ? 3 : 1.6;
    poly = poly.concat(pts);
    out += `<path d="${roundedPath(pts)}" fill="none" stroke="${color}" stroke-width="${w}"${dash} marker-end="url(#a-${style})"/>`;
  }
  for (const l of e.labels ?? []) {
    // Put the label on its own line: nearest point of the edge to where ELK placed it.
    let x = l.x + ox, y = l.y + oy;
    const c = { x: x + l.width / 2, y: y + l.height / 2 };
    // candidates: every point along the edge, closest to ELK's spot first; take the first that overlaps no other label
    const cands = [];
    for (let i = 0; i + 1 < poly.length; i++) {
      const a = poly[i], b = poly[i + 1], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
      if (len < 24) continue;
      for (let t = 0.15; t <= 0.851; t += 0.05) {
        const q = { x: a.x + t * dx, y: a.y + t * dy };
        cands.push({ ...q, d: Math.hypot(q.x - c.x, q.y - c.y) });
      }
    }
    cands.sort((p, q) => p.d - q.d);
    const pick = cands.find((q) => !placed.some((r) => hit({ x: q.x - l.width / 2, y: q.y - l.height / 2, w: l.width, h: l.height }, r))) ?? cands[0];
    if (pick) { x = pick.x - l.width / 2; y = pick.y - l.height / 2; }
    placed.push({ x, y, w: l.width, h: l.height });
    lab += `<rect x="${x}" y="${y}" width="${l.width}" height="${l.height}" rx="6" fill="#FFFFFF" stroke="${style === "back" ? "#F3B4C8" : C.line}"/>`;
    (l._lines ?? lines(l.text)).forEach((t, i) => {
      lab += `<text x="${x + l.width / 2}" y="${y + 15 + i * 17}" font-size="${T.label}" fill="${style === "back" ? "#A61E4D" : C.text}" text-anchor="middle">${esc(t)}</text>`;
    });
  }
  return { paths: out, labels: lab };
}

const LEGEND = {
  step: ["節點", "step"], gate: ["人工關卡", "gate"], human: ["需要人", "human"], rule: ["串接層的判斷", "rule"],
  decision: ["串接層的判斷", "decision"], record: ["紀錄", "record"], ext: ["圖外的節點或起點", "ext"],
  state: ["狀態", "state"], wait: ["等待", "wait"],
};
function drawLegend(kinds, styles, x, y) {
  let out = "", cx = x;
  const seen = new Set();
  for (const k of kinds) {
    const [label, shape] = LEGEND[k] ?? []; if (!label || seen.has(label)) continue; seen.add(label);
    const p = palette(shape), n = { kind: shape, x: cx, y: y, width: 26, height: 16 };
    const sp = shape === "record" ? `<rect x="${cx}" y="${y}" width="26" height="16" rx="4"` : shape === "gate" || shape === "human-gate" ? shapePath({ ...n, kind: "gate" }).replace(/L/g, "L") : `<rect x="${cx}" y="${y}" width="26" height="16" rx="${shape === "ext" || shape === "decision" ? 8 : 4}"`;
    const hexFix = shape === "gate" ? `<path d="M${cx + 6},${y} H${cx + 20} L${cx + 26},${y + 8} L${cx + 20},${y + 16} H${cx + 6} L${cx},${y + 8} Z"` : sp;
    out += `${hexFix} fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.3"${shape === "wait" ? ' stroke-dasharray="4 3"' : ""}/>`;
    out += `<text x="${cx + 32}" y="${y + 12.5}" font-size="12.5" fill="${C.sub}">${label}</text>`;
    cx += 32 + textW(label, 12.5) + 22;
  }
  const S = { normal: "正常往下走", back: "失敗或退回", wait: "等待或補充", strong: "唯一寫入" };
  for (const s of styles) {
    const col = C.edge[s];
    out += `<path d="M${cx},${y + 8} H${cx + 30}" stroke="${col}" stroke-width="${s === "strong" ? 3 : 1.6}"${s === "back" ? ' stroke-dasharray="6 4"' : s === "wait" ? ' stroke-dasharray="3 4"' : ""} marker-end="url(#a-${s})"/>`;
    out += `<text x="${cx + 38}" y="${y + 12.5}" font-size="12.5" fill="${C.sub}">${S[s]}</text>`;
    cx += 38 + textW(S[s], 12.5) + 22;
  }
  return { svg: out, width: cx - x };
}

// ---------- build one diagram ----------------------------------------------------------
const elk = new ELK();
async function build(spec) {
  const kindsUsed = [], stylesUsed = new Set();
  const toElk = (n) => {
    if (n.children) {
      return { id: n.id, _group: true, label: n.label, layoutOptions: { "elk.padding": "[top=40,left=18,bottom=18,right=18]", "elk.direction": n.direction ?? spec.direction }, children: n.children.map(toElk) };
    }
    const m = sizeNode(n); kindsUsed.push(n.kind ?? "step");
    return { ...n, kind: n.kind ?? "step", _m: m, width: m.w, height: m.h };
  };
  const edges = spec.edges.map((e, i) => {
    const [from, to, label, style] = Array.isArray(e) ? e : [e.from, e.to, e.label, e.style];
    stylesUsed.add(style ?? "normal");
    const ls = lines(label);
    return {
      id: `e${i}`, sources: [from], targets: [to], style: style ?? "normal",
      layoutOptions: { "elk.layered.priority.straightness": (style ?? "normal") === "normal" ? "10" : "0", "elk.layered.priority.direction": (style ?? "normal") === "normal" ? "10" : "0" },
      labels: label ? [{ text: ls.join(" / "), _lines: ls, layoutOptions: { "elk.edgeLabels.placement": (style ?? "normal") === "back" ? "TAIL" : "CENTER" }, width: Math.ceil(Math.max(...ls.map((t) => textW(t, T.label))) + 16), height: 8 + ls.length * 17 }] : [],
    };
  });
  // Same width for all step cards so the main path reads as one straight column.
  if (spec.uniform !== false) {
    const steps = []; const visit = (n) => (n.children ? n.children.forEach(visit) : (n.kind === "step" || n.kind === "state") && steps.push(n));
    const built = spec.nodes.map(toElk); built.forEach(visit);
    const w = Math.max(0, ...steps.map((n) => n.width)); steps.forEach((n) => (n.width = w));
    spec._built = built;
  }
  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered", "elk.direction": spec.direction ?? "DOWN",
      "elk.edgeRouting": "ORTHOGONAL", "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.spacing.nodeNode": String(spec.nodeSpacing ?? 34), "elk.layered.spacing.nodeNodeBetweenLayers": String(spec.layerSpacing ?? 46),
      "elk.spacing.edgeNode": "22", "elk.spacing.edgeEdge": "14", "elk.layered.spacing.edgeNodeBetweenLayers": "20",
      "elk.spacing.edgeLabel": "6", "elk.edgeLabels.placement": "CENTER",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.layered.cycleBreaking.strategy": "MODEL_ORDER",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      ...(spec.layout ?? {}),
    },
    children: spec._built ?? spec.nodes.map(toElk), edges,
  };
  let res;
  try { res = await elk.layout(graph); } catch (err) { throw new Error(`ELK failed for ${spec.id}: ${String(err.message ?? err).slice(0, 300)}`); }

  // absolute positions
  const byId = {}, groups = [], leaves = [];
  const walk = (n, ox, oy) => {
    for (const c of n.children ?? []) {
      c.abs = { x: c.x + ox, y: c.y + oy };
      byId[c.id] = c;
      if (c._group) { groups.push(c); walk(c, c.abs.x, c.abs.y); } else leaves.push(c);
    }
  };
  walk(res, 0, 0);

  const PAD = 28, HEAD = spec.title ? 56 : 18;
  const legend = drawLegend([...new Set(kindsUsed)], [...stylesUsed], 0, 0);
  const W = Math.max(res.width, legend.width) + PAD * 2, H = res.height + HEAD + 62;
  const ox = PAD, oy = HEAD;

  let body = "";
  placed.length = 0;
  for (const g of groups) {
    body += `<rect x="${g.abs.x + ox}" y="${g.abs.y + oy}" width="${g.width}" height="${g.height}" rx="12" fill="${C.group.fill}" stroke="${C.group.stroke}" stroke-dasharray="4 4"/>`;
    body += `<text x="${g.abs.x + ox + 16}" y="${g.abs.y + oy + 25}" font-size="13" font-weight="700" fill="${C.group.text}">${esc(g.label)}</text>`;
  }
  // edges: ELK gives coordinates relative to the edge's container
  const edgeOffset = (e) => { const c = e.container && e.container !== "root" ? byId[e.container].abs : { x: 0, y: 0 }; return [ox + c.x, oy + c.y]; };
  const allEdges = [];
  const collect = (n) => { for (const e of n.edges ?? []) allEdges.push(e); for (const c of n.children ?? []) collect(c); };
  collect(res);
  // labels must not sit on nodes: register node boxes first, then draw paths, nodes, labels (labels on top)
  for (const n of leaves) placed.push({ x: n.abs.x + ox, y: n.abs.y + oy, w: n.width, h: n.height });
  let labels = "";
  for (const e of allEdges) { const [ex, ey] = edgeOffset(e); const d = drawEdge(e, byId, ex, ey); body += d.paths; labels += d.labels; }
  for (const n of leaves) body += drawNode({ ...n, x: n.abs.x, y: n.abs.y }, ox, oy);
  body += labels;

  const lg = drawLegend([...new Set(kindsUsed)], [...stylesUsed], PAD, H - 38);
  const head = spec.title
    ? `<text x="${PAD}" y="36" font-size="19" font-weight="700" fill="${C.ink}">${esc(spec.title)}</text>` + (spec.subtitle ? `<text x="${PAD + textW(spec.title, 19, true) + 14}" y="36" font-size="13" fill="${C.muted}">${esc(spec.subtitle)}</text>` : "")
    : "";
  const markers = Object.entries(C.edge).map(([k, col]) =>
    `<marker id="a-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="${k === "strong" ? 5 : 7}" markerHeight="${k === "strong" ? 5 : 7}" orient="auto-start-reverse"><path d="M0,0.8 L10,5 L0,9.2 Z" fill="${col}"/></marker>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(W)}" height="${Math.ceil(H)}" viewBox="0 0 ${Math.ceil(W)} ${Math.ceil(H)}" font-family="${FONT}" role="img" aria-label="${esc(spec.title ?? spec.id)}">
<defs>${markers}<filter id="sh" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.6" flood-color="#0F172A" flood-opacity="0.10"/></filter></defs>
<rect x="0.5" y="0.5" width="${Math.ceil(W) - 1}" height="${Math.ceil(H) - 1}" rx="14" fill="#FFFFFF" stroke="${C.line}"/>
${head}
<line x1="${PAD}" y1="${H - 54}" x2="${W - PAD}" y2="${H - 54}" stroke="${C.line}"/>
${body}
${lg.svg}
</svg>
`;
}

const files = (await readdir(path.join(HERE, "src"))).filter((f) => f.endsWith(".mjs")).sort();
const only = process.argv.slice(2);
for (const f of files) {
  const spec = (await import(pathToFileURL(path.join(HERE, "src", f)).href)).default;
  if (only.length && !only.includes(spec.id)) continue;
  await writeFile(path.join(HERE, `${spec.id}.svg`), await build(spec));
  console.log("wrote", `${spec.id}.svg`);
}
