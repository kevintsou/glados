# AI 節點怎麼啟動與回收

> **這份文件回答**：外部互動節點與派工節點，實際上怎麼用 Claude Code（或 Codex 等）執行。屬於實作；框架只要求兩種執行方式（[framework/04 §4.2](../framework/04_rules.md#42-兩種執行方式)）與「只認證據」（[framework/05 §5.1](../framework/05_checks.md#51-只認證據)），換成 Codex、Agent SDK 或人來執行都可以。

---

## 各節點的執行方式

| 執行方式 | 節點 |
| :---- | :---- |
| 外部互動：人自己開 agent，串接層只開工與收件 | P0、P2、M1、C、P7 |
| 派工：無人在旁的單次執行（`claude -p`） | M2、M6、P1 的移植審查、P5 的安全審查 |
| 派工：每輪一個新 session | M4、P1 的移植（靠 `plan.md` 與交接說明接續，最多 3 輪） |
| 派工：純程式，不用 LLM | M5、P4／P5 的執行部分、P1 的機械替換與 build、串接層 |
| 人 | G0、GB、G1、H、G3、GC、P6 |

審查（M2 的測試審查、M6、P1 的移植審查、P5 的安全審查）一定是另一個 session，最好換一個模型。

---

## 外部互動節點：開工與收件

串接層不啟動 agent，也不參與中間過程（[framework/04 §4.2](../framework/04_rules.md#42-兩種執行方式)）。

1. **開工**：串接層開執行編號，準備工作區（有禁看 branch 的專案，工作區只含允許的 branch 與快照），寫出工作包 `.glados/projects/<專案編號>/runs/<執行編號>/workpackage.md`（[framework/03 §3.5](../framework/03_artifacts.md#35-工作包)）。
2. **人開 agent**：在工作區用終端機、desktop app、VS Code 或 Codex 開 agent，叫它先讀工作包。建議的 skill 寫在工作包裡，例如 P0 用 bct-p0，M1 用 bct-grill-me 與 bct-to-spec。
3. **提交**：人在 openBCT 按「提交」，或執行提交指令。串接層記下當下的 commit，跑收件檢查與擋關檢查，結果顯示給人；沒過就列出缺什麼。
4. **等外部回覆**：要等客戶、SOC、HW 回答的問題，登記成待確認事項，節點轉為「等外部回覆」。專案設定「寫進 Jira」允許時由工具寫進 Jira；不允許時（例如 E39）由人轉問，答案記回待確認事項清單。答案回來後開新 session 從檔案接續，不靠舊對話。

互動式 session 不能用 Stop hook 強制交出產出：每回一次話就會觸發一次，會讓 AI 不把發言權交回給人。收尾一律由人提交。

---

## 派工節點：啟動與回收

**生命週期**：派工前核對上游已完成 → 按需 clone 或準備 worktree，固定輸入 commit，產生執行編號與 session 編號 → 用節點專屬參數執行 `claude -p` → 串接層自己設 timeout → 回收產出、交接說明與 log → 核對只寫在允許範圍內 → 跑擋關檢查 → 沒過就在節點內重做（最多 3 輪）→ 過了就記錄並判斷下一站。

```bash
claude -p "執行節點 M4（模組 lcp）：讀 nodes/M4.md、spec、驗收合約與測試，完成後寫出交接說明" \
  --model opus --effort high \
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

節點的設定一律不載入簽核 skill，也不允許執行簽核指令，避免節點核准自己的產出（[gate_signoff.md](gate_signoff.md)）。

**回收結果只看檔案與擋關檢查**：

1. 看 exit code 與 JSON 的 `is_error`。實測沒登入時 `subtype` 仍然是 `success`，但 `is_error: true`、exit 1，所以不能只看 `subtype`。`permission_denials` 會列出被擋下的動作。
2. 真正的結果是工作區的 commit、交接說明，以及串接層自己跑的擋關檢查；agent 回覆裡說的「完成」不算數。
3. 可以用 Stop hook 擋住「沒寫交接說明就結束」。

**企業訂閱方案要注意的事**：

- 串接層的機器要先登入（`claude auth login`；無人值守用 `claude setup-token`）。
- 不要用 `--bare`：那個模式只接受 API key。隔離改用 `--setting-sources` 和 `--strict-mcp-config`。
- `-p` 模式下設定檔格式錯誤會被**默默忽略**，hook 也跟著消失。串接層啟動前必須自己驗證設定檔。
- 所有節點都吃同一個人的額度；用個人席位跑無人值守的自動化是否合規，要和管理員確認，必要時改用組織 API key。
- 另一個選擇是 Claude Agent SDK（同一個引擎，改成函式呼叫）。建議先用 CLI，需要更細的控制再換。

---

**決定（2026-10-20，依使用者決定）**：

- **執行方式**：派工的 AI 節點用 `claude -p`（本節的做法）。openBCT 的 AgentRuntime 與 Codex CLI 暫不用。
- **帳號**：先用使用者自己的企業席位（在跑服務的機器上用 `claude setup-token` 登入），只跑少量節點試行；同時向管理員確認無人值守自動化是否合規。量大或不合規時，改用組織 API key（[framework/08 §8.2](../framework/08_open_questions.md#82-實作待決) 第 2 項）。token 由使用者自己設定，不進 repo、log 或工作包。
- **timeout 預設**：工具節點（例如 bcgen）15 分鐘，AI 節點 60 分鐘，由串接層自己計時；專案設定的 `dispatch.timeout_minutes.<名稱>`（例如 `dispatch.timeout_minutes.bcgen`）可以覆寫。

## 另一條路：openBCT 的 AgentRuntime

openBCT 已經有 `openbct-agent`（`AgentRuntime`），透過 CCR 或其他 OpenAI 相容的 gateway 呼叫 openBCT 的 MCP tools，有 tool policy 與 session 管理。它可以當成另一種派工節點的執行介面，但和上面的 `claude -p` 是兩條不同的路（hook、設定檔隔離、權限詢問的機制都不一樣）。要不要用、用在哪些節點，展開時再決定。
