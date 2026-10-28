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
| sandaru／burner | **另一支程式**：燒錄 FW、開卡用，不是 bootcode。**我們產出的是驗證用的 burner**，量產用的 burner 由其他單位產出（2026-10-28 使用者說明） | SRAM（ATCM／ILM） | 由 ROM 裡的 bootcode 帶入：host tool 下 VUC 給 bootcode，bootcode 把 sandaru／burner 帶進 SRAM；host tool 再下 VUC，讓 bootcode 從 ROM 跳到 SRAM 執行它 |

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
- **ASIC 設定在 tapeout 前沒有晶片可以跑。** 驗證平台是 FPGA，燒進 mask ROM 的卻是 ASIC 設定。2026-10-28 使用者決定，G3 要的 ASIC 證據是「FPGA 驗證加上 ASIC 與 FPGA 的差異清單」：
  - ASIC 設定本身要 build 0 warning、記憶體在預算內。
  - P5 把同一類設定的 ASIC 與 FPGA 版逐項列出差異（例如編譯旗標、記憶體配置、clock、PHY 設定），每一項寫明 FPGA 的結果為什麼能代表 ASIC。
  - 說明不了的差異登記為驗證缺口，交給 G3 核准人決定；不靠 HW SIM 補驗。
- **FPGA 上的 eFuse 不一定是真的。** 2026-10-28 使用者說明：eFuse 可以用 BCFG 的機制模擬，就是寫變數，不真的 trim eFuse；FPGA 似乎也有模擬真實 eFuse、可以寫入重來的機制，待確認。暫定：不可逆動作清單按平台記，FPGA 上的 eFuse case 照常自動跑，只有 ASIC 上才擋（[07](07_project_profile.md)「不可逆動作清單」）。
- **image hash 以 BIN 為準。** AXF 帶 debug 資訊，可能還有 build 時間或路徑，同一個 commit 重 build 的 hash 可能不同，會讓「image 改變、舊結果不算」誤判，也驗不了 tapeout 後的新專案 ROM image 有沒有變。2026-10-28 使用者決定：G3 核准、P6 交付、「image 改變」的判斷都比 BIN 的 hash；AXF 保留給 ICE 載入與 debug。前提是 BIN 能重現，P1 用同一個 commit build 兩次確認。
- **同一個模組在不同設定裡份量不同。** 同一個模組可能同時編進 bootcode 和 sandaru，也可能只在其中一邊；模組預算要記是哪個設定的。

## 9.4 sandaru／burner 是專案的一部分

> **這一節的 burner 是驗證用的 burner**（2026-10-28 使用者說明）：bootcode 團隊產出的 sandaru／burner 是拿來驗證 bootcode 的，不是量產用的；量產用的 burner 由其他單位產出。所以：
> - 推論（待確認）：量產 burner 應該也是靠 ROM bootcode 的載入 VUC 帶進 SRAM。果真如此，這組 VUC 不只是我們兩支程式之間的介面，也是**其他單位量產 burner 的介面**，改它要通知那個單位。
> - **驗證用 burner 不交付，是測試環境**（2026-10-28 使用者決定）：G3 綁它的 hash，只用來證明驗收時用的是哪一版；P6 只交付 bootcode；tapeout 後改它是測試環境的更新，不必開新專案。

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

- **錯誤注入**（2026-10-28 讀 E39 起點 code 得知，待確認是否通用）：burner 的 `VUC_InjectError` 把要注入的錯誤寫進一個暫存區（`gpBootInfoSimReg`），bootcode 下次開機讀出來照著觸發錯誤。製造壞情境要靠（驗證用的）burner。起點上這段讀取由 `BOOT_INJECT_ERROR_TEST = 1` 編進每個 bootcode 設定，但量產 bootcode 這個旗標不會是 1（2026-10-28 使用者說明），所以驗證用的 image 和量產交付的 image 不同（[notes/build_config_audit_20261028](../notes/build_config_audit_20261028.md) K）。
- **burner bin 的大小上限**：就是這個專案的 ATCM 大小（2026-10-28 使用者說明）。ATCM 大小依那顆 IC 的 HW memory map；sandaru／burner 設定的記憶體上限照這個數字定。

### 其他細節在 P0 依 burner feature list 討論

2026-10-28 使用者決定：其他問題不在框架裡統一定，而是每個專案在 P0 討論需求時，用 burner feature list 詳細列出需要的功能，以及每個功能實際怎麼實作。P0 討論 burner 時至少要涵蓋：

- 載入 burner 的 VUC：這個專案沿用哪一組、格式能不能改，改的話 bootcode、burner、host tool 三邊一起看。
- 兩邊同時用 SRAM 的範圍：burner 可以用到整個 ATCM 時，bootcode 在帶入與跳轉期間的資料、stack、收資料的 buffer 放在哪裡。
- burner 有沒有引用 ROM bootcode 的固定位址或函式（例如 E39 sandaru build 的 `BOOT_ROM_FW_VERSION` 衝突）。
- 共用的 SDK／HAL 與 header 有哪些。
- 跨兩支程式的 feature list 項目（例如 `SDKBOOT-1323`）要怎麼分到 bootcode 與 burner。

### 一起開發、一起放行

2026-10-28 使用者決定：

- **一起放行**：bootcode 和 burner 走同一套流程（M1～M6、P4、P5、G3）。G3 核准的那一版同時綁 bootcode 與 burner 的 image：bootcode 是交付內容，burner 是證明驗收用了哪一版的證據。P6 只交付 bootcode（驗證用 burner 不交付，見本節開頭）。
- **開發時互相搭配**：M1～M6 的過程中，可能要有 burner 才能驗 bootcode，反過來 burner 也要跑在 bootcode 上（載入 VUC）。兩邊在開發階段要互相搭配，不能各做各的。

這代表：

- **P2 的模組相依要跨兩支程式**：某個 bootcode 模組的 M5 需要 burner 的某個功能時，P2 要把它標成相依，並排好順序（[nodes/P2](../nodes/P2.md)）。
- **M5 的驗證證據要記用到的另一支程式**：bootcode 的測試用了哪一版 burner image、burner 的測試跑在哪一版 bootcode 上，都要記 hash（[nodes/M5](../nodes/M5.md)）。那一版改了，用到它的結果也要重新判斷，不能只看被測那一支有沒有變。
- **G3 綁兩邊、P6 只交 bootcode**：G3 核准紀錄記 bootcode 與 burner 每個必要設定的 image hash；「交付內容與核准版本相符」比對 bootcode 的部分。

「要有 burner 才能驗 bootcode」有兩種情況，兩種都有（2026-10-28 使用者確認）：

1. **burner 準備 bootcode 要讀的東西**：bootcode 要從後端介質載入 FW，得先用 burner 把 FW 和載入需要的資料（例如 NAND 的 ID page）寫進去，開機流程才有東西可讀。後端介質依專案而定，不一定是 NAND，也可能是 SPI ROM、UFS 等（2026-10-28 使用者說明；feature list 也有 NAND、SPI_LOAD、UFS_LOAD 分頁）。從後端介質載入的 feature 都是這樣。
2. **burner 本身是被驗的對象之一**：bootcode 的 VUC 帶入與跳轉功能，要拿一支真的 burner 來驗。

這代表：

- burner 是 bootcode **測試環境的一部分**，不只是另一個交付物。
- **P1 量基線**時要有一版能用的 burner，基線報告記下用的是哪一版（[nodes/P1](../nodes/P1.md)）。
- **後端介質是專案設定**：這個專案從哪些介質載入，決定 burner 要寫什麼、bootcode 要讀什麼、驗證平台要接什麼（[07](07_project_profile.md)「後端介質」）。
- **P2 標相依**時，bootcode 模組要用到的 burner 功能（例如把 FW 寫進後端介質）如果這版也要改，要標出來；這種模組在 M5 怎麼驗見下一段。

**驗證時用哪一版另一支程式**（2026-10-28 使用者決定）：

- **M5 用固定的一版**：驗 bootcode 模組時，burner 固定用同一個版本，不跟著 burner 的開發變動，這樣才能把問題隔離在被測的模組。證據照樣記下那一版的 image hash。
- **固定的那一版就是 P1 基線用的 burner**：在基底上 build 出來、基線報告記了 hash 的那一版，M5 和基線的對照條件因此一致。所以基底上的 burner 設定一定要 build 得過、能用；E39 起點的 sandaru 有 L6291E，是 P1 要先解決的事（[notes/build_config_audit_20261028](../notes/build_config_audit_20261028.md) G）。
- **P4 整合時用完整版本**：全部模組開發完、整合之後，用整合出來的 bootcode 與 burner 一起再驗一次。
- **要用到這版新 burner 功能的 case，延到 P4 驗**（2026-10-28 使用者決定）：固定版本裡沒有那個功能，M5 驗不了。
  - 哪些 case 延到 P4，在 M1 的驗收合約裡標明，並寫出依賴哪個 burner 功能；經 H 核准，不能在 M5 臨時決定。P2 標出的跨程式相依是 M1 的線索。
  - M5 驗其餘 case；標了延到 P4 的 case 記「未執行（延到 P4）」，不擋 M5。
  - P4 用完整版本跑這些 case，全部 PASS 才算過；P4 沒驗到的，不能拿 M5 的結果補。
  - 反過來，burner 的 case 要用到這版新 bootcode 功能時，也照同樣規則。

### 哪些 code 屬於哪支程式

每個檔案都要知道屬於 bootcode、burner，還是兩邊共用，才能判斷改了它要重驗哪一邊。2026-10-28 使用者決定：

- **由工具從 build 設定自動算**：build 設定（ARM 的 `.cproject`）記了每個設定編進哪些檔案。只編進 bootcode 設定（ROM 組態、SPI ROM／ICE mode）的檔案屬於 bootcode；只編進 sandaru／burner 設定的屬於 burner；兩種都有的是共用。
- **P0 給人確認**：工具算出來的結果在 P0 給人看一遍。不靠人工填，因為人工容易漏掉共用的檔案。
- **改到共用的檔案，兩邊都要重 build、重驗。**

### build 一律 clean build 全部

2026-10-28 使用者決定：M4 的正式 build 每次都 build 全部必要設定（bootcode 與 burner），而且是 clean build，就算只改到 bootcode 專屬的檔案也一樣。檔案歸屬是從 build 設定算的，改一個 header 可能影響到沒算到的地方，全部 clean build 最直接抓得到。

openBCT 目前的正式 build 已經是這樣：用 `git archive` 匯出一份全新的 source，ds5build 對每個設定下 `-cleanBuild`。repo 裡被 git 追蹤的編譯產物（例如 E39 的 `ws_fw/ps5037_boot_mask_asic/` 下的 `.o`）也會被一起匯出，但 clean build 會先清掉，不會被沿用。

### tapeout 之後的更新

只有 ROM 組態（ASIC）燒進 mask ROM 後不能改；SPI ROM／ICE mode 之後還能更新。2026-10-28 使用者決定：tapeout 後要改 SPI ROM 版，**開一個新的 GLADOS 專案**（驗證用 burner 不是交付物，改它是測試環境的更新，不必開新專案）：

- 起點是上一個專案 P6 交付的版本。
- 範圍清單裡 ROM bootcode 標「保留」，而且不能改：ROM 組態的 image 必須和交付的一樣（hash 相同），等於在固定的 ROM bootcode 上開發。
- 不走原專案的 C 變更；原專案交付後就結束。

### case 要標適用的 build 設定

2026-10-28 使用者決定：驗收合約裡的每個 case 都要標明適用哪些 build 設定，例如只在 ROM 組態、ROM 組態與 SPI ROM／ICE mode 都要，或只在 FPGA、只在 ASIC。

- 在 M1 的驗收合約裡寫，預設值從 feature list 或 test plan 帶過來，經 H 核准。
- M5 對每個適用的設定各跑一次，結果分開記，各自綁那個設定的 image hash。
- 沒標的 case 不能當成「所有設定都驗過」。
- **怎麼載入、怎麼開始跑也看 test plan**（2026-10-28 使用者決定）：每種設定在驗證平台上怎麼載入（ICE 直接載入後 free run、ICE 載入後從 reset 開始、先寫進 SPI ROM 再 reset、host tool 下 VUC 帶入 burner 等），GLADOS 規格不寫死，由 test plan 決定；case 照著寫在驗收合約裡。驗證環境因此要支援 test plan 用到的每一種載入方式；openBCT 目前只有「ICE 直接載入 AXF 後 free run」一種（`lab.py` 的 `run_iceload`）。
- **P1 基線照同樣規則**（2026-10-28 使用者決定）：既有測項也標適用的設定，預設值從 feature list 或 test plan 帶過來，在每個適用設定上各跑一次；標不出來的在 P0 問人。這樣基線和 M5 的條件一致，M5 在某個設定上 FAIL 時，才分得出是這次改壞的還是基底原本就這樣。

### P4 驗什麼由 test plan 決定

2026-10-28 使用者決定：P4 的整合驗證項目照 **test plan** 寫的步驟去驗，GLADOS 規格不寫死要跑哪幾條 flow，讓規格保持彈性。

- 開卡（帶入 burner、寫進後端介質）、正常開機、SPI ROM／ICE mode 這些 flow 要不要跑、怎麼跑，都看 test plan。
- 每一種後端介質要不要各跑一次，也看 test plan。
- test plan 和 feature list 一樣，由工具依專案設定的來源抓成來源快照（[03 §3.2](03_artifacts.md#32-來源快照)、[07](07_project_profile.md)「test plan 來源」）。

### 檔案歸屬的例子

以 E39 推測：`duan/app/boot` 是 bootcode，`duan/app/sandaru` 是 burner，`proj/ps5037/phal`、`duan/user/back` 和共用 header 是共用；以工具實際算出來的為準。

規格要怎麼改的其他結論，會寫回這一節和 [08](08_open_questions.md)。

## 9.5 還沒照這份知識修正的設計

2026-10-28 依這份文件重新檢查規格與 openBCT，找到一批把所有 build 設定當成同一個 image、或只用 ICE 直接載入測試的設計，逐項列在 [notes/build_config_audit_20261028](../notes/build_config_audit_20261028.md)。每一項等使用者回答後才改規格。
