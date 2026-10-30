# V&V feature 表作為 GLADOS P0 需求 baseline — 可行性研究

> **日期:** 2026-10-30
> **議題:** Confluence《V&V - feature - SSD》（pageId `1033179968`）能否作為新 bootcode FW 專案在 GLADOS P0/P1 階段的需求 baseline
> **範圍:** 評估對象為該頁 14 個 tab 所列的 155 張 SDKBOOT 單；對照基準為 GLADOS v0.9/v0.10 的 P0、P1 節點契約
> **產出性質:** 可行性評估與定位建議，非實作

---

## 結論先行

**可行，但它的定位是「P0 討論素材」，不是 scope.md 的權威來源；真正產值最高的落點其實在 M1。**

這份資料的性質是 **補完度高、發現力零**：它能確認「繼承的功能有沒有漏」，不能回答「這版要新增什麼」。因為它是 V&V 測項，描述的是已經做出來的東西要怎麼驗——新功能還沒有測項，所以在這張表上不存在。

關鍵是把用途切對：

| 用途 | 判定 | 理由 |
|---|---|---|
| P0 既有功能的**討論素材** | ✅ 推薦 | 把開放題變封閉題，且不需權威性 |
| profile.json「既有測項」欄位 | ✅ 推薦 | 它本身就是既有測項 |
| M1 **驗收合約種子** | ✅ 價值最高 | 112 張已有 Pass Criteria，接近 contract.md 形式 |
| 建立設定（recipe）輸入 | ⚠️ 僅間接 | 只能貢獻「哪些 feature 開關要關」 |
| scope.md **CR baseline** | ❌ 不建議 | CR 另有正式來源（見 §5） |
| P1 移植依據 | ❌ 不適用 | P1 依據只認 register / HW spec / 建立設定 |

---

## 1. 這份資料是什麼

### 1.1 頁面結構

整頁無正文，是一個 AUI tab group，14 個頁籤各放一個 Jira issues 巨集：

```
LCP / SIB / BFM / SYS / UART / SATA / PCIE / SMBUS / SEC / SPI / NAND / UFS_LOAD / SPI_LOAD / OTHERS
```

前 13 個 tab 共用同一模板，只差 tag：

```sql
project = SDKBOOT AND "Epic Link" = SDKBOOT-786
  and "Test-Case Tag" in ("FEA_<XXX>")
```

第 14 個（OTHERS）是補集，把 13 個 tag 逐一 `OR` 後 `not`，外加 `is EMPTY` 抓漏。

- **Epic:** SDKBOOT-786 "Verification - SSD"（assignee 陳俊宏/chunhung_chen）
- **Test-Case Tag** = `customfield_11201`，多值欄位
- **labels** = 適用 IC：`5963 / E37 / PS5039 / PS5801 / PS5910 / SE32 / X3`
- 總計 **155 張**，maximumIssues=1000（尚有餘裕）

### 1.2 兩個分類軸

每張單通常帶兩個 tag：

- **FEA_\***（功能面）— tab 用的分類軸
- **BCVT_\***（歸屬）— `BCVT_FE` / `BCVT_BE` / `BCVT_SEC`，與 assignee 高度對應
  （BCVT_FE → ryan_liang、BCVT_BE → niki_chou、BCVT_SEC → ryan_liang）

例外：SDKBOOT-2529 只有 `FEA_LCP`，無 BCVT 軸。

### 1.3 分佈

| Tag | 張數 | 備註 |
|---|---:|---|
| FEA_NAND | 43 | 最大宗 |
| FEA_SEC | 22 | 法規壓力最重 |
| FEA_SMBUS | 13 | |
| FEA_LCP | 12 | |
| FEA_PCIE | 9 | |
| FEA_SIB | 9 | |
| FEA_UFS_LOAD | 9 | 僅 5963 |
| FEA_SYS | 7 | |
| FEA_UART | 5 | |
| FEA_SPI | 4 | |
| FEA_SPI_LOAD | 2 | 僅 5963 |
| FEA_BFM | 2 | **涵蓋度不足** |
| FEA_SATA | 1 | **涵蓋度不足** |
| （無 tag）OTHERS | 14 | 性質不同，見 §3.1 |

> ⚠️ **涵蓋度不均勻。** NAND/SEC 很完整，SATA/BFM 幾乎是空的。SATA 真實功能面不可能只有 fast link 一項。若目標 IC 是 SATA 產品，這份資料幫助有限。

---

## 2. 為什麼不能當 scope.md 的權威 baseline

P0 的 `scope.md` 規格（`bct-p0/references/sources-and-artifacts.md`）：

> 每個 **CR／spec 需求／既有功能**各一列：項目、**來源 ID／版本／hash**、標記新增／修改／保留／移除／這版不做

有三個硬性要求對不上。

### 2.1 沒有來源快照，且本質上無法有

契約規定：

> 正式依據讀工具產生的快照，含完整 issue 內容與全部留言、查詢條件、總數、updated／版本及逐項 hash。**MCP 查線上內容只作線索**

這頁是 Confluence 的 **Jira 動態巨集**：沒有版本、每次 render 結果都可能不同。P0 的證據鏈建立在「固定版本 + 逐項 hash」上，而這頁的本質就是「不固定」。

要合規只有一條路：先凍結成快照（某時間點的 JQL 結果 + 完整 issue 內容 + 留言 + hash），引用那個快照而非這頁。**但那樣引用的就不是「這頁」，而是「某次匯出」**——需要有人負責定期匯出與版本管理，是持續成本。

> 而 §4 的三個推薦用法都不需要權威性，**因此也不需要付這筆成本**。這是定位切對之後最大的省事之處。

### 2.2 43 張空描述

空 description 的單共 43 張，包括若干關鍵項：

IDPG HMAC Check、Landmark Disable by eFuse、Partial Bad Plane、redriver support、SATA fast link、VUC、pad page、BH LM、Boot information to/from FW and Burner、flash hard reset handle、GPIO Latch、GPIO SMBus Alert、Xmodem Packet Protection、Xmodem Timeout…

契約正好有一條打到這裡：

> 「未找到新資料」不是「未更動」；沒有依據的 keep 放 `pending`

空單進 scope.md 只能全標 `pending`，而送 G0 前 `pending` 必須為空。等於用它當 baseline 會**製造 43 個擋關項**。

**但空單分佈本身是有訊息的**（見 §3.3）。

### 2.3 CR 關係是反的

原以為這 155 張就是需求清單。查 SDKBOOT-2746 的 subtask 後發現：**CR 掛在測項底下**，不是測項的父項。

```
SDKBOOT-786 (Epic: Verification - SSD)
 └─ SDKBOOT-2746 "CR - PS5039"        ← 這是一張 Test Case
     ├─ [PS5039][CR-2259] Dice UDS Clear while skip DSA by code header
     ├─ [PS5039][CR-2421] ID page HMAC check
     └─ …（共 35 張 sub-Task）
 └─ SDKBOOT-1991 "CR - SE32"          ← 同上
     └─ …（共 4 張 sub-Task）
```

只有 PS5039 和 SE32 有 CR 容器，其他專案沒有。拿它當 CR 清單會漏掉所有沒被收進測項的 CR。**CR 的正式來源見 §5。**

---

## 3. 用之前必須知道的三件事

### 3.1 這 155 張是三種東西混在一起

| 類別 | 張數 | 性質 | 在 GLADOS 的去向 |
|---|---:|---|---|
| 功能需求的驗收描述 | ~112 | 真的在描述 FW 該有什麼行為 | **M1 的 contract.md** |
| 工程品質閘門 | 14 | static analysis、no TODO、compile option、register value check、CR 容器 | **profile.json「必要規則」「CI」欄位** |
| CR 容器 | 2 | 本身不是測項，是 39 張 CR 的掛載點 | **scope.md「CR」列**（但應改用 §5 來源） |

**三者流向完全不同的節點，混在一起餵給任何一個都會出問題。** 要用必須先拆。

OTHERS 那 14 張特別要注意：它們跨 feature、不屬於任何功能類別（這正是它們沒 tag 的原因），當功能 baseline 用會污染清單。

> 其中 `SDKBOOT-1564 static code analysis` 列了 CPP Check / Coverity / Black Duck / **CCM** / **Corvia** 五項——與 repo 內的 `ci-owner`、`corvia-code-review` skill 對應。

### 3.2 最獨特的價值：功能的外部依賴關係

這是從 code 盤不出來、只有測項描述才看得到的資訊。

以下跨界功能在 bootcode 側只描述了一半，另一半在 Burner：

| 單號 | 功能 | 跨界內容 |
|---|---|---|
| SDKBOOT-546 | MP with Phison VUC | Boot ↔ Burner 互跳、random delay、不同 bin size |
| SDKBOOT-2128 | isp pram bin size overflow abort | 五條路徑（nvme adm vuc / sata / security protocol / nvme-mi over mctp over smbus / uart xmodem） |
| SDKBOOT-583 | Load FW Flow: Prohibit Mode | 擋 vendor_isp_pram 與 FW download |
| SDKBOOT-1323 | Boot information to/from FW and Burner | — |
| SDKBOOT-585 | GPIO MUX | UART 收 Burner、印 "XB"、跳 Burner 印 "J" |

**為什麼 code 看不出來：** code 裡只看得到「UART 收資料、檢查 bin size」，看不出對面是誰、對面是不是正式版。而測項必須寫清楚怎麼測、用什麼測，依賴關係因此是顯性的。

這一層資訊比「功能清單」本身更難從別處取得，也是 §4.1 推薦此用法的主要理由。

### 3.3 空單比例可當成熟度指標

空描述的分佈不是隨機的：

- **描述最完整**的落在兩端——最舊的（UFS_LOAD 那組寫到 eFuse bank4 的 bit 位置）與最新的（SDKBOOT-2126 SMBus AC timing 寫到 `phal_smbm_set_freq()` 函式路徑 + 5-phase review SOP）
- **空單集中在中段偏新**（SDKBOOT-1878 之後編號居多，labels 多為 PS5910 / SE32 / PS5039）

推測是「單先開起來佔位，描述之後才補」。若此假設成立，**空單比例可作為該 IC 的 V&V 定義成熟度指標**：

> **操作判準：** 要用這份資料前，先看目標 IC 在這頁的空單比例。PS5039 / E37 描述相對完整；SE32 / PS5910 空單明顯較多。

---

## 4. 推薦的三個用法

### 4.1 P0 既有功能的「討論素材」← 主要用法

P0 是外部互動節點，`bct-p0/SKILL.md`：

> 先把四份草稿存起來，需要人判斷的決定列成待問清單
> 一次一個白話決定。**大量相同規則先整理成表一起確認**，例外單獨處理

這 155 張單天然具備討論素材該有的形狀：

- **有分類骨架**（14 個 FEA_，問題可按面向分批問）
- **有 IC 維度**（labels 直接是「前代做過沒」，正是「跟進／不跟進」的判斷基礎）
- **顆粒度剛好**（一張單 = 一個可回答「要不要」的功能單位）

**核心效益：把開放題變封閉題。**

| 沒有它 | 有它 |
|---|---|
| 「這版 NAND 要支援什麼？」 | 「前代 E37 的 NAND 有這 43 項，逐項確認跟進／不跟進／這版不做」 |
| 問題太大，人答不出來 | 可一次確認完的表 |

同時它也是對「自行盤點」的交叉檢查——人腦很容易漏掉 NAND 那 43 項裡的冷門項（Trimload Fail、Partial Bad Plane、Micron WP Hard Reset）。

**合規性：** 契約允許此用途，但有限制：

> 限定導航用途的 KB 要把具體事實**回查固定 source／spec**

即：它只負責「提醒該查什麼」，具體事實仍回固定起點的 code 與 spec 查證。因此**不需快照合規**。

### 4.2 profile.json「既有測項」欄位

profile 要涵蓋的項目明列「既有測項」。這 155 張就是既有測項本身，14 個 FEA_ 分類 + 3 個 BCVT_ 歸屬軸是現成的分類骨架。這是它最名正言順的位置。

### 4.3 M1 驗收合約種子 ← 產值最高

M1 規格（`glados-contract.md`）：

> `spec` 條目 B1、B2…須有來源；**驗收合約每條對到 spec 條目**

那 112 張描述完整的單，本質上**就是驗收合約**。現成範例：

| 單號 | 已具備的形式 |
|---|---|
| SDKBOOT-577 stay in boot by GPIO | 標準三段式：`[Description]` 1=Load FW / 0=Force in boot → `[Verification Flow]` → `[Pass Criteria]` |
| SDKBOOT-742 fault mitigation pattern | Pass Criteria：確實進入 fault_delay、delay 時間有變化、UART 印 Boot→FW 時間至少 10 次且長於 disable 的 case |
| SDKBOOT-1456 boot lun switch | 4 個 case 各自預期，並標明哪些由 HW SIM cover |
| SDKBOOT-1461 init delay | eFuse trim 值對應 ms 全列（RST_N 0/3/22/200；unit ready 60/70/90/200） |
| SDKBOOT-2747 CR-2259 | C10 / C3-1R / C4-5~C4-8 逐 case 前提 + Pass Criteria，已達可執行程度 |

拿來當 contract.md 起草素材，省掉最費工的「想驗收條件」那段。仍須逐條回查來源。

### 4.4 對建立設定（recipe）只有間接貢獻

`recipe.md` 要求的項目全部是**路徑、commit、hash、register 位址**：起點 repo/branch/commit、register block 的 replace/keep/drop + 逐檔 hash、IC 目錄、build 設定對應、include 入口、生成區／起始複製區／移植範圍。

**V&V 測項一項都提供不了**——它不知道 `btAESCodeBlkDecrypt` 在哪個 header、不知道 E37 的 IC 目錄叫什麼、不知道 build target 怎麼對應。

唯一接點是「共用層 IC 條件開關」：

> 預設跟進前代；例外只能是範圍清單標「移除」或「這版不做」的功能，並連到該項目

這需要先有功能清單才能判斷。所以這頁能幫的是：**提供功能清單 → 人決定哪些標「這版不做」→ 該決定才連到 recipe 的例外**。中間那步是人的決定，不是資料本身。

> ⚠️ 因此「用這份資料建 codebase」的說法應降級為「**決定建完之後哪些 feature 開關要關**」。recipe 本身仍須從 code、register、build 設定來。

---

## 5. CR 那條線（已釐清）

CR 在 SDKBOOT 是**獨立的 issue type**，不是靠測項容器管理：

- `issuetype = "Change Request"`，SDKBOOT 專案內共 **217 張**
- summary 多帶專案前綴：`[PS5039]` / `[PS5910]` / `[PS5933]` / `[PS6237 ECO LDO3]`
- 有完整 review workflow：`In Evaluation → Evaluated → In Review → REVIEWED`
- 與測項的關係是 issue link **"be verified by"**

查證示例（SDKBOOT-2747）：

```
SDKBOOT-2259  [PS5039][Security] Dice UDS Clear while skip DSA by code header
              issuetype = Change Request, status = REVIEWED
   ↑ be verified by
SDKBOOT-2747  [PS5039][CR-2259] …（Test Case 的 sub-Task，掛在 SDKBOOT-2746 底下）
```

**結論：scope.md 的「CR」列應直接接 `issuetype = "Change Request"` 的查詢，而非本頁的 CR 容器。**

這也強化了 §2.3 的判斷：本頁的 CR 容器只是「要驗的 CR」的子集，不是 CR 母體。

> 契約提醒：Jira 的 `In Review` / `REJECTED` 是**來源狀態**，人的本版範圍決定另記；排除項目仍留來源與理由。

---

## 6. Burner 側的 V&V（尚未建立）

已知事實：
- Burner 有類似頁面的規劃，用**不同的 Epic link** 管理
- 驗證用 Burner **並非量產版本**——量產版由其他部門開發，在 bootcode 開發階段可能尚未完成
- 因此驗證 Burner 的嚴謹度**本來就低於** bootcode

### 6.1 定位：註腳，不是對等的第二份

既然嚴謹度本來就低，Burner 那份不需比照 bootcode 的完整度：

- 不用追求逐項描述完整（bootcode 是 112/155）
- 不當證據來源
- 合併時**以 bootcode 為主、Burner 為註腳**

真正的價值不在「Burner 自己有什麼功能」，而在「**bootcode 的哪些測項依賴 Burner 的哪些能力**」——是依賴關係表，不是功能需求表。工作量因此小很多：只需標出 §3.2 那幾張跨界單各自依賴什麼。

### 6.2 「量產版差異無記錄」不是 pending

**這點容易判斷錯，特此記錄。**

直覺會想把「驗證版 vs 量產版差異未知」標成 scope.md 的 pending。**這是錯的**——它不是資訊缺口，是**時序事實**：量產 Burner 在 bootcode 開發階段根本還不存在。

契約對 pending 的要求是「缺什麼、誰補、影響哪一項」。這裡「誰補」和「何時補」都指向 bootcode 專案以外、且在 P0 之後。標成 pending 會讓 G0 卡在 P0 本來就無權解決的事情上。

正確處理依契約：

> 缺漏會擋住本站必要輸出時才列為阻擋；**不影響本站的細節寫在交接說明給下一站**

| 項目 | 正確落點 |
|---|---|
| 驗證用 Burner 的存在與限制 | **profile.json「驗證平台」/「觀察與錯誤注入手段」欄位**，寫一次即可 |
| 量產版差異無記錄 | **交接說明**（時序事實，非 pending） |
| §3.2 那批跨界功能 | 交接說明標「驗證結論有時效性，量產 Burner 完成後需回歸」 |

寫在 profile 的好處：一次說明勝過在每個相關功能上重複標註。下一站看到的是「驗證平台清單裡有『驗證用 Burner』，其限制為 X」，而不是散落在 scope.md 的一堆 pending。

### 6.3 衍生的真實情報

既然量產 Burner 在 bootcode 開發期不存在，有個結構性後果：

**bootcode 對 Burner 介面的正確性，在 bootcode 專案週期內永遠無法終局驗證。**

這不是壞消息，是正常的開發現實。但它讓 §3.2 那批功能的「已驗證」狀態帶有**有效期**——一旦量產 Burner 完成，這些介面可能需要重驗。

把這批功能識別出來本身就有價值：後續節點單看 code 是看不出哪些功能依賴一個尚未存在的對手方的。

---

## 7. 證據強度總表

| 材料 | 在 P0 的角色 | 證據強度 | 需快照？ |
|---|---|---|---|
| bootcode V&V（本頁，155 張） | 既有功能討論素材、分批確認的表 | 導航級——具體事實回查 code/spec | 否 |
| Burner V&V（待建） | bootcode 跨界測項的依賴註腳 | 更低，不當證據 | 否 |
| CR（`issuetype = "Change Request"`，217 張） | scope.md「CR」列 | 正式來源 | **是** |
| spec / register | recipe 的實際輸入 | 需固定版本 + hash | **是** |

---

## 8. 落地建議

| 用途 | 做法 | 風險 |
|---|---|---|
| 既有功能討論素材 | 匯出成 feature × IC 矩陣，當 P0 分批確認的表 | 低——定位清楚就不會誤用 |
| profile「既有測項」 | 直接引用 Epic key + 分類骨架 | 低 |
| profile「驗證平台」 | 記驗證用 Burner 及其限制 | 低 |
| M1 合約種子 | 挑 112 張描述完整的當起草素材 | 中——須逐條回查來源 |
| scope.md CR 列 | 改接 `issuetype = "Change Request"` | 低 |
| scope.md 既有功能 baseline | **不建議以本頁為權威來源** | 高——43 個 pending + 漏 CR |

### 操作順序的提醒

P0 討論若從功能表開始，會先確立「繼承哪些」再疊 CR 的「新增哪些」。這順序對人較友善（先確認熟悉的舊東西）。

**但有返工風險：** 若某張 CR 會改掉某個既有功能的行為，先確認「這項跟進」再看 CR，可能產生前後矛盾的決定。

契約對此的規定是兩邊都要記、衝突另記：

> 程式現況不會自動推翻需求；需求也不證明程式已做到

實務上建議：**先掃一遍 CR 標題、標出會動到既有功能的那幾張，再進功能表討論**，可減少返工。

---

## 9. 未決事項

1. **Burner 側 Epic 的 tag 體系是否與 bootcode 同一套。** bootcode 用 `FEA_*` + `BCVT_*`；若 Burner 用不同命名（如 `BNR_*`），合併時需一層對照表。labels 的 IC 代號應為共用。待該頁建立後確認。
2. **PS5039 P0 演練當時實際用了什麼當 CR 來源。** `bct-p0/SKILL.md` 提到「源自 PS5039 P0 演練」；若有留下記錄，可直接比對本研究 §5 的結論。
3. **空單比例作為成熟度指標的假設尚未驗證**（§3.3）。目前僅為分佈觀察，未與實際專案進度核對。

---

## 附錄：查證方法與限制

本研究透過 MCP（`mcp-atlassian`）讀取：

- Confluence 頁面 `1033179968`（storage format，含 14 個 Jira 巨集的完整 JQL）
- SDKBOOT-786 底下全部 155 張單的 summary / description / labels / `customfield_11201`
- OTHERS tab 的 JQL 實跑結果（14 張，全為 Test-Case Tag 空值）
- SDKBOOT-2746 / 1991 的 subtask 結構（39 張 CR sub-Task）
- SDKBOOT-2747 的 issuelinks（確認 "be verified by" 關係）
- `issuetype = "Change Request"` 母體計數（217 張）

GLADOS 契約依據 `bct_knowledge_base` repo 內的固定檔案（非本 repo）：

- `Skills/bct-grill-me/references/glados-contract.md`（對照 v0.10）
- `Skills/bct-p0/SKILL.md` v0.3.1
- `Skills/bct-p0/references/sources-and-artifacts.md`
- `Skills/bct-p0/references/recipe.md`
- `Skills/bct-p1-port/SKILL.md` v0.1.0（契約固定於 GLADOS v0.10 `cd4b9f285f437ba2d8fa327b83b26273c5ec0731`）

本 repo 側的對應規格：[framework/03_artifacts](../framework/03_artifacts.md)、[04_rules](../framework/04_rules.md)、[05_checks](../framework/05_checks.md)、[07_project_profile](../framework/07_project_profile.md)、[nodes/P0](../nodes/P0.md)、[nodes/P1](../nodes/P1.md)、[nodes/M1](../nodes/M1.md)、[impl/recipe](../impl/recipe.md)。

> ⚠️ **本研究全部以 MCP 線上查詢取得，未經正式快照檢查。** 依 P0 契約，這屬於「線索」層級，不等價於來源快照。本文件的結論可用於決定「要不要採用、怎麼定位」，但若要實際作為 P0 產出的依據，相關事實仍須回查固定版本來源。
>
> 另：Jira 的 155 張單中，附件與圖片未讀（例如 SDKBOOT-1581 的 LA 波形截圖、SDKBOOT-601 的 OCP spec PDF）。未把文字抓齊當作全部資料已齊。
