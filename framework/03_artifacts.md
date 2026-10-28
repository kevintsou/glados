# 03 產出物與紀錄

> **這份文件回答**：每一站交出什麼、版本怎麼追蹤、交接說明與工作包寫什麼、串接層留下哪些紀錄、存在哪裡。
>
> v0.9 起，產出物的版本一律靠 git；不再要求產出物檔頭、固定格式的交接清單、逐份內容 hash 與產出物狀態（[v0.9 精簡提案 §5](../notes/v0.9_simplification_proposal.md#5-機制)）。

---

## 3.1 產出物目錄

節點卡的「輸入」「輸出」用這裡的名稱。檔案位置是 `.glados/projects/<專案編號>/` 底下的相對路徑；目錄配置見 [§3.7](#37-存放位置)。

| 產出物 | 檔案位置 | 產出節點 | 主要使用者 |
| :---- | :---- | :---- | :---- |
| 來源快照 | `sources/`（Jira CR、Confluence spec 頁；程式碼建立設定列的外部來源只存位置、版本與逐檔 hash，大型檔案放證據儲存區） | 工具（串接層派工） | P0、P1、P2、M1、C |
| 專案說明 | `project.md` | P0 | 全部 |
| 範圍清單 | `scope.md` | P0（G1 後經 GC 由 C 改） | P1、P2、P5、C |
| 專案設定 | `profile.json` | P0 | 全部 |
| 環境清單 | `environment.json` | P0 | 全部 |
| 基底 commit | 專案層工作 branch（機械替換與移植的 commit；沒有程式碼建立設定時就是起點 commit） | P1 | P2 之後所有節點，模組與整合 branch 的起點 |
| 基底建立紀錄 | `artifacts/base/`（生成紀錄、移植說明、移植審查報告） | P1 | GB、P7 |
| 基線報告 | `artifacts/baseline/`（含基線待處理清單） | P1 | GB、P2、M2、P5 |
| 差異分析 | `artifacts/delta.md` | P2 | M1、P5、C |
| 架構文件 | `artifacts/arch.md`（模組介面、記憶體預算、錯誤碼、boot flow 變更） | P2 | M1、M4、M6、P4 |
| CR 修訂紀錄 | `artifacts/cr_revisions.md`（有修訂時才有） | P2 | M1、C |
| 模組 spec | `artifacts/modules/<模組>/spec.md` | M1 | M2、M4、M6 |
| 待確認事項清單 | `artifacts/modules/<模組>/tbd.md` | M1 | M1 |
| 驗收合約 | `artifacts/modules/<模組>/contract.md` | M1 | M2、M5、P5 |
| 測試實作 | 專案設定的測試框架位置 | M2 | M4（唯讀）、M5、P5 |
| 測試基準 | M2 完成時，串接層記下的測試實作內容 hash | 串接層 | M4、M5、P5 |
| 實作計畫 | `artifacts/modules/<模組>/plan.md`（M4 自己的計畫與進度，選用） | M4 | M4、M6 |
| 模組 commit | 模組工作 branch | M4 | M5、M6、P4 |
| image | 證據儲存區 | 串接層派工的 build | M5、P4、P5 |
| 驗證報告 | `artifacts/modules/<模組>/verification/` | M5 | M6 |
| 審查報告與發現紀錄 | `artifacts/modules/<模組>/review/` | M2（測試審查）、M6 | 模組完成判斷 |
| 整合 branch、boot flow 報告 | 整合 branch、`artifacts/integration/` | P4 | P5 |
| 全量驗收報告 | `artifacts/acceptance/` | P5 | G3、P6 |
| release 包、交付紀錄 | 專案設定的交付位置 | P6 | P7 |
| 回寫提案 | `artifacts/writeback/` | P7 | — |
| 變更決定 | `artifacts/changes/<CR 編號>/` | C | GC、重做的那一站 |

---

## 3.2 來源快照

Jira、Confluence 上的內容隨時會被改，不能直接當依據：

- **由工具抓，不由 AI 搜**：工具依專案設定抓下來源快照。CR 範圍是專案設定指定的 Jira Epic（不用標題關鍵字）；feature list 是專案設定列出的 Jira 查詢條件與 IC label，抓查詢結果的每一張；test plan 照它的來源用同樣方式抓；spec 頁是專案設定列出的頁面 ID（[07](07_project_profile.md)）。
- **每一項都有版本與 hash**：Jira CR 存完整內容（含全部留言）、更新時間與內容 hash；Confluence 頁面記錄頁面 ID、版本號與內容 hash，另外存一份內容（隔離的工作區可能連不到 Confluence）。
- **來源只有兩種：Jira 查詢與 Confluence 頁面**（2026-10-29 使用者決定）。CR 的 Epic 也是一條 Jira 查詢。Confluence 頁面裡嵌了 Jira 查詢（Jira macro）時，工具**自動展開**：找出每個 macro 的 JQL，把每個查詢的結果都抓成快照，再依專案設定的 IC label 篩選；快照記下當時展開出來的每條 JQL 與各自的總數。這樣團隊在頁面上多一個分頁或改了查詢條件，下次同步就會帶進來，不用改專案設定；頁面怎麼改過也查得到。feature list 與 test plan 都照這個方式抓。
- **完整性可以驗證**：快照記錄查詢條件和查詢回傳的總數；快照的張數必須等於總數（[05 §5.4](05_checks.md#54-擋關檢查)「來源快照完整」）。
- **AI 寫進產出物的依據要引用快照**：節點可以用 MCP 查線上內容找線索，但依據要引用快照裡的項目；發現快照以外的重要來源，就請工具把它加進快照。
- **快照每一版都保留**：重抓會產生新版本，不覆蓋舊內容。抓到新版不等於接受新需求，怎麼接受見 [04 §4.6](04_rules.md#46-需求變更)。

程式碼建立設定列的外部來源（例如 register、HW spec）也一樣先做快照：svn、git 記 revision 或 commit；資料夾沒有版本號，定版時複製並記錄逐檔 hash（[07 §7.2](07_project_profile.md#72-填寫規則)）。

---

## 3.3 版本與追溯

- **版本靠 git**：產出物不寫檔頭；要知道「當時看的是哪一版」，看執行紀錄與核准紀錄綁定的 commit。
- **條目要編號**：spec 寫成有編號的條目（B1、B2…），不能是一整段敘述；驗收合約的每一條對到 spec 條目；每個 case 引用它驗證的 spec 條目。這是追溯唯一要求的部分，讓人看得出「B2 改了，哪些 case 要看」。
- **commit message 寫模組名稱**，有對應的 CR 時寫 CR 編號。
- **執行紀錄記下讀了哪些檔案**：串接層靠它在上游檔案改版時列出受影響的節點（[04 §4.4](04_rules.md#44-上游改版與重做)）。
- **image 與測試基準有 hash**：M5、P4、P5 的測試結果綁定 image hash 與測試基準；這兩個 hash 是「測試沒被動過」「交付內容與核准版本相符」的依據。**image hash 算的是 BIN**（燒進 ROM 或寫進 SPI 的內容，沒有 debug 資訊），不是 AXF；AXF 照樣保留，給 ICE 載入與 debug 用（2026-10-28 使用者決定，[09 §9.3](09_build_configurations.md#93-規劃時不能忽略的事)）。

---

## 3.4 交接說明

每一站結束時交出一份 markdown，放在 `handoff/<節點>-<執行編號>.md`（模組層節點放在該模組的工作 branch）。格式自由，但要有三段：

```markdown
# M4 交接說明（lcp，執行 r-0042）

## 交了什麼
- 模組 commit：<commit SHA>；改了 lcp_idpg.c、lcp_hmac.c
- 實作計畫：artifacts/modules/lcp/plan.md

## 還沒解決的問題
- 驗證缺口：B4（PMIC 異常）在 FPGA 上觸發不了
- 待確認：TBD-3 已轉問 SOC

## 給下一站
- HMAC 比對改用固定時間比較，M6 請特別看 lcp_hmac.c:88
```

**AI 的工作**（v0.10）：交接說明最前面加一段 `key: value`，到第一個空行為止，給串接層收件時核對（例如審查的獨立性，[05 §5.5](05_checks.md#55-收件檢查)）：

```text
run: r-0042
node: M4
subject: lcp
round: 2
session: <agent 的 session 編號>
model: <模型名稱>
reviewed_run: r-0041
```

`subject` 是模組或變更 CR，沒有就省略；`reviewed_run` 只有審查才填，寫被審的那次執行編號。討論類的外部互動（P0、P2、M1、C、P7）不需要這一段。

輸入與輸出的 commit、讀了哪些檔案、跑了幾輪，由串接層記在執行紀錄，交接說明不必重寫。**下一站光靠交接說明和產出物就要做得下去**，做不下去就算交接不合格，交給人處理。

---

## 3.5 工作包

外部互動的步驟（P0、P2、M1、C、P7，以及 v0.10 起所有 AI 的工作，見 [04 §4.2](04_rules.md#42-兩種執行方式)）開工時，串接層準備一份工作包給人與 agent，放在工作區的 `.glados/projects/<專案編號>/runs/<執行編號>/workpackage.md`：

| 項目 | 內容 |
| :---- | :---- |
| 節點與執行編號 | 例如 P0、r-0001；交出的檔案與交接說明都引用這個編號 |
| 工作區 | 只含允許內容的 repo 位置與 branch；有禁看 branch 的專案，工作區裡就沒有那些 branch |
| 固定輸入 | 起點或基底 commit、來源快照版本、上游產出物的 commit |
| 可讀來源 | 允許的快照、知識庫、工具；建議使用的 skill 與版本（例如 P0 的 bct-p0） |
| 要交的檔案 | 節點卡的輸出，以及交接說明的位置 |
| 會做的檢查 | 這個節點的收件檢查與擋關檢查（[05](05_checks.md)） |
| 輪數 | 有重做上限的步驟（例如 M4 的實作、P1 的移植）：這是第幾輪、前幾輪的失敗證據，包括 M5、M6 退回的累計（串接層從紀錄算）。上限 3 輪由 skill 遵守 |
| 能不能平行 | 模組層的步驟：能不能和其他模組同時做，要等哪個模組（[02 §2.6](02_workflow.md#26-模組之間)） |
| 接續的工具步驟 | 提交通過後串接層會自動執行的工具步驟（例如 M4 之後的正式 build 與 M5），以及專案設定是否關掉自動接續 |
| 規則版本 | 這次依據的 GLADOS 版本 |

工作包只是說明，不限制人與 agent 的做法。提交時，串接層以交出檔案當下的 commit 為準。

---

## 3.6 紀錄

串接層只留四種紀錄。共同規則：

- 每筆都有編號、`project_id`、`created_at`；「誰做的」用 `executor`，種類是 `ai`、`tool`、`human`、`orchestrator`。
- **只新增**：同一個編號只能有一筆，內容不同就拒絕；要更正就寫新的一筆，舊的保留。
- 讀取時不認得的格式或欄位要列出來，不能默默略過。下面的欄位都是格式的一部分；標「有的話」的可以省略。

### 核准與決定紀錄

關卡核准、交給人之後人做的決定，以及人對影響提示（[04 §4.4](04_rules.md#44-上游改版與重做)）的決定，用同一種格式：

```yaml
format: glados.approval/v2
approval_id: <編號>
project_id: <專案編號>
kind: gate                      # gate（關卡核准）／decision（交給人之後的決定、對影響提示的決定）
gate: H                         # kind 為 gate 時填：G0／GB／G1／H／G3／GC
module: <模組名稱>              # 模組層關卡或決定時填
subject: <決定對象>             # 同一關卡同時有幾個在等時區分用，例如 GC 的變更 CR（有的話）
node: <節點>                    # kind 為 decision 時填：決定的是哪一站
run_id: <被決定的那次執行>      # 有的話
handoff_id: <交給人的那次執行>  # 交給人之後的決定時填
impact:                         # 對影響提示的決定時填：提示的內容
  run_id: <讀過這些檔案的那次執行>  # 節點就是這筆決定的 node；branch 看那次執行的 read_at
  files: [ <改了的檔案> ]
  commits: [ <改到這些檔案的 commit SHA> ]
  head: <提示時 branch 的 commit SHA>   # 之後再有新 commit 會重新提示
approver: <人員>                # 必須在專案設定這個關卡的核准人名單上；決定時是「交給人時通知誰」的名單
confirmed_by: <確認方式>        # 人親自送出決定的方式，見 impl/gate_signoff
commit: <核准時的 commit SHA>
binding:                        # 這筆核准綁定的東西；改了核准就不算數
  branch: <工作 branch>         # 綁檔案的關卡（G0、G1、H、GC）
  paths: [ <綁定的檔案> ]
  blobs: { <檔案>: <blob SHA> }
  # GB 綁 commit（基底）與 pending_sha256（基線待處理清單的 hash）；G3 綁 commit（整合 branch）與 image_hash
positions:                      # 核准人對關鍵風險的逐項表態（有的話）
  - item: "spec.md#B4 的驗證缺口"
    answer: "這版接受，P5 前補 SIM 驗證"
decision: approve               # 關卡：approve／reject／defer
                                # 交給人之後：self（自己做）／return（指定回哪一站）／retry_env（修好環境重跑）／retry（再試一次）／drop（這版不做）
                                # 影響提示：return（從指定的站重做）／keep（不用重做）
return_to: <節點>              # decision 為 return 時填
note: "..."                     # 影響提示的決定必填：重做或不用重做的原因
created_at: <時間>
```

- 送出決定的動作必須由人親自完成，AI 無法代為完成（[02 §2.4](02_workflow.md#24-人工關卡)）。
- 核准之後，`binding` 裡的檔案或 commit 又改了，這筆核准就不算數，要重新核准；改回原內容又算數。
- 決定只對那個節點最近一次執行、最近一次提交有效；重新開工或退回後重新提交，都要重新決定。

### 執行紀錄

一次執行有一個執行編號。工具步驟（`mode: dispatch`）每次嘗試寫一筆；外部互動節點的一次執行會經過開工、提交（可以多次）、等外部回覆與恢復、取消，每件事各寫一筆，用 `event` 區分，`record_id` 是執行編號加事件（提交、等待、恢復會重複發生，再加一段讓編號不重複的尾碼）。工具步驟的紀錄沒有 `event`。

```yaml
format: glados.run/v2
record_id: <執行編號>.<事件>    # 例如 r-0003.start、r-0003.submit.<尾碼>；工具步驟是 <執行編號>.<輪次>
run_id: <執行編號>
event: submit                   # 只有外部互動節點：start（開工）／submit（提交）／wait（等外部回覆）／resume（恢復）／cancel（取消）
project_id: <專案編號>
module: <模組名稱>
subject: <對象>                 # 例如 C 的變更 CR（有的話）
node: M4
step: <步驟>                    # 節點有多個步驟時填（v0.10），例如 P1 的 port、port_review，M2 的 cases、test_review
mode: dispatch                  # dispatch（串接層執行的工具步驟）／external（外部互動：人＋agent，人或 agent 提交）
attempt: 2
executor: { kind: ai, id: <session 或人員識別> }
branch: <工作 branch>
input_commit: <commit SHA>      # 外部互動節點是開工時 commit 工作包的那個 commit
output_commit: <commit SHA>     # 提交時人交的 commit
read_paths: [ <讀過的檔案或目錄> ] # 給影響提示用；外部互動節點填工作包列、會隨 branch 改變的輸入；* 表示 .glados/ 以外的整個 code（例如 P2 讀基底 commit）；只讀固定版本的節點可以是空的（例如 P0 讀固定起點與快照、P7 只讀紀錄）
read_at: { branch: <branch>, commit: <commit SHA> }  # read_paths 是在哪裡讀的
workpackage: <工作包路徑>       # 開工時填
handoff: <交接說明路徑>         # 開工時填（有的話）
sources: <來源快照的參照>       # 開工時填（有的話）
environment: <這次用的環境清單 commit>  # 工具步驟填（就是輸入 commit，環境清單在裡面）；外部互動節點由人自己準備環境，可以省略
evidence: [ <證據編號> ]        # 提交時：這次收件與擋關檢查的證據；交給人時：觸發的證據
input_changed: [ <檔案> ]       # 提交時發現執行期間輸入被改了的檔案（有的話）
questions: [ <待確認事項> ]     # 等外部回覆時填
note: "..."                     # 恢復時寫回覆內容（有的話）
reason: "..."                   # 交給人的原因（有的話）
started_at: <時間>
submitted_at: <時間>            # 提交時填
ended_at: <時間>
result: 完成                    # 完成／未通過／交給人／已取消；開工、等待、恢復時是 null；工具步驟遇到環境問題或要交給人時，另寫一筆 result 為「交給人」的紀錄
log: <log 位置>                 # 工具步驟填；外部互動可以省略
```

- 進度只從紀錄推導：提交要有寫進紀錄的每一項證據，而且都是 PASS，才算收件與擋關通過。

### 證據紀錄

每執行一次收件檢查或擋關檢查，留下一筆：

```yaml
format: glados.evidence/v2
evidence_id: <編號>
project_id: <專案編號>
check: build 零警告             # 檢查名稱，見 05
kind: blocking                  # receiving（收件檢查，05 §5.5）／blocking（擋關檢查，05 §5.4）
run_id: <產生這筆證據的執行編號>
executor: { kind: tool, id: <執行端識別> }
commit: <受檢的 commit SHA>
image_hash: <hash>              # 用到 image 時才填
test_baseline: <hash>           # 用到測試基準時才填
result: PASS                    # PASS／FAIL／未執行／環境錯誤／驗證缺口，見 05 §5.3
details: <報告或原始 log 的位置>
missing: [ <缺少的項目> ]       # 沒過時缺了什麼，例如漏掉的檔案或章節（有的話）
created_at: <時間>
```

### 審查發現紀錄

P1 移植審查、M2 測試審查、M6 code 審查、P5 安全審查發現的每一項問題各一筆。放行規則見 [04 §4.8](04_rules.md#48-審查放行)。

```yaml
format: glados.finding/v2
finding_id: <編號>
project_id: <專案編號>
review_run: <審查的執行編號>
commit: <被審的 commit SHA>
location: "lcp/lcp_idpg.c:212"
category: 功能錯誤               # 功能錯誤／安全問題／記憶體越界／介面違約／違反必要規則／風格／改善建議／需求或架構爭議
blocking: true                  # 依 04 §4.8 由類型決定，實作者不能自己改
impact: "HMAC 驗證失敗時仍接受 ID page"
disposition: fixed              # fixed（已修正）／not_valid（不成立）／deferred（延後）／escalated（交給人）
created_at: <時間>
```

---

## 3.7 存放位置

### 專案工作區

- **預設就是 FW repo**。專案設定列有禁止 agent 看到的 branch 時（例如 E39 的對照實驗），工作區必須是另一個只含允許 branch 的 repo（GitLab mirror 或 fork），agent 能用的 GitLab 權限也只限於這個 repo；GLADOS 的產出不推回原 repo。
- **同一個 repo 可以有多個 GLADOS 專案**，用專案編號區分。
- **每個模組一個工作 branch，專案層節點共用一個專案層工作 branch，P4 用整合 branch**。
- **模組與整合 branch 從基底 commit 開出**（P1 完成，有 GB 時經 GB 處置後）。之後的節點不能改專案設定列的生成區，要改就改程式碼建立設定、重新建立基底；起始複製區在基底建立後是一般 source，之後的節點依各自的可寫範圍修改（[07 §7.1](07_project_profile.md#71-欄位)）。
- 每台機器的本機路徑、憑證與暫存檔另外存在本機，不當成共用的專案資料。

### branch 名稱

| branch | 名稱 | 誰寫 |
| :---- | :---- | :---- |
| 專案層工作 branch | `glados/<專案編號>/project` | 專案層節點（P0、P1、P2、P5、P7）與 C；P1 的基底 commit 也在這裡 |
| 模組工作 branch | `glados/<專案編號>/<模組名稱>` | 該模組的 M1、M2、M4、M5、M6 |
| 整合 branch | `glados/<專案編號>/integration` | P4 |
| 紀錄 branch | `glados/records/<專案編號>` | 串接層：來源快照、執行與證據紀錄、核准紀錄、進度 |

- `project` 與 `integration` 保留給專案層和整合用，模組不能取這兩個名字。
- `records` 保留給紀錄 branch，專案編號不能取這個名字，建立專案時就要拒絕。
- 紀錄 branch 目前不要求權限保護；多人、多機同時使用時再加（[08 §8.2](08_open_questions.md#82-實作待決)）。
- 有隔離限制的專案，這些 branch 都在只含允許 branch 的獨立工作區 repo 裡。

### push

- **工具步驟**（script、build、bcgen）只在執行工作區 commit，不 push；串接層回收產出後才 push。
- **外部互動**（含 v0.10 起所有 AI 的工作）由人和 agent 在工作區 commit，人可以自己 push；提交時串接層記下當下的 commit。
- **先推工作 branch，再寫紀錄 branch**：紀錄引用的 commit 必須已經在遠端；任何一步失敗都標「待同步」，不 force push。做法見 [impl/service.md I6.2](../impl/service.md#i62-commit-與-push)。

### `.glados/` 目錄配置

```text
<FW repo>/
  <FW source 與 build 檔案>
  .glados/
    projects/<專案編號>/
      project.md               # 專案說明：起點、禁看 branch
      scope.md                 # 範圍清單
      profile.json             # 專案設定，不放密碼、token 或本機路徑
      environment.json         # 環境清單
      artifacts/               # 產出物（見 §3.1），含 base/、baseline/
      handoff/                 # 各節點的交接說明
      runs/<執行編號>/          # 外部互動節點的工作包
      sources/                 # 來源快照（工具產生，只在紀錄 branch）
      records/                 # 執行、證據、核准與審查發現紀錄（串接層寫，只在紀錄 branch）
```
