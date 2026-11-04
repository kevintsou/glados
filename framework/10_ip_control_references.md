# 10 IP 控制實作參考來源

## 10.1 P0 必問與用途

P0 每個專案都要問：「是否有可供參考的 ICV（IC Verify）team 驗證 FW？Git repo 或來源位置在哪裡？有沒有已知的 IP 目錄或控制範例？」已有答案就沿用，不重問。可記「無來源」「暫缺」「無權限」；只有人明確列為必要依據的來源缺失才擋 G0。尚未詢問不能當成無來源。

ICV FW 通常以 Git 管理，以 repo 與採用 commit 辨識；不要求辨認是哪顆 IC，不設同 IC／跨代的允許條件。已知 IP、目錄、入口與適用情境可附註，P0 不要求先完成 IP 控制分析。

它提供初始化、clock／reset、register 存取順序、polling、timeout 與錯誤處理的實作線索。需求仍依 CR、feature list、HW spec 與核准合約；參考 code 的存在不證明適用或已驗證。後續依當前 register、HW spec 與 bootcode 執行情境核對；有差異或查不到的前提就留下未知，不直接照抄、不用它覆蓋需求。ICV FW 不因被列為參考就成為本專案的 burner、交付程式、必要 build target 或 P1 生成輸入。

## 10.2 環境資訊與固定版本

保持 P0 四份產出。在 `environment.json` 新增 `reference_sources` 清單，與原有 `items`（build／verification／ai 工具）分開；不新增工具 category。`profile.json` 以 `ip_control_references` 字串清單引用來源代號（例如 `["icv-fw"]`），包含無來源／暫缺的紀錄；用途與版本以環境清單為準，不重複保存。Git URL、clone 路徑與憑證由各機器的本機設定以來源代號解析，不放入共享產出；repo 欄記可辨認的邏輯名稱，例如 `icv/ip-validation-fw`。

| 欄位 | 要求 |
|---|---|
| `id` | 非空、唯一來源代號；未知 repo 也可用 `icv-fw` 記錄詢問結果 |
| `type` | 本區塊的 Git 來源寫 `git`；若只有非 Git 資料，先記 `pending` 與來源形式，交人確認快照格式，不假造 commit |
| `status` | `available`（已取得固定 commit 與可讀唯讀快照）、`none`（人確認無來源）、`pending`（暫缺／待回答）、`inaccessible`（無權限／無法取得） |
| `required` | 布林值；只有人明確列為必要依據才填 `true`，不從缺口自行推定 |
| `purpose` | IP 控制參考用途；未細分 IP 時如實記錄 |
| `repo`、`ref`、`commit` | `available` 必須有邏輯 repo 名稱與完整 commit（40 或 64 位小寫 hex）；branch／tag 已知時記在 `ref`，不代替 commit。其他狀態只填已知資訊 |
| `paths` | 選填，repo 內相對路徑；未知就省略，不掃全 repo 補齊 |
| `note` | 非 `available` 時必填：回答或缺口、誰補（未知可明列）、下一步；不得寫「已取得」 |

例子中的 repo、commit 為合成資料，不能作真實來源證據：

```json
{"reference_sources": [
  {"id": "icv-fw", "type": "git", "status": "available", "required": false,
   "repo": "icv/ip-validation-fw", "ref": "main",
   "commit": "1111111111111111111111111111111111111111",
   "purpose": "IP 初始化與控制流程參考", "paths": ["drivers/uart/"]}
]}
```

沒有來源的例子（原有 `items` 照常保留）：

```json
{"reference_sources": [
  {"id": "icv-fw", "type": "git", "status": "none", "required": false,
   "purpose": "IP 控制實作參考", "note": "使用者確認目前無來源；負責人未知，日後取得時補入"}
]}
```

`reference_sources` 至少保留一筆 ICV 詢問紀錄；`profile.json.ip_control_references` 不得有重複或不存在的來源代號，每筆 ICV 詢問紀錄都要被引用。`none` 只表示人已確認無來源；尚未回答用 `pending`，note 說明是否已詢問及待誰回答，不把它記成已回答。`required: false` 表示尚未被列為必要依據，不代表人已決定該來源永遠不需要。

上述 available 範例是假設工具已備妥固定快照的環境片段；快照位置、來源代號、commit 與 hash 依既有來源紀錄及交接說明提供，不在環境片段補造工具欄位。只有 commit、尚無可讀快照時用 `pending`（存取受阻則用 `inaccessible`），note 保留缺口；有 commit 不等於已取得可用參考。

有來源時由工具取得指定 commit 的唯讀快照，沿用 `sources/` 及外部證據儲存規則，保留來源代號、commit、快照位置及 hash。branch 更新不自動換掉已採用 commit。尚未取得固定版本時記 `pending`／`inaccessible`；只有 branch 名不能寫 `available`。交接說明保存詢問結果、必要性決定與缺口，不新增第五份 P0 正式產出。

## 10.3 下游使用與換版

- P1 移植、P2 架構、M1 行為釐清與 M4 實作的工作包，帶入相關來源代號、repo、固定 commit、快照位置／hash、用途、已知 paths 及缺口；缺來源時也要帶入狀態，不能默默省略。
- agent 只讀工作包允許的固定快照；引用時在當站既有文件（port.md、arch.md、spec.md、plan.md 或交接說明）記來源代號、commit、檔案與函式／行號、採用方式及與當前 HW 的核對結果。參考來源不擴大可寫範圍，不解除既有隔離規則。
- 單純參考 commit 改版，提示曾引用該來源的節點重新確認依據，由人決定重做哪裡；不自動讓 build／測試證據失效。環境清單或專案設定被修改時，仍照既有 G0／G1／GC 的核准綁定處理，不豁免 G0。
- 若改為生成或編譯輸入，另外納入程式碼建立設定或 build 輸入版本規則，照影響 build 的變更處理。

## 10.4 檢查與串接狀態

P0 收件檢查要確認有詢問紀錄、profile 與環境來源代號一致、狀態符合已取得的證據；`available` 須有完整 commit，且來源紀錄／交接可定位同一份可讀快照與 hash；`required: true` 且來源不可用或快照缺失時擋 G0。`required: false` 的明確無來源／暫缺／無權限不因來源缺失而擋 G0，但不能據此引用未取得的 code。來源問題未答覆時先記 `pending`，不替人回答。

本章定義規格與 skills 的交接契約，新增欄位的自動檢查、唯讀快照與工作包串接尚待 [OBC-032](../docs/coordination/tasks/OBC-032.md)。舊版 openBCT 的收件通過不代表已檢查本章；在串接完成前，由 P0 skill 自查並在交接說明明列未執行的工具檢查，不宣稱自動擋關已生效。
