# 各節點目前構想的工具

> 屬於實作：各節點可能用到的現有 skill、MCP 與工具，展開節點時再確認。每張節點卡的「實作」段也有列出。

| 節點 | 工具 |
| :---- | :---- |
| 串接層、S 版本同步 | 串接層服務（入口：openBCT GLADOS 分頁、CLI、API）、GitLab／本機 git、版本比對與獨立影響分析 |
| P0、P2、C | 來源快照 script（直接呼叫 Jira／Confluence REST API）、Atlassian MCP（討論時查線索）、bootcode-qa、grill-me |
| P1 | ds5-build／andes-build、remote-ice、bootcode-qa |
| P2 | GitLab MCP、bootcode-qa、subagent 平行分析；P2b：CR 撰寫 skill（新做，參考 write-jira-desc）、grill-me、寫回 Jira 的工具 |
| 人工關卡 | 簽核 skill、簽核指令（系統對話框）、openBCT GLADOS 分頁的核准按鈕（[gate_signoff.md](gate_signoff.md)） |
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

## 這些工具在哪裡（2026-10-07 核對）

- `write-openbct-test`、`write-jira-desc` 在 openBCT 的 `.agents/skills/`。
- `grill-me` 被 openBCT 的 write-jira-desc 引用，但 openBCT 與 bct_knowledge_base 兩個 repo 裡都沒有它的本體，來源與版本待確認。
- 其他 skill（bootcode-qa、remote-ice、ds5-build、andes-build、pyconvert、logic-analyzer、pps-log-verify、corvia-code-review、ci-owner、sim-release、vault-smith、the-validator）都在 bct_knowledge_base 的 `Skills/`。
