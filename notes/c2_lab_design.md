# C2：上機測試的 lab 設計

> **這份文件回答**：串接層的上機測試步驟要怎麼做。這些步驟是 M5、M2 的判別能力、P1 量基線的既有功能、P4、P5 的測試執行。2026-10-22 與使用者討論後的決定記在下面；還沒定的另外標出來。前一段 C1（build 的工具步驟）見 [p1_dispatch_brief](p1_dispatch_brief.md)。

## 現有可以沿用的

- **remote-ice skill**（bct_knowledge_base）：遠端操作 lab 機的 ICE 與 UART，負責載入 image、free run、收 UART log。支援多台 bench、keepalive，沒有 SSH 時走 watcher。
- **openBCT 的測試**：既有的 case 執行器與報告（UART 指令、Scripts）。這些還沒變成 GLADOS 的證據（共用待辦 OBC-021）。
- **openBCT 的 lab 模組**：Andes ICE、GPIO、FPGA、單機的 `DeviceLease`。ARM ICE 還是空殼（OBC-026）；跨機器排程與互斥還沒做（OBC-022）。

## 決定（2026-10-22，依使用者決定）

| # | 事項 | 決定 |
| :---- | :---- | :---- |
| 1 | 誰把「載入 image」和「跑測試」串成同一次執行（[framework/08 §8.2](../framework/08_open_questions.md#82-實作待決) 第 7 項） | 把 remote-ice 包成機器可讀的工具（JSON 進出，做法同 ds5build）。由串接層在同一次工具步驟裡依序呼叫「載入」與「跑 openBCT 測試」，兩段綁同一個執行編號與 image hash。不另外補 openBCT 的 ARM ICE |
| 2 | 怎麼證明測試時跑的是哪個 image | 先用 ICE 在載入後讀回記憶體、比對 hash。之後請 FW owner 在 image 加上開機時印出的 build ID，在測試 log 裡再比對一次，當作雙重保險。證明不了的，M5 記「驗證缺口」 |
| 5 | build 設定和驗證平台怎麼對應 | 目前都用 FPGA（E39 是 `*_fpga` 的設定）。其他專案在 P0 寫進專案設定的「驗證平台」欄位 |
| 6 | M2 的判別能力怎麼證明 | 預設在目前還沒實作的 image 上跑新寫的 case，必要的 case 要 FAIL。證明不了的專案，再補錯誤注入或受控修改（framework/08 §8.2 第 3 項） |
| 7 | 既有功能的測試清單 | **openBCT 既有的測試項目全部都要通過**，這就是 P1 量基線與 P5 全量驗收的既有功能測試。CR 的測項由 M2 另外新增，不在既有清單裡 |

## 還沒定（要先整理蒐集）

| # | 事項 | 狀態 |
| :---- | :---- | :---- |
| 3 | 哪些 bench 可以給 GLADOS 用：lab 機 IP、FPGA 平台與 IC、能不能晚上無人值守地跑 | 使用者要先整理，目前留白 |
| 4 | 設備認領與互斥 | 公司的 FPGA 已經有 FPGA Queue 機制，設備的認領、排隊與互斥應該接它，不另外做一套；細節之後再討論 |
| 8 | 無人值守時怎麼用設備：什麼時候釋放、timeout、和 keepalive 怎麼共存 | 同樣跟 FPGA Queue 一起討論。暫定：跑完立刻釋放，每個 case 沿用 openBCT 既有的 timeout，串接層不自己做 keepalive |

第 3、4、8 項定之前，實作可以先用假的 bench 與假的 remote-ice 把流程做完；真機 smoke 要等 bench 清單。

## 之後要做的工作

1. **remote-ice 的機器可讀包裝**（bct_knowledge_base，可以交給 Codex）：
   - 輸入：bench、image、要讀回驗證的記憶體範圍。
   - 輸出 JSON：載入結果、讀回的 hash、UART log 的位置，環境錯誤要分開標。
   - 不改 remote-ice skill（照「報不改」的規矩）。
2. **openBCT 的測試工具步驟**：
   - 要接的步驟：M5、M2 的判別能力、P1 量基線的既有功能、P4、P5 的測試執行。
   - 每個步驟依序做：載入、讀回比對、跑 openBCT case。
   - 每個 case 寫一筆證據，綁 image hash 與測試基準。
   - 既有測試項目沒過時：P1 列進基線待處理清單（交 GB）；P5 交給人。
3. **把 openBCT 的測試報告變成 GLADOS 的證據**（OBC-021）：
   - FAIL、ERROR、SKIP、不支援、未執行要分開記。
   - 必要的 case 沒跑，就不能算 PASS。
   - 保存原始 log。
