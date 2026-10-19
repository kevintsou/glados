// 變更處理 — framework/04 §4.6
export default {
  id: "glados_change_flow",
  title: "變更處理",
  subtitle: "G1 核准後的需求變更：人在 GC 決定接不接、從哪裡重做",
  direction: "DOWN",
  uniform: false,
  nodes: [
    { id: "CR", kind: "ext", title: "變更 CR", sub: "不在 G1 核准範圍裡" },
    { id: "XS", kind: "ext", title: "外部來源同步發現", sub: "CR 被改或取消、spec 頁改版" },
    { id: "SF", kind: "ext", title: "有人直接改了", sub: "已核准的需求、介面、預算或設定" },
    { id: "C", tag: "C", title: "變更", sub: ["外部互動：人＋agent", "agent 提供影響建議，只供參考"] },
    { id: "GC", kind: "gate", title: "GC 變更核准", sub: "接不接？從哪裡重做？" },
    { id: "DEFER", kind: "record", title: "記錄：延後或拒絕" },
    { id: "K", kind: "decision", title: "人指定的重做起點（常見）" },
    { id: "E0", kind: "ext", title: "P0、P1", sub: "改基底、平台、toolchain" },
    { id: "E2", kind: "ext", title: "P2 → G1", sub: "全新功能，或改介面、預算" },
    { id: "E4", kind: "ext", title: "該模組 M1 → H", sub: "改既有模組的需求" },
    { id: "E5", kind: "ext", title: "該模組 M2 補 case", sub: "既有行為的 bug" },
  ],
  edges: [
    ["CR", "C"], ["XS", "C"], ["SF", "C"], ["C", "GC"],
    ["GC", "DEFER", "不接"], ["GC", "K", "接"],
    ["K", "E0"], ["K", "E2"], ["K", "E4"], ["K", "E5"],
  ],
};
