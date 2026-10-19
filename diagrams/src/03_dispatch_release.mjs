// 兩種執行方式 — framework/04 §4.2
export default {
  id: "glados_dispatch_release",
  title: "一次執行到完成",
  subtitle: "外部互動節點由人做、串接層只開工與收件；派工節點由串接層派工與回收",
  direction: "DOWN",
  uniform: false,
  nodes: [
    { id: "X", label: "外部互動節點：P0、P2、M1、C、P7", direction: "DOWN", children: [
      { id: "XS", kind: "rule", title: "開工", sub: ["開執行編號、準備隔離工作區", "寫出工作包"] },
      { id: "XH", kind: "human", title: "人＋agent 完成", sub: "中間過程串接層不參與" },
      { id: "XP", kind: "human", title: "人提交" },
    ] },
    { id: "D", label: "派工節點：P1、M2、M4、M5、M6、P4、P5", direction: "DOWN", children: [
      { id: "DA", kind: "rule", title: "派工", sub: ["固定輸入 commit", "每次開新的 session 或工具執行"] },
      { id: "DN", title: "AI 或工具執行", sub: "交出產出與交接說明" },
      { id: "DR", kind: "rule", title: "回收", sub: "核對只寫在允許範圍內" },
    ] },
    { id: "CK", kind: "rule", title: "收件檢查與擋關檢查", sub: "自動核對、工具執行、獨立審查" },
    { id: "EV", kind: "record", title: "證據紀錄", sub: "綁定 commit" },
    { id: "Q", kind: "decision", title: "都通過？" },
    { id: "BACKX", kind: "human", title: "外部互動：交還給人補齊" },
    { id: "BACKD", kind: "rule", title: "派工：節點內重做", sub: "最多 3 輪，超過交給人" },
    { id: "G", kind: "gate", title: "出口關卡：等人核准" },
    { id: "REC", kind: "record", title: "完成", sub: "記錄進度，判斷下一站" },
  ],
  edges: [
    ["XS", "XH"], ["XH", "XP"], ["XP", "CK"],
    ["DA", "DN"], ["DN", "DR"], ["DR", "CK"],
    ["CK", "EV"], ["EV", "Q"],
    ["Q", "BACKX", "沒有（外部互動）", "back"],
    ["Q", "BACKD", "沒有（派工）", "back"],
    ["Q", "G", "通過，這站有關卡"],
    ["Q", "REC", "通過，這站沒有關卡"],
    ["G", "REC", "核准"],
  ],
};
