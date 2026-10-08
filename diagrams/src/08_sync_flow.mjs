// 版本同步 — framework/04 §4.7
export default {
  id: "glados_sync_flow",
  title: "版本同步",
  subtitle: "六種變更和 04 §4.7 的表格一一對應",
  direction: "DOWN",
  uniform: false,
  nodes: [
    { id: "T", kind: "ext", title: "什麼時候執行", sub: "開啟專案、新 commit、派工前、放行前" },
    { id: "SNAP", kind: "rule", title: "固定這次讀到的 commit", sub: "和上次檢查過的版本比對" },
    { id: "K", kind: "decision", title: "這次有什麼變更？" },
    { id: "A1", kind: "rule", title: "只有進度紀錄", sub: ["更新已檢查的位置", "證據保持有效"] },
    { id: "A2", kind: "rule", title: "有人手動改 FW code", sub: ["登記人工 diff、重新 build", "舊證據過期，從 M5 重走"] },
    { id: "A3", kind: "human", title: "需求、介面或設定改了", sub: ["第一次通過 G1 前：P0／P2 整理", "之後：C 變更分析與關卡", "已在 repo 裡不等於已核准"] },
    { id: "A4", kind: "rule", title: "測試或驗證環境改了", sub: ["相關證據過期", "回 M2，或處理環境"] },
    { id: "A5", kind: "rule", title: "執行期間輸入被改", sub: ["結果保留但不放行", "判斷重跑或從哪裡重走"] },
    { id: "A6", kind: "human", title: "分岔、衝突或影響不明", sub: ["含未提交的修改", "擋住交給人", "不自動 reset、merge、rebase"] },
    { id: "OK", kind: "rule", title: "派工或放行前", sub: "再確認一次 branch 沒變" },
  ],
  edges: [
    ["T", "SNAP"], ["SNAP", "K"],
    ["K", "A1"], ["K", "A2"], ["K", "A3"], ["K", "A4"], ["K", "A5"], ["K", "A6"],
    ["A6", "SNAP", "人處理完", "back"],
    ["A1", "OK"], ["A2", "OK"], ["A4", "OK"], ["A5", "OK"],
  ],
};
