# Codex 工作說明：M2 測試實作 skill `bct-m2`（SK-011）

請用繁體中文回覆。

## 工作位置

- 在 bct_knowledge_base **開一個新的 worktree**：
  - 從團隊 main（remote `gitlab`）開出 branch `codex/skill-bct-m2`，放在 `D:\repo\bct_kb_skill_m2`：
    ```
    git -C D:\repo\bct_knowledge_base fetch gitlab
    git -C D:\repo\bct_knowledge_base worktree add -b codex/skill-bct-m2 D:\repo\bct_kb_skill_m2 gitlab/main
    ```
  - 只在這個 worktree 工作。
- **不要碰**：
  - `D:\repo\bct_knowledge_base` 主 checkout。
  - 其他 worktree：`bct_kb_skill_review` 可能有另一個 Codex 在做 SK-009、SK-012。
  - openBCT 的任何 checkout：另一個 Claude session 正在做。openBCT 的檔案只用 `git show gitlab/main:<路徑>` 讀，不要 checkout、不要改。
- GLADOS（`D:\repo\glados`）只讀，例外是下面「進度回報」說的任務檔。

## 背景

GLADOS 是 bootcode FW 開發流程平台。**v0.10 起，串接層（openBCT）不派工給 AI**：AI 的工作一律由人在 Claude Code、Codex 等 agent 照 skill 執行。openBCT 只負責開工（工作區、固定輸入、工作包）、收件（收件檢查與擋關檢查）與確定性的工具步驟。

M2「測試實作」分三件事：

1. **寫 case**：人開 agent 照本 skill 做。**這次要做的就是這個 skill。**
2. **判別能力**：串接層的工具步驟，在提交後把新 case 跑在目前還沒實作的 image 上，必要的 case 要 FAIL。
3. **測試審查**：另一次開工、另一個 session，用 `bct-review`（SK-009，另外在做）。

已經決定的事（GLADOS `notes/c2_lab_design.md`）：
- 驗證平台目前都是 FPGA。
- openBCT 既有的測試項目是既有功能的測試，全部都要通過。CR 的測項由 M2 另外新增，**這就是本 skill 要寫的**。
- 判別能力預設在還沒實作的 image 上跑新寫的 case。

先讀這些：
- GLADOS `docs/coordination/tasks/SK-011.md`：完成條件。**這是最重要的一份。**
- GLADOS `impl/ai_node_execution.md`：「做 AI 工作的 skill 要守的規則」，每一條都要做到，含最多 3 輪。
- GLADOS `nodes/M2.md`：輸入、輸出、擋關檢查、可寫範圍，特別是「判別能力：證明 case 真的抓得到問題」一節。
- GLADOS `nodes/M5.md`：case 之後怎麼被執行，以及怎麼證明測試時跑的是哪個 image。
- GLADOS `notes/c2_lab_design.md`：上機測試的決定。
- GLADOS `framework/03_artifacts.md`：§3.4 交接說明，**開頭的 `key: value` 區塊格式是固定的**；§3.5 工作包。
- GLADOS `framework/04_rules.md`：§4.2 兩種執行方式、§4.5 失敗處理（3 輪上限、跨節點累計）。
- GLADOS `framework/05_checks.md`：M2 的收件與擋關檢查。
- openBCT 的寫測項方式（用 `git -C D:\repo\openBCT show gitlab/main:<路徑>` 讀）：
  - `.agents/skills/write-openbct-test/SKILL.md` 與它的 `references/`：data-driven 的 `cases.yaml` 加 `manifest.json`，放在 scripts repo，由 `framework/test.py`（SharedTest）執行。
  - `examples/example_script/`、`examples/example_ice_script/`、`src/openbct/sdk/testcase.py`。
- bct_knowledge_base `Skills/bct-p0/`、`Skills/bct-m4/`、`Skills/bct-p1-port/`：同系列 skill 的封裝方式與契約寫法，照著做。

## 要做的事

照 SK-011 的完成條件，新增 `Skills/bct-m2/`：

1. **開工時讀工作包**：專案與模組、執行編號、輪數與前幾輪的失敗證據、模組 spec、驗收合約、目前的 image、既有 case、可寫範圍（測試框架位置）、要交的檔案、GLADOS 版本。上一輪有交接說明、測試審查或判別能力退回的證據，就先讀，不重做已經過的部分。
2. **對照表**：驗收合約的每個必要情境對到一個或多個 case，寫在交接說明。對不上的情境列為缺口，不能假裝有 case。
3. **寫 case**：
   - 優先沿用 openBCT 既有的 case 與測試框架（data-driven 的 `cases.yaml`、`manifest.json`）。本 skill 和 openBCT 的 `write-openbct-test` 怎麼分工、要不要引用它的格式說明，由你評估，寫進交接紀錄。**不要改 openBCT 的 skill**。
   - case 要真的檢查合約要求的行為（回傳值、暫存器、狀態、UART 裡可判斷的結果），不能只用「印出訊息」當成功的證據。
   - 只寫測試框架位置；不改 FW source 與驗收合約。需要改合約或碰 FW 時交給人。
4. **判別能力的預期**：交接說明寫明哪些必要 case 預期在目前的 image 上會 FAIL、為什麼。預期不會 FAIL 的必要 case（例如功能已經存在）要寫明，讓人決定要不要補錯誤注入或受控修改。
5. **最多 3 輪**：從工作包的輪數接著算，包含判別能力沒過與測試審查阻擋退回的累計。第 3 輪還沒過就停下來，交接說明寫明每一輪失敗在哪，標「交給人」。
6. **commit 與提交**：修改 commit 到工作區的工作 branch，commit 訊息帶執行編號。交接說明開頭是 §3.4 的 `key: value` 區塊。提交由人在 openBCT 按，或在人同意後由 agent 執行工作包寫的提交指令。提交後照實轉述檢查結果。
7. **不碰簽核**：不宣稱已通過或已核准。
8. **封裝**：
   - 照 bct-p0：`SKILL.md`（frontmatter 的 `name: bct-m2`、description、`metadata.version: "0.1.0"`）、`references/`、`agents/openai.yaml`、`evals/evals.json` 與 `evals/fixtures/`。
   - 在 Claude Code 與 Codex 都能用，寫法照 bct-p0 的「執行平台」一節。
   - 檔案用 LF，在 `Skills/.gitattributes` 加一行 `bct-m2/** text eol=lf`。
   - 在 README 的 Skills 一覽加一列，並更新 skill 數量。
9. **契約**：參考固定的 GLADOS commit（`cc44aec` 或更新），列出依據的檔案，做法和 bct-p0 的 `references/contract.md` 一樣。不要自己發明框架沒有的欄位或規則。
10. **evals**：用合成的工作包、合約與工作區，至少涵蓋這些情境，並實際跑一次：
    - 一般情況：每個必要情境都有 case，對照表齊全。
    - 合約有一個情境寫不出 case，列為缺口，不假造。
    - 草稿 case 只檢查印出訊息，改成檢查實際行為。
    - 需求要求改驗收合約或 FW，拒絕並交給人。
    - 工作包說已經第 3 輪（判別能力沒過累計），只剩這一次。
    - 交接說明有寫預期在目前 image 上 FAIL 的必要 case。
    - 交接說明開頭欄位齊全。

## 限制

- 只用合成的資料，不碰真的專案 repo（duanyue 等）與真的 scripts repo。
- 不要改既有的 skill（含 openBCT 的 `write-openbct-test`）。發現它們有問題，照 `reports/traps/_TEMPLATE.md` 寫 report。
- 不連任何 lab 機、不碰 FPGA 或板子。
- 只在 `codex/skill-bct-m2` branch commit，**不要 push、不要 merge 到 main**：一進 main，當晚 auto_update 就會裝到全團隊。
- 不做任何對外寫入：不寫 Jira、不推 GitLab。
- 不要改 GLADOS 的規格檔與其他任務檔。

## 進度回報

照 GLADOS `docs/coordination/README.md` 的認領規則，**只更新** `D:\repo\glados\docs\coordination\tasks\SK-011.md`：
- frontmatter：owner 寫 `codex`，branch `codex/skill-bct-m2`，worktree `D:\repo\bct_kb_skill_m2`，加上實際的 owned_paths 與 status。
- 接續紀錄：日期、改了哪些檔案、commit、驗證命令與結果、還缺什麼。
- **注意**：寫 thread 或 session 編號時直接寫字元，不要用跳脫字元。上次有一個開頭的 `0` 被寫成 NUL 字元。

GLADOS 的任務檔改了**不要 commit**，Claude session 會核對後幫你 commit。

## 完成的判斷

- SK-011 的完成條件都做到，evals 實際跑過並附結果。
- 最後回報這些：
  - commit。
  - 新增的檔案。
  - 每個 eval 情境的結果。
  - 和 openBCT `write-openbct-test` 的分工決定。
  - 和 GLADOS 規格不一致或自己做了決定的地方。
  - 還缺什麼。
