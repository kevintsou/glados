# Codex 工作說明：審查 skill `bct-review` 與安全審查 skill `bct-p5-security`（SK-009、SK-012）

請用繁體中文回覆。

## 工作位置

- 在 bct_knowledge_base **開一個新的 worktree**：
  - 從團隊 main（remote `gitlab`）開出 branch `codex/skill-bct-review`，放在 `D:\repo\bct_kb_skill_review`：
    ```
    git -C D:\repo\bct_knowledge_base fetch gitlab
    git -C D:\repo\bct_knowledge_base worktree add -b codex/skill-bct-review D:\repo\bct_kb_skill_review gitlab/main
    ```
  - 只在這個 worktree 工作。兩個 skill 都放在這個 branch。
- **不要碰**：
  - `D:\repo\bct_knowledge_base` 主 checkout。
  - 其他 worktree：`bct_kb_skill_m2` 可能有另一個 Codex 在做 SK-011。
  - openBCT 的任何 checkout：另一個 Claude session 正在做。
- GLADOS（`D:\repo\glados`）只讀，例外是下面「進度回報」說的任務檔。

## 背景

GLADOS 是 bootcode FW 開發流程平台。**v0.10 起，串接層（openBCT）不派工給 AI**：AI 的工作一律由人在 Claude Code、Codex 等 agent 照 skill 執行。openBCT 只負責開工（工作區、固定輸入、工作包）、收件（收件檢查與擋關檢查）與確定性的工具步驟。

審查是「另一次開工、另一個 session」的 AI 工作，共有四種：

| 審查 | 節點 | 被審的東西 | 產出位置 | skill |
| :---- | :---- | :---- | :---- | :---- |
| 測試審查 | M2 | M2 寫的 case | `artifacts/modules/<模組>/review/` | `bct-review` |
| 獨立審查 | M6 | M4 的 diff | `artifacts/modules/<模組>/review/` | `bct-review` |
| 移植審查 | P1 第 4 步 | P1 移植的 diff | `artifacts/base/` | `bct-review` |
| 安全審查 | P5 | 整合 branch 的 diff 與 boot flow | `artifacts/acceptance/` | `bct-p5-security` |

這次要做的就是這兩個 skill。**先做 `bct-review`，再做 `bct-p5-security`**。兩個共用審查的骨架（讀工作包、身分核對、發現紀錄、交接說明），安全的重點另外列。共用的部分怎麼放（例如 `bct-p5-security` 引用 `bct-review` 的 references，或各自帶一份），由你決定，寫進交接紀錄。

先讀這些：
- GLADOS `docs/coordination/tasks/SK-009.md` 與 `SK-012.md`：完成條件。**這是最重要的兩份。**
- GLADOS `impl/ai_node_execution.md`：「做 AI 工作的 skill 要守的規則」，每一條都要做到。
- GLADOS `nodes/M2.md`、`nodes/M6.md`、`nodes/P1.md`（第 4 步移植審查）、`nodes/P5.md`：輸入、輸出、擋關檢查、可寫範圍。
- GLADOS `framework/03_artifacts.md`：
  - §3.4 交接說明，**開頭的 `key: value` 區塊格式是固定的**。審查要填 `reviewed_run`（被審那次的執行編號）。
  - §3.5 工作包。
  - §3.6 紀錄，發現紀錄 `glados.finding/v2` 的欄位。
- GLADOS `framework/04_rules.md`：§4.2 兩種執行方式；§4.8 審查放行（哪些類型 `blocking`、審查的 AI 不能自己改 `blocking`、結果綁定被審的 commit）。
- GLADOS `framework/05_checks.md`：M2、M6、P1、P5 的收件與擋關檢查。
- bct_knowledge_base `Skills/bct-p0/`、`Skills/bct-m4/`、`Skills/bct-p1-port/`：同系列 skill 的封裝方式與契約寫法，照著做。
- bct_knowledge_base `Skills/corvia_code_review/`：既有的 C 程式碼審查 skill。

## 要做的事

### `bct-review`（SK-009）

1. **開工時讀工作包**：節點（M2／M6／P1）、模組、執行編號、被審那次的執行編號與 commit、固定輸入、可寫範圍、要交的檔案、GLADOS 版本。依節點切換審查重點。
2. **身分核對**：讀被審那次的交接說明，取出它的 `session`。**和自己的 session 相同就停下來不審**，交接說明寫明原因、交給人。模型相同時照審，但在交接說明提示。
3. **三種重點清單**（寫在 references，每項都要有判斷依據）：
   - M2：每個必要情境的 case 有沒有真的落實驗收合約、是不是只用「印出訊息」當證據、預期 FAIL 的 case 是否合理、有沒有改到不該改的地方。
   - M6：功能錯誤、安全、記憶體越界、介面違約、必要規則，以及是否超出差異分析列的 code 範圍。
   - P1：每處移植有沒有依據（register 差異、建立設定、HW spec）、有沒有超出 port_paths、有沒有碰到生成區。
4. **發現紀錄**：
   - 每一項寫成 `glados.finding/v2` 的內容：位置、類型、影響、處置。
   - `blocking` 照 §4.8 由類型決定，審查的 AI 不能自己調。
   - 沒有發現時也要寫明審了哪些範圍。
5. **corvia_code_review**：先評估能不能以它為基礎，或在本 skill 裡叫用它（M6、P1 的 C 程式碼部分）。評估結果與決定寫進交接紀錄。**不要改 corvia_code_review**。
6. **只寫可寫範圍**：審查報告與發現紀錄放進工作包指定的位置。不改 FW source、測試或合約。
7. **交接與提交**：交接說明開頭是 §3.4 的 `key: value` 區塊，含 `reviewed_run`。提交由人在 openBCT 按，或在人同意後由 agent 執行工作包寫的提交指令。
8. **不碰簽核**：不宣稱已放行或已核准。

### `bct-p5-security`（SK-012）

1. 骨架同 `bct-review`：讀工作包、身分核對、發現紀錄、交接說明、提交、不碰簽核。
2. **身分核對**：自己的 session 不能和任何一個模組 M4 的 session 相同。工作包或紀錄裡有各模組 M4 的 session 時逐一核對；拿不到時在交接說明寫明是「驗證缺口」。
3. **安全重點清單**：信任鏈與簽章驗證、key 與敏感資料、除錯介面與後門、記憶體越界、錯誤處理會不會放行（錯誤路徑仍然繼續開機）。每項寫明要看 boot flow 的哪裡、要對哪些必要規則與 spec 條目。
4. **產出**：`artifacts/acceptance/` 的安全審查報告與發現紀錄。全量驗收的執行（regression、靜態分析、授權掃描）是串接層的工具步驟，**不在本 skill 範圍**。

### 兩個 skill 都要

- **封裝**：
  - 照 bct-p0：`SKILL.md`（frontmatter 的 `name`、description、`metadata.version: "0.1.0"`）、`references/`、`agents/openai.yaml`、`evals/evals.json` 與 `evals/fixtures/`。
  - 在 Claude Code 與 Codex 都能用，寫法照 bct-p0 的「執行平台」一節。
  - 檔案用 LF，在 `Skills/.gitattributes` 各加一行 `<skill>/** text eol=lf`。
  - 在 README 的 Skills 一覽各加一列，並更新 skill 數量。
- **契約**：參考固定的 GLADOS commit（`cc44aec` 或更新），列出依據的檔案，做法和 bct-p0 的 `references/contract.md` 一樣。不要自己發明框架沒有的欄位或規則；規格不清楚的地方列進回報。
- **evals**：用合成的工作包、工作區與 diff，至少涵蓋這些情境，並實際跑一次：
  - `bct-review`：
    - M6 審到一個記憶體越界，記成阻擋項目。
    - M6 沒有發現，報告寫明審查範圍。
    - M2 的 case 只檢查印出訊息，記成發現。
    - P1 的移植改到 port_paths 以外的檔案。
    - 被審那次的 session 和自己相同，停下來交給人。
    - 交接說明開頭欄位齊全，含 `reviewed_run`。
  - `bct-p5-security`：
    - 簽章驗證失敗的錯誤路徑仍然繼續開機，記成阻擋項目。
    - 除錯介面在量產設定下沒有關。
    - 自己的 session 和某個模組 M4 相同，停下來交給人。
    - 拿不到 M4 的 session，記驗證缺口。

## 限制

- 只用合成的資料，不碰真的專案 repo（duanyue 等）。
- 不要改 `Skills/corvia_code_review/` 或其他既有的 skill。發現它們有問題，照 `reports/traps/_TEMPLATE.md` 寫 report。
- 只在 `codex/skill-bct-review` branch commit，**不要 push、不要 merge 到 main**：一進 main，當晚 auto_update 就會裝到全團隊。
- 不做任何對外寫入：不寫 Jira、不推 GitLab。
- 不要改 GLADOS 的規格檔與其他任務檔。

## 進度回報

照 GLADOS `docs/coordination/README.md` 的認領規則，**只更新** `D:\repo\glados\docs\coordination\tasks\SK-009.md` 與 `SK-012.md`：
- frontmatter：owner 寫 `codex`，branch `codex/skill-bct-review`，worktree `D:\repo\bct_kb_skill_review`，加上實際的 owned_paths 與 status。
- 接續紀錄：日期、改了哪些檔案、commit、驗證命令與結果、還缺什麼。
- **注意**：寫 thread 或 session 編號時直接寫字元，不要用跳脫字元。上次有一個開頭的 `0` 被寫成 NUL 字元。

GLADOS 的任務檔改了**不要 commit**，Claude session 會核對後幫你 commit。

## 完成的判斷

- SK-009、SK-012 的完成條件都做到，evals 實際跑過並附結果。
- 最後回報這些：
  - commit。
  - 新增的檔案。
  - 每個 eval 情境的結果。
  - corvia_code_review 的評估與決定；兩個 skill 共用骨架的方式。
  - 和 GLADOS 規格不一致或自己做了決定的地方。
  - 還缺什麼。
