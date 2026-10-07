# 節點卡（v0.7 討論稿）

> 每個節點一張卡。卡分兩段：
>
> - **介面**：由框架固定，串接層照這一段守門。改這一段＝改框架。
> - **實作**：誰做、用什麼做。可以替換，之後一個節點一個節點展開。
>
> v0.7 先把 16 個節點的介面寫完整；實作段只記目前的構想與待展開的議題。

---

## 節點索引

| 節點 | 名稱 | 介面 | 實作 |
| :---- | :---- | :---- | :---- |
| [P0](P0.md) | 專案啟動 | 初稿 | 待展開 |
| [P1](P1.md) | 基線建立 | 初稿 | 待展開 |
| [P2](P2.md) | 差異分析 | 初稿 | 待展開 |
| [P3](P3.md) | 架構與介面 | 初稿 | 待展開 |
| [P4](P4.md) | 整合 | 初稿 | 待展開 |
| [P5](P5.md) | 全量驗收 | 初稿 | 待展開 |
| [P6](P6.md) | 交付 | 初稿 | 待展開 |
| [P7](P7.md) | 回寫 | 初稿 | 待展開 |
| [C](C.md) | 變更分析 | 初稿 | 待展開 |
| [M1](M1.md) | 需求釐清 | 初稿 | 待展開 |
| [M2](M2.md) | 驗收定義 | 初稿 | 待展開 |
| [M3](M3.md) | 實作計畫 | 初稿 | 待展開 |
| [M4](M4.md) | 實作與 build | 初稿 | 待展開 |
| [M5](M5.md) | 驗證 | 初稿 | 待展開 |
| [M6](M6.md) | 獨立審查 | 初稿 | 待展開 |
| [M7](M7.md) | 完成交接 | 初稿 | 待展開 |

S 版本同步與 R 失敗分類是串接層的規則，不是節點，見 [03 串接層規則](../framework/03_rules.md)。

---

## 節點卡的欄位

### 介面（框架固定）

| 欄位 | 寫什麼 |
| :---- | :---- |
| 目的 | 一句話說明這一站要完成什麼 |
| 層級 | 專案、模組或變更 |
| 從哪裡進來 | 哪些情況會進到這個節點（第一次、變更、退回） |
| 輸入 | 要用到的產出物，以及必要的狀態（已通過且有效）、必要的核准 |
| 輸出 | 要交出的產出物，以及串接層要能核對的最低結構 |
| 出口檢查 | 列檢查名稱，意思見 [05 檢查清單](../framework/05_checks.md)。每張卡都另外要做 [05 §5.4](../framework/05_checks.md) 的共通檢查 |
| 出口關卡 | 需要哪個人工核准（見 [02 §2.4](../framework/02_workflow.md)） |
| 失敗退回 | 什麼情況退回哪裡（依 [03 §3.6](../framework/03_rules.md)） |
| 迴圈上限 | 最多幾輪，超過交給人 |
| 可寫範圍 | 可以寫哪些路徑、禁止碰哪些 |
| 人怎麼參與 | 只在關卡／與 AI 一起做／由人執行 |
| 獨立性要求 | 這一站的執行者不能和哪一站相同 |

### 實作（可替換，待展開）

| 欄位 | 寫什麼 |
| :---- | :---- |
| 執行者 | AI、工具、人，或組合 |
| 執行方式 | 互動式 session、無人在旁的單次執行、每輪一個新 session、純程式 |
| 模型 | 用哪個模型，審查節點用哪個不同的模型 |
| 工具 | skill、MCP、測試框架、build 工具 |
| 待展開議題 | 實作時要解決的問題 |

---

## 範本

```markdown
# <節點代號> <名稱>

## 介面（框架固定）

- **目的**：
- **層級**：
- **從哪裡進來**：
- **輸入**：
- **輸出**：
- **出口檢查**：
- **出口關卡**：
- **失敗退回**：
- **迴圈上限**：
- **可寫範圍**：
- **人怎麼參與**：
- **獨立性要求**：

## 實作（待展開）

- **執行者**：
- **執行方式**：
- **工具**：
- **待展開議題**：
```

---

## 目前構想的工具對照

各節點可能用到的現有 skill、MCP 與工具（屬於實作，展開時再確認）：

| 節點 | 工具 |
| :---- | :---- |
| 全流程、S 版本同步 | 串接層服務（入口：openBCT GLADOS 分頁、CLI、API）、GitLab／本機 git、版本比對與獨立影響分析 |
| P0、C | Atlassian MCP（Jira／Confluence 讀 CR 與 spec）、bootcode-qa |
| P1 | ds5-build／andes-build、remote-ice、bootcode-qa |
| P2 | Atlassian MCP、GitLab MCP、bootcode-qa、subagent 平行分析 |
| P3 | bootcode-qa、pyconvert（eFuse／BCFG 欄位與 layout） |
| M1 | bootcode-qa、pyconvert、grill-me |
| M2 | write-jira-desc、write-openbct-test、openBCT |
| M3 | 強模型規劃＋另一個模型審查 |
| M4 | ds5-build／andes-build |
| M5 | remote-ice、openBCT、bootcode-qa（log 判讀）、logic-analyzer（實體訊號）、pps-log-verify（以已知通過的 log 當標準比對） |
| M6 | corvia-code-review、另一個模型 |
| P4、P5 | openBCT、ci-owner（Coverity／cppcheck／Black Duck）、corvia-code-review |
| P6 | sim-release |
| P7 | vault-smith（寫知識庫）、the-validator（驗知識庫沒退步）、skill-creator |

**2026-10-07 核對結果**（v0.6 把部分工具標為「playbook 頁提到、待確認」）：

- `write-openbct-test`、`write-jira-desc` 已經存在，放在 openBCT 的 `.agents/skills/`。
- `grill-me` 被 openBCT 的 write-jira-desc 引用，但 openBCT 與 bct_knowledge_base 兩個 repo 裡都沒有它的本體，來源與版本待確認。
- 其他 skill（bootcode-qa、remote-ice、ds5-build、andes-build、pyconvert、logic-analyzer、pps-log-verify、corvia-code-review、ci-owner、sim-release、vault-smith、the-validator）都在 bct_knowledge_base 的 `Skills/`。
