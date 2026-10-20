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
| **B** | AI 執行端實際接上 `claude -p`；P1 第 3 步移植、第 4 步移植審查 | 已決定。實際跑 AI 之前，要等使用者自己登入並確認合規 |
| **C** | P1 第 1、5 步：起點與基底的 build、量基線（OBC-012、OBC-013） | 要等 build 機器與 lab 設計 |

下面是 A、B 兩批的完整說明。C 批等 build 機器定了再寫。

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

## B 批：AI 執行端、P1 移植與移植審查

A 批核對完再交。實際跑 AI 之前，要使用者自己做兩件事：在跑服務的這台機器用 `claude setup-token` 登入（token 由使用者自己處理，不經過 agent）；向管理員確認用企業席位做無人值守自動化是否合規（決定 1）。

### 規格依據

- impl/ai_node_execution.md：
  - 「派工節點：啟動與回收」：`claude -p` 的參數與節點設定的對應。
  - 回收時看 exit code 加 `is_error`，不能只看 `subtype`。
  - `-p` 模式下設定檔格式錯誤會被默默忽略，所以啟動前要自己驗證。
  - 不用 `--bare`。
  - 新增的「決定（2026-10-20）」：帳號、執行方式、timeout。
- nodes/P1.md：
  - 第 3 步移植：只改移植範圍，每處修改寫明依據，和機械替換的 commit 分開。
  - 第 4 步移植審查：另一個執行者審查。
  - 失敗時：build 不過或審查有阻擋項目就在第 3 步重做，最多 3 輪；要改移植範圍以外的檔案，交給人。
- framework/04 §4.8 審查放行：哪些類型是阻擋項目，由類型決定。
- framework/03 §3.6：審查發現紀錄 `glados.finding/v2`。
- framework/05 §5.4：「審查沒有未處置的阻擋項目」「只寫在允許範圍內」。
- impl/gate_signoff.md：節點的設定不載入簽核 skill，也不能執行簽核指令。

### 要做的事

1. **AI 執行端**（決定 3：`claude -p`）：
   - **節點設定**：每個 AI 節點一套，放在 openBCT 裡、跟著版本走。包括：
     - 節點卡：取自固定的 GLADOS commit。
     - `settings.json`：權限只允許節點的可寫範圍；不允許 bcgen、簽核 skill、簽核指令、push。
     - `mcp.json`：搭配 `--strict-mcp-config`。
     - 允許的工具清單。
   - **啟動前檢查**：
     - 自己驗證設定檔，格式錯就不啟動。
     - 確認已登入。沒登入算環境問題，交給人，不算一輪。
   - **執行**：`--setting-sources project`、`--permission-mode dontAsk`、`--session-id` 由串接層產生、`--output-format json`。timeout 60 分鐘（決定 7）。
   - **回收**：
     - 結果判讀沿用 A 批的介面。
     - 保存 session 編號、`permission_denials` 與 log。
     - agent 回覆說「完成」不算數，只看工作區的 commit、交接說明，以及串接層自己跑的擋關檢查。
2. **P1 第 3 步：移植**：
   - **輸入**：
     - 機械替換 commit。
     - include 差異清單。
     - 建立設定的 `port_paths` 與理由。
     - register 快照：從紀錄 branch 讀。
     - HW spec：若有快照。
     - 上一輪的交接說明。
   - **每一輪開新的 session**：靠 `plan.md` 與交接說明接續，最多 3 輪。
   - **可寫範圍**：只有 `port_paths` 與 `artifacts/base/` 的移植說明，不能碰生成區。寫到範圍外就不放行，而且交給人，因為規格要求不能自行擴大範圍。
   - **移植說明**：每處修改寫明依據（建立設定的項目、register 差異或 HW spec 的出處）。
   - **commit**：和機械替換的 commit 分開。
3. **P1 第 4 步：移植審查**：
   - **另開一個 session**，用和移植不同的模型（例如移植用 Opus、審查用 Sonnet），只讀不寫 code。
   - **發現紀錄**：每項發現寫一筆 `glados.finding/v2`，`blocking` 由類型決定（04 §4.8），審查的 AI 不能自己改。
   - **阻擋項目**：有就回第 3 步，計入輪數；修正後重新審查。
   - **擋關檢查**：「審查沒有未處置的阻擋項目」寫成證據紀錄。
4. **build 還沒有**：
   - 第 3 步「build 不過就重做」要等 C 批的 build 執行端。
   - 在那之前，build 證據記「未執行」，P1 停在「等 build 與基線」，畫面照實顯示。
   - 不拿 PC 上的 gcc 語法檢查當 build 通過。

### 限制

- 測試一律用假的 `claude` 執行檔：它照指定的情境輸出 JSON 與 exit code，可以涵蓋成功、`is_error`、權限被擋、逾時、沒寫交接說明。CI 裡不呼叫真的 AI。
- 真的 AI 只用在一次手動 smoke，用專案設定的開關打開。這次 smoke 要等使用者已登入、也確認過合規，而且只能在暫存的合成專案上跑。
- 其他限制同 A 批。

### 完成判斷

新增的測試要涵蓋：

- 設定檔格式錯就不啟動。
- 沒登入算環境問題，不算一輪。
- `is_error` 為真時，就算 exit 0 也不算成功。
- 權限被擋會出現在交接給人的摘要裡。
- AI 的允許清單裡沒有 bcgen、簽核 skill、簽核指令、push。
- 移植寫到 `port_paths` 以外，不放行而且交給人。
- 移植說明缺依據時，收件不過。
- 審查有阻擋項目就回第 3 步並計入輪數；3 輪後交給人。
- 審查發現寫成 `glados.finding/v2`，而且 `blocking` 由類型決定。
- build 證據是「未執行」時，P1 不顯示完成。

ruff、mypy --platform linux、完整 pytest 全綠。

---

## 使用者的決定（2026-10-20，全部照「建議」欄）

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
