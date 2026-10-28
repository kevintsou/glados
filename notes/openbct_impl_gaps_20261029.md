# openBCT 照新規格要改的地方（2026-10-29）

> 2026-10-28～29 和使用者討論 sandaru／burner 與 build 設定後，GLADOS 規格改了很多（[framework/09](../framework/09_build_configurations.md)、[08 §8.3](../framework/08_open_questions.md#83-已決定事項) v0.11）。這份清單列出 openBCT（`src/openbct/glados/`，基準 `bedc16c`）和 KB `tools/ds5build` 還沒跟上的地方，依優先順序排。
>
> 使用者 2026-10-29 交代「能做的都直接做完」；實作在 openBCT branch `claude/glados-f-sandaru`，merge 進 main 前要使用者確認。每項的狀態記在「狀態」欄。

## 優先 1：證據與交付會綁錯東西

| # | 規格 | 現在 | 要改 | 狀態 |
| :---- | :---- | :---- | :---- | :---- |
| F1 | image hash 以 BIN 為準（03 §3.3、09 §9.3） | `builds.built_images()` 記 AXF 的 sha256，`image_hash` 是 AXF | hash 改記 BIN；AXF 照樣保留給 ICE 載入（`lab.py`） | 進行中 |
| F2 | 每個必要設定記類型、平台、交付／驗證版本、怎麼 build、產出（07「build 設定」） | `build_targets` 只有 `source`、`target`、`disposition`、`reason`、`scope`；驗證只用一個 `verification.build_target`（`labsteps.verification_target()`） | `build_targets` 加 `kind`、`platform`、`role`（deliver／verify）欄位與檢查；`verification_target` 改成按 case 的適用設定挑 | 待做 |
| F3 | G3 綁交付版本的 hash，burner 的 hash 當證據；P6 只交付 bootcode 的交付版本（05、09 §9.4） | G3 binding 只有一個 `image_hash`；`integration.deliver()` 只複製 `verification_target` 那一個設定 | binding 記每個必要設定的 hash 並標 role；deliver 複製所有 `role=deliver` 的 bootcode 設定並逐一比對 | 待做（接 F2） |
| F4 | 合約的 case 可標「延到 P4」，M5 記「未執行（延到 P4）」不擋，P4 必須 PASS（09 §9.4、05 §5.3） | 合約表沒有這一欄；M5 擋關是必要 case 全部 PASS | 合約表加「延到 P4」欄；M5 判定略過、P4 判定要求 | 進行中 |
| F5 | case 標適用的 build 設定，M5 按設定分開跑、分開記（09 §9.4） | 合約沒有適用設定欄；M5 只在一個設定跑 | 合約表加「適用設定」欄（先做解析與檢查；按設定分開跑接 F2） | 進行中（解析） |

## 優先 2：檢查做不到或會誤判

| # | 規格 | 現在 | 要改 | 狀態 |
| :---- | :---- | :---- | :---- | :---- |
| F6 | 記憶體上限按設定、SRAM 按區（07「記憶體預算」、09 §9.3） | `memory_check()` 比對 ds5build 的 Grand Totals（`memory_limits` 一套） | `memory_limits` 改成 `{設定: {region: 上限}}`，比對 ds5build `parse_map()` 已有的 region 用量；舊格式仍接受 | 進行中 |
| F7 | stack 查預留大小與 `--callgraph` 最深用量；未歸屬預算；模組預算（09 §9.3） | stack、模組預算一律記驗證缺口 | 接 F11 的解析結果 | 待做（接 F11） |
| F8 | bootcode 與 burner 的 SRAM 自動交叉比對，重疊交人判斷（05、09 §9.3） | 沒有 | 讀兩份解析結果比對「ROM bootcode 還在用的區域」；重疊產生待判斷項目，判斷紀錄綁兩邊 BIN hash | 待做（接 F11） |
| F9 | bench 要和設定的平台相符（稽核 C） | `lab.py` 固定用 `benches[0]` | bench 設定加平台標記，挑和設定平台相符的 bench；找不到記環境錯誤 | 進行中 |
| F10 | 每種設定怎麼載入由 test plan 決定（09 §9.4） | 只有 ICE 載入 AXF 後 free run（`run_iceload`） | 載入方式做成可選（ICE＋free run、ICE＋reset、SPI ROM＋reset、VUC 帶入 burner）；要上機才驗得了 | 待做（要硬體） |
| F11 | listing 解析擴充在 KB ds5build（09 §9.3） | `parse_map()` 只有 region | 加每個檔案（模組）的用量、`--callgraph` 最深 stack、symbol／section 範圍 | 進行中（KB） |
| F12 | 檔案歸屬（bootcode／burner／共用）由工具從 build 設定算（09 §9.4） | 沒有 | 讀 `.cproject` 每個設定編進的檔案，算出歸屬 | 進行中 |
| F13 | 哪些結果過期照改到的檔案判斷（04 §4.4） | `impact.voided_evidence()` 比 image hash 的聯集 | 依 F12 的歸屬：bootcode／burner／共用分別讓對應結果過期 | 進行中（接 F12） |
| F14 | 來源快照只有 Jira 查詢與 Confluence 頁面，頁面裡的 Jira macro 自動展開；feature list、test plan（03 §3.2、07） | `sources.take_snapshot()` 只抓一個 Epic 與 spec 頁 | 展開 Confluence 頁面裡的 Jira macro，抓每條 JQL 的結果與總數；專案設定加 feature list、test plan 來源與 IC label 篩選 | 進行中 |
| F15 | P1 起點檢查同一個 commit build 兩次，BIN hash 要相同（nodes/P1） | 沒有 | P1 起點 build 跑兩次並比對 | 待做（接 F1） |
| F16 | P1 基線記 burner 的 hash，M5 固定用它（nodes/P1、M5） | 沒有 | 基線報告記 burner 設定的 BIN hash；M5 證據記用到的 burner hash | 待做（接 F2） |

## 不在 openBCT

- 不可逆動作按平台擋（05）：hook 在 agent 端，不在 openBCT。
- Andes 的 listing 解析與最深 stack（08 第 14 項）：規格還沒定。
