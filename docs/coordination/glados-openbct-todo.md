# GLADOS / openBCT / bcgen / Skills 共用 To-do List

盤點日期：2026-10-12。使用與認領規則見 [跨 agent 接續方式](README.md)。

## 基準與適用範圍

| Repo | 本次依據 | 限制 |
|---|---|---|
| GLADOS | v0.8.1，3c04c3481a319756e7a70496ba0189a32dc4da52 | 正式規格權威；本 TODO 不改規格 |
| openBCT | 原完整盤點 c42a019cd159a91231a9602de4848c177cb0f28b；本次 HEAD 54038fc26b4be3b11e0541b04430b4270ce3daf3 | 新 commit 修 fresh Windows 安裝器，diff 未改 GLADOS runtime；本文未對新 HEAD 重跑全量測試 |
| bct_knowledge_base | fedcbdb9f11c2973ac0a158bc8465bf7dd6b987b，加三包 skills 0.1.0 working-tree 草稿 | 此 HEAD 尚未含新包 bytes；正式固定版本做 SK-004 |
| skills 上游 | Matt Pocock 49dd158d1076134a641b33efb035946536778336 | 參照來源，不是 BCT 適配 commit |

openBCT 有另一個 agent 修改；本表不代認領其工作。未明確記錄的 owner 保持 null，開始前重查 diff。GLADOS 只有 GitHub，不把 GitLab 當其必要交付。

## 排序與首批可認領工作

- A：正式 P0/P1 前置及可立即修正的問題。先分開認領 OBC-001、OBC-005、OBC-006、OBC-027、BC-001；檢查程式 ownership 是否重疊。
- B：模組、變更、驗收、交付及 skills 迭代，設計可先進行，整合驗收受相依限制。
- C：有實際需求才啟動的流程外產生功能。

表格不複製狀態/owner；查看對應任務 YAML frontmatter。相依及完成條件也在該檔，不必讀本 session 的對話才能接續。

## openBCT 作為 GLADOS 串接層

| ID | 優先 | 執行 repo | 待辦 |
|---|---|---|---|
| [OBC-001](tasks/OBC-001.md) | A | openBCT | 對齊 GLADOS v0.8.1 與 build 設定處置 |
| [OBC-002](tasks/OBC-002.md) | A | openBCT | 實作正式產出物與紀錄的讀取、驗證及寫入 |
| [OBC-003](tasks/OBC-003.md) | A | openBCT | 加入身分與精確版本的人工簽核 |
| [OBC-004](tasks/OBC-004.md) | A | openBCT | 從正式紀錄推導狀態、動態解鎖與唯一派工 |
| [OBC-005](tasks/OBC-005.md) | A | openBCT | 保存完整、固定的 P0 需求來源快照 |
| [OBC-006](tasks/OBC-006.md) | A | openBCT | 補齊 portable project profile 與本機路徑映射 |
| [OBC-007](tasks/OBC-007.md) | A | openBCT / bct_knowledge_base | 準備每專案固定版本的 KB、skill、MCP 與工具 |
| [OBC-008](tasks/OBC-008.md) | A | openBCT | 建立允許 branch/snapshot 的實際隔離 |
| [OBC-009](tasks/OBC-009.md) | A | openBCT | 補齊 P0 出口與 G0 來源、環境檢查 |
| [OBC-010](tasks/OBC-010.md) | A | openBCT | 接通 P0a 草擬與 P0b 逐題討論 |
| [OBC-011](tasks/OBC-011.md) | A | openBCT | 將唯讀 bcgen CLI 接入 GLADOS adapter |
| [OBC-012](tasks/OBC-012.md) | A | openBCT | 建立 P1 所有必要 build 設定的基線證據 |
| [OBC-013](tasks/OBC-013.md) | A | openBCT | 建立 P1 功能、啟動與硬體基線 |
| [OBC-014](tasks/OBC-014.md) | A | openBCT | 完成派工生命週期、恢復與 OS 常駐 |
| [OBC-015](tasks/OBC-015.md) | A | openBCT | 實作固定輸入的新 AI session 與出口檢查 |
| [OBC-016](tasks/OBC-016.md) | A | openBCT | 實作 R 失敗分類、退回與迴圈限制 |
| [OBC-017](tasks/OBC-017.md) | B | openBCT | 實作 S 版本同步與過期傳播 |
| [OBC-018](tasks/OBC-018.md) | B | openBCT | 實作 C/GC 需求變更與影響報告 |
| [OBC-019](tasks/OBC-019.md) | B | openBCT | 建立 M2 保護測試基準與 H2 合約依賴 |
| [OBC-020](tasks/OBC-020.md) | B | openBCT | 串接 P2/P3 模組展開與 M1–M7 節點 |
| [OBC-021](tasks/OBC-021.md) | A | openBCT | 把現有測試報告接為可核對的 GLADOS 證據 |
| [OBC-022](tasks/OBC-022.md) | A | openBCT | 完成遠端 FPGA/ICE/UART 排程與設備互鎖 |
| [OBC-023](tasks/OBC-023.md) | B | openBCT | 設定 metadata-only commit 與明確節點 CI 觸發 |
| [OBC-024](tasks/OBC-024.md) | B | openBCT | 完成 P4/P5 整合、全量驗證與品質檢查 |
| [OBC-025](tasks/OBC-025.md) | B | openBCT / bct_knowledge_base | 完成 P6/P7 交付、收尾與知識回寫 |
| [OBC-026](tasks/OBC-026.md) | A | openBCT | 補齊 ARM DS-5 ICE backend |
| [OBC-027](tasks/OBC-027.md) | A | openBCT | 修正 Windows cp950 讀取 UTF-8 profile 的回歸問題 |
| [OBC-028](tasks/OBC-028.md) | A | openBCT | GitLab 唯讀查詢模式（觀察者不 clone 看進度） |
| [OBC-029](tasks/OBC-029.md) | A | openBCT | 串接層統一 commit 與 push 工作 branch 及紀錄 branch |

## bcgen 改造

| ID | 優先 | 執行 repo | 待辦 |
|---|---|---|---|
| [BC-001](tasks/BC-001.md) | A | bct_knowledge_base | bcgen 只讀明確傳入的輸入（不讀隱藏的全域狀態） |
| [BC-002](tasks/BC-002.md) | A | bct_knowledge_base | 提供唯讀 JSON CLI、版本與來源回報 |
| [BC-003](tasks/BC-003.md) | A | bct_knowledge_base | 將 check 分為起點盤點與產生模式 |
| [BC-004](tasks/BC-004.md) | A | bct_knowledge_base | 提供 profile_draft 與 build target 處置核對 |
| [BC-005](tasks/BC-005.md) | B | bct_knowledge_base | （不做）bcgen 的唯讀 MCP——AI 改用命令列呼叫 |
| [BC-006](tasks/BC-006.md) | B | bct_knowledge_base | 補足 E39 功能線索與過往問題資料覆蓋 |
| [BC-007](tasks/BC-007.md) | A | bct_knowledge_base | P1 機械替換前修正生成的失敗傳遞與輸出覆寫 |
| [BC-008](tasks/BC-008.md) | A | bct_knowledge_base | 以前代 code base 衍生新 IC 的機械替換（含 ARM） |

## 共用討論 / spec skills

| ID | 優先 | 執行 repo | 待辦 |
|---|---|---|---|
| [SK-001](tasks/SK-001.md) | B | bct_knowledge_base | 保存三個共用 skills 的第一版適配草稿 |
| [SK-002](tasks/SK-002.md) | A | bct_knowledge_base | 審閱三個 skills 的 BCT/GLADOS 適用邊界 |
| [SK-003](tasks/SK-003.md) | B | bct_knowledge_base | 擴充、重跑 skills 的可共用行為評估 |
| [SK-004](tasks/SK-004.md) | A | bct_knowledge_base | 將審閱後的 skills 納入可固定的 BCT 版本 |
| [SK-005](tasks/SK-005.md) | A | openBCT | 讓 openBCT 正式節點載入共用 skills |
| [SK-006](tasks/SK-006.md) | B | bct_knowledge_base | 維護三包共用契約與封裝一致性 |

## 已有資產與部分完成，避免重做

- openBCT 已有 GUI 流程圖、P0 草稿、SQLite/revision、獨立本機服務、OS lock、草稿匯出與人工修改保護；正式派工/簽核/紀錄有效性仍未完成。
- external tools、Orchestrator/results/reports、GitSnapshot、memory、SPI/XMODEM、lab、Andes ICE、本機 DeviceLease 已存在。做 GLADOS adapter 與必要真機驗證，不重造核心能力。
- bcgen ARM .cproject/burner.scat 匯入已在 fedcbdb 完成；E39 起點已識別 duan、boot＋sandaru、六個 build 設定。context/JSON/version/check 模式與 target 處置仍待做。
- 三包 skills 草稿、references、MIT/來源與合成比較已完成（SK-001）。正式版本、擴充評估及 openBCT 載入未完成。
- fresh Windows 安裝器修正由 54038fc 提供，不列尚未實作；該 commit 沒修 OBC-027 encoding。

## 盤點證據與邊界

- [glados/framework/06_service.md](../../framework/06_service.md)
- [glados/impl/bcgen.md](../../impl/bcgen.md)
- [glados/assessments/bcgen-p0-p1/README.md](../../assessments/bcgen-p0-p1/README.md)
- [openBCT/docs/glados-prototype.md](../../../openBCT/docs/glados-prototype.md)
- [openBCT/docs/current-status-report.md](../../../openBCT/docs/current-status-report.md)
- [bct_knowledge_base/docs/skills/grill-spec-integration.md](../../../bct_knowledge_base/docs/skills/grill-spec-integration.md)

前次六個指定測試模組在 Windows 預設編碼結果為 128 passed / 4 skipped / 1 failed；單項 -X utf8 通過。整理 TODO 期間沒有新 FW build、設備驗證、正式 GLADOS run 或全量 openBCT 測試。skills 是合成情境，不是 production 證明。

此清單只收本 session 已盤點的 GLADOS 串接/工具/skills 工作。openBCT 一般 backlog（vendor HSM、native ATA/NAND model、agent streaming 等）仍在其 current-status-report，不自行擴成 GLADOS 必要功能。
