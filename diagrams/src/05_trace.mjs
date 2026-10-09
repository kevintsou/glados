// 追溯與過期 — framework/04 §4.4
export default {
  id: "glados_cr_trace",
  title: "追溯與過期",
  subtitle: "箭頭從上游指向下游；上游改版，箭頭指到的東西就過期",
  direction: "DOWN",
  uniform: false,
  nodes: [
    { id: "REQ", label: "需求鏈：只有相連的那條鏈過期", direction: "DOWN", children: [
      { id: "CR", kind: "ext", title: "CR、spec 頁", sub: "需求基準：來源快照＋CR 修訂紀錄" },
      { id: "SPEC", title: "spec 條目 B2", sub: ["第 2 版", "經 H1 核准"] },
      { id: "CON", title: "驗收合約", sub: "經 H2 核准" },
      { id: "CASE", title: "case" },
      { id: "PLAN", title: "計畫步驟" },
      { id: "COMMIT", title: "commit" },
    ] },
    { id: "EVI", label: "驗證證據：任何一個變了，報告就過期", direction: "DOWN", children: [
      { id: "IMG", title: "image", sub: "由 commit build 出來" },
      { id: "TS", title: "測試集合", sub: "由 case 組成" },
      { id: "ENV", title: "驗證環境" },
      { id: "REP", kind: "record", title: "驗證報告", sub: "＋原始 log" },
    ] },
  ],
  edges: [
    ["CR", "SPEC"], ["SPEC", "CON"], ["CON", "CASE"], ["CASE", "PLAN"], ["PLAN", "COMMIT"],
    ["COMMIT", "IMG"], ["CASE", "TS"], ["IMG", "REP"], ["TS", "REP"], ["ENV", "REP"], ["CON", "REP"],
  ],
};
