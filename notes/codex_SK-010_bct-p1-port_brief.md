# Codex 工作說明：P1 移植 skill `bct-p1-port`（SK-010）

請用繁體中文回覆。

## 工作位置

- 在 bct_knowledge_base **開一個新的 worktree**：
  - 從團隊 main（remote `gitlab`）開出 branch `codex/skill-bct-p1-port`，放在 `D:\repo\bct_kb_skill_p1port`：
    ```
    git -C D:\repo\bct_knowledge_base fetch gitlab
    git -C D:\repo\bct_knowledge_base worktree add -b codex/skill-bct-p1-port D:\repo\bct_kb_skill_p1port gitlab/main
    ```
  - 只在這個 worktree 工作。
- **不要碰**：
  - `D:\repo\bct_knowledge_base` 主 checkout。
  - 其他 worktree：`bct_kb_regspec`、`bct_kb_ds5build`、`bct_kb_skill_m4` 可能各有一個 Codex 在做。
  - openBCT 的任何 checkout：另一個 Claude session 正在做 B 批。
- GLADOS（`D:\repo\glados`）只讀，例外是下面「進度回報」說的任務檔。

## 背景

GLADOS 是 bootcode FW 開發流程平台。**v0.10 起，串接層（openBCT）不派工給 AI**：AI 的工作一律由人在 Claude Code、Codex 等 agent 照 skill 執行，openBCT 只開工、收件，並執行確定性的工具步驟。

P1「基底與基線建立」用前代 IC 的 code base 建立新 IC 的 code base，分五步：

| 步驟 | 內容 | 誰做 |
| :---- | :---- | :---- |
| 1 | 起點檢查 | openBCT 的工具 |
| 2 | 機械替換：bcgen 依程式碼建立設定換 register、建立新 IC 目錄與 build 設定 | openBCT 的工具 |
| **3** | **移植：機械替換做不到的部分，例如 register 改變後受影響的 HAL 與初始化** | **本 skill** |
| 4 | 移植審查：另一次開工，用審查 skill | 另一個 session |
| 5 | 量基線 | openBCT 的工具 |

E39 是第一個實例：以 PS5037 的 code base 做 PS5039。

先讀這些：
- GLADOS `docs/coordination/tasks/SK-010.md`：完成條件。**這是最重要的一份。**
- GLADOS `impl/ai_node_execution.md`：「做 AI 工作的 skill 要守的規則」七條，每一條都要做到。
- GLADOS `nodes/P1.md`：五個步驟、輸出（`artifacts/base/` 的移植說明）、失敗時、可寫範圍（移植只改移植範圍，不能落在生成區）。
- GLADOS `impl/recipe.md`：程式碼建立設定的格式。和本 skill 有關的有 `port_paths`、生成區（`replace`、`keep` 的 `to`）、起始複製區、`register_entry`、include 差異清單、「名稱替換」。
- GLADOS `framework/03_artifacts.md`：
  - §3.4 交接說明，**開頭的 `key: value` 區塊格式是固定的**。
  - §3.5 工作包。
- GLADOS `framework/04_rules.md`：§4.2、§4.5（3 輪上限；移植審查有阻擋項目會退回第 3 步，計入輪數）。
- GLADOS `framework/05_checks.md`：§5.4「只寫在允許範圍內」、§5.5 P1（移植）的收件檢查（每處修改都寫明依據）。
- GLADOS `notes/v0.10_human_triggered_ai_proposal.md`：為什麼這樣分工。
- bct_knowledge_base `Skills/bct-p0/`：同系列 skill 的封裝方式，照著做；它的 `references/recipe.md` 說明 P0 怎麼寫程式碼建立設定。
- bct_knowledge_base `tools/bcgen/README.md` 的「GLADOS 衍生模式」一節：機械替換產出什麼。生成紀錄有 `generation.json`、include 差異清單，生成區與起始複製區怎麼分。
- GLADOS `docs/coordination/tasks/BC-009.md`：register 版本辨識與差異查詢工具，另一個 Codex 正在做。本 skill 要能在工具可用時用它查 register 差異；不可用時，退回直接比對快照裡的 header 或 RegSpec xml。

## 要做的事

照 SK-010 的完成條件，新增 `Skills/bct-p1-port/`：

1. **開工時讀工作包與機械替換的結果**：
   - 從工作包讀這些：
     - 專案、執行編號、輪數與前幾輪的失敗證據。
     - 固定輸入：機械替換 commit。
     - 可讀來源：紀錄 branch 上的外部來源快照，例如 `.glados/projects/<id>/sources/<來源代號>/`；有 HW spec 快照就一起讀。
     - 可寫範圍、要交的檔案、會做的檢查。
   - 讀 `artifacts/base/` 裡機械替換的生成紀錄：include 差異清單、建立設定、輸出清單。
   - 上一輪有移植說明、交接說明，或移植審查的發現，就先讀。
2. **只改 `port_paths`**：
   - 可寫範圍是程式碼建立設定的 `port_paths`，加上 `artifacts/base/` 的移植說明。
   - 不能碰生成區（`register_blocks` 的 `replace`、`keep` 的 `to`）。
   - 需要改 `port_paths` 以外的檔案時，不自己擴大範圍；停下來交給人，交接說明寫明缺哪個路徑、為什麼，通常要回 P0 補建立設定。
3. **每處修改都有依據**：
   - 移植說明逐項寫：檔案與位置、改了什麼、依據是什麼。依據只能是三種：建立設定的哪一項、哪個 register 的差異（版本、欄位、位址）、HW spec 的哪一段。
   - 查不到依據的，不要自己推定；列為未解決，交給人。
4. **include 差異清單逐項處置**：入口檔案（`register_entry`，例如 `lib/platform.h`）include 了不存在的生成檔，或有生成檔沒被 include，每一項都寫明處置：加 include、改名、或說明為什麼不用。
5. **自己 build 的循環**：
   - ARM 照 ds5-build 的做法，Andes 照 andes-build。
   - 修到 build 得過、零警告。結果只供參考，放行看的是串接層的 build 與基線。
6. **最多 3 輪**：
   - 從工作包的輪數接著算，包含移植審查有阻擋項目退回的累計。
   - 第 3 輪還沒過就停下來交給人，交接說明寫明每一輪失敗在哪、證據與卡住的原因。
7. **commit 與提交**：
   - 移植的修改要和機械替換的 commit 分開，commit 到工作區的專案層工作 branch，commit 訊息帶執行編號。
   - 交接說明開頭是 §3.4 的 `key: value` 區塊（`run`、`node: P1`、`round`、`session`、`model`），後面三段是交了什麼、還沒解決的問題、給下一站。給下一站時，要提醒審查者特別看哪些地方。
   - 提交：人在 openBCT 按「提交」，或在人同意後由 agent 執行工作包寫的提交指令。提交後照實轉述檢查結果。
8. **不碰簽核**：不宣稱已通過或已核准。
9. **封裝**：
   - 照 bct-p0：`SKILL.md`（`name: bct-p1-port`、description、`metadata.version: "0.1.0"`）、`references/`、`agents/openai.yaml`、`evals/evals.json` 與 `evals/fixtures/`。
   - 在 Claude Code 與 Codex 都能用。
   - 檔案用 LF，在 `Skills/.gitattributes` 加一行 `bct-p1-port/** text eol=lf`。
   - 在 README 的 Skills 一覽加一列。
10. **契約**：參考固定的 GLADOS commit（`398ee46` 或更新），列出依據的檔案。不要自己發明框架沒有的欄位或規則。
11. **evals**：用合成的工作包、機械替換結果、register 快照與建立設定，至少涵蓋這些情境：
    - 一般移植，每處都有依據。
    - include 差異清單有缺漏，逐項處置。
    - 需要改 `port_paths` 以外的檔案，停下來交給人並建議回 P0。
    - 想改生成區的檔案，被拒絕。
    - 第 2 輪：移植審查有阻擋項目退回，逐項處理。
    - 找不到依據，列為未解決，不推定。
    - 交接說明開頭的欄位齊全。

    實際跑一次 evals，回報結果。

## 限制

- 只用合成的資料。如果要讓 fixture 貼近真實，可以**只讀** duanyue 的 commit `83dc1a65b`（用 `git -C D:\repo\duanyue show 83dc1a65b:<路徑>` 取小片段當樣本）。不要 checkout，也不要讀 `release/PS5039`、`PS5039/*` 這些禁看的 branch。從起點取材的樣本要改成合成內容，不要整份複製進 repo。
- 不要改 bcgen、`Skills/bct-p0/`、`Skills/ds5-build/`、`Skills/andes-build/` 或其他既有 skill。
- 只在 `codex/skill-bct-p1-port` branch commit，**不要 push、不要 merge 到 main**：一進 main，當晚 auto_update 就會裝到全團隊。
- 不做任何對外寫入：不寫 Jira、不推 GitLab、不改分享資料夾。
- 不要改 GLADOS 的規格檔與其他任務檔。

## 進度回報

照 GLADOS `docs/coordination/README.md` 的認領規則，**只更新** `D:\repo\glados\docs\coordination\tasks\SK-010.md`：
- frontmatter：owner 寫 `codex`，branch `codex/skill-bct-p1-port`，worktree `D:\repo\bct_kb_skill_p1port`，加上實際的 owned_paths 與 status。
- 接續紀錄：日期、改了哪些檔案、commit、驗證命令與結果、還缺什麼。
- **注意**：寫 thread 或 session 編號時，直接寫字元，例如 `01a157e4-…`。上次有一個開頭的 `0` 被寫成 NUL 字元。

改了**不要 commit**，Claude session 會核對後幫你 commit。

## 完成的判斷

- SK-010 的完成條件都有做到，evals 實際跑過並附結果。
- 最後回報這些：
  - commit。
  - 新增的檔案。
  - 每個 eval 情境的結果。
  - 和 BC-009 工具怎麼銜接。
  - 和 GLADOS 規格不一致或自己做了決定的地方。
  - 還缺什麼。
