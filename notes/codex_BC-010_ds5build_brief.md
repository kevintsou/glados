# Codex 工作說明：DS-5 headless build 的機器可讀包裝（BC-010）

請用繁體中文回覆。

## 工作位置

- 在 bct_knowledge_base **開一個新的 worktree**：
  - 從團隊 main（remote `gitlab`）開出 branch `codex/ds5build`，放在 `D:\repo\bct_kb_ds5build`：
    ```
    git -C D:\repo\bct_knowledge_base fetch gitlab
    git -C D:\repo\bct_knowledge_base worktree add -b codex/ds5build D:\repo\bct_kb_ds5build gitlab/main
    ```
  - 只在這個 worktree 工作。
- **不要碰**：
  - `D:\repo\bct_knowledge_base` 主 checkout。
  - 其他 worktree，例如 `D:\repo\bct_kb_regspec` 可能有另一個 Codex 在做 BC-009。
  - openBCT 的任何 checkout：另一個 Claude session 正在改。
- GLADOS（`D:\repo\glados`）只讀，例外是下面「進度回報」說的任務檔。

## 背景

GLADOS 是 bootcode FW 開發流程平台（目前 v0.9.1）。下面這些地方都要「build 所有必要設定，而且零警告」，而且要留下能核對的證據：

- P1「基底與基線建立」的起點檢查與量基線。
- M4 實作的擋關檢查。
- 「影響 build 的環境改變就重新 build」這條自動規則。

需要的證據是：每個設定的結果、warning 清單、image hash。串接層（openBCT）之後會把這個工具當成 build 執行端呼叫。

bct_knowledge_base 的 `ds5-build` skill 已經寫好怎麼用 DS-5 的 `eclipsec` headless build（不能直接呼叫 armclang 的原因、環境偵測、已知的雷、log 判讀與雜訊清單），但它是給 agent 照著做的說明。這次要做的是串接層能直接呼叫、會回傳機器可讀結果的工具。

**skill 由 EdwinLuo 維護**。照知識庫「報不改」的規矩：發現 skill 有錯或缺漏，照 `reports/traps/_TEMPLATE.md` 寫一份 report 放在 `reports/traps/`，**不要改 `Skills/ds5-build/`**。

這台機器裝有 DS-5 v5.28.1 與 v5.29.3。

先讀這些：
- GLADOS `docs/coordination/tasks/BC-010.md`：完成條件。**這是最重要的一份。**
- bct_knowledge_base `Skills/ds5-build/SKILL.md`：Step 0 環境偵測、Step 1 從 `.cproject` 讀設定、Step 2 headless build、Step 3 已知的雷、Step 4 log 判讀。
- `Skills/ds5-build/references/build-notes.md`、`build-failure-order.md`：成功的判定看產出檔、不看 exit code；從哪個 shell 發起；雜訊清單。
- `reports/traps/261019_ds5-build_parallel-make-j.md`：沒有平行 build 的路徑。
- GLADOS `framework/05_checks.md` §5.4「build 零警告」，以及 `nodes/P1.md`。
- GLADOS `notes/p1_dispatch_brief.md`：串接層之後怎麼用這個工具（C 批）。

## 要做的事

照 BC-010 的完成條件：

1. **新工具**：放在 `tools/ds5build/`（名稱可以調整），只用 Python 標準函式庫。
   - 輸入：`ws_fw` 目錄、要 build 的設定清單（從 `.cproject` 讀，不寫死）、輸出目錄。
   - 每個設定輸出一筆 JSON：
     - 結果：成功、失敗或環境錯誤。
     - error 與 warning 的數量與清單：檔案、行號、訊息與代碼。
     - `.axf`、`.bin` 是否存在，以及 sha256。
     - 有 map 檔時記記憶體用量。
     - log 位置與耗時。
2. **判讀照 skill**：
   - 成功與否看產出檔與 log，不只看 exit code。
   - skill Step 3 的已知雷都要處理，例如從哪個 shell 發起、clean 階段的「Build Finished」被誤當完成。
   - 真的 compiler warning 不能被當成雜訊濾掉。
3. **環境不寫死**：DS-5 版本、`eclipsec`、license 都自動偵測。偵測不到或授權失敗時回報「環境錯誤」，不回報成 build FAIL。
4. **不動 source**：
   - 不修改被 build 的 source。
   - Eclipse workspace 與 metadata 放在暫存目錄。
   - 同時只跑一個 build。
   - 如果 headless build 一定會在 `ws_fw/` 底下產生檔案（例如 Debug 輸出目錄），把哪些檔案會被產生寫進 README，並在結果 JSON 裡列出。
5. **測試**：log 判讀用 fixture 測試，涵蓋：
   - 成功。
   - 有 warning。
   - compile error。
   - link error。
   - 授權失敗。
   - clean-only 的假完成。
   - 產出檔缺少。
6. **E39 實跑**：用起點 `83dc1a65b` 的 6 個設定在本機實際跑一次，回報每個設定的結果。build 不過不算本項失敗，只要判讀正確，而且和你人工看 log 的結論一致。

## 限制

- **起點只能讀 duanyue 的 commit `83dc1a65b`**：用 `git -C D:\repo\duanyue archive 83dc1a65b` 取出到 repo 以外的暫存目錄，在那裡 build。不要 checkout，也不要讀 duanyue 的其他 branch：`release/PS5039`、`PS5039/*` 是禁看的 branch。
- 實跑的產出（axf、bin、log）放在 repo 以外的暫存目錄，不要 commit。
- 不要改 `Skills/ds5-build/`；有問題就寫 trap report。report 和程式一起 commit 在你的 branch 上。
- 只在 `codex/ds5build` branch commit，**不要 push、不要 merge 到 main**：一進 main，當晚 auto_update 就會裝到全團隊。
- 不做任何對外寫入：不燒錄、不碰板子、不寫 Jira、不推 GitLab。
- 不要改 bcgen、其他 skills 或 GLADOS 的規格檔。

## 進度回報

照 GLADOS `docs/coordination/README.md` 的認領規則，**只更新** `D:\repo\glados\docs\coordination\tasks\BC-010.md`：
- frontmatter：owner 寫 `codex`，branch `codex/ds5build`，worktree `D:\repo\bct_kb_ds5build`，加上實際的 owned_paths 與 status。
- 接續紀錄：日期、改了哪些檔案、commit、驗證命令與結果、還缺什麼。

改了**不要 commit**，Claude session 會核對後幫你 commit。GLADOS 的其他檔案都不要改。

## 完成的判斷

- 新工具的 unittest 全過，涵蓋 BC-010 列的情況。
- E39 的 6 個設定實跑完成，或者環境無法 build 而且有說明（例如授權不通）。
- 最後回報這些：
  - commit。
  - 測試結果。
  - 6 個設定各自的結果、warning 數、image hash。
  - 有沒有在 `ws_fw/` 下產生檔案。
  - 寫了哪些 trap report。
  - 還缺什麼。
