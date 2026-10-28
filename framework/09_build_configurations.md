# 09 bootcode 的 build 設定（背景知識）

> **這份文件回答**：一個 bootcode 專案的 build 設定各是什麼、跑在哪裡、怎麼被載入，以及規劃 GLADOS 時不能把它們當成同一種 image。
>
> 來源：2026-10-28 使用者說明。標「待確認」的要再核對。

---

## 9.1 三種 build 設定

一個 bootcode 專案通常有好幾個 build 設定，各自 build 出不同的 image，執行位置和載入方式都不一樣：

| 類型 | 是什麼 | 執行位置 | 怎麼被載入、怎麼開始跑 |
| :---- | :---- | :---- | :---- |
| ROM 組態 | bootcode 本體，執行位置是 ROM（mask ROM） | ROM；資料、stack 在 SRAM | 量產時就在晶片的 ROM 裡，上電執行 |
| SPI ROM／ICE mode | bootcode，從 SPI ROM 或用 ICE 載入 | SRAM：ARM 是 ATCM，Andes 是 ILM（code 也在 RAM） | 從 SPI ROM 載入，或由 ICE 載進 ATCM／ILM 後執行 |
| sandaru／burner | **另一支程式**：燒錄 FW、開卡用，不是 bootcode | SRAM（ATCM／ILM） | 由 ROM 裡的 bootcode 帶入：host tool 下 VUC 給 bootcode，bootcode 把 sandaru／burner 帶進 SRAM；host tool 再下 VUC，讓 bootcode 從 ROM 跳到 SRAM 執行它 |

每一種通常再分 ASIC 與 FPGA 兩個設定。

## 9.2 E39 的對應

起點 `ws_fw/.cproject` 的 6 個設定（[projects/E39 E2](../projects/E39.md#e2-e39-的專案設定)）：

| 設定 | 類型 | 2026-10-22 起點 build 結果（BC-010） |
| :---- | :---- | :---- |
| `ps5037_boot_mask_asic`／`_fpga` | ROM 組態 | asic 成功但有 2 個 L6312W，零警告不通過 |
| `ps5037_boot_spice_asic`／`_fpga` | SPI ROM／ICE mode（2026-10-28 使用者確認） | 都失敗：`phal_rpc.h` 型別未宣告 |
| `ps5037_sandaru_asic`／`_fpga` | sandaru／burner | 都失敗：L6291E，`BOOT_ROM_FW_VERSION` 固定位址衝突 |

ROM 的位址每顆 IC 不同，但一定和 ATCM（ITCM）／ILM 是不同的位置（2026-10-28 使用者說明）。

**FPGA 上的 ROM 組態有兩種做法，因 IC 而異**（2026-10-28 使用者說明）：
- HW 把 ROM 的區域在 FPGA 實作成**可以寫入的 SRAM**，方便開發與 debug：ROM 組態照真實的 ROM 位址跑。
- HW 沒有這樣做：只能把 ROM 組態放進 ATCM，在 ATCM 上驗證 bootcode 功能。

PS5037 看起來是第二種：`ps5037_boot_mask_fpga` 的 image 在 `ATCM_RAM`（base `0x00080000`，Max `0x4D000`），依 listing 推得，待確認。所以每顆 IC 要在專案設定寫明：FPGA 上的 ROM 組態跑在哪裡。這也決定了 FPGA 驗證和 ASIC 真實執行位置差多少。

**真實的 ROM 位置從 HW memory map 查**：在 svn 上的 hardware spec 裡（[07 §7.1](07_project_profile.md#71-欄位) 程式碼建立設定的外部來源「HW spec」）。要判斷某段用量算 ROM 還是哪一區 SRAM，以那份 memory map 為準。

## 9.3 規劃時不能忽略的事

- **不同設定是不同的 image。** 每個必要設定各有自己的 image hash、記憶體用量、測試方式。「這個專案的 image」只有一個的設計都要先問：是哪一個設定的？
- **「ROM 用量」的意思跟著設定變。** armlink 的 ROM 是「image 要載入的內容」：ROM 組態燒在真的 ROM 上，SPI ROM／ICE mode 卻是吃 ATCM／ILM。所以記憶體上限與模組預算要**按 build 設定各定一套**（[07 §7.1](07_project_profile.md#71-欄位)，2026-10-28 依使用者決定）。
- **不能從 region 名稱判斷是 ROM 還是 SRAM。** ROM 的位址因 IC 而異，scatter 的 region 名稱也可能沿用；要判斷某段用量算 ROM 還是哪一區 SRAM，要照那顆 IC 的 HW memory map，不能猜。同一個 ROM 組態，FPGA 版和 ASIC 版的記憶體配置也不同，上限要各自定。
- **SRAM 有好幾區，彼此不能借。** 例如 E39 `ps5037_boot_mask_fpga` 的 ATCM_RAM 用了 91%、BTCM1 用了 72%，另一區只用了 5%。總數看不出哪一區快滿。
- **sandaru／burner 和 ROM bootcode 會同時用 SRAM。** sandaru 被帶進 SRAM 時，ROM bootcode 還在處理 VUC 與跳轉，它自己的資料、stack、收資料的 buffer 也在 SRAM。兩個設定各自 link 都可能沒事，放在一起卻重疊；只有拿兩份 listing 交叉比對才看得出來。要不要做成檢查還沒決定（[08 §8.2](08_open_questions.md#82-實作待決) 第 14 項）。
- **sandaru 的上機測試要經過 bootcode。** 正式的載入路徑是「ROM bootcode 收 VUC 帶入、再跳轉」，不是直接用 ICE 載進去；只用 ICE 直接載入測到的，不包含這條路徑。
- **同一個模組在不同設定裡份量不同。** 同一個模組可能同時編進 bootcode 和 sandaru，也可能只在其中一邊；模組預算要記是哪個設定的。

## 9.4 sandaru／burner 是專案的一部分

2026-10-28 使用者決定，GLADOS 規格要重新討論，把 sandaru／burner 納進來：

- sandaru／burner 和 bootcode 有相依性。
- 專案準備（P0）時，burner 的功能需求也要一起備齊。
- 進到模組開發階段時，burner 也一起開發。

### P0 的需求來源：feature list＋CR

2026-10-28 使用者說明：P0 用 **bootcode 的 feature list**、**burner 的 feature list** 和 **CR** 三樣東西，建出 bootcode 和 burner 的基本架構。

- **bootcode feature list**：Confluence 頁面 [V&V - feature - SSD](https://confluence2.phison.com:8443/pages/viewpage.action?pageId=1033179968)（IPFWI，頁面 ID `1033179968`）。
  - 頁面本身沒有內容，只是一組 Jira 查詢。每個分頁是一類 feature：LCP、SIB、BFM、SYS、UART、SATA、PCIE、SMBUS、SEC、SPI、NAND、UFS_LOAD、SPI_LOAD、OTHERS。
  - 查詢條件是 `project = SDKBOOT AND "Epic Link" = SDKBOOT-786 AND "Test-Case Tag" in ("FEA_<類>")`。Epic `SDKBOOT-786` 是「Verification - SSD」，2026-10-28 共有 155 張，類型都是 Test Case。OTHERS 分頁收沒有 `FEA_` 標記的項目。
  - 每張的 **labels 標出適用哪些 IC**，例如 `5963`、`E37`、`PS5039`、`PS5910`、`SE32`、`X3`。`Test-Case Tag` 除了 `FEA_<類>`，還有 `BCVT_FE`、`BCVT_BE`、`BCVT_SEC`，看起來是前端、後端、安全的分組。
  - 所以要抓的是這組查詢的結果，不是頁面內容。一個專案取哪些項目，要依 IC label 篩選。
  - 已經有跨兩支程式的項目，例如 `SDKBOOT-1323`「Boot infomation to/from FW and Burner」（`FEA_LCP`）。
- **burner feature list**：之後會建立，格式還沒定。
- **CR**：照舊，是專案設定的 Jira Epic（[07](07_project_profile.md)）。

### bootcode 和 burner 的相依

2026-10-28 使用者說明：

- **共用底層的 SDK／HAL**：同一份底層 code 會同時編進 bootcode 和 burner。
- **共用部分 header**：例如 eFuse 的定義。

這代表：

- 改到共用的 SDK／HAL 或共用 header，bootcode 和 burner 兩邊的設定都要重 build、重驗，影響範圍不能只算改動的那一支。
- P2 切模組時，共用的 SDK／HAL 和 header 是兩支程式之間的介面，要先定好，就像多顆 IC 共用的 code（[07](07_project_profile.md)「共用層規則」）。

- **載入 burner 的 VUC**：host PC 上的 tool（例如 openBCT）下 VUC，把 burner 的 bin 送進 IC；bootcode 必須支援這些 VUC。

  openBCT 現有的對應指令（`src/openbct/hal/commands.py`）如下，是不是全部都在 2026-10-28 還待確認：

  | 指令 | 做什麼 |
  | :---- | :---- |
  | `ispbnr` | opcode `0xD1`，feature `0x12`，ISP 寫入 BNR image |
  | `enc_ispbnr` | opcode `0xE1`，加密版 |
  | `ispbnr2`／`enc_ispbnr2` | 同上，但固定切成 64 KB 封包，而且不 commit（burner 只載入 RAM 執行，不寫進 flash） |
  | `ispjmp` | opcode `0xD0`，feature `0x02`，讓 bootcode 跳轉或繼續執行 |

這代表：

- 載入 burner 的 VUC 是 **bootcode 的需求**，burner 依賴它。burner 在範圍內，bootcode 的範圍清單就要有對應的 VUC 支援；改這組 VUC，bootcode、burner、host tool 三邊都要一起看。
- host tool 是第三方。VUC 的格式一改，openBCT 的 `CommandSpec` 也要跟著改。
- burner 的上機測試，由 host tool 對跑著 bootcode 的板子下這組 VUC 帶入、再跳轉。這回答了稽核 B 的「sandaru 的測試由誰下 VUC」（[notes/build_config_audit_20261028](../notes/build_config_audit_20261028.md)）。

還沒問到的相依：這組 VUC 的格式與 burner 大小上限，是寫死在 ROM 的固定規格，還是這個專案可以改；兩邊同時用 SRAM 的範圍；burner 會不會引用 ROM bootcode 的固定位址或函式。規格要怎麼改，結論會寫回這一節和 [08](08_open_questions.md)。

## 9.5 還沒照這份知識修正的設計

2026-10-28 依這份文件重新檢查規格與 openBCT，找到一批把所有 build 設定當成同一個 image、或只用 ICE 直接載入測試的設計，逐項列在 [notes/build_config_audit_20261028](../notes/build_config_audit_20261028.md)。每一項等使用者回答後才改規格。
