# 生成配方的機器格式

> **這份文件回答**：專案設定（`profile.json`）裡「起點與生成配方」寫成機器可讀的格式時長什麼樣子，以及 P0、串接層、P1 的生成工具怎麼使用它。屬於實作，目前是**草案**。
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
           "to": "proj/ps5039/lib/dal/inc/fip_fphy/dal_reg_flh_fphi_reg_rx.h"}
        ]
      },
      {
        "block": "APU",
        "action": "keep",
        "reason": "<沿用依據，例如 P0b 確認這個 block 未變更>",
        "files": [{"from_start": "proj/ps5037/lib/dal/inc/apu/apu_reg.h", "sha256": "<起點檔案 hash>",
                   "to": "proj/ps5039/lib/dal/inc/apu/apu_reg.h"}]
      }
    ],
    "ic_dir": {"from": "proj/ps5037/", "to": "proj/ps5039/"},
    "shared_flags": [
      {"file": "duan/.../sal_build_feature.h", "flag": "IC_NAME", "add": "PS5039"}
    ],
    "build_map": [
      {"from": "ps5037_boot_mask_asic", "to": "ps5039_boot_mask_asic"}
    ],
    "generated_paths": ["proj/ps5039/"],
    "port_paths": [
      {"path": "proj/ps5039/phal/", "reason": "register 改變後受影響的 IC 專屬 HAL"}
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
| `sources[]` | 是 | 外部來源：`id`（代號，配方內唯一）、`kind`（`folder`／`svn`／`git`）、`version`（資料夾記快照逐檔清單的 hash；svn 記 `revision` 與 `peg`；git 記 `commit`）。不放網址或路徑 |
| `register_blocks[]` | 是 | 每個 block 一筆。`action`：`replace`（採外部來源）、`keep`（沿用起點的檔案）、`drop`（新 IC 不要）。`replace` 要有 `source`、`version` 與逐檔 `files`（`from` 是快照內路徑）；`keep` 的 `files` 用 `from_start`（起點內路徑）；`keep`、`drop` 要有 `reason`。每個檔案都附 `sha256` |
| `ic_dir` | 新 IC 時必填 | 以前代 IC 目錄為底建立新 IC 目錄 |
| `shared_flags[]` | 否 | 共用層要加入新 IC 的旗標 |
| `build_map[]` | 是 | 起點的每個 build 設定對到新 IC 的設定；必要／排除的處置仍寫在專案設定的「build 設定」欄位，這裡只記對應 |
| `generated_paths[]` | 是 | 機械替換可以寫的生成區 |
| `port_paths[]` | 是（可為空） | P1 允許 AI 移植修改的範圍，每項附理由 |
| `pending[]` | 是 | 還沒定案的項目（P0 草稿用）。送 G0 前必須是空的（[framework/05](../framework/05_checks.md)「專案設定完整」） |

**還沒定的部分**（BC-008 實作時一起定稿，改了就升 `format`）：記憶體配置與 scatter 的變更怎麼表達；`ic_dir` 複製後的 IC 名稱替換規則（哪些檔案、哪些字串）；`generated_paths` 和 `port_paths` 能不能重疊；register 的 include 順序／入口檔案。

---

## R3. 誰怎麼用

| 誰 | 做什麼 |
| :---- | :---- |
| P0（bct-p0） | 討論中直接把決定寫進配方區塊；未定的放 `pending`。照本文件的格式自查欄位齊全、代號與 hash 都有來源；自查只供參考 |
| 串接層 | P0 出口用同一份格式做確定性檢查（共用待辦 OBC-009）；P1 派工時把來源代號換成快照目錄、核對 hash，再把配方與目錄傳給生成工具（OBC-031） |
| P1 生成工具（bcgen 衍生模式或 script） | 嚴格讀取配方；只寫 `generated_paths`；同一份配方與快照重跑結果逐檔相同（BC-008） |
| 環境清單 | 記下 P1 生成工具的固定版本，以及它支援的配方 `format` 版本 |

**生成輸入可不可用**，在 P0 分兩件事回報：配方照本文件的格式是否完整（`pending` 為空、必填欄位齊全）；環境清單選定的生成工具版本是否宣告支援這個 `format`。BC-008 完成前，bcgen 沒有衍生模式，配方完整也只能寫「工具尚不支援」，不能寫成可以交給 P1 生成。
