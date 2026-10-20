# Codex 工作說明：M4 實作 skill `bct-m4`（SK-008）

請用繁體中文回覆。

## 工作位置

- 在 bct_knowledge_base **開一個新的 worktree**：
  - 從團隊 main（remote `gitlab`）開出 branch `codex/skill-bct-m4`，放在 `D:\repo\bct_kb_skill_m4`：
    ```
    git -C D:\repo\bct_knowledge_base fetch gitlab
    git -C D:\repo\bct_knowledge_base worktree add -b codex/skill-bct-m4 D:\repo\bct_kb_skill_m4 gitlab/main
    ```
  - 只在這個 worktree 工作。
- **不要碰**：
  - `D:\repo\bct_knowledge_base` 主 checkout。
  - 其他 worktree：`bct_kb_regspec`、`bct_kb_ds5build`、`bct_kb_skill_p1port` 可能各有一個 Codex 在做。
  - openBCT 的任何 checkout：另一個 Claude session 正在做 B 批。
- GLADOS（`D:\repo\glados`）只讀，例外是下面「進度回報」說的任務檔。

## 背景

GLADOS 是 bootcode FW 開發流程平台。**v0.10 起，串接層（openBCT）不派工給 AI**：AI 的工作一律由人在 Claude Code、Codex 等 agent 照 skill 執行，openBCT 只負責這幾件事：

- **開工**：準備隔離的工作區、固定輸入，寫出工作包。
- **收件**：跑收件檢查與擋關檢查。
- **執行確定性的工具步驟**：例如正式 build、M5 上機測試。

M4「實作」就是這樣的 AI 工作。人開 agent，叫它讀工作包、用本 skill 規劃並改 code，在 session 裡自己 build、修到零警告，寫交接說明，然後提交。提交後，openBCT 會跑正式 build 與 M5。

先讀這些：
- GLADOS `docs/coordination/tasks/SK-008.md`：完成條件。**這是最重要的一份。**
- GLADOS `impl/ai_node_execution.md`：「做 AI 工作的 skill 要守的規則」七條，每一條都要做到。
- GLADOS `nodes/M4.md`：輸入、輸出、擋關檢查、失敗時、可寫範圍。
- GLADOS `framework/03_artifacts.md`：
  - §3.4 交接說明，**開頭的 `key: value` 區塊格式是固定的**。
  - §3.5 工作包，要讀哪些欄位。
- GLADOS `framework/04_rules.md`：§4.2 兩種執行方式、§4.5 失敗處理（3 輪上限、跨節點累計、交給人時要附什麼）。
- GLADOS `framework/05_checks.md` §5.4：M4 的擋關檢查有「build 零警告」「記憶體在預算內」「只寫在允許範圍內」「測試沒被動過」；§5.5 有 M4 的收件檢查。
- GLADOS `notes/v0.10_human_triggered_ai_proposal.md`：為什麼這樣分工。
- bct_knowledge_base `Skills/bct-p0/`：同系列 skill 的封裝方式，照著做，包括 SKILL.md、`references/`、`agents/openai.yaml`、`evals/` 與 fixtures。
- bct_knowledge_base `Skills/ds5-build/SKILL.md` 與 `Skills/andes-build/`：session 裡自己 build 的做法，含已知的雷與 log 判讀。不要改這兩個 skill，由本 skill 引用。
- bct_knowledge_base `Skills/ds5-build/SKILL.md` 開頭的「執行平台（Claude Code / OpenCode / Codex）」一節：在不同 agent 上怎麼用。

## 要做的事

照 SK-008 的完成條件，新增 `Skills/bct-m4/`：

1. **開工時讀工作包**：
   - 從工作包讀這些：專案與模組、執行編號、輪數與前幾輪的失敗證據、固定輸入、可讀來源、可寫範圍、要交的檔案、會做的檢查、GLADOS 版本。
   - 上一輪有交接說明、`plan.md`，或 M5、M6 退回的證據，就先讀，不重做已經過的部分。
2. **先寫 `artifacts/modules/<模組>/plan.md` 再改 code**：
   - 計畫裡每一步要對到 spec 條目與驗收合約，並列出會改哪些檔案。
   - 這些檔案必須都在差異分析列的這個模組的 code 範圍內。
3. **只改可寫範圍**：
   - 可寫：這個模組的 code 範圍，以及 `plan.md`。
   - 不能改：測試實作、驗收合約、生成區。
   - 需要大範圍改動範圍以外的檔案，或牽涉需求、介面時，不自己擴大，直接交給人。
4. **自己 build 的循環**：
   - ARM 照 ds5-build 的做法，Andes 照 andes-build；用哪一條線依工作區的標記檔判斷。
   - 修到零警告、不超出差異分析與架構文件給這個模組的記憶體預算。量不到記憶體用量時，在交接說明寫明。
   - 交接說明寫明：自己 build 的結果只供參考，放行看的是串接層的正式 build。
5. **最多 3 輪**：
   - 從工作包的輪數接著算，包含 M5 FAIL、M6 阻擋項目、正式 build 沒過退回的累計。
   - 第 3 輪還沒過就停下來，交接說明寫明每一輪失敗在哪、證據與卡住的原因，標「交給人」。不要自己硬修。
6. **commit 與提交**：
   - 修改 commit 到工作區的工作 branch，commit 訊息帶執行編號。
   - 交接說明放在工作包指定的位置，開頭是 §3.4 的 `key: value` 區塊（`run`、`node`、`subject`、`round`、`session`、`model`），後面三段是交了什麼、還沒解決的問題、給下一站。
   - 提交：人在 openBCT 按「提交」，或在人同意後由 agent 執行工作包寫的提交指令。提交後照實轉述檢查結果；沒過就照結果修，計入輪數。
7. **不碰簽核**：不載入簽核 skill，也不執行簽核指令。不宣稱已通過或已核准。
8. **封裝**：
   - 照 bct-p0：`SKILL.md`（frontmatter 的 `name: bct-m4`、description、`metadata.version: "0.1.0"`）、`references/`、`agents/openai.yaml`、`evals/evals.json` 與 `evals/fixtures/`。
   - 在 Claude Code 與 Codex 都能用。
   - 檔案用 LF，在 `Skills/.gitattributes` 加一行 `bct-m4/** text eol=lf`。
   - 在 README 的 Skills 一覽加一列。
9. **契約**：參考固定的 GLADOS commit（`398ee46` 或更新），列出依據的檔案，做法和 bct-p0 的 `references/contract.md` 一樣。不要自己發明框架沒有的欄位或規則。
10. **evals**：用合成的工作包、工作區與 build 指令（例如 fixture 裡寫一個假的 build 腳本），至少涵蓋這些情境：
    - 範圍內的一般實作。
    - build 一直不過，到第 3 輪停下來交給人。
    - 工作包說已經第 3 輪（M5 FAIL 累計），只剩這一次。
    - 需求要求改測試或合約，拒絕並交給人。
    - 需要改模組範圍外的檔案，交給人。
    - 交接說明開頭的欄位齊全。

    實際跑一次 evals，回報結果。

## 限制

- 只用合成的資料，不碰真的專案 repo（duanyue 等）。
- 不要改 `Skills/ds5-build/`、`Skills/andes-build/` 或其他既有 skill。發現它們有問題，照 `reports/traps/_TEMPLATE.md` 寫 report。
- 只在 `codex/skill-bct-m4` branch commit，**不要 push、不要 merge 到 main**：一進 main，當晚 auto_update 就會裝到全團隊。
- 不做任何對外寫入：不寫 Jira、不推 GitLab。
- 不要改 GLADOS 的規格檔與其他任務檔。

## 進度回報

照 GLADOS `docs/coordination/README.md` 的認領規則，**只更新** `D:\repo\glados\docs\coordination\tasks\SK-008.md`：
- frontmatter：owner 寫 `codex`，branch `codex/skill-bct-m4`，worktree `D:\repo\bct_kb_skill_m4`，加上實際的 owned_paths 與 status。
- 接續紀錄：日期、改了哪些檔案、commit、驗證命令與結果、還缺什麼。
- **注意**：寫 thread 或 session 編號時，直接寫字元，例如 `01a157e4-…`。上次有一個開頭的 `0` 被寫成 NUL 字元。

改了**不要 commit**，Claude session 會核對後幫你 commit。

## 完成的判斷

- SK-008 的完成條件都有做到，evals 實際跑過並附結果。
- 最後回報這些：
  - commit。
  - 新增的檔案。
  - 每個 eval 情境的結果。
  - 和 GLADOS 規格不一致或自己做了決定的地方。
  - 還缺什麼。
