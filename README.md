# GLADOS

bootcode FW 開發流程平台。目前是 **v0.7 討論稿**：先把框架定好，節點實作之後個別展開；**文件確認後才開始實作**。

**GLADOS 在做什麼**：從需求（spec、CR）出發，經過需求釐清、驗收定義、實作、驗證、整合與全量驗收，產出一版功能正常的 bootcode FW。工作由 AI、工具與人分工：每一站交出固定格式的交接清單，由確定性的「串接層」執行檢查、決定放行或退回；人只在關卡核准。

---

## 文件怎麼讀

第一次讀，照 01 → 02 → 04 的順序就能掌握全貌；其他文件需要時再查。

| 想知道 | 讀這份 |
| :---- | :---- |
| GLADOS 的目標、六個核心概念、設計原則、建置路線 | [framework/01 總覽](framework/01_overview.md) |
| 流程怎麼走、有哪些節點、哪裡要人核准 | [framework/02 流程](framework/02_workflow.md) |
| 每一站交什麼、交接清單與紀錄長什麼樣子、誰能寫 | [framework/03 產出物與紀錄](framework/03_artifacts.md) |
| 串接層怎麼派工、放行、退回、處理變更與新 commit | [framework/04 串接層規則](framework/04_rules.md) |
| 怎樣才算通過（所有檢查的定義） | [framework/05 檢查](framework/05_checks.md) |
| 串接層服務必須做到的事 | [framework/06 串接層服務的要求](framework/06_service.md) |
| 專案要填哪些設定 | [framework/07 專案設定](framework/07_project_profile.md) |
| 還沒決定的事、已經決定的事 | [framework/08 待決事項](framework/08_open_questions.md) |
| 每個節點的介面與實作構想 | [nodes/](nodes/README.md) |
| E39 怎麼套用 GLADOS | [projects/E39](projects/E39.md) |
| 實作設計（框架確認後才開始） | [impl/service](impl/service.md)、[impl/ai_node_execution](impl/ai_node_execution.md)、[impl/tools](impl/tools.md) |
| 討論筆記 | [notes/](notes/playbook_kit_review.md) |
| 版本紀錄、和 v0.6 的章節對照 | [CHANGELOG](CHANGELOG.md) |

## 文件分三層

| 層 | 內容 | 位置 |
| :---- | :---- | :---- |
| **框架** | 流程、節點介面、產出物與紀錄、檢查、串接層規則與服務要求。對所有專案都一樣 | `framework/`、`nodes/` 每張卡的「介面」段 |
| **節點實作** | 誰執行、用什麼模型與工具、怎麼接 openBCT、串接層服務怎麼寫。可以替換 | `nodes/` 每張卡的「實作」段、`impl/` |
| **專案** | 專案設定、範圍、試點 | `projects/` |

## 流程圖

所有流程圖都是 SVG 圖檔（[`diagrams/`](diagrams/)），每張圖內附標題與圖例。

| 圖 | 在哪裡 | 回答什麼問題 |
| :---- | :---- | :---- |
| 專案層流程 | [02 §2.1](framework/02_workflow.md#21-專案層流程) | 一個專案從頭到尾怎麼走、哪裡要人核准、失敗退回哪裡 |
| 模組流程 | [02 §2.3](framework/02_workflow.md#23-模組流程) | 一個模組的 M1–M7 怎麼走、哪些問題交給 R 失敗分類 |
| 一次派工到放行 | [04 §4.2](framework/04_rules.md#42-派工與放行) | 串接層怎麼派工、回收、檢查、放行 |
| 節點狀態 | [04 §4.3](framework/04_rules.md#43-節點與執行的狀態) | 一個節點會處在哪些狀態、什麼事件讓它轉換 |
| 追溯與過期 | [04 §4.4](framework/04_rules.md#44-過期與重新進入) | 上游改版時，哪些東西會過期 |
| R 失敗分類的去處 | [04 §4.5](framework/04_rules.md#45-r-失敗分類) | 每一種失敗退回哪裡、要不要人 |
| 變更處理 | [04 §4.6](framework/04_rules.md#46-c-變更處理) | 變更 CR 進來後，依改到的東西從哪裡重走 |
| 版本同步 | [04 §4.7](framework/04_rules.md#47-s-版本同步) | 發現新 commit 時，各種變更怎麼處理 |
| 串接層服務架構 | [impl/service I2](impl/service.md#i2-架構) | 服務、入口、紀錄、執行端之間怎麼連 |
| 服務生命週期 | [impl/service I6.1](impl/service.md#i61-服務生命週期圖) | 服務怎麼啟動、停止、恢復 |

**所有圖用同一套樣式**：藍色卡片＝節點；橘色＝需要人，人工關卡一律畫成六角形；紫色＝串接層的判斷；綠色圓柱＝紀錄；灰色＝圖外的節點或起點。灰色實線＝正常往下走；紅色虛線＝失敗或退回；灰色點線＝等待或補充。

**怎麼改圖**：改 `diagrams/src/` 裡對應的 `.mjs`（節點與連線的文字清單），再重新產生 SVG，見 [diagrams/README](diagrams/README.md)。不要直接改 `.svg`。

## 寫作約定

- 用一般人讀得懂的中文寫，不自創縮寫。節點與關卡代號（P0、M4、G1、H2…）是流程圖上的名字，第一次出現時附上名稱，例如「M4 實作與 build」「G1 範圍核准」。
- **每個概念只在一個地方定義**，其他地方用連結引用；連結寫成「文件編號 §節號」。
- 檢查用中文名稱（例如「build 零警告」），定義集中在 [framework/05](framework/05_checks.md)。
- 格式範例裡的欄位名稱用英文（它們是檔案格式的一部分），旁邊附中文說明。
- 正文只寫現行規則。還沒定案的寫「待確認」並連到 [framework/08](framework/08_open_questions.md) 的編號；版本差異寫在 [CHANGELOG](CHANGELOG.md)。
