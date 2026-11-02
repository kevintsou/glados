# 同步到 Confluence

把這個 repo 在 HEAD 的文件同步到 Confluence 的 [GLADOS Spec 頁面樹](https://confluence2.phison.com:8443/pages/viewpage.action?pageId=1130727668)（IPFWI）。GitHub 是來源，Confluence 是閱讀版本；不要直接改 Confluence 上的規格頁，下次同步會被蓋掉。

## 需要什麼

- Python 3.11 以上，裝好 `markdown`、`beautifulsoup4`。
- Claude Code 已設定 `mcp-atlassian`（`~/.claude.json`）。腳本照同樣的設定啟動這個 server，用的是同一個 Confluence 登入，不另外讀 token。
- 要同步的內容已經 commit。頁面記的是 HEAD 的 commit，未提交的修改不會上去。

## 怎麼跑

```bash
python -I -X utf8 tools/confluence_sync/sync_spec.py build   # 讀 Confluence，產生計畫；不改任何頁面
python -I -X utf8 tools/confluence_sync/sync_spec.py push    # 照計畫更新；中途失敗就再跑一次，做過的會跳過
```

`build` 會印出從哪個 commit 同步到哪個 commit、要更新幾頁、新建幾頁。計畫和轉好的頁面放在暫存目錄的 `glados-confluence-sync/`（`--work` 可以改），`push` 前可以先打開 `out/*.xml` 看。`push` 時 HEAD 和 `build` 時不同就拒絕，要重跑 `build`。

## 做了什麼

- **每一份 `.md` 一頁**：從頁尾的「原始文件」找出每頁對應哪個檔案，整頁從 markdown 重新轉換。保留頁面開頭的上層連結、說明與子頁目錄，頁尾記 commit、檔案的 SHA-256 與 `Last synced`。
- **新檔案新建一頁**：`framework/` 放到「01 框架規格」，`notes/` 裡標題有「工作說明」的放「06.B」、其他放「06.A」，任務卡依編號放「07.BC／07.OBC／07.SK」，並補進該分類頁的子頁目錄。其他位置的新檔案只印警告，要自己決定放哪裡再加規則。
- **連結**：連到 repo 內 `.md` 的變成頁面連結（`#章節` 照 GitHub 的錨點），其他 repo 內檔案連到 GitHub 的同一個 commit，`../openBCT/...` 這類其他 repo 的檔案只寫路徑。流程圖引用「05 流程圖」頁的 PNG 附件。
- **根頁標題**跟著 README 的版本改名，例如「GLADOS Spec｜GitHub 完整版 v0.11.3」；`EXTRA_LINKERS` 列的頁面裡的舊標題一起換掉。
- **只更新有變的頁**：原始檔的 SHA-256 和頁尾記的一樣、子頁目錄沒變、根頁也沒改名的頁面跳過，所以頁尾的 commit 可能比根頁舊，內容仍和那個檔案相同。根頁每次都更新，它的 `Last synced` 就是這次同步到的 commit。要全部重做加 `--all`。
- **不重新轉換的頁**：流程圖頁、JSON Schema 頁與分類頁只換標題、commit、版本與日期。根頁底下沒有上層連結的手寫頁（例如「09 Agent 輸出控制」）不動。

## 還不會做的事

- **附件**：工具不能上傳附件。流程圖的 SVG 或 PNG 改了，要自己到「05 流程圖」頁換附件；根頁的原始快照 zip 停在 v0.10。
- **刪頁**：repo 刪掉的檔案，對應的頁面不會被刪，要自己處理。
