# 工作說明：派工共用骨架與 P1 機械替換（OBC-031）

> 2026-10-20。給 openBCT session 的下一階段工作說明，依 GLADOS v0.9.1（main `a73368b` 之後）。最後一節的 7 項待決事項，使用者已經全部照建議決定，也寫進了 GLADOS 的實作文件。順序是：先做 A 批，B 批等 A 批核對完再交。

## 為什麼現在可以開始

- bcgen 的衍生模式已經 merge 進 bct_knowledge_base 的團隊 main（`f51ad4da`）。它能嚴格讀取 `glados.recipe/v1` 的程式碼建立設定，產出逐檔 manifest，同一份輸入重跑會逐檔相同（BC-007、BC-008）。
- openBCT 已經有這些可以沿用：
  - 外部互動節點的開工與收件。
  - 正式紀錄寫進紀錄 branch，並由串接層 push。
  - 關卡與交給人之後的決定（`hand_to_human` 已有，目前只有測試會呼叫）。
  - 六種節點狀態，以及 `DISPATCH_RETRY_LIMIT = 3`。
- 派工節點（P1、M2、M4、M5、M6、P4、P5）都還沒有實際派工的程式。

## 分三批

| 批 | 內容 | 要不要等決定 |
| :---- | :---- | :---- |
| **A** | 派工共用骨架、工具執行端、P1 第 2 步機械替換（OBC-031） | 都已決定，可以開始 |
| **B** | （v0.10 改寫）AI 步驟的開工、提交、收件：P1 移植與移植審查、M2、M4、M6；工作包的輪數與 skill；審查的 session 核對；審查發現變成紀錄；工具步驟自動接續 | 可以開始 |
| **C** | C1：P1 第 1、5 步與 M4 正式 build 接上 ds5build（BC-010）；C2：上機測試（M5、判別能力、既有功能量測、P4、P5） | C1 可以開始；C2 要先設計 lab |

下面是 A、B、C 三批的完整說明。C 批先做 build 的部分（C1），上機測試（C2）等 lab 設計好再寫。

---

## A 批：派工共用骨架與 P1 機械替換

### 規格依據

- framework/04：
  - §4.2「派工節點」的六步：派工前、派工、回收、擋關、沒過、過了。另外，程式正常結束不代表節點完成。
  - §4.5 失敗處理：節點內重做最多 3 輪，超過就交給人，並附上每一輪的失敗證據。
  - §4.7 執行期間輸入被改了的處理。
- framework/03：
  - §3.6 執行紀錄：派工節點每次嘗試寫一筆，`mode: dispatch`。
  - §3.6 證據紀錄。
  - §3.7 存放位置與 push 順序。
- framework/05 §5.4 P1 的擋關檢查：「機械替換可重現」「只寫在允許範圍內」「建立設定是否齊全」（P1 開始時再核對一次）。
- nodes/P1.md：
  - 第 2 步「機械替換」。
  - 可寫範圍：機械替換只寫生成區與起始複製區。
  - 失敗時交給人的條件。
- impl/recipe.md：
  - R1「來源代號由串接層解析」。
  - 「格式狀態」裡 `drop` 與 `snapshot_sha256` 的定義。
  - schema 檔 `impl/schema/glados.recipe.v1.schema.json`。
- impl/bcgen.md B8 的 C2：串接層自己算的 hash 和 bcgen 回報的不一致就不放行；同一份輸入重跑要逐檔相同；AI 呼叫不到 bcgen。
- impl/ai_node_execution.md「派工節點：啟動與回收」：生命週期與回收規則。這一批只做判讀結果的部分，不實際呼叫 `claude -p`。
- impl/service.md：
  - I6：持久保存與重啟時要核對，不盲目重派。
  - I6.2：commit 的時間點與 commit 訊息尾端的欄位。
- 共用待辦：
  - OBC-031 的五個完成條件。
  - OBC-014、OBC-015 裡和派工生命週期有關的條件。
  - OBC-016 的 v0.9 範圍：沒有 R 分類，只有 3 輪與交給人。

### 要做的事

**1. 派工共用骨架**（不用等決定）

- **派工前**：
  - 上游節點已完成，判斷用正式紀錄。
  - 這個節點沒有其他執行中的嘗試。從 GUI、API 同時派工只會成功一次，沿用開工時的鎖。
  - 固定輸入 commit。
  - 環境可用。缺工具或缺本機路徑時，標成環境問題並交給人，不算一輪。
- **執行工作區**：每次嘗試從工作 branch 的輸入 commit 開一個獨立的 git worktree。不用人的工作區，也不讀禁看的 branch，照 OBC-008 的隔離規則。
- **執行端介面**：
  - 定一個共用介面：輸入是工作區、固定輸入與節點設定；輸出是 exit code、log、產出位置。
  - 先做兩種實作：
    - **工具執行端**：跑確定性的命令，例如 bcgen。
    - **假執行端**：測試用，可以指定成功、失敗或逾時。
  - AI 執行端只做命令組裝與結果判讀：看 exit code、JSON 的 `is_error` 與 `permission_denials`，啟動前驗證設定檔。不實際呼叫，留給 B 批。
- **timeout 與取消**：由串接層自己設定。取消時保存已取得的 log。執行端沒有確認已停止時，標成「待核對」，不推定已停止。
- **回收**：
  - 收集產出、交接說明與 log。
  - 核對「只寫在允許範圍內」：範圍依節點卡的可寫範圍，加上專案設定的生成區、起始複製區、移植範圍。
  - exit 0 不等於完成。
- **擋關**：跑這個節點的擋關檢查，每項寫一筆證據紀錄。
- **沒過**：在節點內開新的一次嘗試，最多 3 輪。超過 3 輪就呼叫 `hand_to_human`，附上每一輪的失敗證據與目前擋住的原因。環境問題直接交給人，不算輪數。
- **過了**：commit 到工作 branch，commit 訊息尾端帶 `GLADOS-Project`、`GLADOS-Node`、`GLADOS-Run`、`GLADOS-Input`；照既有的同步流程，先推工作 branch，再寫紀錄 branch。
- **紀錄**：每次嘗試寫一筆 `glados.run/v2`（`mode: dispatch`、`attempt`、`input_commit`、`output_commit`、`environment`、`result`、`log`）。
- **重啟**：服務重啟時，資料庫裡狀態還是「執行中」的嘗試要先核對：worktree 還在嗎？執行端還活著嗎？已經有結果了嗎？核對後交給人決定接續或重跑，不自動重派。
- **節點狀態**：派工中顯示「進行中」，附註第幾輪；擋關中顯示「收件檢查中」。不新增狀態。

**2. P1 第 2 步：機械替換**

- **固定輸入**（全部取自 G0 核准的那個 commit）：
  - 專案設定的 `start`、`recipe` 兩段原樣擷取，不做格式轉換。
  - 起點 commit 用 `git archive` 匯出成起點目錄，不 checkout 禁看的 branch。
  - 外部來源快照（決定 5）：
    - 存在紀錄 branch 的 `.glados/projects/<專案編號>/sources/<來源代號>/`，和 Jira／Confluence 快照放在一起。
    - 第一次由串接層從本機路徑對照讀入，例如 `folder` 類型的 PS5039 register 資料夾。之後 P1 只讀紀錄 branch 上的版本，不讀原始位置。
    - 讀入與使用前，都先自己算 `snapshot_sha256`（算法見 impl/recipe.md），和建立設定記的值比對，不同就不執行並交給人。
    - 本機路徑對照放在每台機器的 openBCT 設定，不進 profile；這是 OBC-006 還沒做的部分，一起補上。
  - bcgen（決定 4）：
    - 從本機 bct_knowledge_base clone 的路徑（放本機設定），依環境清單記的 commit 用 `git archive` 匯出 `tools/bcgen` 到暫存目錄執行。
    - 不用安裝目錄，因為每晚 auto_update 會改它。
    - bcgen 的版本由串接層用這個 commit 計算，不靠 bcgen 自己回報。
  - timeout（決定 7）：bcgen 15 分鐘，專案設定可以覆寫。
- **執行**：
  - 輸出目錄先放起點的副本（bcgen 的輸出是覆寫層）。
  - 執行 `bcgen.py derive --start-dir --recipe --snapshots-dir --output-dir --report-dir`。
  - 串接層自己算所有輸入與輸出的 sha256，和 bcgen 的 `input-manifest.json`、`output-manifest.json` 比對，不一致就不放行。
- **可重現**：在另一個目錄用同一份輸入再跑一次，兩次的輸出與紀錄要逐檔相同。這就是擋關檢查「機械替換可重現」的證據。
- **只寫在允許範圍內**：和起點相比，改到的檔案只能落在生成區（`replace`、`keep` 的 `to`）、起始複製區（`seed_paths`），以及 `drop` 列出要刪的檔案。
- **commit**：
  - 結果在專案層工作 branch 上 commit 成一個獨立的機械替換 commit。身分用「GLADOS orchestrator」（決定 6），和紀錄 branch 的寫入者相同。
  - 生成紀錄寫到 `artifacts/base/`，包括：建立設定、工具與版本、輸入與輸出 manifest、include 差異清單、兩次執行的比對結果。
- **include 差異清單**：
  - 不是空的時候，交接說明要寫明「第 3 步移植要處理」。
  - `register_entry` 不在 `port_paths` 時，bcgen 會拒絕執行；這時交給人，通常是回 P0。
- **AI 呼叫不到 bcgen**：AI 執行端的允許清單不能列 bcgen，要有測試證明。
- **沒有建立設定的專案**：跳過第 2–4 步，基底就是起點 commit。
- **P1 還沒能完成**：第 1、5 步（build、量基線）屬於 C 批。這一批做完時，P1 停在「第 2 步完成、等 build 與基線」，畫面要照實顯示，不能顯示 P1 完成。

**3. 文件**：docs/glados-prototype.md 與共用筆記補上這一批。

### 限制

- 只在新的 branch 上 commit，不 push、不 merge。merge 要等使用者另外同意。
- 不實際呼叫 `claude -p`，也不呼叫任何真的 AI 或遠端服務。測試用本機暫存 repo、合成的起點與快照。
- 不寫分享資料夾，不寫 GitLab、Jira。
- 既有測試（含 OBC-002～OBC-017）要維持通過。
- 完整套件用背景執行。

### 完成判斷

新增的測試要涵蓋：

- **派工骨架**：
  - 上游沒完成時拒絕派工。
  - 從兩個入口同時派工只成功一次。
  - 假執行端失敗 3 輪後交給人，而且附上每一輪的證據。
  - 環境問題不算輪數。
  - timeout 與取消會保存 log；沒確認停止的標「待核對」。
  - exit 0 但擋關沒過，節點不算完成。
  - 寫到允許範圍以外，不放行。
  - 重啟後，殘留的執行中嘗試會標「待核對」，不會被自動重派。
- **P1 機械替換**（用合成的起點、快照與建立設定，真的跑 bcgen。測試用本機 bct_knowledge_base 的一個固定 commit；找不到 clone 時 skip 並說明原因）：
  - 快照 hash 不符就不執行。
  - bcgen 回報的 hash 和串接層算的不一致，就不放行。
  - 兩次執行逐檔相同，「機械替換可重現」為 PASS。
  - 改到生成區、起始複製區以外的檔案，「只寫在允許範圍內」為 FAIL。
  - include 差異非空、`register_entry` 不在 `port_paths` 時，交給人。
  - 機械替換 commit 與 `artifacts/base/` 的生成紀錄都存在。
  - AI 的允許清單裡沒有 bcgen。
  - P1 的狀態照實顯示「等 build 與基線」。

ruff check src tests、mypy --platform linux、完整 pytest 全綠。

另外做一次手動 smoke：用 E39 的試跑輸入（起點 `83dc1a65b`、PS5039 register 快照、試跑用的建立設定）在暫存目錄跑一次，回報結果。這次 smoke 不進 CI，也不 commit 試跑產出。

### 回報

- 每個 commit 的 hash 和改了什麼。
- 新增測試與完整套件的總數、通過、失敗、skip、花的時間。
- 和規格不一致或自己做了決定的地方。
- 還沒做的和有疑問的地方。

---

## B 批（v0.10 改寫）：AI 步驟的開工與收件

> v0.10（GLADOS `2050dec`）起串接層不派工給 AI，原本的 B 批（接上 `claude -p`）取消。改成：讓所有 AI 的工作都能像 P0、P2 一樣開工、提交、收件。A 批做好的 `claude -p` 命令組裝與判讀保留給以後的批次模式，不接線。

### 規格依據

- framework/04（v0.10）：
  - §4.2 兩種執行方式：外部互動（人＋agent）和工具步驟；人或 agent 都可以提交；審查一定是另一次開工；無人值守的平行。
  - §4.5 失敗處理：3 輪上限由 skill 遵守，跨節點累計由串接層寫進工作包，超過只提示。
- framework/03 §3.5：工作包多三項：輪數、能不能平行、接續的工具步驟。§3.6：外部互動寫 `mode: external`，審查發現寫 `glados.finding/v2`。
- framework/05：§5.5 新增 P1（移植）、M2（寫 case）、M4、審查四列收件檢查；§5.4 這些節點的擋關檢查。
- framework/02 §2.2 節點總表、§2.6 模組之間。
- 節點卡 P1、M2、M4、M6：由誰做、失敗時、可寫範圍。
- impl/ai_node_execution.md：「做 AI 工作的 skill 要守的規則」。
- 共用待辦：OBC-015（v0.10 改寫的範圍）、OBC-020、OBC-031。

### 要做的事

1. **AI 步驟能開工、提交、收件**：沿用外部互動節點（OBC-010）的做法，加上這些步驟：
   - P1 第 3 步移植、第 4 步移植審查：第 2 步通過後，第 3 步可以開工；第 3 步提交通過後，第 4 步另開一次。
   - M2 寫 case、M2 測試審查（另一次開工）、M4、M6（另一次開工）。模組層的步驟要有 M1、H 已完成這類上游條件，照 framework/02 §2.3。
   - P5 安全審查先只把步驟定義好，P4、P5 還沒做，不用接線。
2. **工作包多三項**：
   - **建議的 skill**：先用暫定名稱，放在流程目錄、可以改。對應共用待辦：M4 是 `bct-m4`（SK-008），審查是 `bct-review`（SK-009），P1 移植是 `bct-p1-port`（SK-010），M2 是 `bct-m2`（SK-011），P5 是 `bct-p5-security`（SK-012）。
   - **輪數**：這是第幾輪，以及前幾輪的失敗證據（證據編號與摘要）。
     - M4 的輪數從紀錄算：M4 提交沒過、正式 build 沒過、M5 FAIL、M6 有阻擋項目，各算一輪。人做了「再試一次」的決定後，從頭算。
     - P1 移植算移植提交沒過，以及移植審查有阻擋項目。
   - **能不能平行**：依 framework/02 §2.6，A 批已經會判斷。
   - **接續的工具步驟**：有哪些，以及自動接續是開還是關。
3. **超過 3 輪只提示**：提交照收，畫面顯示「已超過 3 輪」，不擋。
4. **agent 也能提交**：API 已有。另外加一個 agent 好呼叫的提交指令（例如 `openbct glados submit --project … --node … --subject …`），回傳收件與擋關的結果，讓 agent 能自己循環修。提交指令不能碰任何核准。
5. **審查的 session 核對**：
   - 實作類步驟（M2 寫 case、M4、P1 移植）與審查類步驟的交接說明，都要記下 `session` 與 `model`，審查另外記 `reviewed_run`。
   - 用一個簡單、固定的格式，例如交接說明開頭的 key: value 區塊，寫進工作包，讓 skill 照著寫。
   - 收件時核對審查的 session 和被審那次不同；不同才算過。模型相同時只提示。
   - 缺這些欄位時收件不過，並寫明缺什麼。
6. **審查發現變成紀錄**：
   - 審查步驟的產出放一個機器可讀的發現清單，例如 `review/findings.json`，欄位照 framework/03 §3.6 的 `glados.finding/v2`，但不含編號。
   - 串接層收件時轉成正式的 finding 紀錄：編號由串接層產生；`blocking` 依類型重新判定（framework/04 §4.8），不採用 AI 填的值。
   - 擋關檢查「審查沒有未處置的阻擋項目」照紀錄判斷。有阻擋項目就回被審的步驟（移植回第 3 步、M6 回 M4），計入輪數。
7. **工具步驟自動接續**：
   - 專案設定的開關 `dispatch.auto_chain`，預設開。
   - 做好機制與測試：前一步通過後，自動執行下一個工具步驟；設備或環境不可用時交給人。
   - 現在唯一真的工具步驟是 P1 第 2 步。其他要接的工具步驟（M4 正式 build、M5、P1 第 1、5 步）在 C 批，先用測試替身驗證機制。
8. **還沒有工具的擋關檢查**：
   - M4 的「build 零警告」、M2 的「判別能力」要等 C 批的 build 和上機測試，在那之前記「未執行」，節點不能完成。
   - 「只寫在允許範圍內」「測試沒被動過」現在就能跑，照常執行。
   - 畫面照實顯示還差什麼。
9. **文件**：docs/glados-prototype.md 與共用筆記補上這批；SPEC_COMMIT 指到 GLADOS `2050dec` 或更新。

### 限制

- 繼續在 `claude/glados-dispatch` 上 commit，不 push、不 merge。
- 不呼叫任何真的 AI 或遠端服務。agent 的提交用測試裡的假呼叫端驗證。
- 既有測試（含 A 批）要維持通過。
- 完整套件用背景執行。

### 完成判斷

新增的測試要涵蓋：

- P1 第 2 步通過後，第 3 步才能開工；第 3 步提交通過後，第 4 步才能開工，而且是不同的執行。
- 工作包的輪數：M4 被 M5 FAIL、M6 阻擋、正式 build 沒過退回時，累計正確；人做「再試一次」後歸零。
- 超過 3 輪的提交照收，顯示提示。
- 提交指令回傳檢查結果，而且碰不到任何核准。
- 審查的 session 和被審那次相同時，收件不過；模型相同時只提示；缺欄位時收件不過。
- `findings.json` 轉成 `glados.finding/v2`，AI 填的 `blocking` 不被採用；有阻擋項目就回被審的步驟，計入輪數。
- 自動接續開的時候會接、關的時候不會接；設備不可用時交給人。
- 需要 C 批工具的擋關檢查記「未執行」，節點不能完成。

ruff check src tests、mypy --platform linux、完整 pytest 全綠。

### 回報

- 每個 commit 的 hash 和改了什麼。
- 新增測試與完整套件的總數、通過、失敗、skip、花的時間。
- 和規格不一致或自己做了決定的地方，例如交接說明的欄位格式、`findings.json` 的格式、輪數的算法。
- 還沒做的和有疑問的地方。

---

## C 批：build 的工具步驟（C1）；上機測試（C2）另外設計

C 批分兩段：

- **C1**（現在就能做）：build 類的工具步驟。工具已經在知識庫 main 上，就是 BC-010 的 `tools/ds5build`。
- **C2**（要先和使用者設計 lab）：上機測試類的工具步驟，包括 M5、M2 的判別能力、P1 量基線裡的既有功能、P4、P5 的測試執行。這部分需要決定設備認領、image 載入與跑測試串成同一次執行、remote-ice／ArmICE、FPGA／ICE 排程（framework/08 §8.2 第 6、7 項，共用待辦 OBC-022、OBC-026），之後另寫。

### C1 規格依據

- nodes/P1.md：
  - 第 1 步起點檢查：起點 commit 上，必要 build 設定都 build 得過；同時用 checker 重新核對 build 設定的處置。
  - 第 5 步量基線：在基底上 build 所有必要設定。
  - 失敗時：起點本身 build 不過交給人；P1 不自行把失敗的必要設定改成排除。
- nodes/M4.md：放行看串接層執行的正式 build，記錄 image hash 與記憶體用量。
- framework/05 §5.4：「build 零警告」記錄每個必要設定的 image hash；「記憶體在預算內」比對 P2 分配的預算與專案設定的上限；「既有功能已量測」（C2）。
- framework/04 §4.2「工具步驟」與 §4.5：正式 build 沒過，回 M4 的實作並計入輪數；環境問題交給人、不算輪數。
- framework/03 §3.1、§3.7：image 放證據儲存區。
- bct_knowledge_base `tools/ds5build/README.md`：
  - 用法：`--ws-fw`、`--configs`／`--all`、`--output`、`--source-id`。
  - 輸出：NDJSON 加上 `results.json`。
  - 退出碼：0、1、2 的意思。
  - 零警告要看每一筆的 `zero_warning_pass`，不能只看退出碼。
  - 工具內建序列鎖，同一時間只跑一個 build。
  - `--timeout` 預設每組 1200 秒。

### C1 要做的事

1. **ds5build 的固定方式**：照決定 4（bcgen）的做法。
   - 環境清單記成 `category: build`、`name: ds5build`、`version: <bct_knowledge_base commit>`。
   - 從本機的知識庫 clone，用 `git archive tools/ds5build` 匯出後執行，不用安裝目錄。
   - DS-5 的版本照環境清單影響 build 的 toolchain 項目（例如 DS-5 v5.28.1），傳給 ds5build（`DS5_PIN`）。偵測到的版本不符就算環境錯誤，交給人。
2. **共用的 build 步驟**：給定固定的 commit 與一組設定，做以下這些事：
   - 用 `git archive` 匯出 `ws_fw`。
   - 呼叫 ds5build，讀它的 `results.json`。
   - 每個設定寫一筆證據「build 零警告」：`zero_warning_pass` 才算 PASS；`status` 為 environment_error 時記「環境錯誤」。
   - 證據附上 image（axf、bin）的 sha256、warning 清單摘要、記憶體用量。
   - ds5build 的 run 目錄很大（sandbox、workspace、image），**整個存到本機證據目錄**（路徑放 `local_settings.json`，例如 `evidence_root`）。紀錄 branch 只存摘要（每個設定的結果、hash、warning 數）與證據目錄裡的相對路徑。
   - 必要設定的清單，從 G0 核准的專案設定裡標成「必要」的 build 設定取得。ds5build 本身不判斷齊不齊全，由串接層核對。
   - timeout：每個設定 20 分鐘，整個步驟是設定數乘以 20 分鐘；專案設定的 `dispatch.timeout_minutes.ds5build` 可以覆寫。
   - Andes 專案（沒有 `.cproject`）明確回報「不支援」，算環境問題交給人。
3. **P1 第 1 步，起點檢查**：
   - 在起點 commit 重跑 build 設定核對（OBC-030 的 checker），再 build 所有必要設定。
   - 任何必要設定 build 不過，或有 warning：照節點卡交給人，附上每組的結果。不自行改成排除。
   - 全部通過才接到第 2 步。自動接續的開關照 B 批的 `dispatch.auto_chain`。
4. **P1 第 5 步，量基線的 build 部分**：
   - 在基底 commit（移植審查通過後）build 所有必要設定。
   - 每個設定的結果、image hash、記憶體用量寫進 `artifacts/baseline/` 的基線報告。
   - 「既有功能已量測」在 C2 之前記「未執行」，所以 P1 不能完成，畫面照實顯示「等上機測試（C2）」。
5. **M4 的正式 build**：
   - M4 提交通過後自動接續：build 所有必要設定，寫「build 零警告」。
   - 「記憶體在預算內」：拿 map 的用量比對 P2 架構文件裡這個模組的預算，以及專案設定的上限。量不到就記「驗證缺口」，並寫出原因。
   - 沒過就回 M4 的實作，計入輪數，並把每組的 warning 和 error 摘要帶進下一輪的工作包。
   - M4 之後的 M5 屬於 C2，記「未執行」。
6. **文件**：docs/glados-prototype.md 與共用筆記補上這批。SPEC_COMMIT 指到 GLADOS main 最新的 commit。

### C1 限制

- 在 `claude/glados-dispatch` 上接著 `a5c283c` 開發，不 push、不 merge。
- 測試用假的 ds5build（fixture 的 `results.json` 與退出碼）驗證流程，CI 不需要 DS-5。
- 真的 DS-5 只用在一次手動 smoke。
- 不燒錄、不碰板子。

### C1 完成判斷

新增測試要涵蓋：
- ds5build 用固定 commit 匯出。
- DS-5 版本不符算環境錯誤。
- 證據判斷：
  - `zero_warning_pass` 為 false 但 `status` 為 success 時，記 FAIL。
  - environment_error 記「環境錯誤」。
- 必要設定缺結果時不能 PASS。
- 起點有任何必要設定不過時交給人，而且不改成排除。
- 基線報告有每組的 hash 與記憶體用量，P1 停在「等上機測試」。
- M4 的正式 build：
  - 沒過時回 M4，計入輪數，工作包帶 warning 摘要。
  - 記憶體超預算時 FAIL；量不到時記「驗證缺口」。
- 大檔留在本機證據目錄，紀錄 branch 只有摘要。

手動 smoke：在這台機器用 E39 的起點 `83dc1a65b`，跑 P1 第 1 步。
- 預期結果和 BC-010 的實跑一致：6 組只有 `ps5037_boot_mask_asic` 成功，但有 2 個 warning，所以 P1 交給人。這是正確的行為，回報給我。
- 要跑大約 30–40 分鐘，用背景執行。

ruff、`mypy --platform linux` 全綠。最後跑完整 pytest，這台機器的 git 很慢，大約要 2 小時，請用背景執行。

### C1 回報

- 每個 commit 的 hash 和改了什麼。
- 測試結果。
- E39 smoke 的結果。
- 自己做了決定的地方。
- 還沒做的部分。

---

## 使用者的決定（2026-10-20，全部照「建議」欄）

v0.10（`2050dec`）修正了其中三項：決定 1 只剩「定時任務直接開新工作」要確認合規；決定 3 的 `claude -p` 只留給以後的批次模式；決定 7 的 AI 節點 timeout 不再適用。

已寫進 GLADOS：impl/ai_node_execution.md（決定 1、3、7）、impl/service.md（決定 2、6）、impl/bcgen.md B9（決定 4）、framework/08 §8.2 第 1、2、4 項（決定 5、1、2）。

| # | 事項 | 選項 | 建議 | 影響哪一批 |
| :---- | :---- | :---- | :---- | :---- |
| 1 | AI 節點用誰的帳號跑 | 你的企業席位（`claude setup-token`）；組織 API key | 先用企業席位試跑少量節點，同時向管理員確認無人值守是否合規；量大或不合規再換組織 API key | B |
| 2 | 串接層服務跑在哪台機器 | 你這台電腦；一台共用機（之後可能和 remote worker 同機） | 先在你這台單機跑，跟現在的原型一樣；B、C 批跑順之後再搬 | B、C |
| 3 | 派工用哪種 agent | `claude -p`（GLADOS 已設計好）；openBCT 的 AgentRuntime（走 CCR）；Codex CLI | `claude -p`：設定隔離、權限詢問、hook 的做法都已在 impl/ai_node_execution 寫好 | B |
| 4 | bcgen 怎麼固定版本 | 本機 bct_knowledge_base clone，依環境清單記的 commit 用 `git archive` 匯出；直接用安裝目錄（每晚 auto_update 會變） | 前者：版本固定、可重現，也符合「版本由串接層計算」 | A |
| 5 | 外部來源快照放哪裡（E39 的 PS5039 register 快照是 484 個檔、71 MB） | 紀錄 branch 的 `sources/`（同一個 git，未改的檔案只存一次）；另外的快照庫（共享資料夾或 GitLab Package），git 只放逐檔 hash 清單 | 先放紀錄 branch：最簡單，權限和版本跟著紀錄走。缺點是 clone 工作區的人會多下載約 71 MB；之後太大再搬到快照庫（framework/08 §8.2 第 1 項） | A |
| 6 | 機械替換 commit 的身分 | 和紀錄一樣用「GLADOS orchestrator」這個本機身分；用操作者自己的 git 身分 | 用「GLADOS orchestrator」，再靠 commit 尾端的欄位分辨。等多人使用時，再換成真的服務帳號（和紀錄 branch 的權限保護一起） | A |
| 7 | 派工 timeout 的預設值 | 依節點各自設定 | 工具節點（bcgen）15 分鐘、AI 節點 60 分鐘；可以在專案設定覆寫 | A、B |

另外有兩件事不用現在決定，但會卡住後面：

- **build 機器**：P1 第 1、5 步與 M4 都要在有 DS-5 授權的機器上 headless build（ds5-build skill 已有）。這會影響 C 批。
- **E39 實際跑 P1**：要有 E39 的隔離工作區（目前先等），以及 P0 定案、經 G0 核准的建立設定（目前只有試跑用的）。在那之前，A 批只用合成資料測試，加上一次用 E39 試跑輸入的手動 smoke。
