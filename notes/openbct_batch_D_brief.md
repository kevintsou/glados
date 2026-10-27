# 工作說明：openBCT D 批（C2 上機測試流程、cp950、收尾核對）

> 2026-10-27。給 openBCT session（openbct-v09）的下一批工作，依 GLADOS v0.10（main `c48c148` 之後）與 openBCT `gitlab/main` `5cfefbe`。這批都**不需要等使用者討論**；需要討論的項目（見最後一節）不要做。

## 工作位置與規則

- 沿用 worktree `D:\repo\openBCT\.claude\worktrees\sleepy-maxwell-5e8821`，branch `claude/glados-dispatch`，先從 `gitlab/main` 更新。
- 不要碰 `D:\repo\openBCT` 主 checkout，那裡有別人沒 commit 的 GUI 改動（`glados_overview.py` 等）。
- 只 commit 到工作 branch，**不要 push、不要 merge**；完成後由協調 session 核對、merge、push 到 gitlab main。
- 每項完成後更新 GLADOS `docs/coordination/tasks/<ID>.md` 的 frontmatter 與接續紀錄（日期、commit、驗證命令與結果、還缺什麼），**不要 commit GLADOS**。
- 測試照 openBCT `AGENTS.md`：適用的 pytest、ruff、mypy。改動不能讓既有 main 的功能退步。

## D1：OBC-027 cp950 回歸（先做，最小）

- 照任務檔：先用 Windows 預設編碼重跑 `python -m pytest -q tests/test_glados.py::test_export_preserves_original_and_manual_edits`，和 `python -X utf8` 比較；新版 Python 預設已是 UTF-8 時照實記錄，不宣稱重現。
- 掃一遍 `src/openbct/glados/` 與 `tests/test_glados*.py` 裡沒指定 encoding 的 `read_text`／`write_text`／`open(`，改成明確 `encoding="utf-8"`。只修這類，不全面重構。
- 加一個回歸測試：在 `locale.getpreferredencoding` 是 cp950 的情況下（monkeypatch 或子程序 `PYTHONUTF8=0` 加 `-X utf8=0`）讀中文 profile 不出錯。

## D2：C2 上機測試的工具步驟（用假 bench）

依據：GLADOS `notes/c2_lab_design.md` 的決定 1、2、5、6、7；`nodes/M5.md`、`nodes/M2.md`（判別能力）、`nodes/P1.md`（第 5 步既有功能）、`nodes/P4.md`、`nodes/P5.md`；`framework/03` §3.6 證據紀錄；`framework/05` 各節點的擋關檢查。

1. **iceload 介面**：bct_knowledge_base `tools/iceload/`（`0c47a040`，已在 gitlab main）。CLI 輸出一筆 `iceload.result/v1` JSON；退出碼 0 全相符、1 讀回不符、2 環境錯誤。串接層用 subprocess 呼叫，和 ds5build 的接法一樣（工具路徑來自本機設定，不寫死）。**只用 `--mode fake` 與假 bench 開發與測試**，不連任何 lab 機。
2. **一次工具步驟依序做**：iceload 載入並讀回比對 → 讀回相符才跑 openBCT case → 每個 case 寫一筆證據，綁執行編號、image hash、讀回範圍與結果、測試基準（M2 記下的 hash）、設備（bench 名稱）。讀回不符或 iceload 環境錯誤：不跑 case，記環境問題（不算輪數）或驗證缺口，照 §4.5。
3. **OBC-021 測試報告變證據**：沿用 openBCT 既有的 Orchestrator／results／reports，不重寫。FAIL、ERROR、SKIP、不支援、未執行、輸入不足分開記；必要的 case 沒跑不能算 PASS；保存原始 log 並記 hash。
4. **各節點怎麼用**：
   - **M5**：跑該模組 M2 的 case；FAIL 回 M4、計入 M4 輪數（已有的輪數機制）。
   - **M2 判別能力**：在目前還沒實作的 image 上跑新寫的 case，必要的 case 要 FAIL；預期不會 FAIL 的照 M2 交接說明列出，交給人，不自動算過。
   - **P1 第 5 步既有功能**（OBC-013）：openBCT 既有測試項目全部要過；沒過的列進基線待處理清單（交 GB），不擋 build 基線已有的部分。
   - **P4、P5 的測試執行**：全量既有測試加上各模組 M2 的 case；P5 有沒過的交給人。
5. **設備認領**：bench 清單與 FPGA Queue 還沒定（決定 3、4、8）。先做一個可替換的認領介面，目前實作只有「本機設定裡明確列出的 bench、單機互斥」；**不要**自己做跨機排程。跑完立刻釋放，case timeout 沿用 openBCT 既有值。
6. **mock 與真機分開**：證據要記 iceload 的 mode；`fake` 產生的證據不能讓節點在正式專案算 PASS（或至少在 GUI 與紀錄明確標示為假 bench）。真機 smoke 等 bench 清單，不在這批。

## D3：已做大半的項目，核對後收尾

這些任務檔還寫「未開始」，但 `gitlab/main` 已經有對應程式。逐項對照任務檔的完成條件（以 GLADOS v0.10 改寫後的範圍為準），補缺口、補測試，在任務檔寫明哪條由哪個 commit／測試涵蓋，哪條還缺：

- **OBC-016**：節點內最多 3 輪、M5 FAIL 與 M6 阻擋回 M4 並計入 M4 輪數、其他交給人並記決定紀錄（framework/04 §4.5）。
- **OBC-018**：G1 核准後的變更走 C＋GC、重做起點由人在 GC 指定、GC 精確版本觸發原節點重做與核准失效（§4.6）。
- **OBC-019**：M2 完成時記測試基準 hash，M4「測試沒被動過」與 P5「測試標準沒被放寬」使用。
- **OBC-007**（v0.9 縮小後）：每次執行記下 skill、MCP、知識庫實際用的版本（知識庫 commit）；build 類（toolchain、生成工具）要固定版本，收件已檢查。核對開工工作包與執行紀錄有沒有寫這些。
- **OBC-029**：先盤點目前紀錄 branch 的 push 與工作 branch 的 push 做到哪；補「工作 branch push 成功後才寫紀錄 branch」的測試、commit 訊息的 `GLADOS-Project/Node/Run/Input` 欄位、push 被拒不 force、網路失敗標待同步。**CI 排除規則（OBC-023）還沒和 CI 管理者確認，自動 push 預設關閉**，照完成條件 5 拒絕打開。

## D4：P4／P5／P6／P7 的確定性部分（D2、D3 之後）

- **OBC-024**：P4 只收所有必要模組有效的 M7、固定整合 commit 與 image；P5 收件核對全量 case、必要規則、靜態分析、授權的結果都在，缺一項不算過。靜態分析與授權掃描的實際執行要接 CI（OBC-023），先做「結果缺就擋」。
- **OBC-025**：P6 只交 G3 精確版本核准的 image、報告與附件；交付清單（manifest）與未解事項；知識回寫只有人確認後才寫，遵守 `writeback=false`。

## 這批不做（要等使用者討論或真機）

- OBC-022 跨機排程與 FPGA Queue、OBC-026 ARM ICE backend、真機 smoke：等 bench 清單（c2_lab_design 第 3、4、8 項）。
- OBC-023 CI 排除規則：要和 CI 管理者確認（framework/08 §8.2 第 5 項）。
- OBC-014 的 OS 常駐、登出與開機驗證：要人在實機上登出、重開機驗證。
- M4 模組記憶體的算法、E39 起點只有 1／6 設定 build 得過：等使用者決定。

## 完成時回報

- commit 清單與每項的驗證命令、結果。
- 每個任務檔更新到哪個狀態。
- 和 GLADOS 規格不一致、或自己做了決定的地方。
- 還缺什麼。
