# AI 的工作怎麼執行與收件

> **這份文件回答**：AI 的工作實際上怎麼用 Claude Code（或 Codex 等）完成、怎麼交給串接層收件。屬於實作。框架只要求兩件事：兩種執行方式（[framework/04 §4.2](../framework/04_rules.md#42-兩種執行方式)），以及「只認證據」（[framework/05 §5.1](../framework/05_checks.md#51-只認證據)）。換成 Codex、Agent SDK 或人來執行都可以。
>
> v0.10（2026-10-20，依使用者決定）起，**串接層不派工給 AI**：AI 的工作一律由人開 agent 照 skill 執行，串接層只開工與收件。理由與取捨見 [v0.10 提案](../notes/v0.10_human_triggered_ai_proposal.md)。

---

## 各步驟的執行方式

| 執行方式 | 步驟 |
| :---- | :---- |
| 外部互動：討論 | P0、P2、M1、C、P7 |
| 外部互動：AI 照 skill 完成，有 3 輪上限 | M4 的規劃與實作、P1 的移植、M2 的寫 case |
| 外部互動：審查，一定是另一次開工 | M2 的測試審查、M6、P1 的移植審查、P5 的安全審查 |
| 工具步驟：串接層執行，不用 LLM | P1 的起點檢查、機械替換、量基線；M2 的判別能力；M4 的正式 build；M5、P4、P5 的測試執行 |
| 人 | G0、GB、G1、H、G3、GC、P6 |

---

## 外部互動：開工與收件

串接層不啟動 agent，也不參與中間過程。

1. **開工**：串接層開執行編號，準備工作區（有禁看 branch 的專案，工作區只含允許的 branch 與快照），寫出工作包 `.glados/projects/<專案編號>/runs/<執行編號>/workpackage.md`（[framework/03 §3.5](../framework/03_artifacts.md#35-工作包)）。工作包寫明：
   - 建議的 skill。
   - 目前第幾輪、前幾輪的失敗證據。
   - 能不能和其他模組平行。
   - 提交通過後會自動接續哪些工具步驟。
2. **人開 agent**：在工作區用終端機、desktop app、VS Code 或 Codex 開 agent，叫它先讀工作包、照建議的 skill 做。例如：
   - P0 用 bct-p0。
   - M1 用 bct-grill-me 與 bct-to-spec。
   - M4、P1 移植、審查用對應的 skill（共用待辦 SK-008 起）。
3. **提交**：人在 openBCT 按「提交」，或由人或 agent 執行提交指令（`POST /projects/<key>/nodes/<node>/submit`）。串接層記下當下的 commit，跑收件檢查與擋關檢查，結果寫成證據紀錄；沒過就列出缺什麼。提交只觸發檢查，不是核准；核准只能由人在服務跳出的系統確認框完成（[gate_signoff.md](gate_signoff.md)）。
4. **等外部回覆**：要等客戶、SOC、HW 回答的問題，登記成待確認事項，節點轉為「等外部回覆」。
   - 專案設定「寫進 Jira」允許時，由工具寫進 Jira。
   - 不允許時（例如 E39），由人轉問，答案記回待確認事項清單。
   - 答案回來後開新 session 從檔案接續，不靠舊對話。
5. **接續的工具步驟**：提交通過後，串接層照專案設定自動接續工具步驟，例如 M4 之後的正式 build 與 M5。工具步驟沒過時，照節點卡回到對應的外部互動步驟，並計入它的輪數。

互動式 session 不能用 Stop hook 強制交出產出：每回一次話就會觸發一次，會讓 AI 不把發言權交回給人。收尾由人或 agent 提交。

---

## 做 AI 工作的 skill 要守的規則

做 AI 工作的 skill，不論是實作、移植、測試實作還是審查，都要做到：

1. **先讀工作包**：照固定的輸入工作；只讀工作包列的來源；不讀禁看的 branch。
2. **只寫可寫範圍**：範圍照節點卡和工作包，不改測試或驗收合約（實作）、不碰生成區（移植）。提交時的「只寫在允許範圍內」會擋，但 skill 不能靠它來兜底。
3. **最多 3 輪**：在同一次執行裡自己做「改 → 自己 build／檢查 → 修」，從工作包的輪數接著算。第 3 輪還沒過就停下來，寫交接說明（每一輪失敗在哪、證據、目前卡住的原因），標「交給人」，不再自己硬修。
4. **自己 build 的結果只供參考**：放行看的是串接層執行的正式 build 與測試（[framework/05 §5.1](../framework/05_checks.md#51-只認證據)），session 裡的 build log 可以寫進交接說明。
5. **審查要記下自己是誰**：交接說明開頭的 `key: value` 區塊（[framework/03 §3.4](../framework/03_artifacts.md#34-交接說明)）寫 `session`、`model`，審查另寫 `reviewed_run`（被審的那次執行編號）。實作類的步驟也要寫 `session`、`model`，審查才核對得到。每項發現寫成審查發現（`glados.finding/v2`），阻擋與否照類型（[framework/04 §4.8](../framework/04_rules.md#48-審查放行)），不能自己改。
6. **寫交接說明，然後提交**：交接說明要寫第幾輪、做了什麼、還沒解決的問題、給下一站的話，寫完由 agent 或人提交。
7. **不碰簽核**：不載入簽核 skill，也不執行簽核指令。

---

## 無人值守的平行

| 做法 | 怎麼做 | 注意 |
| :---- | :---- | :---- |
| 下班前由人觸發 | 依工作包的「能不能平行」，每個可以平行的模組各開一個 agent session（例如各自一個 worktree），叫它讀工作包做完並提交 | 權限模式要選不會停下來問的（例如 auto），安全靠工作區隔離與提交時的範圍檢查；電腦不能睡（keep-awake）；多個 session 一起跑，額度用得快 |
| 工具步驟自動接續 | 提交通過後，串接層自動跑正式 build、M5 等 | 不用 AI，也不牽涉帳號合規；設備被占用時交給人 |
| 定時任務 | 額度恢復後，叫停下的 session 接續；早上彙整各模組的結果 | **用定時任務直接開新的工作，等於無人值守的自動化**，用企業席位做這件事要先向管理員確認合規（[framework/08 §8.2](../framework/08_open_questions.md#82-實作待決) 第 2 項） |

---

## 決定

**2026-10-20，依使用者決定**（v0.10 之前做的決定，已依 v0.10 修正）：

- **帳號**：AI 的工作由人在自己的 agent 裡執行，屬於一般的互動使用。只有「用定時任務直接開新的工作」才要先確認合規，量大或不合規時改用組織 API key。token 由使用者自己設定，不進 repo、log 或工作包。
- **執行方式**：串接層不派工給 AI（v0.10）。原本選的 `claude -p` 只留給以後的批次模式（下一節），目前不使用。
- **timeout**：工具步驟（例如 bcgen）預設 15 分鐘，由串接層自己計時；專案設定的 `dispatch.timeout_minutes.<名稱>`（例如 `dispatch.timeout_minutes.bcgen`）可以覆寫。原本的「AI 節點 60 分鐘」不再適用。

---

## 以後的批次模式（v0.10 暫不使用）

如果以後需要串接層自己啟動 AI，例如沒有人觸發也要跑的大量重跑，可以用 `claude -p`。openBCT 已經做好這部分（共用待辦 OBC-015 的 A 批，openBCT `fcebef0`）：命令組裝、啟動前驗證設定檔、結果判讀。但它目前沒有接線。

```bash
claude -p "執行節點 M4（模組 lcp）：讀工作包，照實作 skill 完成，寫出交接說明" \
  --model opus --effort high \
  --append-system-prompt-file nodes/M4/card.md \
  --setting-sources project --settings nodes/M4/settings.json \
  --mcp-config nodes/M4/mcp.json --strict-mcp-config \
  --permission-mode dontAsk \
  --session-id <uuid> --output-format json
```

（參數已在 Claude Code 2.1.187 的 `claude --help` 確認。）

| 設定 | 對應參數 |
| :---- | :---- |
| 角色與規則 | `--append-system-prompt-file`（或用 `--system-prompt` 整個替換） |
| 模型 | `--model`、`--effort` |
| 權限、hook | `--settings` 指向節點專屬設定；`--setting-sources project` 避免個人設定混進來 |
| 可用工具 | `--tools`、`--allowedTools`、`--disallowedTools` |
| 可用 MCP | `--mcp-config` 加上 `--strict-mcp-config` |
| 沒人在旁時的權限詢問 | `--permission-mode dontAsk`：沒有事先允許的動作直接拒絕 |
| 追蹤編號 | `--session-id`，由串接層產生 |

要注意的事：

- **判讀結果**：看 exit code 與 JSON 的 `is_error`。實測沒登入時 `subtype` 仍然是 `success`，但 `is_error: true`、exit 1，所以不能只看 `subtype`。`permission_denials` 會列出被擋下的動作。
- **設定檔**：`-p` 模式下設定檔格式錯誤會被**默默忽略**，hook 也跟著消失。啟動前必須自己驗證。
- **不要用 `--bare`**：那個模式只接受 API key。隔離改用 `--setting-sources` 和 `--strict-mcp-config`。
- **帳號與合規**：這就是無人值守的自動化，要先向管理員確認合規，必要時改用組織 API key。
- **簽核**：節點的設定一律不載入簽核 skill，也不允許執行簽核指令。
- **另一條路**：openBCT 的 `openbct-agent`（`AgentRuntime`）透過 CCR 或其他 OpenAI 相容的 gateway 呼叫 openBCT 的 MCP tools，有 tool policy 與 session 管理，也可以當批次模式的執行介面。它和 `claude -p` 的 hook、設定檔隔離、權限詢問機制都不一樣，真的需要時再決定。
