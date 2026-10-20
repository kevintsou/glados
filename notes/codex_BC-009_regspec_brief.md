# Codex 工作說明：register 版本辨識與差異查詢工具（BC-009）

請用繁體中文回覆。

## 工作位置

- 在 bct_knowledge_base **開一個新的 worktree**：
  - 從團隊 main（remote `gitlab`）開出 branch `codex/regspec`，放在 `D:\repo\bct_kb_regspec`：
    ```
    git -C D:\repo\bct_knowledge_base fetch gitlab
    git -C D:\repo\bct_knowledge_base worktree add -b codex/regspec D:\repo\bct_kb_regspec gitlab/main
    ```
  - 只在這個 worktree 工作。
- **不要碰**：
  - `D:\repo\bct_knowledge_base` 主 checkout。
  - 其他 worktree，例如 `D:\repo\bct_kb_ds5build` 可能有另一個 Codex 在做 BC-010。
  - openBCT 的任何 checkout：另一個 Claude session 正在改。
- GLADOS（`D:\repo\glados`）只讀，例外是下面「進度回報」說的任務檔。

## 背景

GLADOS 是 bootcode FW 開發流程平台（目前 v0.9.1）。P0「專案啟動」要寫出**程式碼建立設定**（簡稱「建立設定」，`profile.json` 的 `recipe` 區塊，格式是 `glados.recipe/v1`）。建立設定要逐一決定新 IC 的每個 register block：

- 採用外部來源的哪一版（`replace`）。
- 沿用起點的檔案（`keep`）。
- 新 IC 不要（`drop`）。

目前沒有工具能回答兩個問題：「起點 code 用的是哪一版」和「兩版之間差在哪」。

E39（以 PS5037 的 code base 做 PS5039）就卡在這裡：PS5039 缺 apu、bmu、cop1、d2h、dmac、mctp、nvme、pcie、semaphore、wbe、other 這些 block，而且同一個 block 有很多版本，還有 `_new`、`_r8r16`、`_fw` 等變體。上次 BC-008 的試跑沒有依據，只能挑最新版。

先讀這些：
- GLADOS `docs/coordination/tasks/BC-009.md`：完成條件。**這是最重要的一份。**
- GLADOS `impl/recipe.md`：`register_blocks` 的格式、`snapshot_sha256` 的算法（「格式狀態」一節）、不能全文替換的理由。
- GLADOS `projects/E39.md` E7 第 13 項、`framework/01_overview.md` §1.7 用語表。
- GLADOS `docs/coordination/README.md`：跨 agent 的認領規則。
- bct_knowledge_base `Skills/bct-p0/references/recipe.md`：P0 怎麼寫建立設定。這個工具要讓它有依據。
- bct_knowledge_base `tools/bcgen/core/derived.py` 與 `core/publication.py`：bcgen 怎麼算 `snapshot_sha256`。你的實作要和它算出一樣的值，但不要 import bcgen。

## 資料長什麼樣

- **分享資料夾**：`\\192.168.197.61\RegSpecTranslator\<IC>\<block>\<IC>_<BLOCK>_v<版本>[_new|_r8r16|_fw]\`
  - 例：`PS5037\fip\PS5037_FIP_FPHY_v1217_new\`。
  - 每個版本資料夾有 translator 產生的 `.h`（例如 `dal_reg_flh_dll_reg.h`、`dal_flh_dll_reg_reg_type.h`），以及 `PS50xx_RegSpec_<BLOCK>_v<版本>.xml`，有的還有 `.xlsx`。
- **RegSpec xml**：`<regs_list version="5.0"><regs Name=... Global_addr=...><register Byte_Addr=... REG_Name=... Offset=...><bitfield Field_Name=... Type="RW" Reset=... Bit_s=... Bit_e=... Is_rsv=.../>`。
- **header 裡的標記**：
  - 只代表工具或產生時間：例如 `version: 4.0.0`、`time:2023-10-30 00:00:00`、`script version: 4.0.0`。
  - 起點的 header 開頭還有 `//EXCEL_VERSION`、`//FPGA_IP_VERSION`、`//TOOL_VERSION`、`//HEADER_VERSION`。其中 `FPGA_IP_VERSION` 這類代表內容版本的標記**不能排除**，要當成辨識依據。
- **起點**：duanyue 的 commit `83dc1a65b`（`release/PS5037`），register header 在 `ws_fw/src_root/proj/ps5037/lib/dal/inc/<目錄>/`。目錄名和分享資料夾的 block 名不一定一樣，例如 `db` 對應 mrdb、`pic` 對應 i2c；對照要由輸入提供或列成清單，不要硬猜。
- **上次試跑**：BC-008 的 E39 試跑把 PS5039 複製了一份在 `C:\Users\kevin_tsou\AppData\Local\Temp\bcgen-e39-_1scixdo\snapshots\REG-PS5039\`（484 檔），可以參考，但要自己重新複製並記 hash。

## 要做的事

照 BC-009 的完成條件：

1. **新工具**：放在 `tools/regspec/`（名稱可以調整，但要和 bcgen 分開），只用 Python 標準函式庫。所有輸入都由參數明確傳入。
2. **版本辨識**：
   - 排除規則要明確，寫在程式與 README，報告要列出實際排除了哪些行。
   - 逐個 block 判定起點用的是哪個版本與變體，結果分成「完全相同」「最接近（附差異摘要）」「找不到」三種。
3. **結構化差異**：
   - 以 xml 為主，沒有 xml 時解析 header，並標明依據是什麼。
   - 要列出 register 與欄位的新增、刪除，以及位址、bit 位置與寬度、存取類型、reset 值的變動。
   - 名稱只是大小寫或前綴不同的，要先正規化，不能誤判成刪除再新增。
4. **快照**：算資料夾快照的 `snapshot_sha256`，要和 bcgen 算出的一致。測試要拿同一個資料夾，分別給兩邊算並比對。
5. **輸出**：JSON（附格式說明）與 Markdown。同樣的輸入重跑，輸出逐 byte 相同（不含時間或本機路徑）。
6. **E39 實跑**：
   - 用起點 `83dc1a65b` 對 PS5037 快照辨識版本。
   - 對每個 block，列出 PS5037 採用的版本和 PS5039 各版本的差異。
   - 列出 PS5039 缺少的 block。
   - 報告開頭寫明「供 P0 討論，不是 P0 定案」。

## 限制

- **起點只能讀 duanyue 的 commit `83dc1a65b`**：用 `git -C D:\repo\duanyue archive 83dc1a65b` 或 `git show` 取出到 repo 以外的暫存目錄。不要 checkout，也不要讀 duanyue 的其他 branch：`release/PS5039`、`PS5039/*` 是禁看的 branch。
- **分享資料夾只讀**：先複製 PS5037 與 PS5039 到暫存目錄當快照，記下逐檔 hash，不要寫回去。連不上就跳過實跑並說明。
- 實跑的產出放在 repo 以外的暫存目錄，不要 commit。
- 只在 `codex/regspec` branch commit，**不要 push、不要 merge 到 main**：一進 main，當晚 auto_update 就會裝到全團隊。
- 不做任何對外寫入：不寫 Jira、不推 GitLab、不改分享資料夾。
- 不要改 bcgen、skills 或 GLADOS 的規格檔。

## 進度回報

照 `docs/coordination/README.md` 的認領規則，**只更新** `D:\repo\glados\docs\coordination\tasks\BC-009.md`：
- frontmatter：owner 寫 `codex`，branch `codex/regspec`，worktree `D:\repo\bct_kb_regspec`，加上實際的 owned_paths 與 status。
- 接續紀錄：日期、改了哪些檔案、commit、驗證命令與結果、還缺什麼。

改了**不要 commit**，Claude session 會核對後幫你 commit。GLADOS 的其他檔案都不要改。

## 完成的判斷

- 新工具的 unittest 全過，涵蓋 BC-009 列的情況。
- E39 實跑完成，或者分享資料夾連不上而且有說明。
- 最後回報這些：
  - commit。
  - 測試結果。
  - E39 每個 block 的辨識結果摘要：幾個完全相同、幾個最接近、幾個找不到，以及 PS5039 缺哪些 block。
  - 排除了哪些行。
  - 還缺什麼。
