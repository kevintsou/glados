// 新 commit 與人工修改 — framework/04 §4.7
export default {
  id: "glados_sync_flow",
  title: "新 commit 的處理",
  subtitle: "串接層列出影響、交給人決定；不自動分流、不自動合併",
  direction: "DOWN",
  uniform: false,
  nodes: [
    { id: "T", kind: "ext", title: "什麼時候檢查", sub: "開啟專案、新 commit、派工前、收件時" },
    { id: "SNAP", kind: "rule", title: "列出新 commit 碰到的檔案", sub: "被哪些節點讀過或產出" },
    { id: "K", kind: "decision", title: "是哪一種？" },
    { id: "A1", kind: "rule", title: "只改 .glados/ 的進度與紀錄", sub: "不影響 build 與測試結果" },
    { id: "A2", kind: "rule", title: "人工改了 FW code", sub: ["可以，接回流程", "該模組重新 build、跑 M5、M6"] },
    { id: "A3", kind: "human", title: "改了已核准的需求、介面、預算或設定", sub: ["G1 前：回 P0／P2 討論", "之後：C＋GC"] },
    { id: "A4", kind: "human", title: "執行期間輸入被改", sub: ["結果保留並標示", "人決定沿用或重跑"] },
    { id: "A5", kind: "human", title: "分岔、衝突、未提交的修改", sub: ["交給人", "不自動 reset、merge、rebase"] },
    { id: "HINT", kind: "human", title: "提示人：這些節點要不要重做" },
  ],
  edges: [
    ["T", "SNAP"], ["SNAP", "K"],
    ["K", "A1"], ["K", "A2"], ["K", "A3"], ["K", "A4"], ["K", "A5"],
    ["A2", "HINT"], ["A4", "HINT"],
    ["A5", "SNAP", "人處理完", "back"],
  ],
};
