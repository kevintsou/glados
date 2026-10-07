# GLADOS

bootcode FW 開發流程平台，目前為 v0.6 討論稿。此 repo 保存平台規格與串接層服務設計。

- [完整平台 spec](GLADOS_platform_spec.md)：通用流程、關卡、產出物、版本同步，以及 E39 驗收專案。
- [串接層服務實作設計](GLADOS_impl_service.md)：獨立背景程式、openBCT 的 GLADOS 分頁、啟動與停止連動、持久化及 openBCT 元件銜接。
- [Mermaid 圖源](diagrams/)：專案流程、模組流程、追溯鏈、S 版本守門、服務架構與服務生命週期。

文件直接內嵌 Mermaid，GitHub 可呈現流程圖；同名 `.mmd` 是可編輯圖源，修改時請一併更新文件內的圖。

本次版本納入：開啟 GLADOS 分頁時連線或啟動服務、關閉 openBCT 不停止服務、使用者可獨立停止，以及一般停止／立即停止與重啟核對規則。待決事項仍依各文件列出的內容繼續討論。
