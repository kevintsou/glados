# 跨 agent 共用待辦

此目錄接續 2026-10-12 對 GLADOS、openBCT、bcgen 與三個討論/spec skills 的盤點。待辦的共用來源在 GLADOS；skills 與 bcgen 程式仍在 bct_knowledge_base。此清單不修改 GLADOS 正式規格，也不替代 openBCT 的專案現況總表。

先讀 [總表](glados-openbct-todo.md)，再讀要認領的 tasks/ID.md。狀態、owner、相依、阻礙及證據只以該任務檔為準；總表只索引固定 ID 與標題，避免多個 agent 同時改一張狀態表。

## 接續方式

1. 讀總表基準，再查三個 repo 的最新 HEAD、git status/diff 及目標 repo 的 AGENTS.md。若其他 agent 已完成本項，先核對實作與證據，再更新狀態，不重做。
2. 打開任務檔，確認 owner 未認領。填可辨識的 agent/thread、claimed_at、branch/worktree、實際 owned_paths，將 status 改為 in_progress。再次讀取確認沒有衝突才開始。
3. 同一項只由一個 owner 更新；不同任務檔可分開更新。任務分開不代表程式檔分開：owned_paths 重疊時先記錄協調/切分，不撤銷他人修改。
4. 有意義的進度更新 updated_at、接續紀錄及 evidence。附 commit/diff、驗證命令/平台/結果；evidence 使用 repo 名稱開頭的相對路徑（例如 bct_knowledge_base/docs/skills/grill-spec-integration.md）或可查核的紀錄連結。缺什麼寫 blocker，不靠模型印象填完成。
5. 交接時記已做、未做、缺輸入與下一步；釋放 owner 前保留紀錄。done 只代表本項完成條件與必要驗證已滿足，不代表 G0/H1/H2/GC 核准或正式 GLADOS PASS。

狀態只有 todo、in_progress、blocked、in_review、done。相依未完成可先研究/設計，但不能假稱整合驗收完成；等待必要輸入時填阻礙。A/B/C 是本盤點工作排序，與 GLADOS 節點 P0/P1 代號不同。

認領欄位是 Git/文字協作規則，不是分散式鎖。同 checkout 的 agent 可立即看到檔案；不同 worktree/主機必須先同步包含本目錄與最新認領的共用 Git 版本。待辦與認領同步 GLADOS 的 Git；工具與 skills 版本另同步 bct_knowledge_base 的 Git。Git 衝突要合併，不得整檔覆蓋。同步/commit/push 依當次授權與 repo 規則；文件本身不授權外部發布或傳訊其他 agent。

## 給另一個 agent 的接續提示

> 先讀 glados/docs/coordination/README.md 和 glados-openbct-todo.md。查最新 repo 狀態，選擇並認領 tasks/ID.md，填 owner、owned_paths、branch/worktree。遵守目標 repo 的 AGENTS.md，不覆蓋其他 agent 修改；完成後附具體驗證與剩餘工作，更新同一任務檔。正式規格仍以 GLADOS 固定版本為準。

## 路徑與新任務

範例 checkout 是同一父資料夾下的 glados/、openBCT/、bct_knowledge_base/；跨 repo 連結按此配置，標籤也保留 repo 相對路徑。其他配置請依標籤解析實際 checkout，不把原 session 絕對路徑當必需環境。

新任務沿用 OBC-（openBCT 串接層）、BC-（bcgen）、SK-（共用 skills）的下一個未使用 ID，複製既有格式並加入總表。不重排既有 ID、不刪歷史；需求/驗收條件改動須記錄理由及來源版本。調整標題或優先序時同步總表；其餘進度只更新任務檔。
