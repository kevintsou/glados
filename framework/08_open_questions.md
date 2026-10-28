# 08 待決事項與決定紀錄

> **這份文件回答**：還有哪些事沒決定、哪些已經決定、哪些先暫緩。
>
> 正文裡標「待確認」的地方，都連到這裡的編號。框架待決要在文件定稿前有結論；實作待決等展開節點或實作時再決定。

---

## 8.1 框架待決

文件定稿（建置路線步驟 1a）前要有結論。

目前沒有。之後討論出新的框架問題，再加在這裡。

---

## 8.2 實作待決

展開節點或實作串接層服務時再決定。

| # | 事項 | 在哪裡 |
| :---- | :---- | :---- |
| 1 | 大型證據（image、log、報告）的保存位置、存取與保留期限。（2026-10-20 暫定，依使用者決定：外部來源快照先放紀錄 branch 的 `sources/`，同一個 git 只存一次沒改的檔案；太大再搬到另外的快照庫，git 只放逐檔 hash 清單） | [03 §3.7](03_artifacts.md#37-存放位置) |
| 2 | 串接層帳號：個人企業席位，還是組織 API key。（2026-10-20 暫定，依使用者決定：先用使用者的企業席位試行，同時向管理員確認合規。v0.10 起 AI 的工作由人在自己的 agent 執行，只有「用定時任務直接開新的工作」才要確認合規） | [impl/ai_node_execution.md](../impl/ai_node_execution.md) |
| 3 | 各專案可用的錯誤注入、受控修改與補驗證手段 | [nodes/M2](../nodes/M2.md) |
| 4 | 串接層服務部署在哪台機器、跨機器的身分與授權、和 openBCT 的介面。（2026-10-20 暫定，依使用者決定：先在使用者自己的電腦單機跑） | [impl/service.md I8](../impl/service.md#i8-待決事項) |
| 5 | 各專案 CI 排除規則的具體設定（要和 CI 管理者確認） | [06 §6.6](06_service.md#66-ci) |
| 6 | 跨機器的設備與資源認領。（2026-10-22：公司的 FPGA 已有 FPGA Queue 機制，應該接它；可用的 bench 清單由使用者整理，細節之後再討論，見 [notes/c2_lab_design](../notes/c2_lab_design.md)） | [impl/service.md I8](../impl/service.md#i8-待決事項) |
| 7 | image 載入與跑測試串成同一次執行，才能證明測試時跑的是哪個 image。（2026-10-22 決定：把 remote-ice 包成機器可讀的工具，和 openBCT 測試在同一次工具步驟裡依序執行；先用 ICE 讀回 hash 證明，之後再加開機印出的 build ID，見 [notes/c2_lab_design](../notes/c2_lab_design.md)） | [nodes/M5](../nodes/M5.md) |
| 8 | 關卡確認動作要不要改用 AI 拿不到的驗證（例如 Windows Hello、重新輸入密碼）；互動式 session 要不要禁止 AI 操作桌面 | [impl/gate_signoff G7](../impl/gate_signoff.md#g7-待決事項) |
| 9 | 各產出物（spec、差異分析、架構、計畫…）的完整範本。框架只規定節點卡列的最低結構，完整範本在展開各節點實作時再定 | [nodes/](../nodes/README.md) |
| 10 | openBCT 的專案建立流程要不要一併開專案層工作 branch 與紀錄 branch；多人、多機同時使用前，紀錄 branch 的權限保護由誰設定 | [impl/service.md I4](../impl/service.md#i4-gitlab本機-repo查詢和執行分開)、[03 §3.7](03_artifacts.md#37-存放位置) |
| 11 | （v0.9 結案）`workflow.json`：v0.9 不再使用，流程版本記在執行紀錄與工作包 | [03 §3.7](03_artifacts.md#37-存放位置) |
| 12 | 有禁看 branch 的專案（例如 E39），只含允許 branch 的獨立工作區 repo 是由建立流程產生，還是要事先由人準備好 | [impl/service.md I4](../impl/service.md#i4-gitlab本機-repo查詢和執行分開)、[03 §3.7](03_artifacts.md#37-存放位置) |
| 13 | 外部來源與程式碼建立設定的工具：svn／git／資料夾快照、register 版本辨識（排除 translator 版本與產生時間後比對）、register 結構化差異查詢（解析 RegSpec xml）、HW spec 查詢；bcgen 的「以前代 code base 衍生」模式與 ARM 支援；本機路徑映射接 OBC-006 | [nodes/P1](../nodes/P1.md)、[07](07_project_profile.md)、[impl/bcgen](../impl/bcgen.md) |
| 14 | 模組記憶體怎麼算（2026-10-28 已決定：上限與預算按 build 設定各定一套）。還沒決定：SRAM 要不要按記憶體區分開算；stack 預算的定義；沒歸到模組的用量（padding、linker 產生的部分）要不要另外擋；sandaru／burner 和 ROM bootcode 同時用 SRAM 的範圍要不要交叉比對；listing 解析放在哪 | [09 §9.3](09_build_configurations.md#93-規劃時不能忽略的事)、[05 §5.4](05_checks.md#54-擋關檢查) |
| 15 | build 設定稽核（2026-10-28）列出的設計問題：測試、G3、交付只綁一個 image；上機只有 ICE 直接載入；測 FPGA、交 ASIC；P4 端到端 flow 沒指定設定；case 沒有適用設定；mask ROM 只有一個旗標等 | [notes/build_config_audit_20261028](../notes/build_config_audit_20261028.md)、[09](09_build_configurations.md) |
| 16 | sandaru／burner 納入規格（2026-10-28 討論中）：burner 的 feature list 格式與位置；共用 SDK／HAL 與 header 改動時兩邊怎麼重驗；從 build 設定算出檔案歸屬的工具（還沒做）；test plan 的格式與位置。載入 VUC、SRAM 共用、ROM 固定位址等細節改由各專案 P0 依 burner feature list 討論 | [09 §9.4](09_build_configurations.md#94-sandaruburner-是專案的一部分) |

其他實作待決：

- 每張節點卡的「待展開議題」。
- [impl/service.md I8](../impl/service.md#i8-待決事項)：串接層服務的待決事項。
- [impl/bcgen.md B9](../impl/bcgen.md#b9-待決事項)：bcgen 接進 GLADOS 的待決事項。
- [projects/E39.md E7](../projects/E39.md#e7-e39-待決事項)：E39 專案自己的待決事項。

---

## 8.3 已決定事項

| 版本 | 決定 | 在哪裡 |
| :---- | :---- | :---- |
| v0.11 | 不可逆動作清單按平台記；暫定 FPGA 上的 eFuse 不擋（BCFG 寫變數模擬，FPGA 可重寫的模擬機制待確認），只有 ASIC 上擋 | [07](07_project_profile.md)、[05](05_checks.md)、[09 §9.3](09_build_configurations.md#93-規劃時不能忽略的事) |
| v0.11 | image hash 以 BIN 為準（G3、P6、「image 改變」都比 BIN），AXF 保留給 ICE 與 debug；P1 起點檢查 build 兩次確認 BIN 可重現 | [03 §3.3](03_artifacts.md#33-版本與追溯)、[09 §9.3](09_build_configurations.md#93-規劃時不能忽略的事)、[nodes/P1](../nodes/P1.md) |
| v0.11 | 我們產出的 sandaru／burner 是驗證用的（量產 burner 由其他單位產出），不交付、是測試環境：G3 綁它的 hash 當證據，P6 只交付 bootcode。tapeout 後要改 SPI ROM 版，開新的 GLADOS 專案：起點是 P6 交付的版本，ROM bootcode 保留且 image hash 不變；「是否為 mask ROM」按 build 設定記 | [09 §9.4](09_build_configurations.md#94-sandaruburner-是專案的一部分)、[07](07_project_profile.md)、[nodes/P0](../nodes/P0.md) |
| v0.11 | 驗證版本與交付版本不同時（ASIC／FPGA、測試專用旗標等）：P0 在 build 設定標明交付版本與驗證版本並列出差異；G3 綁交付版本的 hash；P5 產出差異清單，說明不了的登記為驗證缺口交 G3；交付版本也要 build 0 warning、記憶體在預算內；不靠 HW SIM | [09 §9.3](09_build_configurations.md#93-規劃時不能忽略的事)、[07](07_project_profile.md)、[nodes/P5](../nodes/P5.md)、[05 §5.4](05_checks.md#54-擋關檢查) |
| v0.11（2026-10-28） | sandaru／burner 是專案的一部分：P0 用 bootcode feature list、burner feature list 與 CR 建基本架構，模組階段一起開發 burner；feature list 由工具依 Jira 查詢條件與 IC label 抓快照；bootcode 與 burner 共用底層 SDK／HAL 與部分 header（例如 eFuse），是兩支程式之間的介面；burner 由 host tool 下 VUC 帶入，bootcode 要支援這組 VUC；burner bin 上限是專案的 ATCM 大小；其他細節在各專案 P0 依 burner feature list 討論；bootcode 與 burner 一起開發、一起放行（G3 綁兩邊；P6 只交付 bootcode），M1～M6 互相搭配，P2 相依可跨兩支程式，M5 證據記另一支程式的 image hash；burner 是 bootcode 測試環境的一部分（把 FW 寫進後端介質，NAND、SPI ROM、UFS 等依專案；驗帶入與跳轉），P1 基線也要有一版能用的 burner；M5 驗證時另一支程式用固定版本（P1 基線那一版）以隔離問題，P4 整合時再用完整版本一起驗；要用到另一支程式這版新功能的 case 在 M1 合約標「延到 P4」，M5 不擋、P4 必須 PASS；每個檔案屬於 bootcode、burner 或共用，由工具從 build 設定算出、P0 確認，改到共用的兩邊都重驗；P4 照 test plan 驗（test plan 取得方式同 feature list），不寫死 flow 與介質；正式 build 每次 clean build 全部必要設定（bootcode 與 burner）；每個 case 在 M1 合約標適用的 build 設定，M5 按設定分開跑、分開記；P1 基線的既有測項照同樣規則；每種設定怎麼載入、怎麼開始跑由 test plan 決定，驗證環境要支援 test plan 用到的每一種載入方式 | [09 §9.4](09_build_configurations.md#94-sandaruburner-是專案的一部分)、[nodes/P0](../nodes/P0.md)、[07](07_project_profile.md) |
| v0.10（2026-10-28） | 記憶體上限與模組記憶體預算按 build 設定各定一套：ROM 組態、SPI ROM／ICE mode、sandaru／burner 的執行位置不同，「ROM」「SRAM」意思不同，不能共用一套數字 | [07 §7.1](07_project_profile.md#71-欄位)、[09](09_build_configurations.md)、[05 §5.4](05_checks.md#54-擋關檢查) |
| v0.10 | 串接層不派工給 AI：AI 的工作一律由人開 agent 照 skill 完成，串接層只開工與收件；確定性的工具步驟（機械替換、build、上機測試）由串接層執行，人觸發或自動接續；3 輪上限由 skill 遵守，跨節點累計由串接層寫進工作包，超過只提示；人或 agent 都可以提交；審查是另一次開工並核對 session | [04 §4.2](04_rules.md#42-兩種執行方式)、[04 §4.5](04_rules.md#45-失敗處理)、[03 §3.5](03_artifacts.md#35-工作包)、[05 §5.5](05_checks.md#55-收件檢查) |
| v0.9.1 | 紀錄格式照 openBCT 實作補齊（格式版本仍是 v2）：紀錄只新增、不覆蓋；外部互動節點一次執行的開工、提交、等外部回覆、恢復、取消各寫一筆執行紀錄（`event`、`record_id`）；收件檢查也寫證據（`kind`）；核准紀錄記綁定的東西（`binding`），影響提示的決定用 `kind: decision`、`return`／`keep` 並必寫原因；`read_paths` 的 `*` 表示整個 code | [03 §3.6](03_artifacts.md#36-紀錄)、[04 §4.3](04_rules.md#43-節點狀態)、[04 §4.4](04_rules.md#44-上游改版與重做) |
| v0.9 | 精簡流程：需要人參與的節點（P0、P2、M1、C、P7）由人自己開 agent 完成，串接層只開工與收件；P3 併入 P2、G1 與 G2 合併成 G1；M2 的驗收合約移到 M1、H1 與 H2 合併成每模組一次 H；M3 併入 M4；取消 M7；GB 只在基線有 FAIL 時才問人；P7 的人確認不再是關卡 | [02](02_workflow.md)、[04 §4.2](04_rules.md#42-兩種執行方式)、[nodes/](../nodes/README.md) |
| v0.9 | 擋關檢查只留錯了會真的出事的 20 項；人在場的節點改用收件檢查，只看交齊與結構；交接清單改成自由格式的交接說明，不要產出物檔頭與逐份 hash；紀錄只留核准與決定、執行、證據、審查發現四種 | [03](03_artifacts.md)、[05](05_checks.md) |
| v0.9 | 自動判定改成提示：上游改版、新 commit 由串接層列出受影響的節點，人決定重做哪裡；只保留兩條自動規則（image 改變時舊測試結果不算、影響 build 的環境改變時重新 build）。失敗在派工節點內重做最多 3 輪，其他交給人。需求變更只用一條規則：G1 核准前在 P0／P2 處理，之後一律 C＋GC | [04](04_rules.md) |
| v0.9 | 環境清單只固定影響 build 的項目；skill、MCP、知識庫只記錄用了哪一版，更新不重開 G0。紀錄 branch 保留，但多人使用前不要求權限保護 | [04 §4.4](04_rules.md#44-上游改版與重做)、[03 §3.7](03_artifacts.md#37-存放位置)、[nodes/P0](../nodes/P0.md) |
| v0.9 | 下表 v0.8 以前的決定中，凡是和上面四列衝突的（R 失敗分類、S 版本同步、過期傳播、交接清單格式、受保護紀錄 branch、P0a／P0b 與 P2a／P2b 分段、H2 與測試基準流程、P7 確認關卡、迴圈上限分類），以 v0.9 為準；保留作歷史 | — |
| v0.8.6 | 機械替換寫入的內容分成兩種：生成區只放能由建立設定重新產生的內容（例如 register header），GB 之後凍結；起始複製區放一次性寫入的內容（以前代為底複製的 IC 目錄、新增的 build 設定、共用層加入新 IC 的條件），GB 之後是一般 source。移植範圍不能落在生成區 | [07](07_project_profile.md)、[03 §3.7](03_artifacts.md#37-存放位置)、[05](05_checks.md)、[nodes/P1](../nodes/P1.md)、[impl/recipe](../impl/recipe.md) |
| v0.8.5 | P1 改為「基底與基線建立」：起點必須是已發佈或已驗證的版本，只要求能 build；依 G0 核准的程式碼建立設定由確定性工具做機械替換，做不到的部分由 AI 在移植範圍內修改，經獨立審查後量基線；不需要前代 golden log，保留的既有功能在基底上 FAIL 時列進待處理清單，由新增的 GB 基底核准逐項處置。外部來源（register、HW spec）可以是 svn、git 或資料夾，一律用快照固定版本；程式碼建立設定改版屬於改基底 | [nodes/P1](../nodes/P1.md)、[02 §2.4](02_workflow.md#24-人工關卡)、[07](07_project_profile.md) |
| v0.8.4 | 節點只在執行工作區 commit，push 由串接層負責；先推工作 branch、確認成功才寫紀錄 branch，失敗標「待同步」、不 force push；只在固定時間點 commit 與 push。觀察者只需唯讀權限就能看正式進度，不能要求執行、重跑或核准 | [03 §3.7](03_artifacts.md#37-存放位置)、[06 §6.5](06_service.md#65-查詢不需要執行環境)、[impl/service.md I6.2](../impl/service.md#i62-commit-與-push) |
| v0.8.3 | 專案編號不能取 `records`：`glados/records/` 是紀錄 branch 的前綴，否則專案 `records` 的模組工作 branch 會和其他專案的紀錄 branch 撞名；建立專案時就拒絕 | [03 §3.7](03_artifacts.md#37-存放位置) |
| v0.8.2 | G1 改稱「需求基準核准」，仍核准整理後的來源、差異分析與模組切分；P3 在該需求與切分內定介面及共享資源，架構另由 G2 核准。只修正 P2 模組切分且需求與專案設定不變時，由 R 退回 P2、重開 G1，再做 P3／G2；新增或修改需求、範圍與專案設定仍先走 C＋GC，不能以退回或 G2 代替 | [02 §2.4](02_workflow.md#24-人工關卡)、[02 §2.6](02_workflow.md#26-模組之間)、[nodes/P3](../nodes/P3.md) |
| v0.8.1 | build 設定逐項處置：起點盤點出的每個 build 設定，在專案設定標成必要，或附理由與範圍依據明確排除，由 G0 核准；待確認擋住 G0。排除不能只因 build 失敗或工具不支援，也不能排除範圍需要的設定。「build 零警告」只看必要設定，排除項目不算 PASS，盤點或設定檢查結果不能取代 build 證據 | [07 §7.2](07_project_profile.md#72-填寫規則)、[05 §5.4](05_checks.md#54-擋關檢查) |
| v0.8 | 交接清單與各種紀錄的格式定案：每種紀錄都有 `format`、編號、`project_id`、`created_at`；引用產出物一律寫編號、版本與 hash；「誰執行的」統一用 `executor`；欄位值轉成機器可讀格式時統一配英文代號 | [03](03_artifacts.md) |
| v0.8 | `.glados/` 目錄配置照 03 §3.12 定案；branch 名稱：專案層 `glados/<專案編號>/project`、模組 `glados/<專案編號>/<模組名稱>`、整合 `glados/<專案編號>/integration`、紀錄 `glados/records/<專案編號>`；`project`、`integration` 不能當模組名稱 | [03 §3.7](03_artifacts.md#37-存放位置) |
| v0.8 | 環境清單中途改版：回 P0 出新版、重開 G0 審差異。影響 build 的項目照改基底處理（所有證據過期）；影響驗證的照驗證環境改版；只影響 AI 的（skill、MCP、知識庫）不讓已通過的產出物過期，之後派工用新版本。環境清單每一項標明類別，交接清單記下用了哪一版 | [04 §4.4](04_rules.md#44-上游改版與重做)、[nodes/P0](../nodes/P0.md) |
| v0.8 | 模組排隊或平行：改到的檔案有重疊、或要用到另一個模組實作結果的要排隊；其他可以平行，實際同時跑幾個由串接層看資源決定。由 P2 判定，code 範圍列到檔案 | [02 §2.6](02_workflow.md#26-模組之間)、[nodes/P2](../nodes/P2.md) |
| v0.8 | 交給人之後有五種決定：自己做、指定退回、修好環境後重跑（不算一輪）、讓同一站再試（輪數從頭算，可附補充說明）、這版不做。人的決定不能代替關卡核准 | [04 §4.5](04_rules.md#45-失敗處理) |
| v0.8 | 迴圈上限：這一站自己的產出被判定要改而重做算一輪，上游改版造成的重做不算。AI 寫 code 或計畫（M3、M4）3 輪；AI 寫文件或測試（P0a、P2a、M1a、M2、C 的影響分析、P7）2 輪；人在場的討論不設；不修改自己產出的站不適用。連續 3 輪同樣的失敗一律交給人 | [04 §4.5](04_rules.md#45-失敗處理) |
| v0.8 | R 失敗分類以規則為主；規則判不出來時，派一次獨立分析（執行者不能是被判定節點的執行者），分析結果只是規則的輸入，不能自己決定退回哪裡 | [04 §4.5](04_rules.md#45-失敗處理) |
| v0.8 | 審查與靜態分析的必要規則清單由各專案定，寫在專案設定；框架只規定違反清單上的規則一律擋住 | [04 §4.8](04_rules.md#48-審查放行)、[07](07_project_profile.md) |
| v0.8 | 各產出物的完整範本不在框架定：框架只規定節點卡列的最低結構，完整範本移到實作待決，展開節點實作時再定 | [nodes/](../nodes/README.md) |
| v0.8 | 要改的產出物由產出它的那一站重做：C 只交影響報告（範圍清單要改時一起改），spec、合約、測試、架構、差異分析由重新進入點重做 | [04 §4.4](04_rules.md#44-上游改版與重做)、[04 §4.6](04_rules.md#46-需求變更)、[nodes/C](../nodes/C.md) |
| v0.8 | 從 R、C 或交給人回到某一站時，派工附上退回原因（R 判定紀錄、影響報告或決定紀錄）；人可以附補充說明，但不取代那一站的檢查與關卡。新增 R 判定紀錄的格式。不另開「人和 AI 討論修正」的節點：需要討論的地方已在重新進入的那一站（M1b、P0b、P2b、P3 架構審查會議、C 的討論） | [04 §4.4](04_rules.md#44-上游改版與重做)、[03 §3.6](03_artifacts.md#36-紀錄) |
| v0.8 | M2 先完成出口檢查，合約新增或變更時再送 H2；串接層核對必要核准後建立測試基準，M2 才完成。H2 不核准時修正並重檢；合約內補 case 或修測試沿用有效合約核准，不重開 H2 | [nodes/M2](../nodes/M2.md)、[04 §4.2](04_rules.md#42-兩種執行方式) |
| v0.8 | 專案層關卡 G0–G3、GC 全部保留；G3 放在 P6 交付之前（交付後不能回頭，核准要在動作之前）；P7 的人確認算正式關卡，用核准紀錄的 `confirm` 類型記錄 | [02 §2.4](02_workflow.md#24-人工關卡)、[nodes/P6](../nodes/P6.md)、[nodes/P7](../nodes/P7.md) |
| v0.8 | 產出物處理狀態加上「未通過」，修正後重送就是新版本；產出物檔頭不寫處理狀態與有效性，只記在正式紀錄 | [03 §3.3](03_artifacts.md#33-版本與追溯)、[03 §3.3](03_artifacts.md#33-版本與追溯) |
| v0.8 | 本機模式不能產生正式紀錄，只能查詢與演練（本機的紀錄 branch 沒有權限保護，同帳號的 AI 節點改得到） | [03 §3.7](03_artifacts.md#37-存放位置) |
| v0.8 | 版本同步遇到衝突，或影響判斷不出來，一律擋住交給人 | [04 §4.7](04_rules.md#47-新-commit-與人工修改) |
| v0.8 | P0 分成 P0a（AI 草擬）與 P0b（人和 AI 一起討論）；P0 決定範圍（新增、修改、保留、移除、這版不做），產出範圍清單，由 G0 核准 | [nodes/P0](../nodes/P0.md) |
| v0.8 | P0 產出環境清單（skill、MCP、工具、toolchain、知識庫的版本），出口檢查加「環境就緒」；原本的知識庫快照併進環境清單 | [nodes/P0](../nodes/P0.md)、[05](05_checks.md) |
| v0.8 | 需求來源（Jira CR、Confluence spec 頁）由工具抓成來源快照，AI 只讀快照；實作採直接呼叫 REST API 的 script；spec 頁在專案設定列頁面 ID | [03 §3.2](03_artifacts.md#32-來源快照)、[07](07_project_profile.md) |
| v0.8 | G0 固定專案範圍、起點與環境；第一次通過 G1 前，CR／spec 的新增或修改都由 P0／P2 整理；第一次通過 G1 後才走 C＋GC，即使重開 G1 或回到 P0／P2 也不解除。S 版本同步比對 Jira／Confluence，依同一分界處理 | [04 §4.6](04_rules.md#46-需求變更)、[04 §4.7](04_rules.md#47-新-commit-與人工修改) |
| v0.8 | P2 分成 P2a（AI 分析）與 P2b（人和 AI 整理 CR：拆分、補 CR、澄清、修改），不另開節點；第一次通過 G1 前的 CR 修訂記在 CR 修訂紀錄，P2b 定案即更新 Jira（設定允許時）與相關快照，G1 審核整理後的結果並建立需求基準；會改到範圍清單標記的退回 P0 | [nodes/P2](../nodes/P2.md) |
| v0.8 | GLADOS 的內容（P2b 的 CR 修訂、要問外部的待確認事項）要不要寫進 Jira，由專案設定「寫進 Jira」決定；不寫時 CR 修訂只留在內部、待確認事項由人轉問。E39 因為雙向隔離都不寫 | [07](07_project_profile.md)、[projects/E39](../projects/E39.md) |
| v0.8 | 「輸入不足」定義為「某個必要輸出填不出來，原因是某個輸入缺漏或有問題」，退回產出該輸入的那一站；是 R 失敗分類的通用類型（P0、P2 原本叫「資訊不足」，統一改名） | [04 §4.5](04_rules.md#45-失敗處理)、[nodes/P2](../nodes/P2.md) |
| v0.8 | 人工關卡用簽核 skill 引導審閱，最後由人親自送出（簽核指令跳出的系統對話框，以及 openBCT GLADOS 分頁的按鈕，先做對話框）；不用 GitLab MR。AI 不給核准建議，改成讓核准人逐項表態；專案設定新增「關卡核准人」 | [02 §2.4](02_workflow.md#24-人工關卡)、[impl/gate_signoff](../impl/gate_signoff.md) |
| v0.8 | 不再用 T0（T0 在 IC 領域常指 tapeout；討論中一度改名為「範圍凍結點」，最後拿掉）：G0 固定範圍、起點與環境，核准時間記在 G0 的核准紀錄；CR 變更走 C 的分界是 G1 以來源快照、CR 修訂紀錄與差異分析的版本與 hash 建立的需求基準 | [01 §1.7](01_overview.md#17-用語表) |
| v0.8 | G1 分界以 G1 核准紀錄綁定的快照為準：G1 核准後才發現、不在需求基準裡的修改，不管什麼時候改的都走 C；送出 G1 決定前再同步一次，有新差異就讓審查包作廢 | [03 §3.2](03_artifacts.md#32-來源快照)、[04 §4.7](04_rules.md#47-新-commit-與人工修改) |
| v0.8 | G1 前別人在 Jira／Confluence 上的修改，記成 CR 修訂紀錄的第五類「外部修改」，經 P2b 由人確認才採用；G1 審查包逐項列出 G0 之後採用的修訂與外部修改 | [nodes/P2](../nodes/P2.md)、[02 §2.4](02_workflow.md#24-人工關卡) |
| v0.8 | E39 的目的是建立完整的工作流程；驗收標準是 GLADOS 能完整產出 E39 可以量產的 FW code。和傳統做法的對照用來改進流程，不是通過條件 | [projects/E39 E1](../projects/E39.md#e1-e39-的目的與驗收標準) |
| v0.8 | 建置路線步驟 2 先照專案的完整範圍跑完 P0–P3，再挑一個模組手動跑 M1–M7；不只整理試點模組的 CR，避免其他 CR 在第一次通過 G1 後都變成變更 CR | [01 §1.6](01_overview.md#16-建置路線)、[projects/E39](../projects/E39.md) |
| v0.8 | P2b 的「修改」由專案設定的「CR 修改決定人」定案，預設是 CR 負責人；不能找 CR 負責人時由 G1 核准人決定（E39） | [07](07_project_profile.md)、[projects/E39](../projects/E39.md) |
| v0.8 | 專案設定改版的影響依欄位，只有用到該欄位的節點重走；改基底、平台或 toolchain 才讓所有證據過期 | [07 §7.2](07_project_profile.md#72-填寫規則) |
| v0.7 | 先把框架做好，節點實作之後個別展開；文件確認後才開始實作 | [01 §1.6](01_overview.md#16-建置路線) |
| v0.7 | 只認證據：放行以串接層執行檢查留下的證據紀錄為準，節點自己寫的結果只供參考 | [05 §5.1](05_checks.md#51-只認證據) |
| v0.7 | 節點卡分「介面」（框架固定）與「實作」（可替換）兩段 | [nodes/](../nodes/README.md) |
| v0.6 | 串接層是獨立的背景服務，openBCT 的 GLADOS 分頁是它的入口之一（選項 B） | [06](06_service.md)、[impl/service.md I1](../impl/service.md#i1-決策獨立服務openbct-當入口選項-b) |
| v0.6 | 正式紀錄只由串接層寫在受保護的 branch；人工核准綁身分、對象版本與 hash | [03 §3.7](03_artifacts.md#37-存放位置) |
| v0.6 | 紀錄放在專案工作區的 `.glados/`；有禁看 branch 時，工作區是只含允許 branch 的獨立 repo | [03 §3.7](03_artifacts.md#37-存放位置) |
| v0.5 | 版本同步在開啟、派工、回收與新 commit 時核對 SHA 與內容 hash；人工與 AI 的 commit 可以交錯 | [04 §4.7](04_rules.md#47-新-commit-與人工修改) |
| v0.4 | 「已通過／過期」與人工核准分開；人只核准決策 | [03 §3.3](03_artifacts.md#33-版本與追溯) |
| v0.4 | 審查依發現類型、處置與證據放行，不以模型共識放行 | [04 §4.8](04_rules.md#48-審查放行) |
| v0.4 | H2 核准驗收合約；在合約內補 case 不重開 | [nodes/M2](../nodes/M2.md) |
| v0.4 | 判別能力的三種證明方式 | [nodes/M2](../nodes/M2.md) |
| v0.4 | 驗證證據綁 image、測試集合、驗證環境的版本與 hash | [04 §4.4](04_rules.md#44-上游改版與重做) |
| v0.3 | CR 來源以 Jira Epic 為準，不用標題關鍵字 | [07](07_project_profile.md) |
| v0.2 | 用 T0 區分範圍 CR 與變更 CR（v0.8 改為 G0 固定範圍、第一次通過 G1 後的需求變更走 C）；R 失敗分類與 C 變更處理共用同一套過期機制 | [01 §1.7](01_overview.md#17-用語表)、[04 §4.4](04_rules.md#44-上游改版與重做) |

---

## 8.4 暫緩項目

- 全專案驗證產能與分層細節：平台數量、測試覆蓋率、靜態檢查／主機端單元測試／FPGA／SIM 分工。**試點所需的觸發、觀察與判定能力不可暫緩**，選模組前先確認（[nodes/M2](../nodes/M2.md)）。
- 工時統計與效率基準。
- E39 和傳統做法對照的隔離細節與指標定義。
