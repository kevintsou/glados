// 節點狀態 — framework/04 §4.3
export default {
  id: "glados_node_state",
  title: "節點狀態",
  subtitle: "專案層節點每專案一份，模組層節點每模組一份",
  direction: "DOWN",
  nodes: [
    { id: "P", kind: "state", title: "待開始" },
    { id: "RUN", kind: "state", title: "進行中", sub: "已開工或已派工" },
    { id: "WX", kind: "wait", title: "等外部回覆" },
    { id: "CK", kind: "state", title: "收件檢查中" },
    { id: "WA", kind: "gate", title: "等人決定", sub: "等關卡核准，或已交給人" },
    { id: "DN", kind: "record", title: "完成" },
  ],
  edges: [
    ["P", "RUN", "上游完成，開工或派工"], ["RUN", "CK", "提交或回收"],
    ["CK", "WA", "通過，有關卡"], ["WA", "DN", "核准"], ["CK", "DN", "通過，沒有關卡"],
    ["RUN", "WX", "要問外部", "wait"], ["WX", "RUN", "答案回來", "wait"],
    ["CK", "RUN", "沒過：補齊或節點內重做", "back"],
    ["WA", "RUN", "不核准，或人決定重做", "back"],
    ["CK", "WA", "超過 3 輪、環境問題、\n判不出原因", "back"],
    ["DN", "WA", "上游改版：提示人決定\n要不要重做", "wait"],
  ],
};
