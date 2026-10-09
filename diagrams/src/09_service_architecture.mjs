// 串接層服務架構 — impl/service.md I2
export default {
  id: "glados_service_architecture",
  title: "串接層服務架構",
  subtitle: "入口只送要求；只有服務能寫正式紀錄",
  direction: "DOWN",
  uniform: false,
  nodes: [
    { id: "ENTRY", label: "操作入口：只送要求，不自己判斷放行", direction: "RIGHT", children: [
      { id: "GUI", kind: "ext", title: "openBCT GLADOS 分頁" },
      { id: "CLI", kind: "ext", title: "CLI" },
      { id: "API", kind: "ext", title: "API／MCP" },
    ] },
    { id: "APPR", kind: "gate", title: "人工核准", sub: ["簽核 skill 引導審閱", "人在對話框或分頁按鈕親自送出"] },
    { id: "SVC", kind: "rule", title: "串接層服務", sub: ["獨立背景程式", "觀察、版本同步、守門、派工"] },
    { id: "REC", kind: "record", title: "受保護的紀錄 branch", sub: ["通過紀錄、核准索引、正式進度、", "執行紀錄、版本同步報告、來源快照"] },
    { id: "WS", title: "執行工作區", sub: ["按需 clone，固定輸入版本", "遵守隔離"] },
    { id: "NODE", title: "節點執行", sub: "AI session、build、script" },
    { id: "BR", title: "工作 branch", sub: ["模組或專案層的 .glados/", "產出物與交接清單（申請）"] },
    { id: "OB", title: "openBCT", sub: "跑 case、借還設備" },
    { id: "JIRA", kind: "ext", title: "Jira／Confluence", sub: "需求來源" },
  ],
  edges: [
    ["GUI", "SVC", "開啟時連線\n必要時啟動"], ["CLI", "SVC", "單獨啟動或停止"], ["API", "SVC"],
    ["APPR", "SVC", "核對身分與 hash\n後寫入核准紀錄"],
    ["SVC", "REC", "只有服務能寫入", "strong"],
    ["SVC", "WS", "派工"], ["WS", "NODE"], ["NODE", "BR", "產出與交接清單"],
    ["BR", "SVC", "回收、核對"],
    ["SVC", "JIRA", "派工具抓快照、比對差異；\n設定允許時寫回 CR 修訂"],
    ["SVC", "OB", "跑 case、借設備"], ["OB", "SVC", "報告（核對後才採用）"],
    ["GUI", "REC", "只看進度時直接讀", "wait"],
  ],
};
