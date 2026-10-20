// 兩種執行方式 — framework/04 §4.2
export default {
  id: "glados_dispatch_release",
  title: "一次執行到完成",
  subtitle: "AI 的工作一律由人開 agent 照 skill 做，串接層只開工與收件；確定性的工具步驟由串接層執行",
  direction: "DOWN",
  uniform: false,
  nodes: [
    { id: "X", label: "外部互動（人＋agent）", direction: "DOWN", children: [
      { id: "XS", kind: "rule", title: "開工", sub: ["開執行編號、準備隔離工作區", "寫出工作包（skill、輪數、能否平行）"] },
      { id: "XH", kind: "human", title: "人＋agent 照 skill 完成", sub: ["中間過程串接層不參與", "需要重做時 skill 自己重做，最多 3 輪"] },
      { id: "XP", kind: "human", title: "人或 agent 提交", sub: "提交不是核准" },
    ] },
    { id: "D", label: "工具步驟（串接層執行）", direction: "DOWN", children: [
      { id: "DA", kind: "rule", title: "執行前", sub: ["固定輸入 commit", "人觸發或自動接續"] },
      { id: "DN", title: "工具執行", sub: ["機械替換、build、上機測試", "不用 AI"] },
      { id: "DR", kind: "rule", title: "回收", sub: "核對只寫在允許範圍內" },
    ] },
    { id: "CK", kind: "rule", title: "收件檢查與擋關檢查", sub: "自動核對、工具執行、獨立審查" },
    { id: "EV", kind: "record", title: "證據紀錄", sub: "綁定 commit" },
    { id: "Q", kind: "decision", title: "都通過？" },
    { id: "BACKX", kind: "human", title: "外部互動：交還補齊", sub: "回到進行中" },
    { id: "BACKD", kind: "rule", title: "工具步驟沒過", sub: ["回產生內容的外部互動步驟，計入輪數", "環境、設備問題交給人"] },
    { id: "G", kind: "gate", title: "出口關卡：等人核准" },
    { id: "REC", kind: "record", title: "完成", sub: "記錄進度，判斷下一站" },
  ],
  edges: [
    ["XS", "XH"], ["XH", "XP"], ["XP", "CK"],
    ["DA", "DN"], ["DN", "DR"], ["DR", "CK"],
    ["CK", "EV"], ["EV", "Q"],
    ["Q", "BACKX", "沒有（外部互動）", "back"],
    ["Q", "BACKD", "沒有（工具步驟）", "back"],
    ["Q", "G", "通過，這站有關卡"],
    ["Q", "REC", "通過，這站沒有關卡"],
    ["G", "REC", "核准"],
  ],
};
