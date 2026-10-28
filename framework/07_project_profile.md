# 07 專案設定

> **這份文件回答**：每個專案接上 GLADOS 時要填哪些設定。
>
> 串接層、節點卡、出口檢查都從專案設定讀專案相關的值，流程本身不寫死任何專案細節。
>
> E39 的填寫範例見 [projects/E39.md](../projects/E39.md)。

---

## 7.1 欄位

| 欄位 | 內容 | 哪些節點用到 |
| :---- | :---- | :---- |
| 專案與 IC | 專案編號、名稱、IC 代號、前代專案（如果是 delta 專案）；`.glados/projects/<專案編號>/` | P0、P2、GUI、影響提示 |
| repo 與流程追蹤 | GitLab repo 編號或網址，或本機 repo；正式追蹤的 branch、模組 branch、流程版本。機器本機路徑另外存在本機 | 開啟專案、影響提示、開工、派工與監控 |
| 版本與 hash 規則 | FW／build 輸入範圍、測試與環境版本、哪些算純進度紀錄（[03 §3.3](03_artifacts.md#33-版本與追溯)） | 影響提示、M4、M5、P4、P5 |
| 執行端與同步 | 串接層服務與執行端的位址、證據索引位置、派工方式；憑證由本機的安全設定提供 | 操作入口、派工、監控 |
| 紀錄位置 | 紀錄 branch 名稱或服務資料庫；串接層服務帳號（[03 §3.7](03_artifacts.md#37-存放位置)） | 串接層 |
| 關卡核准人 | 每個關卡（G0、GB、G1、H、G3、GC）的核准人名單；「交給人」時通知誰 | 串接層、所有關卡 |
| 起點與程式碼建立設定 | **起點**：repo、起點 branch／commit，必須是已發佈或已驗證的版本；**禁止 agent 看到的 branch**（例如同專案的人工開發 branch）。**程式碼建立設定**（新 IC 或要換 register 時才有）：外部來源（例如 register、HW spec），每個來源記代號、類型（svn、git、資料夾）與固定版本（revision、commit，或資料夾快照的逐檔 hash）；register 各 block 採用的版本與對到的 code 目錄；機械替換寫入的兩種區域：**生成區**（能由建立設定重新產生的內容，例如 register header；GB 之後凍結，要改只能改建立設定、重建基底）與**起始複製區**（機械替換一次性寫入的內容，例如以前代為底複製的 IC 目錄、新增的 build 設定、共用層加入新 IC 的條件；GB 之後是一般 source）；P1 允許 AI 修改的移植範圍（不能落在生成區）；起點與新 IC build 設定的對應。來源的實際位置與憑證存在各機器的本機設定 | P0、P1、串接層 |
| 隔離方式 | 有禁看 branch 時：獨立工作區 repo 的位置、agent 可用的 GitLab 權限範圍、GLADOS 產出不推回原 repo | P0、串接層、所有節點 |
| CI 規則 | 只改 `.glados/` 或紀錄 branch 時不跑 pipeline 的設定；哪些節點會明確觸發 CI（[06 §6.6](06_service.md#66-ci)） | 串接層、M4、P5 |
| CPU 與 toolchain | ARM／Andes，以及對應的 build 方式 | P1、M4 |
| build 設定 | 盤點出的設定與處置：必要設定清單（全部要過 0 warning），每個必要設定標明是**交付版本**還是**驗證版本**；交付版本與驗證版本的差異逐項列出（例如測試專用的編譯旗標、ASIC 與 FPGA 的差別），P5 據此處置（[09 §9.3](09_build_configurations.md#93-規劃時不能忽略的事)）；明確排除的設定及理由與範圍依據。有程式碼建立設定時，處置的對象是基底的 build 設定（例如 `ps5037_*` 對應到 `ps5039_*`），並記下和起點設定的對應 | P0、P1、M4、P4、P5 |
| 記憶體預算 | **每個必要 build 設定各一套**：ROM、SRAM 各區、stack 的上限與量測方式。設定的執行位置不同，「ROM」「SRAM」的意思就不同，不能共用一套數字（[09](09_build_configurations.md)，2026-10-28 依使用者決定）。sandaru／burner 設定的 bin 大小上限是這個專案的 ATCM 大小 | P2、M4、P4 |
| 是否為 mask ROM | 決定 P6 交付之後能不能回頭。按 build 設定記：通常只有 ROM 組態（ASIC）燒進 mask ROM，SPI ROM／ICE mode 之後還能更新，tapeout 後的更新開新專案；驗證用 sandaru／burner 不交付（[09 §9.4](09_build_configurations.md#94-sandaruburner-是專案的一部分)） | P0、P6 |
| 後端介質 | bootcode 從哪些介質載入 FW：NAND、SPI ROM、UFS 等，依專案而定；決定 burner 要寫什麼、bootcode 要讀什麼、驗證平台要接什麼（[09 §9.4](09_build_configurations.md#94-sandaruburner-是專案的一部分)） | P0、P2、M2、M5、P1 |
| 驗證平台 | FPGA、SIM、ASIC 各有幾台、怎麼連線 | P1、M5、P4、P5 |
| 觀察手段 | UART token、tracker step、readsys 等可以當作預期結果的訊號 | M2、M5 |
| 製造錯誤的手段 | 可以注入錯誤的 VUC 或旗標，用來觸發壞情境 | M2、M5 |
| 測試框架 | openBCT 等；case 放哪裡、怎麼跑、報告格式 | M2、M5、P5 |
| code 模組對照 | 目錄 → 模組名稱；衝突熱點檔案；每個檔案屬於 bootcode、burner 或兩邊共用，由工具從 build 設定算出、P0 給人確認（[09 §9.4](09_build_configurations.md#94-sandaruburner-是專案的一部分)） | P0、P2、影響提示 |
| 必要規則清單 | 審查與靜態分析時違反了就一定要擋的規則（例如 MISRA 的必要條目、團隊的 coding rule、硬體特性規則），以及對應的工具設定 | P1、M6、P5 |
| 共用層規則 | 多顆 IC 共用的 code 及其旗標，改動時額外的 regression 範圍 | P2、P5 |
| 被 git 追蹤的編譯產物 | repo 裡被 git 追蹤的 build 輸出路徑（核對「只寫在允許範圍內」時要排除） | 串接層 |
| CR 來源 | Jira 的 Epic（不要用標題關鍵字，會漏掉標題沒寫專案代號的 CR）；CR 撰寫範本。工具依此抓來源快照 | P0、P2、C |
| 寫進 Jira | GLADOS 的內容要不要由工具寫進 Jira，包括 P2 定案的 CR 修訂（定案就寫回，不等 G1），以及節點要問客戶、SOC、HW 的待確認事項。有雙向隔離、不能讓其他團隊看到的專案設成「否」：CR 修訂只留在 GLADOS 內部；待確認事項由人轉問（不透露 GLADOS 的產出），答案記回待確認事項清單（[nodes/P2](../nodes/P2.md)、[nodes/M1](../nodes/M1.md)） | P2、M1、所有會等待外部回覆的節點 |
| CR 修改決定人 | P2 討論中改變需求內容的 CR 修訂由誰定案。預設是 CR 負責人；不能找 CR 負責人的專案（例如有雙向隔離），改由 G1 核准人決定（[nodes/P2](../nodes/P2.md)） | P2 |
| feature list 來源 | bootcode 和 sandaru／burner 各一份：Jira 查詢條件（例如 Epic 與 `Test-Case Tag`）、這顆 IC 用哪個 label 篩選。Confluence 的 feature list 頁只是一組 Jira 查詢，工具抓查詢結果，不抓頁面（[09 §9.4](09_build_configurations.md#94-sandaruburner-是專案的一部分)） | P0、P2、M1、M2 |
| test plan 來源 | 整合驗證（P4）要照著跑的 test plan，取得方式和 feature list 一樣：Jira 查詢條件或 Confluence 頁面 ID。要跑哪些 flow、每種後端介質要不要各跑一次，都由 test plan 決定（[09 §9.4](09_build_configurations.md#94-sandaruburner-是專案的一部分)） | P0、P4 |
| spec 來源 | Confluence spec 頁的頁面 ID 清單，每一頁標明要不要連子頁面一起抓。工具依此抓來源快照 | P0、P2、M1、C |
| 外部來源同步 | 定期比對來源快照和 Jira／Confluence 的間隔（[04 §4.7](04_rules.md#47-新-commit-與人工修改)） | 串接層 |
| 既有測試項目 | Jira 上的功能或測試項目清單（例如 sub-task），可以當作驗收定義的來源 | M2 |
| 知識庫 | 用哪一個知識庫（例如 bct_knowledge_base）；固定的版本記在環境清單（[03 §3.1](03_artifacts.md#31-產出物目錄)） | P0、M1 |
| 不可逆動作清單 | eFuse trim 等需要人批准的動作，**按平台記**：同一個動作在 ASIC 上不可逆，在 FPGA 上可能只是模擬、可以重來（例如 eFuse 用 BCFG 機制寫變數模擬），只有列在清單上的平台才擋（[09 §9.3](09_build_configurations.md#93-規劃時不能忽略的事)） | 所有節點的 hook、P6 |

---

## 7.2 填寫規則

- **不放憑證與本機路徑**：密碼、token、機器本機路徑另外存在各機器，不寫進專案設定。外部來源只記代號、類型與版本，實際位置（svn 網址、資料夾路徑）由各機器的本機設定解析。
- **外部來源一律用快照**：資料夾沒有版本號、內容可能被改（例如 register 分享資料夾會被重新產生），定版時要複製一份並記錄逐檔 hash；svn、git 用 revision 或 commit 固定。之後的節點只讀快照，不讀原始位置。大型檔案放外部證據儲存區，`sources/` 只存位置、版本與 hash（[03 §3.1](03_artifacts.md#31-產出物目錄)）。來源類型可以換（例如從資料夾換成 svn），採用哪一版仍看快照的 hash。
- **build 設定要逐項處置**：記下起點盤點來源與版本，盤點出的每個設定都要列為必要或明確排除；P0 草稿可有待確認，送 G0 前必須解決。盤點不完整也不能以「沒找到」當作不存在。排除要有範圍依據並經 G0 核准，不能只是 build 失敗或工具不支援；專案範圍需要的設定不得排除。排除項目不要求 build，也不能計為 PASS。這些資訊都放在既有的 build 設定欄位，不新增 P0 產出物。
- **專案設定是產出物**：由 P0 產出、經 G0 核准。G1 核准前要改，回 P0 重開 G0；G1 核准後要改，走 C＋GC（[04 §4.6](04_rules.md#46-需求變更)）。
- **改版的影響依欄位**：上表「哪些節點用到」就是改版時要提示的節點。起點與程式碼建立設定（包括外部來源換版，例如 HW 更新 register）、CPU 與 toolchain、build 設定、驗證平台改了，就是「改基底、平台或 toolchain」，從 P0／P1 重做，之前的 build 與測試結果都不算。其他欄位改了，串接層提示用到它的節點，由人決定重做哪裡（[04 §4.4](04_rules.md#44-上游改版與重做)）；只影響流程運作的欄位（例如關卡核准人、外部來源同步的間隔）不影響任何結果。
- **欄位不夠用時回頭修框架**：如果某個專案需要新欄位才能跑，先檢查是不是流程本身不夠通用（[01 §1.4](01_overview.md#14-三層框架節點實作專案)）。
