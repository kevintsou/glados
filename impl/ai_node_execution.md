# AI 節點怎麼啟動與回收

> **這份文件回答**：用 Claude Code 執行 AI 節點時，怎麼啟動與回收。屬於實作；框架只要求「每個節點一個全新的 session」（[framework/04 §4.1](../framework/04_rules.md#41-串接層是什麼)）與「只認證據」（[framework/05 §5.1](../framework/05_checks.md#51-只認證據)），換成 Codex、Agent SDK 或人來執行都可以。

---

## 各節點目前構想的執行方式

| 執行方式 | 節點 |
| :---- | :---- |
| 互動式 session（人和 AI 討論） | P0、P3、M1b、C 的核准討論 |
| 無人在旁的單次執行（`claude -p`） | P1、P2、C 的影響分析、M1a、M2、M3、M6、P7 |
| 每輪一個新 session | M4（靠 `progress.md` 接續，搭配 3 輪停止條件） |
| 純程式，不用 LLM | M5、M7、P4／P5 的執行部分、串接層 |
| 規則為主，必要時加獨立分析 | R 失敗分類、S 版本同步的影響判讀 |
| 人 | G0–G3、GC、H1、H2、P6 |

審查節點（M3 的計畫審查、M6）一定是另一個 session，最好換一個模型。

---

## 無人在旁的節點：啟動與回收

**生命週期**：派工前版本檢查 → 決定下一站 → 按需 clone 或準備 worktree，固定輸入 commit 與產出物版本，產生執行編號與 session 編號 → 用節點專屬參數執行 `claude -p` → 串接層自己設 timeout → 回收 → 放行前版本檢查 → 核對交接清單與出口檢查 → 提交與同步紀錄 → 更新正式進度並決定下一站。

```bash
claude -p "執行節點 M4：依 handoff/in/M3.yaml 實作，完成後寫出 handoff/out/M4.yaml" \
  --model sonnet --effort high \
  --append-system-prompt-file nodes/M4/card.md \
  --setting-sources project --settings nodes/M4/settings.json \
  --mcp-config nodes/M4/mcp.json --strict-mcp-config \
  --permission-mode dontAsk \
  --session-id <uuid> --output-format json
```

（參數已在 Claude Code 2.1.187 的 `claude --help` 確認。）

| 節點卡上的設定 | 對應參數 |
| :---- | :---- |
| 角色與規則 | `--append-system-prompt-file`（或用 `--system-prompt` 整個替換） |
| 模型 | `--model`、`--effort` |
| 權限、hook | `--settings` 指向節點專屬設定；`--setting-sources project` 避免個人設定混進來 |
| 可用工具 | `--tools`、`--allowedTools`、`--disallowedTools` |
| 可用 MCP | `--mcp-config` 加上 `--strict-mcp-config` |
| 沒人在旁時的權限詢問 | `--permission-mode dontAsk`：沒有事先允許的動作直接拒絕 |
| 追蹤編號 | `--session-id`，由串接層產生 |

**回收結果只看檔案**：

1. 看 exit code 與 JSON 的 `is_error`。實測沒登入時 `subtype` 仍然是 `success`，但 `is_error: true`、exit 1，所以不能只看 `subtype`。`permission_denials` 會列出被擋下的動作。
2. 真正的產出是交接清單：串接層核對格式與 hash。`--json-schema` 可以讓最後的回覆變成固定格式的摘要，但依據仍然是交接清單。
3. 用 Stop hook 擋住「沒交交接清單就結束」。

**企業訂閱方案要注意的事**：

- 串接層的機器要先登入（`claude auth login`；無人值守用 `claude setup-token`）。
- 不要用 `--bare`：那個模式只接受 API key。隔離改用 `--setting-sources` 和 `--strict-mcp-config`。
- `-p` 模式下設定檔格式錯誤會被**默默忽略**，hook 也跟著消失，關卡就失效了。串接層啟動前必須自己驗證設定檔。
- 所有節點都吃同一個人的額度；用個人席位跑無人值守的自動化是否合規，要和管理員確認，必要時改用組織 API key。
- 另一個選擇是 Claude Agent SDK（同一個引擎，改成函式呼叫）。建議先用 CLI，需要更細的控制再換。

---

## 互動式節點

- 不加 `-p` 執行 `claude` 就是互動式。節點設定改寫成工作目錄裡的檔案（CLAUDE.md 或 skill、`.claude/settings.json`、`.mcp.json`），人用終端機、desktop app、VS Code 都會套用。
- **不能用 Stop hook 強制交出交接清單**：互動模式下每回一次話就會觸發一次，會讓 AI 不把發言權交回給人。改用人執行的收尾指令（例如 `/m1-done`）核對交接清單，加上 SessionEnd hook 記錄未完成的狀態。
- 要等客戶、SOC、HW 回答的問題：登記成待確認事項並寫進 Jira，節點狀態改成「等待外部回覆」。答案回來後開**新 session** 從檔案接續，不用 `--resume`。

---

## 另一條路：openBCT 的 AgentRuntime

openBCT 已經有 `openbct-agent`（`AgentRuntime`），透過 CCR 或其他 OpenAI 相容的 gateway 呼叫 openBCT 的 MCP tools，有 tool policy 與 session 管理。它可以當成另一種節點執行介面，但和上面的 `claude -p` 是兩條不同的路（hook、設定檔隔離、權限詢問的機制都不一樣）。要不要用、用在哪些節點，展開時再決定。
