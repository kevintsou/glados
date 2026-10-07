# GLADOS 交接與紀錄格式（v0.7 討論稿）

> 這份文件定義串接層讀寫的各種紀錄長什麼樣子。格式用 YAML 範例加上欄位說明呈現；欄位名稱是初稿。
>
> 文件確認後，才轉成機器可讀的格式定義（例如 JSON Schema），那屬於實作階段。

---

## 4.1 編號、版本與 hash

### 產出物的編號與版本

- **產出物編號**：用檔案路徑，例如 `specs/lcp.md`。要細到條目時，在路徑後面加 `#條目編號`，例如 `specs/lcp.md#B2`。
- **版本**：同一個編號的版本只會往上加（v1、v2…）。已提交的版本內容不能改；要改就是新版本。
- **內容 hash**：由串接層對內容計算（sha256）。檔案裡自己寫的 hash 只供對照，串接層一律自己算。
- **條目也有版本與 hash**：spec 條目、case 各自有版本與 hash，才能做到「只有相連的那條鏈過期」。

### commit SHA 和內容 hash 的分工

**commit SHA 用來定位版本與 diff；內容 hash 用來判斷相關的輸入有沒有變。**

| 欄位 | 意思 |
| :---- | :---- |
| 追蹤的 branch | 正式進度追蹤的 branch；各模組工作 branch 與其輸入版本另外記錄 |
| 已檢查到的 commit | S 版本同步已經分析完的那個 commit；不是「包含這筆紀錄本身」的 commit |
| FW 來源 commit | 能取得這次 FW／build 輸入的來源 commit |
| 輸入 commit | 每次執行實際使用、固定不變的輸入版本，記在執行紀錄與交接清單 |
| FW 來源 hash | 依專案設定宣告的 FW／build 輸入範圍計算的內容 hash；不能只 hash `.c` 檔 |
| image／測試集合／驗證環境 hash | build 產物、測試集合與驗證環境的證據對應 |

- 每個受管理的 branch 分別記錄已檢查到哪個 commit；不同模組 branch 不能共用同一筆。
- M4 的 build 與驗證證據，要綁修改後實際使用的來源 commit 與 hash；原本的輸入 commit 保留作追溯，但不能拿來代替修改後的版本。
- 寫入 `.glados/` 本身也會產生 commit，所以不能要求紀錄裡的 commit 永遠等於目前的 HEAD，也不能要求檔案記下自己所在 commit 的 SHA。

**例子**：A（FW 修改）→ B（交接紀錄）→ C（人工 FW 修改）→ D（版本同步報告）。D 記錄「已檢查到 C」以及 C 的 FW 來源 hash；D 這筆純紀錄更新，不會再讓 FW 證據過期一次。

純進度紀錄可以排除在 FW 來源 hash 之外，但 `.glados/` 裡的需求、合約、架構、專案設定或流程規則變更，仍依各自的相依類別檢查，不能整個目錄一律忽略。反過來，FW 來源 hash 沒變，也不代表測試、環境或人工核准一定還有效。

---

## 4.2 產出物的檔頭

每份產出物在檔案開頭寫明自己是誰、依賴誰：

```yaml
id: specs/lcp.md          # 產出物編號
version: v2               # 版本
depends_on:               # 依賴的上游產出物（細到條目）
  - id: arch.md#IF-LCP-1
    version: v1
    hash: <內容 hash>
  - id: cr/SDKBOOT-2421   # 外部來源，記錄讀取時的快照
    snapshot: <快照編號或讀取時間>
produced_by:              # 由哪個節點的哪次執行產出
  node: M1
  run_id: <執行編號>
```

- **條目層級的依賴**寫在條目旁邊：spec 的每一條寫來源 CR；每個 case 寫依賴的 spec 條目與版本（例如「依賴 B2 第 1 版」）；計畫的每一步寫對應的 case；commit message 寫對應的計畫步驟。
- **v0.7 調整**（待確認）：v0.6 讓檔頭也寫處理狀態與有效性。v0.7 改成**只放在正式紀錄**，因為節點寫在檔案裡的狀態本來就不算數（[03 §3.2](03_rules.md)），放在檔頭只會造成兩邊不一致。

---

## 4.3 交接清單

每一站結束時交出的固定格式清單。**它只是申請**，串接層核對後才算數。

```yaml
format: glados.handoff/v1
project_id: <專案編號>
module: <模組名稱>              # 專案層節點填 "-"
node: M2
run_id: <這次執行的編號>
attempt: 1                      # 第幾輪
executor:                       # 誰執行的
  kind: ai                      # ai／human／tool
  id: <session 或人員識別>
input_commit: <這次用的完整 commit SHA>
output:                         # 產出放在哪裡
  branch: glados/<專案編號>/<模組名稱>
  commit: <產出所在的 commit SHA>
inputs:                         # 用了哪些上游產出物
  - id: specs/lcp.md#B1
    version: v1
    hash: <內容 hash>
  - id: specs/lcp.md#B2
    version: v2
    hash: <內容 hash>
outputs:                        # 交出哪些產出物
  - id: acceptance_contract.md
    version: v1
    hash: <內容 hash>
  - id: cases/<case 檔>
    version: v1
    hash: <內容 hash>
self_checks:                    # 節點自己做的檢查，只供參考，不當放行依據
  - check: 每個必要情境都有 case
    note: "B1、B2 各有好壞兩個情境"
    log: <log 位置>
approvals_requested:            # 這一站需要哪個關卡核准
  - gate: H2
    subjects:
      - id: acceptance_contract.md
        version: v1
    reason: 新增驗收合約
open_blockers: []               # 還沒解決、會擋住下一站的問題
verification_gaps:              # 驗證缺口
  - item: specs/lcp.md#B4
    reason: FPGA 無法觸發 PMIC 異常
tbd:                            # 要等外部回答的問題
  - id: TBD-3
    question: "<問題>"
    asked_to: SOC
    jira: <Jira 編號>
notes_for_next: "..."           # 給下一站的補充；要寫出來，不能只留在對話裡
```

| 欄位 | 說明 |
| :---- | :---- |
| `inputs` | 必須和派工時固定的版本一致；串接層會核對 |
| `outputs` | 串接層會自己算 hash 對照 |
| `self_checks` | 節點自檢，**只供參考**。放行看的是串接層執行檢查後留下的證據紀錄（[05](05_checks.md)） |
| `approvals_requested` | 告訴串接層要送哪個關卡；核准本身由人在可驗證身分的地方產生 |
| `verification_gaps` | 平台觸發不了或觀察不到的項目；有缺口的需求不能算已驗證 |
| `tbd` | 有內容時，節點狀態轉為「等待外部回覆」 |
| `notes_for_next` | 下一站需要知道、但不在產出物裡的事 |

**和 v0.6 的差別**：

- 拿掉 `status`、`freshness`：這兩個由串接層寫在正式紀錄。
- v0.6 的 `checklist` 讓節點自己填 `result: PASS`，和「只認證據」衝突。v0.7 改成 `self_checks` 只供參考，結果以證據紀錄為準。
- 新增 `attempt`、`executor`、`output`、`tbd`。

**如果下一站光靠這份交接清單做不下去，就算上一站的檢查都過了，也視為交接不合格。**

---

## 4.4 核准與決定紀錄

人工關卡的核准，以及「交給人」之後人做的決定，都用同一種格式記錄。

```yaml
format: glados.approval/v1
approval_id: <編號>
kind: gate                      # gate（關卡核准）／decision（交給人之後的決定）／confirm（P7 確認）
gate: H2                        # kind 為 gate 時填
approver:
  id: <人員>
  verified_by: gitlab_mr        # 怎麼驗證身分：gitlab_mr／signed_commit／jira
  ref: <MR、commit 或 Jira 的位置>
subjects:                       # 核准的對象
  - id: acceptance_contract.md
    version: v1
    hash: <內容 hash>
scope: "核准範圍：B1、B2 的預期行為與判定方式"
reviewed_diff_from: <前一次核准的編號>   # 重審時填，表示只審差異
decision: approve               # approve／reject／defer（延後）
note: "..."
date: <日期>
```

- 核准綁定**身分、對象的版本與 hash、核准範圍**。對象出新版後，這筆核准就失效，只保留作稽核。
- 交給人之後的決定（例如「判定是測試錯，退回 M2」）用 `kind: decision`，`decision` 欄寫決定內容；人的決定不能代替關卡核准（[03 §3.10](03_rules.md)）。

---

## 4.5 執行紀錄

每一次嘗試（節點執行、檢查執行、獨立分析）各一份，由串接層寫。

```yaml
format: glados.run/v1
run_id: <執行編號>
project_id: <專案編號>
module: <模組名稱>
node: M4
purpose: node                   # node（節點執行）／check（檢查執行）／analysis（獨立分析）
attempt: 2
executor:
  kind: ai
  id: <session 或執行端識別>
dispatched_by: <串接層服務身分>  # 只有串接層派的執行產生的證據才算數
input_commit: <commit SHA>
inputs: [ ... ]                 # 上游產出物版本與 hash
started_at: <時間>
ended_at: <時間>
exit_code: 0
is_error: false
state: 已記錄                   # 見 03 §3.4.4
log: <log 位置>
log_hash: <hash>
produced:                       # 產出了哪些產出物或證據
  - <產出物或證據編號>
interruption:                   # 中斷時才填
  reason: 使用者立即停止
  unconfirmed: [ "FPGA-1" ]     # 無法確認已停止或已釋放的執行端或設備
```

---

## 4.6 證據紀錄

每執行一次檢查，留下一筆證據紀錄。串接層只採信它派工或自己計算出來的證據。

```yaml
format: glados.evidence/v1
evidence_id: <編號>
check: build 零警告             # 檢查名稱，見 05
run_id: <產生這筆證據的執行編號>
executed_by:                    # 串接層自行核對／工具執行／獨立審查／人工核准
  kind: tool
  id: <執行端識別>
subject:                        # 受檢的對象
  id: <產出物或 commit>
  version: <版本>
  hash: <hash>
bound_to:                       # 這筆證據綁定的版本；有用到的才填
  input_commit: <commit SHA>
  fw_source_hash: <hash>
  image_hash: <hash>
  test_set: { version: <版本>, hash: <hash> }
  environment: { version: <版本>, hash: <hash> }
  contract: { version: <版本>, hash: <hash> }
result: PASS                    # PASS／FAIL／未執行／環境錯誤／驗證缺口，見 05 §5.3
details: <報告或原始 log 的位置>
details_hash: <hash>
created_at: <時間>
```

跑測試這類一次會產生很多結果的檢查，`details` 指向逐條 case 的結果表，每條 case 各自有結果值。

---

## 4.7 審查發現紀錄

M3 實作計畫、M6 獨立審查、P5 安全審查發現的每一項問題各一筆。

```yaml
format: glados.finding/v1
finding_id: <編號>
review_run: <審查的執行編號>
subject:                        # 被審的對象
  id: <計畫或 diff>
  version: <版本>
  hash: <hash>
location: "lcp/lcp_idpg.c:212"
category: 功能錯誤               # 功能錯誤／安全問題／記憶體越界／介面違約／違反必要規則／風格／改善建議／需求或架構爭議
blocking: true                  # 依 03 §3.9 由類型決定，實作者不能自己改
impact: "HMAC 驗證失敗時仍接受 ID page"
disposition: fixed              # fixed（已修正）／not_valid（不成立）／deferred（延後）／escalated（交給關卡）
disposition_evidence: [ <證據編號> ]
confirmed_by: <確認處置的獨立審查執行編號>
```

---

## 4.8 版本同步報告

只有版本、影響或去向真的改變時才產生（[03 §3.8](03_rules.md)）。

```yaml
format: glados.sync/v1
sync_id: <編號>
trigger: 新 commit              # 開啟專案／新 commit／派工前／放行前
branch: <branch>
from_commit: <上次已檢查到的 commit>
to_commit: <這次檢查到的 commit>
changes:
  - path: duan/app/boot/lcp/lcp.c
    kind: FW                    # 進度紀錄／FW／測試／需求／介面／專案設定／驗證環境
    origin: human               # human（人工）／node（節點）／unknown（不明）
    hash_before: <hash>
    hash_after: <hash>
impact:
  - target: <產出物或證據編號>
    effect: 過期                # 過期／保持有效／無法判斷
    basis: 規則                 # 規則／獨立分析（附執行編號）
routing:
  - to: R 失敗分類              # C 變更分析／R 失敗分類／某個節點／交給人
    reason: "人工修改 lcp.c，需重新 build 與驗證"
blocking:
  - reason: "模組 branch 與整合 branch 分岔"
```

---

## 4.9 存放位置

### 誰寫在哪裡

| 紀錄 | 誰寫 | 寫在哪裡 |
| :---- | :---- | :---- |
| 產出物、交接清單 | 節點 | 模組工作 branch 的 `.glados/` |
| 通過判定、核准索引、正式進度、執行紀錄的正式狀態、版本同步報告 | 串接層服務 | 受保護的紀錄 branch 或服務的資料庫（[03 §3.11](03_rules.md)） |
| 核准本身 | 有權限的人 | 能驗證身分的地方（MR approval、簽章 commit、Jira），串接層再建立索引 |
| 證據紀錄 | 串接層（或它派工的執行端） | 紀錄 branch；大型的 log 與報告放外部證據儲存區，repo 只存位置與 hash |

### `.glados/` 建議配置

專案工作區預設就是 FW repo。**專案設定列有禁止 agent 看到的 branch 時（例如 E39 的對照實驗），工作區必須是另一個只含允許 branch 的 repo（GitLab mirror 或 fork）**，agent 能用的 GitLab 權限也只限於這個 repo；GLADOS 的產出也不推回原 repo，做到雙向隔離。

同一個 repo 可以有多個 GLADOS 專案，用專案編號、需求範圍與 branch 對應區分。以下是討論用的配置，確切的目錄細節待定：

```text
<FW repo>/
  <FW source 與 build 檔案>
  .glados/
    projects/<專案編號>/
      project.md               # P0 範圍、T0、起點
      profile.json             # 專案設定，不放機器密碼或 token
      versions.json            # 已檢查到的 commit、FW 來源快照與內容 hash
      workflow.json            # 流程版本、節點與執行規則
      artifacts/               # 差異分析、架構、模組 spec／合約／計畫／審查
      handoff/                 # 各節點的交接清單
      approvals/               # 核准索引
      runs/                    # 執行紀錄、輸入版本與證據索引
      sync/                    # 版本同步報告
```

- `artifacts/`、`handoff/` 由節點寫在各模組的工作 branch，屬於「申請」。
- `approvals/` 的核准索引、`runs/` 的正式狀態、`versions.json`、`sync/` 只由串接層服務寫在受保護的紀錄 branch。
- 每台機器的本機路徑、憑證與暫存檔另外存在本機，不當成共用的專案資料。
- 有人讀到 `.glados/` 裡寫著「已通過」，不代表他可以自己產生有效的通過或核准紀錄；仍要核對可信的證據與身分。
