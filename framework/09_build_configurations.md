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

## 9.4 還沒照這份知識修正的設計

2026-10-28 依這份文件重新檢查規格與 openBCT，找到一批把所有 build 設定當成同一個 image、或只用 ICE 直接載入測試的設計，逐項列在 [notes/build_config_audit_20261028](../notes/build_config_audit_20261028.md)。每一項等使用者回答後才改規格。
