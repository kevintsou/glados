# Codex 工作說明：remote-ice 機器可讀包裝（BC-011）

請用繁體中文回覆。

## 工作位置

- 在 bct_knowledge_base **開一個新的 worktree**：從團隊 main（remote `gitlab`）開出 branch `codex/iceload`，放在 `D:\repo\bct_kb_iceload`：
  ```
  git -C D:\repo\bct_knowledge_base fetch gitlab
  git -C D:\repo\bct_knowledge_base worktree add -b codex/iceload D:\repo\bct_kb_iceload gitlab/main
  ```
- 只在這個 worktree 工作。
- **不要碰**：
  - `D:\repo\bct_knowledge_base` 主 checkout。
  - 其他 worktree。
  - openBCT 的任何 checkout：另一個 Claude session 正在做 C1。
- GLADOS（`D:\repo\glados`）只讀，例外是下面「進度回報」說的任務檔。

## 背景

GLADOS 是 bootcode FW 開發流程平台（目前 v0.10）。串接層 openBCT 要執行「上機測試」的工具步驟：M5、M2 的判別能力、P1 量基線、P4、P5。每次都要依序做兩件事：

1. 把 build 出來的 image 載入 FPGA。
2. 跑 openBCT 的測試。

這兩件必須綁成同一次執行，而且要證明測試時跑的就是那個 image。使用者已經決定：

- 先用 ICE 在載入後讀回記憶體、比對 hash 來證明。
- 載入與讀回用知識庫既有的 `remote-ice` 工具組，外面包一層機器可讀的工具。
- 跑測試由 openBCT 負責。

**這次要做的就是這層包裝。** 可以用的 bench（lab 機）清單使用者還在整理，**全部先用假的 bench 與假的傳輸開發與測試**。

先讀這些：
- GLADOS `docs/coordination/tasks/BC-011.md`：完成條件。**這是最重要的一份。**
- GLADOS `notes/c2_lab_design.md`：C2 的決定與還沒定的事（bench 清單、FPGA Queue）。
- GLADOS `nodes/M5.md`：M5 要怎麼證明測試時跑的是哪個 image；證明不了時記「驗證缺口」。
- bct_knowledge_base `Skills/remote-ice/SKILL.md` 與 `Skills/remote-ice/toolkit/`：
  - 怎麼連線（Find-IceToolkit、Connect-Ice、config.local.ps1），以及傳輸方式：ssh 或 watcher。
  - 怎麼載入與執行：`scripts/load_and_capture.ps1`、`scripts/Invoke-IceCapture.ps1`、`backend/Ds5.psm1`、`ds/load_only.ds`。
  - 怎麼 dump 記憶體：`Ice.psm1` 的 `Save-IceMemory`。
  - 多台 bench 的注意事項：Step 0.8。
- bct_knowledge_base `reports/traps/261019_remote-ice_save-icememory-pulls-stale-same-name-dump.md`：**`Save-IceMemory` 可能拉回同名的舊 dump**，讀回驗證一定要避開。
- bct_knowledge_base `tools/ds5build/`：同樣是「包一層、輸出 JSON」的工具，退出碼、證據目錄、環境錯誤的分法可以照它的慣例。

## 要做的事

照 BC-011 的完成條件，新增 `tools/iceload/`（名稱可以調整）：

1. **命令列**：
   - 輸入：bench 代號、image（`.axf` 或 `.bin`）、讀回範圍（位址與長度，可以給多段）、輸出目錄、要不要 free run 收 UART、收多久。
   - 輸出 JSON：
     - 載入的結果。
     - image 的 sha256。
     - 每一段讀回的位址、長度、讀回 sha256、image 對應 sha256、是否相符。
     - UART log 的位置與 sha256。
     - 實際用到的 toolkit 版本、傳輸方式、bench 代號、耗時。
2. **bench 設定**：
   - 放本機設定檔，路徑由參數或環境變數給，不進 repo。
   - 內容是 bench 代號對應到 remote-ice 需要的設定。
   - JSON 的公開欄位只寫 bench 代號，IP、帳號這類資訊只放證據目錄的內部檔案。
3. **讀回驗證**：
   - 寫清楚 image 對應內容的算法，例如 `.bin` 依載入位址取對應的那一段，`.axf` 依 load region 取。
   - 每次 dump 都用不重複的檔名，並核對大小與時間，避開拉回舊 dump。
   - 讀回不符記失敗；讀不到記環境錯誤。
4. **環境錯誤和失敗分開**：
   - 環境錯誤：連不上、ICE 沒反應、傳輸逾時、授權問題。
   - 失敗：讀回不符。
   - 退出碼：0 成功、1 失敗、2 環境錯誤。
5. **假模式**：
   - 用本機目錄模擬 lab 機、ICE 記憶體與 UART，讓 CI 不需要硬體也能測完整流程。
   - 假模式要走和真模式相同的上層邏輯，只換掉最底層的傳輸與 ICE 呼叫。
6. **不改 remote-ice**：只透過它的工具組呼叫。如果工具組沒有機器可讀的輸出，就在本工具裡解析，並在 README 寫明依賴哪些輸出格式。發現 skill 有問題，照 `reports/traps/_TEMPLATE.md` 寫 report。
7. **README**：用法、JSON 欄位、退出碼、讀回算法、假模式、和 remote-ice 的依賴關係、已知限制（例如還沒接 FPGA Queue）。

## 限制

- **不連任何真的 lab 機、不碰 FPGA 或板子**。全部用假模式開發與測試。真機 smoke 要等使用者提供 bench 清單。
- 只用 Python 標準函式庫，PowerShell 工具組用子程序呼叫。
- 不要改 `Skills/remote-ice/`、`tools/ds5build/` 或其他既有的 skill 與工具。
- 只在 `codex/iceload` branch commit，**不要 push、不要 merge 到 main**：一進 main，當晚 auto_update 就會裝到全團隊。
- 不做任何對外寫入。
- 不要改 GLADOS 的規格檔與其他任務檔。

## 進度回報

照 GLADOS `docs/coordination/README.md` 的認領規則，**只更新** `D:\repo\glados\docs\coordination\tasks\BC-011.md`：

- frontmatter：owner 寫 `codex`，branch `codex/iceload`，worktree `D:\repo\bct_kb_iceload`，填上實際的 owned_paths 與 status。
- 接續紀錄：日期、改了哪些檔案、commit、驗證命令與結果、還缺什麼。
- **注意**：寫 thread 或 session 編號時直接寫字元，不要用跳脫字元。上次有一個開頭的 `0` 被寫成 NUL 字元。

改了**不要 commit**，Claude session 會核對後幫你 commit。

## 完成的判斷

- BC-011 的完成條件都做到，unittest 全過；測試涵蓋任務檔列的情境。
- 最後回報以下內容：
  - commit。
  - 新增了哪些檔案。
  - 測試結果。
  - 讀回算法。
  - 解析了 remote-ice 的哪些輸出。
  - 寫了哪些 trap report。
  - 還缺什麼：真機 smoke、FPGA Queue。
