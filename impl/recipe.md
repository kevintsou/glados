# 生成配方的機器格式

> **這份文件回答**：專案設定（`profile.json`）裡「起點與生成配方」寫成機器可讀的格式時長什麼樣子，以及 P0、串接層、P1 的生成工具怎麼使用它。屬於實作。設計已決定（2026-10-19）；欄位型別定在 schema 檔 [`schema/glados.recipe.v1.schema.json`](schema/glados.recipe.v1.schema.json)（2026-10-20，由 BC-008 的實作補上，見下方「格式狀態」）。
>
> **和框架的關係**：框架只規定這個欄位要記什麼（[framework/07 §7.1](../framework/07_project_profile.md#71-欄位)：起點、禁止 agent 看到的 branch、外部來源與固定版本、register 各 block 的版本與 code 目錄對照、生成區、移植範圍、新舊 build 設定的對應），以及不放憑證與本機路徑（[§7.2](../framework/07_project_profile.md#72-填寫規則)）。本文件決定「寫成什麼格式」，格式改變時只改本文件，不改框架。

---

## R1. 決策（2026-10-19，依使用者決定）

- **配方就是 P1 生成工具的輸入**：`profile.json` 的配方區塊是唯一的資料來源。P0 不另存 bcgen 專用的輸入檔，也不新增第五份產出。bcgen 的衍生模式（共用待辦 BC-008）直接讀這個區塊；改用 script 做機械替換時，也讀同一個區塊。
- **格式由 GLADOS 定義**：放在這份文件，附格式版本（`format`）。理由：P1 寫的是「bcgen 或 script」執行機械替換，配方要和工具無關；P0 只要照格式檢查，不必呼叫 bcgen 就能知道配方齊不齊。bcgen 現有的 `projects/<ic>.json` 是給公版骨架用的，沒有起點 commit、外部來源快照、block 對照、生成區、移植範圍、build 設定對應這些欄位，衍生模式本來就要新定輸入格式。
- **工具嚴格讀取**：不認得的欄位、缺少的必填欄位、對照不到的檔案一律失敗並列出缺什麼，不補預設值、不默默丟掉（bcgen 現有的 `normalize()` 會丟掉不認得的欄位，衍生模式不能沿用這個行為）。
- **來源代號由串接層解析**：配方只記來源代號、類型、版本與 hash。P1 派工時，串接層把代號換成已核對 hash 的快照目錄，用參數明確傳給工具（共用待辦 OBC-031、[impl/bcgen B3](bcgen.md#b3-守住的規則) 第 3 條）。

---

## R2. 格式草案（`format: "glados.recipe/v1"`）

欄位名稱用英文（它們是檔案格式的一部分），說明用中文。路徑一律是相對於 repo 根目錄、用 `/` 分隔的相對路徑；目錄結尾加 `/`。下面以 E39 的結構示意，`<…>` 與 block 的處置都是示意值，不是 E39 的定案（E39 的配方仍在 P0 待決，[E39 E7](../projects/E39.md#e7-e39-待決事項)）。

```json
{
  "start": {
    "repo": "duanyue",
    "branch": "release/PS5037",
    "commit": "<完整 40 字元 commit>",
    "basis": "已發佈的 release branch",
    "forbidden_branches": ["release/PS5039", "PS5039/*"]
  },
  "recipe": {
    "format": "glados.recipe/v1",
    "predecessor_ic": "PS5037",
    "target_ic": "PS5039",
    "sources": [
      {"id": "REG-PS5039", "kind": "folder", "version": {"snapshot_sha256": "<快照逐檔清單的 hash>"}},
      {"id": "HWSPEC-PS5039", "kind": "svn", "version": {"revision": 0, "peg": 0}}
    ],
    "register_blocks": [
      {
        "block": "FIP_FPHY",
        "action": "replace",
        "source": "REG-PS5039",
        "version": "<採用的版本>",
        "files": [
          {"from": "<版本資料夾>/dal_reg_flh_fphi_reg_rx.h", "sha256": "<快照內檔案 hash>",
           "to": "ws_fw/src_root/proj/ps5039/lib/dal/inc/fip_fphy/dal_reg_flh_fphi_reg_rx.h"}
        ]
      },
      {
        "block": "APU",
        "action": "keep",
        "reason": "<沿用依據，例如 P0 討論確認這個 block 未變更>",
        "files": [{"from_start": "ws_fw/src_root/proj/ps5037/lib/dal/inc/apu/apu_reg.h", "sha256": "<起點檔案 hash>",
                   "to": "ws_fw/src_root/proj/ps5039/lib/dal/inc/apu/apu_reg.h"}]
      }
    ],
    "ic_dir": {"from": "ws_fw/src_root/proj/ps5037/", "to": "ws_fw/src_root/proj/ps5039/"},
    "ic_conditions": {
      "id_file": "ws_fw/src_root/sal/build/sal_build_env.h",
      "file": "ws_fw/src_root/sal/build/sal_build_feature.h",
      "follow": "IC_PS5037",
      "add": "IC_PS5039",
      "exceptions": [
        {"macro": "<開關名稱>", "scope_item": "<範圍清單裡標「移除」或「這版不做」的項目>", "reason": "<理由>"}
      ],
      "hw_dependent": [
        {"macro": "HAL_DEF_HOST_APU_RMGR", "blocks": ["APU"]}
      ]
    },
    "build_map": [
      {"from": "ps5037_boot_mask_asic", "to": "ps5039_boot_mask_asic"}
    ],
    "register_entry": "ws_fw/src_root/proj/ps5039/lib/platform.h",
    "seed_paths": [
      "ws_fw/src_root/proj/ps5039/",
      "ws_fw/.cproject", "ws_fw/.settings/", "ws_fw/.gitignore",
      "ws_fw/src_root/sal/build/sal_build_env.h", "ws_fw/src_root/sal/build/sal_build_feature.h"
    ],
    "port_paths": [
      {"path": "ws_fw/src_root/proj/ps5039/phal/", "reason": "register 改變後受影響的 IC 專屬 HAL"},
      {"path": "ws_fw/src_root/proj/ps5039/lib/platform.h", "reason": "依機械替換列出的 include 差異修改"}
    ],
    "pending": []
  }
}
```

| 欄位 | 必填 | 說明 |
| :---- | :---- | :---- |
| `start.repo`、`branch`、`commit`、`basis` | 是 | 起點；`commit` 要完整，`basis` 寫它是已發佈或已驗證版本的依據 |
| `start.forbidden_branches` | 是（可為空） | 禁止 agent 看到的 branch，支援 `*` |
| `recipe.format` | 是 | 格式版本；工具只接受自己宣告支援的版本 |
| `predecessor_ic`、`target_ic` | 是 | 前代與新 IC 代號 |
| `sources[]` | 是 | 外部來源：`id`（代號，配方內唯一）、`kind`（`folder`／`svn`／`git`）、`version`（資料夾記快照逐檔清單的 hash `snapshot_sha256`，算法見下方「格式狀態」；svn 記 `revision` 與 `peg`；git 記 `commit`）。不放網址或路徑 |
| `register_blocks[]` | 是 | 每個 block 一筆。`action`：`replace`（採外部來源）、`keep`（沿用起點的檔案）、`drop`（新 IC 不要）。`replace` 要有 `source`、`version` 與逐檔 `files`（`from` 是快照內路徑）；`keep` 與 `drop` 的 `files` 用 `from_start`（起點內路徑）；`drop` 也逐檔列出，`to` 是複製前代 IC 目錄後要拿掉的檔案，工具不自行推定 block 的範圍；`keep`、`drop` 要有 `reason`。每個檔案都附 `sha256` |
| `ic_dir` | 新 IC 時必填 | 以前代 IC 目錄為底建立新 IC 目錄 |
| `ic_conditions` | 新 IC 時必填 | 共用層依 IC 開關功能的條件怎麼加入新 IC，規則見下方「IC 條件開關」 |
| `build_map[]` | 是 | 起點的每個 build 設定對到新 IC 的設定；必要／排除的處置仍寫在專案設定的「build 設定」欄位，這裡只記對應 |
| 生成區（不另列欄位） | — | 就是 `register_blocks` 裡 `replace` 與 `keep` 所有檔案的 `to`（`drop` 的不算），以檔案為單位，GB 之後凍結 |
| `register_entry` | 有 `register_blocks` 時必填 | include register header 的入口檔案（E39 是 `lib/platform.h`），屬於起始複製區，規則見下方「include 入口」 |
| `seed_paths[]` | 新 IC 時必填 | 起始複製區：機械替換一次性寫入的內容（IC 目錄、新增的 build 設定、共用層的 IC 條件），GB 之後是一般 source |
| `port_paths[]` | 是（可為空） | P1 允許 AI 移植修改的範圍，每項附理由；不能落在生成區 |
| `pending[]` | 是 | 還沒定案的項目（P0 草稿用）。送 G0 前必須是空的（[framework/05](../framework/05_checks.md)「專案設定完整」） |

**IC 條件開關**（2026-10-19，依使用者決定）：共用層用 `IC_NAME` 決定每個功能開不開（E39 起點的 `sal_build_feature.h` 有 20 個條件直接寫到 PS5037）。只換 IC 而不處理，這些條件在新 IC 上全部變成 FALSE，功能被悄悄關掉、build 照樣會過，所以必須寫進配方：

- **預設跟進**：`file` 裡凡是條件含 `(<follow> == IC_NAME)` 的巨集，工具把這一項換成「`follow` 或 `add`」，其他條件原樣保留（例如 `MLDSA_EN` 的「而且 mask ROM 開機」不變）；`id_file` 加上新 IC 的代號定義。只改巨集的條件式，不動註解。
- **例外連到範圍清單**：`exceptions` 裡的巨集不加新 IC。每個例外必須連到範圍清單裡標「移除」或「這版不做」的項目；範圍清單標「保留」的功能不能列例外。例外的巨集不存在，或條件裡沒有 `follow`，工具直接失敗。
- **硬體能力類放 `pending` 等查證**：開關取決於硬體能力（例如 Gen5、flash 介面的 FPU／LDPC 規則）而不是範圍選擇時，列在 `hw_dependent` 並寫出對應的 register block。對應的 block 在配方裡是 `drop` 時，這個開關必須列為例外；block 還沒查證時，這個開關放進 `pending`，在 P0 討論時逐題確認。哪些開關屬於硬體能力類，由 agent 提出候選、人確認。
- **新 IC 要開、前代沒開的功能**（例如 CR 要新增 HMAC）不放配方，那是 CR 的工作，由 P2 之後的節點處理。

**名稱替換**（2026-10-19，依使用者決定）：配方不寫自由的字串替換，替換只發生在工具確定知道語意的地方。

- `ic_dir`：把前代 IC 目錄原樣複製成新 IC 目錄，裡面不做任何字串替換。E39 起點的 `proj/ps5037/` 裡帶 PS5037 的只有 register header 註解裡的來源檔名與少數註解，那是真實出處；之後 `replace` 的 register header 自然換成新版。
- build 設定：工具依 build 工具格式內建固定規則，對 `build_map` 的每一筆複製一份設定。以 DS-5 為例：改設定名稱、把 `_IC_NAME_` 換成新 IC、把 IC 目錄路徑換成新目錄、產生新的唯一 ID，並同步 `.settings/` 的 `IC_FOLDER` 與 `.gitignore` 的輸出目錄。前代的設定保留不動。
- 不能全文替換：E39 起點的 `.cproject` 有 Eclipse 內部 ID `com.arm.tool.assembler.input.503725324`，把 `5037` 全換成 `5039` 會改壞它。之後遇到 Andes 或其他 build 工具格式，在工具加一套對應的固定規則，不在配方裡寫替換表。

**生成區與起始複製區**（2026-10-19，依使用者決定，框架 v0.8.6）：機械替換寫的內容分兩種。框架原本把機械替換寫到的都算生成區、GB 之後一律凍結，套到 E39 時 `proj/ps5039/`、`.cproject`、`sal_build_feature.h` 都會被凍結，CR 一碰 IC 專屬 HAL、功能開關或 build 設定就要改基底。

- **生成區**只放能由配方重新產生、不該手改的內容：就是 `register_blocks` 裡 `replace`／`keep` 每個檔案的 `to`，以檔案為單位，不用目錄。E39 起點的 `lib/dal/inc/` 裡混了 10 個沒有 translator 標記的手寫 header（例如 `fip/dal_fip_reg_def.h`、`sec/dal_sec_sha_api.h`、`pic/dal_reg_uart.h`），旁邊的 `lib/dal/src/` 還有手寫 `.c`；用目錄當生成區會把它們一起凍結。GB 之後凍結；`port_paths` 不能落在這裡。
- **起始複製區**（`seed_paths`）放機械替換一次性寫入的內容。它在機械替換 commit 裡要可重現，GB 之後就是一般 source，移植與之後的 CR 依各自的可寫範圍修改。
- 生成區的檔案落在 `seed_paths` 的目錄裡時，以生成區為準；同一目錄裡的其他檔案（包括手寫 header）屬於起始複製區。機械替換寫到這兩區以外，工具直接失敗。
- 生成配方或外部來源換版、要重建基底時，起始複製區會從前代重新複製，之後的移植與 CR 修改要重新套上；這是 [nodes/P1](../nodes/P1.md) 已列的待展開議題。

**include 入口**（2026-10-19，依使用者決定）：E39 起點用手寫的 `lib/platform.h` 依固定順序 include 約 70 個 header，其中也 include 手寫 helper。

- `register_entry` 屬於起始複製區：機械替換原樣複製，不改寫。
- 機械替換完成後，工具檢查並列出差異清單，寫進基底建立紀錄：入口檔案 include 的生成區檔案不存在（例如 `drop` 的 block），以及生成區裡有檔案沒被 include（例如新 IC 多出或改名的 header）。工具不自行增刪 include，也不決定順序。
- 清單不是空的時，`register_entry` 必須在 `port_paths` 裡，由 P1 移植依清單修改並經移植審查；不在 `port_paths` 裡時，P1 判定配方不完整，退回 P0。

**記憶體地圖**（2026-10-19，依使用者決定）：配方不描述記憶體。E39 起點的位址與大小都集中在 `scat/scatter.h` 的 `#define`，三個 `.scat` 只用這些巨集描述結構；它們都屬於起始複製區，機械替換原樣複製。新 IC 的記憶體地圖和前代不同時，把 `scatter.h`（必要時連 `.scat`）放進 `port_paths`，由 P1 移植修改，每處都要對到 HW spec 的出處並經移植審查。各區怎麼分給功能是 P3 的記憶體預算，不在配方裡決定。

**格式狀態**：上面幾項設計都已決定。欄位型別、必填與不允許多餘欄位定在 [`schema/glados.recipe.v1.schema.json`](schema/glados.recipe.v1.schema.json)（JSON Schema 2020-12），可以檢查單獨的配方，也可以檢查專案設定的 `start`＋`recipe` 兩段。schema 由 BC-008 的 bcgen 衍生模式實作時寫成（bct_knowledge_base `0b479613`，branch `bcgen/derived-mode`，2026-10-20 尚未 merge），逐 byte 複製到這裡；兩邊要改時一起改。實作時補上的兩個細節：

- **`drop` 逐檔列出**：`files` 和 `keep` 一樣用 `from_start`、`sha256`、`to`。工具依 `ic_dir` 複製前代 IC 目錄後，只拿掉這裡列出的 `to`，不自行推定一個 block 包含哪些檔案；這些檔案也列進 include 差異的比對。
- **`snapshot_sha256` 的算法**：相對於該來源的快照目錄，把每個檔案寫成 `{"path": ..., "sha256": ...}`，依 `path` 排序成陣列，以 UTF-8、`sort_keys`、不跳脫非 ASCII、分隔符號不加空白（`","`、`":"`）序列化成 JSON，最後加一個 LF，再算 SHA-256。空目錄不列；快照裡不接受 symlink 或 junction。

改到既有欄位的意義就升 `format`。

---

## R3. 誰怎麼用

| 誰 | 做什麼 |
| :---- | :---- |
| P0（bct-p0） | 討論中直接把決定寫進配方區塊；未定的放 `pending`。照本文件的格式自查欄位齊全、代號與 hash 都有來源；自查只供參考 |
| 串接層 | P0 收件時用同一份格式做擋關檢查「生成配方沒有待定項目」（共用待辦 OBC-009）；P1 派工時把來源代號換成快照目錄、核對 hash，再把配方與目錄傳給生成工具（OBC-031） |
| P1 生成工具（bcgen 衍生模式或 script） | 嚴格讀取配方；只寫生成區與起始複製區；列出 include 入口的差異清單；同一份配方與快照重跑結果逐檔相同（BC-008） |
| 環境清單 | 記下 P1 生成工具的固定版本，以及它支援的配方 `format` 版本 |

**生成輸入可不可用**，在 P0 分兩件事回報：配方照本文件的格式是否完整（`pending` 為空、必填欄位齊全）；環境清單選定的生成工具版本是否宣告支援這個 `format`。BC-008 完成前，bcgen 沒有衍生模式，配方完整也只能寫「工具尚不支援」，不能寫成可以交給 P1 生成。
