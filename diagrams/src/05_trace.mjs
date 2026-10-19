// 上游改版的影響提示 — framework/04 §4.4
export default {
  id: "glados_cr_trace",
  title: "上游改版的影響提示",
  subtitle: "左邊只提示、由人決定重做哪裡；右邊兩條規則自動生效",
  direction: "DOWN",
  uniform: false,
  nodes: [
    { id: "HINT", label: "提示，人決定：列出讀過改版檔案的節點", direction: "DOWN", children: [
      { id: "CR", kind: "ext", title: "CR、spec 頁、範圍清單" },
      { id: "SPEC", title: "spec 條目、驗收合約", sub: "經 H 核准" },
      { id: "CASE", title: "case", sub: "引用 spec 條目" },
      { id: "COMMIT", title: "模組 commit" },
    ] },
    { id: "AUTO", label: "自動規則：變了就不算，要重跑", direction: "DOWN", children: [
      { id: "IMG", title: "image", sub: "由 commit build 出來" },
      { id: "ENV", title: "影響 build 的環境", sub: "toolchain、生成工具" },
      { id: "REP", kind: "record", title: "測試結果", sub: "M5、P4、P5" },
    ] },
  ],
  edges: [
    ["CR", "SPEC"], ["SPEC", "CASE"], ["CASE", "COMMIT"],
    ["COMMIT", "IMG"], ["ENV", "IMG"], ["IMG", "REP", "image 變了，舊結果不算", "strong"],
    ["CASE", "REP"],
  ],
};
