// 節點狀態 — framework/04 §4.3
export default {
  id: "glados_node_state",
  title: "節點狀態",
  subtitle: "專案層節點每專案一份，模組層節點每模組一份",
  direction: "DOWN",
  nodes: [
    { id: "P", kind: "state", title: "待開始" },
    { id: "RD", kind: "state", title: "可開始" },
    { id: "RUN", kind: "state", title: "執行中" },
    { id: "WX", kind: "wait", title: "等待外部回覆" },
    { id: "CK", kind: "state", title: "交接檢查中" },
    { id: "WA", kind: "gate", title: "等待核准" },
    { id: "DN", kind: "record", title: "完成" },
    { id: "HM", kind: "human", title: "交給人", sub: ["任何狀態都可能轉到這裡", "例如有衝突，或核准人決定交給人"] },
    { id: "BACK", kind: "ext", title: "依人的決定回到流程", sub: ["重跑、退回其他節點，", "或人自己做完交出交接清單"] },
  ],
  edges: [
    ["P", "RD", "進入條件滿足"], ["RD", "RUN", "派工"], ["RUN", "CK", "執行結束"],
    ["CK", "WA", "通過，有關卡"], ["WA", "DN", "核准"], ["CK", "DN", "通過，沒有關卡"],
    ["RUN", "WX", "要問外部", "wait"], ["WX", "RD", "答案回來", "wait"],
    ["CK", "RD", "沒過，本節點重做；\n輸入被改要重跑", "back"],
    ["WA", "RD", "不核准，修正", "back"],
    ["CK", "P", "沒過，退回其他節點；\n輸入被改，等上游新版", "back"],
    ["DN", "P", "輸出過期", "back"],
    ["CK", "HM", "超過輪數、環境問題、\n判不出原因", "back"],
    ["HM", "BACK"],
  ],
};
