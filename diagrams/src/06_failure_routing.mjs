// 失敗的去處 — framework/04 §4.5
export default {
  id: "glados_failure_routing",
  title: "失敗的去處",
  subtitle: "派工節點自己的問題在節點內重做；其他一律交給人決定回哪裡",
  direction: "RIGHT",
  uniform: false,
  layerSpacing: 70,
  nodes: [
    { id: "IN", kind: "ext", title: "擋關檢查沒過", sub: "或節點回報問題" },
    { id: "K", kind: "decision", title: "是哪一種？" },
    { id: "D1", kind: "ext", title: "節點內重做", sub: "最多 3 輪" },
    { id: "D2", kind: "ext", title: "回 M4 重做", sub: "計入 M4 的輪數" },
    { id: "D3", kind: "human", title: "交還給人補齊", sub: "不計輪數" },
    { id: "HM", kind: "human", title: "交給人", sub: ["自己做、指定回哪一站、", "修好環境重跑、再試一次，", "或這版不做"] },
  ],
  edges: [
    ["IN", "K"],
    ["K", "D1", "派工節點自己的檢查\n（build、warning、預算…）"],
    ["K", "D2", "M5 case FAIL、\nM6 阻擋項目"],
    ["K", "D3", "外部互動節點的\n收件或擋關檢查"],
    ["K", "HM", "需求、合約、介面、測試寫錯、\n環境問題、驗證缺口"],
    ["D1", "HM", "超過 3 輪", "back"],
    ["D2", "HM", "超過 3 輪", "back"],
  ],
};
