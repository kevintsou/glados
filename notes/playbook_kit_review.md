# 對 playbook 頁 kit 範本的修正建議

> 原 v0.6《平台 spec》附錄 A。這是對另一份文件（playbook 頁的 kit 範本）的審查意見，不是 GLADOS 規格本身；相關規則已寫進框架，對應位置附在各點後面。

## 3\_CLAUDE.md

- Model Routing、「不准改驗收清單其他欄位」等關鍵約束不應只寫在 CLAUDE.md（playbook 頁心法 6：CLAUDE.md 只是提醒）。模型分工放在節點啟動設定，欄位保護用節點的 PreToolUse hook，並由串接層在節點邊界再檢查一次（[framework/05 §5.4](../framework/05_checks.md#54-每個節點都要做的共通檢查)）。
- bootcode 通用紅線應寫進平台預設：記憶體預算、linker script 不准動、所有 polling 都要有 timeout、MISRA、不可動態配置記憶體、register 只能經由 HAL 存取（列入 [nodes/M4](../nodes/M4.md) 待展開議題）。
- 「spec 沒寫的行為不實作」太嚴：timeout、防禦性檢查通常 spec 不會寫，需要一份「預設允許的防禦性行為」清單。
- build 工具依專案設定選擇，不寫死。

## 2\_feature\_list.json／5\_regression\_gate.md 的防作弊漏洞

- passes、evidence 由 agent 自己寫；`REVIEW: APPROVED` 也是寫進 plan.md 的字串，實作 agent 自己就能寫。建議 passes 由測試結果腳本產生；review 結論由另一個 process 寫入獨立檔案並綁定 diff hash（[framework/05 §5.1](../framework/05_checks.md#51-只認證據)）。
- regression\_gate.py 沒檢查 report 對應的 image hash，舊的 PASS report 也會被放行（[framework/04 §4.4](../framework/04_rules.md#44-過期與重新進入)）。
- block\_irreversible.py 用黑名單 regex，包一層 script 就能繞過；改用白名單。
- 合法新增 case 後，由串接層依已核准驗收合約、獨立審查與工具證據建立新版測試基準。合約變更才回 H2；實作 agent 無權移動（[nodes/M2](../nodes/M2.md)）。
