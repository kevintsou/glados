# openBCT 照新規格要改的地方（2026-10-29）

> 2026-10-28～29 和使用者討論 sandaru／burner 與 build 設定後，GLADOS 規格改了很多（[framework/09](../framework/09_build_configurations.md)、[08 §8.3](../framework/08_open_questions.md#83-已決定事項) v0.11）。這份清單列出 openBCT（`src/openbct/glados/`，基準 `bedc16c`）和 KB `tools/ds5build` 還沒跟上的地方，依優先順序排。
>
> 使用者 2026-10-29 交代「能做的都直接做完」；實作在 openBCT branch `claude/glados-f-sandaru`（gitlab），KB 在 branch `claude/ds5build-listing`（gitlab）；2026-10-29 使用者確認後兩個都 fast-forward 併入 gitlab main（openBCT `bedc16c..80ef733`、KB `1f921b3e..46a7bd2e`）。每項的狀態記在「狀態」欄。
>
> 2026-10-29 整組測試 1737 通過；跑出的 2 個失敗（sources 的 kind 被誤當 build 設定檢查、測試仍期望 AXF hash）已修（`58c8068`、`80ef733`）。
>
> 還沒做的 F5、F10、F16 與 F7 的模組預算，都要上機的載入方式或模組歸屬，假的證據會誤導，所以留著。
>
> 2026-10-30：F7 的模組預算與 F5 的解析、檢查、預設值做完，在 openBCT branch `claude/glados-doable`（gitlab，還沒併入 main）。還沒做的是 F5 按設定分開跑、F10、F16，都要上機。

## 優先 1：證據與交付會綁錯東西

| # | 規格 | 現在 | 要改 | 狀態 |
| :---- | :---- | :---- | :---- | :---- |
| F1 | image hash 以 BIN 為準（03 §3.3、09 §9.3） | `builds.built_images()` 記 AXF 的 sha256，`image_hash` 是 AXF | hash 改記 BIN；AXF 照樣保留給 ICE 載入（`lab.py`） | 已做（`5607b9a`）：BIN 命名 image；交付複製 BIN、AXF 當 debug |
| F2 | 每個必要設定記類型、平台、交付／驗證版本、怎麼 build、產出（07「build 設定」） | `build_targets` 只有 `source`、`target`、`disposition`、`reason`、`scope`；驗證只用一個 `verification.build_target`（`labsteps.verification_target()`） | `build_targets` 加 `kind`、`platform`、`role`（deliver／verify）欄位與檢查；`verification_target` 改成按 case 的適用設定挑 | 欄位已做（`da78b0b`）：`kind`／`platform`／`role`／`build`／`program` 選填並檢查值；按 case 挑設定接 F5 |
| F3 | G3 綁交付版本的 hash，burner 的 hash 當證據；P6 只交付 bootcode 的交付版本（05、09 §9.4） | G3 binding 只有一個 `image_hash`；`integration.deliver()` 只複製 `verification_target` 那一個設定 | binding 記每個必要設定的 hash 並標 role；deliver 複製所有 `role=deliver` 的 bootcode 設定並逐一比對 | 已做（`437b499`）：`build_targets[].role` 有值時，G3 binding 記每個設定的 BIN hash 與 role，P6 只交 deliver 的設定 |
| F4 | 合約的 case 可標「延到 P4」，M5 記「未執行（延到 P4）」不擋，P4 必須 PASS（09 §9.4、05 §5.3） | 合約表沒有這一欄；M5 擋關是必要 case 全部 PASS | 合約表加「延到 P4」欄；M5 判定略過、P4 判定要求 | 已做（`5607b9a`）：合約「延到 P4」欄；M5 記未執行不擋；P4 用完整版本跑、要 PASS |
| F5 | case 標適用的 build 設定，M5 按設定分開跑、分開記（09 §9.4） | 合約沒有適用設定欄；M5 只在一個設定跑 | 合約表加「適用設定」欄（先做解析與檢查；按設定分開跑接 F2） | 解析與檢查已做（openBCT `ffc5aaa`、`dd8c216`，branch `claude/glados-doable`）：合約「適用設定」欄、M1 收件檢查、M5 只跑適用目前設定的 case、其他適用設定各記驗證缺口；留空依使用者 2026-10-29 決定＝標 `verify` 的必要設定（沒有 `role` 時全部必要設定）。待做：按設定分開跑要先有 F10 的載入方式 |

## 優先 2：檢查做不到或會誤判

| # | 規格 | 現在 | 要改 | 狀態 |
| :---- | :---- | :---- | :---- | :---- |
| F6 | 記憶體上限按設定、SRAM 按區（07「記憶體預算」、09 §9.3） | `memory_check()` 比對 ds5build 的 Grand Totals（`memory_limits` 一套） | `memory_limits` 改成 `{設定: {region: 上限}}`，比對 ds5build `parse_map()` 已有的 region 用量；舊格式仍接受 | 已做（`5607b9a`）：`memory_limits.configs.<設定>` 可給 totals 與 `regions`；P2 預算表要「設定」欄與「未歸屬」列 |
| F7 | stack 查預留大小與 `--callgraph` 最深用量；未歸屬預算；模組預算（09 §9.3） | stack、模組預算一律記驗證缺口 | 接 F11 的解析結果 | stack 已做（`13d0c1d`）；模組與未歸屬預算已做（`e1591ea`，branch `claude/glados-doable`）：object 依 delta.md 的 code 範圍歸到模組，比 ROM、SRAM、分區與模組 stack；未歸屬包含沒被 delta 模組涵蓋的既有 code。用真的 E39 build 驗過，修掉 0 bytes 分區要求上限（`800a354`） |
| F8 | bootcode 與 burner 的 SRAM 自動交叉比對，重疊交人判斷（05、09 §9.3） | 沒有 | 讀兩份解析結果比對「ROM bootcode 還在用的區域」；重疊產生待判斷項目，判斷紀錄綁兩邊 BIN hash | 已做（`cf8d004`）：專案設定 `sram_cross_check` 指定兩個設定與 bootcode 還在用的區域／symbol，P4 比對；重疊記驗證缺口交人，不直接擋 |
| F9 | bench 要和設定的平台相符（稽核 C） | `lab.py` 固定用 `benches[0]` | bench 設定加平台標記，挑和設定平台相符的 bench；找不到記環境錯誤 | 已做（`5607b9a`）：本機 `lab.bench_platforms` 標 bench 平台，依 `build_targets[].platform` 挑 |
| F10 | 每種設定怎麼載入由 test plan 決定（09 §9.4） | 只有 ICE 載入 AXF 後 free run（`run_iceload`） | 載入方式做成可選（ICE＋free run、ICE＋reset、SPI ROM＋reset、VUC 帶入 burner）；要上機才驗得了 | 待做（要硬體） |
| F11 | listing 解析擴充在 KB ds5build（09 §9.3） | `parse_map()` 只有 region | 加每個檔案（模組）的用量、`--callgraph` 最深 stack、symbol／section 範圍 | 已做（KB `46a7bd2`）；2026-10-30 用真的 E39 armlink 輸出（`83dc1a65b`，`ps5037_boot_mask_asic`）驗過。修掉 callgraph 漏掉沒有呼叫別人的函式（KB branch `claude/ds5build-leaf-stack` `fd76ae7c`，還沒併入 main）；E39 算不出深度的路徑 36 條 |
| F12 | 檔案歸屬（bootcode／burner／共用）由工具從 build 設定算（09 §9.4） | 沒有 | 讀 `.cproject` 每個設定編進的檔案，算出歸屬 | 已做（`f9a212b`）：`ownership.py` 讀 `.cproject`，E39 實測 376 共用、32 bootcode、30 burner |
| F13 | 哪些結果過期照改到的檔案判斷（04 §4.4） | `impact.voided_evidence()` 比 image hash 的聯集 | 依 F12 的歸屬：bootcode／burner／共用分別讓對應結果過期 | 已做（`f9a212b`）：`impact.ownership_voids()` |
| F14 | 來源快照只有 Jira 查詢與 Confluence 頁面，頁面裡的 Jira macro 自動展開；feature list、test plan（03 §3.2、07） | `sources.take_snapshot()` 只抓一個 Epic 與 spec 頁 | 展開 Confluence 頁面裡的 Jira macro，抓每條 JQL 的結果與總數；專案設定加 feature list、test plan 來源與 IC label 篩選 | 已做（`90ec523`）：`take_snapshot(feature_lists=, test_plan=)` 展開 macro、manifest 記 `queries`；還沒對真的 Confluence／Jira 跑過 |
| F15 | P1 起點檢查同一個 commit build 兩次，BIN hash 要相同（nodes/P1） | 沒有 | P1 起點 build 跑兩次並比對 | 已做（`071846c`）：起點 build 兩次，比 BIN；時間加倍 |
| F16 | P1 基線記 burner 的 hash，M5 固定用它（nodes/P1、M5） | 沒有 | 基線報告記 burner 設定的 BIN hash；M5 證據記用到的 burner hash | 待做：M5 要先能用 VUC 帶入 burner（F10）才有 burner hash 可記 |

## 不在 openBCT

- 不可逆動作按平台擋（05）：hook 在 agent 端，不在 openBCT。
- Andes 的 listing 解析與最深 stack（08 第 14 項）：規格還沒定。
