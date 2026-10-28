# build 設定稽核（2026-10-28）

> 使用者說明 bootcode 有 ROM 組態、SPI ROM／ICE mode、sandaru／burner 三種 build 設定（[framework/09](../framework/09_build_configurations.md)）之後，重新檢查 GLADOS 規格與 openBCT 實作（`8847d1c`）裡，哪些設計是在不知道這件事、或沒有來源的情況下訂的。
>
> 做法：兩個只讀的檢查分別看規格與程式碼，結果由 claude-code session f9dd76bb 逐條核對原文後整理。**【矛盾】**＝和已知事實衝突；**【推論】**＝推斷，要使用者確認。這份筆記只列問題，規格還沒照它修改；每一項等使用者回答後再改。

## 高

**A【矛盾】測試、G3、交付都只綁一個 image**
- 規格：03 §3.3「M5、P4、P5 的測試結果綁定 image hash」，以及 05 的「交付內容與核准版本相符」、P5、P6、G3 都是單數。可是 05 的「build 零警告」與 M4 已經是「每個必要設定一個 hash」。
- openBCT：`labsteps.py` 的 `verification_target()` 只回傳一個設定（`verification.build_target`，framework/07 沒有這個欄位）。M5、M2 判別能力、P1 既有功能、P4 e2e、P5 都用它。G3 binding 與 manifest 只有一個 `image_hash`。P6 `deliver` 只複製這一個設定的 AXF。
- 後果：如果 build_target 是 `boot_spice_fpga`，交出去的是 FPGA ICE 版。`boot_mask_asic`（燒進 mask ROM 的那支）和 sandaru 都沒交，也沒上機測過。
- 連帶：「image 改變，舊結果不算」比的是最新 build 所有設定 hash 的聯集（`impact.py`）；P5 來源檢查也是比聯集（`service.py`）。測試證據沒記是哪個設定。
- 部分回答（2026-10-28 使用者）：bootcode 與 burner 一起放行，G3 綁兩邊的 image、P6 一次交付；開發時可能要有 burner 才能驗 bootcode（[09 §9.4](../framework/09_build_configurations.md#94-sandaruburner-是專案的一部分)）。
- 要問：G3／P6 要綁哪幾個設定的 hash？「image 改變」要不要按設定分開算？ROM bootcode 變了，sandaru 的結果要不要跟著失效？

**B【矛盾】上機只有「ICE 直接載入、讀回 hash、free run」一條路**
- 規格：notes/c2_lab_design 決定 1、2；08 §8.2 #7；BC-011。
- openBCT：`lab.py` 的 `run_iceload` 一律 `--image <AXF> --run`，沒有按設定類型分支。
- 後果：
  - ROM 組態（ASIC）的 code 在 mask ROM，ICE 寫不進去，讀回永遠不符，結果是驗證缺口。
  - sandaru 被 ICE 直接載進 ATCM，沒走「ROM bootcode 收 VUC 帶入、跳轉」這條正式路徑。`lab_run` 一次只能吃一個 image，表達不出兩階段。
- 部分回答（2026-10-28 使用者）：host tool（例如 openBCT）下 VUC 把 burner 的 bin 送進 IC，bootcode 要支援這組 VUC（[09 §9.4](../framework/09_build_configurations.md#94-sandaruburner-是專案的一部分)）。
- 要問：每種設定怎麼上機？下面跑的 bootcode 用哪個設定？讀回比對要在 VUC 帶入之後做嗎？FPGA 上的 ROM 組態（放在 ATCM，或放在 HW 做成可寫入 SRAM 的 ROM 區）是不是都用 ICE 載入、從 reset 流程開始跑？專案設定要不要加一欄「FPGA 上 ROM 組態跑在哪裡」？

**C【矛盾＋推論】測的是 FPGA 設定，交的是 ASIC 設定**
- 規格：c2_lab_design 決定 5 寫「目前都用 FPGA（E39 是 `*_fpga` 的設定）」。「交付內容與核准版本相符」只證明交的等於核准的，不證明 `*_asic` 被測過。
- openBCT：`lab.py` 固定用 `benches[0]`，bench 沒有平台標記，FPGA 的 image 可能被載到 ASIC 板上。
- 要問：ASIC 與 FPGA 設定差在哪裡？G3 前 ASIC 設定要哪種證據（SIM、只要 build、還是等價論證）？

**D【矛盾】P4「端到端 boot flow」沒說是哪個設定**
- 規格：05「整合後的 image 整條 boot flow 都通過」、nodes/P4。ROM 組態、SPI ROM、ROM→sandaru 是三條不同的 flow，最後一條跨兩個 image。
- 已回答（2026-10-28 使用者）：照 test plan 寫的步驟驗，GLADOS 不寫死；每種介質要不要各跑一次也看 test plan（[09 §9.4](../framework/09_build_configurations.md#94-sandaruburner-是專案的一部分)）。

**E【矛盾】驗收合約與 case 沒有「適用哪些設定」**
- 規格：M1、M2、05、P1 基線、P2 regression 範圍都沒有這一欄。E39 的 2258 只在 sandaru，2421 在 bootcode。
- 要問：合約與 case 要不要標目標設定？bootcode 的 case 要在 ROM 組態與 SPI ROM 都跑嗎？P1 基線要在哪幾個設定上跑既有測項？

**F【矛盾】E39 的記憶體預算仍是一個數字**
- 規格：projects/E39 E2「ROM 區 `0x80000`、大小 `0x4D000`（308KB）」。這組數字正好是 `ps5037_boot_mask_fpga` listing 裡 `ATCM_RAM` 的 base 與 Max。
- 已確認（2026-10-28 使用者）：FPGA 上的 ROM 組態因 IC 而異。HW 有時把 ROM 區在 FPGA 做成可寫入的 SRAM，沒有的話就放進 ATCM 驗證（PS5037 看起來是這種）；真實 ROM 位置要查 svn 上 hardware spec 的 HW memory map。所以這組數字是 `boot_mask_fpga` 的 ATCM 配置，不是 ASIC mask ROM 的上限。
- 要問：6 個設定各自的上限是多少？ASIC ROM 的大小直接取 HW memory map，還是另定較小的預算？

**G【矛盾】E39 起點過不了 P1 第 1 步**
- 規格：P1「起點必要設定都 build 得過」、05「起點也要 0 warning」、07「不能因 build 失敗而排除」。BC-010 實跑 6 個設定只有 `boot_mask_asic` 成功，而且有 2 個 L6312W。
- 要問：起點上的 spice／sandaru 平常怎麼 build（別的 branch、別的程序）？起點要求 0 warning，還是「warning 不比起點多」？（和「E39 起點 commit」待決是同一件事）

## 中

**H【矛盾】「是否為 mask ROM」是整個專案一個旗標**
- 規格：07、E39 E2、P5、P6。只有 ROM 組態（ASIC）交出去不能回頭；SPI ROM 與 sandaru 之後還能更新。
- 要問：哪些設定的交付不可逆？各設定是同一次 P6 交，還是分開交？tapeout 後改 sandaru，要怎麼回到 GLADOS？

**I【矛盾】sandaru 還是「待確認」，CR 卻已經靠它**
- 規格：E39 E2 與 E7 #5 說 sandaru 是否在範圍內待確認，但 E4 把 2258 放進 sandaru 模組、E5 把 2258 列為試點候選。
- 要問：sandaru 兩個設定是否直接列為必要？2258 要走 ROM bootcode＋VUC 這條最難的測試路徑，還適合當試點嗎？

**J【推論】sandaru 可能依賴 ROM bootcode 的固定位址**
- 線索：sandaru 的 L6291E 是 `BOOT_ROM_FW_VERSION` 固定位址衝突。P2 的介面定義沒有跨設定的項目。
- 要問：sandaru 會引用 ROM bootcode 的固定位址或函式嗎？會的話，這是要在 P2 定的介面。

**K【推論】錯誤注入用的 VUC 是否編進交付設定**
- 規格：M2「錯誤注入要用隔離的測試版本……不能合入交付版本」。E39 E2 列的 `VUC_InjectError` 等如果本來就編進量產 ROM，這個前提不成立。
- 要問：這些 VUC 編進哪些設定？

**L【推論】FPGA 上的 eFuse 是否真的不可逆**
- 規格：05、07、E39 的 eFuse 擋關。FPGA 上如果是可以重來的模擬，一律擋住會卡死無人值守的 M5。
- 要問：哪些平台、哪些設定上的 eFuse 動作才真的不可逆？

**M【推論】「既有測項全部要過」在 FPGA 上可能做不到**
- 規格：c2_lab_design、P1、05。E39 說既有測試覆蓋率不高，FPGA 上不一定有那顆 NAND。
- 要問：既有測項要不要按平台或設定篩過？

## 低

**N【推論】hash 的是哪個檔、能不能重現**
- openBCT R04 改成記 AXF。AXF 若帶 debug 資訊或 build 時間，同一個 commit 重 build 的 hash 會不同，「image 改變」會誤觸發。而且 ROM／SPI ROM 交付的可能是 BIN／hex。
- 要問：build 是否 bit-reproducible？要 hash AXF 還是 BIN？交付哪一種？

**O【推論】Andes 的三類設定怎麼表達沒有定義**
- 規格：P0、impl/bcgen C1 只寫了 ARM `.cproject`。openBCT 的 ELF 讀回只處理 ARM ELF32，目前 Andes 在 build 端就明確擋下，不會誤用。
- 要問：Andes 專案的 ROM 組態、ILM、sandaru 怎麼定義？

**P openBCT 小項**
- `lab.py` 的 `BOOT_SECONDS = 20` 寫死，各設定的開機時間不一定相同。
- `builds.py` 的 DS-5 安裝資料夾名稱 `DS-5 v{version}` 看起來是猜的。

## 已修正

- openBCT P4 呼叫記憶體檢查時沒有模組預算，固定被記成「找不到這個模組的記憶體預算」，所以 P4 的記憶體檢查永遠是驗證缺口。現在 P4 只比對專案上限，附回歸測試（`tests/test_glados_review_fixes.py`）。這是 E 批自己的錯，和 build 設定無關。
