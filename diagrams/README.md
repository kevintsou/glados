# 流程圖

這個資料夾放 GLADOS 文件裡的所有流程圖。

- `*.svg`：產生出來的圖，文件直接引用。**不要直接改。**
- `src/*.mjs`：每張圖的圖源，是一份節點與連線的文字清單。要改圖就改這裡。
- `build.mjs`：把圖源排版（[ELK](https://eclipse.dev/elk/) 自動排版）並畫成 SVG。

## 重新產生

需要 Node.js 18 以上。

```bash
cd diagrams
npm install          # 第一次才需要，只會裝 elkjs
node build.mjs       # 產生全部
node build.mjs glados_module_flow   # 只產生某一張（用圖源裡的 id）
```

## 圖源怎麼寫

```js
export default {
  id: "glados_module_flow",          // 輸出檔名
  title: "模組流程",                  // 圖上的標題
  subtitle: "一句話說明",
  direction: "DOWN",                 // DOWN（由上往下）或 RIGHT（由左往右）
  nodes: [
    { id: "M1", tag: "M1", title: "需求釐清", sub: "寫成有編號的 spec 條目" },
    { id: "H1", kind: "gate", title: "H1 需求核准" },
  ],
  edges: [
    ["M1", "H1"],                              // 正常往下走
    ["M5", "R", "case FAIL", "back"],          // 失敗或退回（紅色虛線）
  ],
};
```

| 節點 `kind` | 畫成 | 用在 |
| :---- | :---- | :---- |
| 不寫（`step`） | 藍色卡片，可加 `tag` 代號標籤 | 節點 |
| `gate` | 橘色六角形 | 人工關卡 |
| `human` | 橘色卡片 | 需要人處理（交給人） |
| `rule` | 紫色卡片 | 串接層的判斷或動作 |
| `decision` | 紫色圓角卡片 | 串接層的是非判斷 |
| `record` | 綠色圓柱 | 紀錄 |
| `ext` | 灰色圓角卡片 | 圖外的節點或起點 |
| `wait` | 灰色虛線卡片 | 等待 |
| `state` | 藍色卡片 | 狀態 |

| 連線樣式（第 4 欄） | 畫成 | 用在 |
| :---- | :---- | :---- |
| 不寫（`normal`） | 灰色實線 | 正常往下走 |
| `back` | 紅色虛線 | 失敗或退回 |
| `wait` | 灰色點線 | 等待或補充 |
| `strong` | 深色粗線 | 唯一寫入 |

**排版小技巧**：節點的順序就是主流程的順序；和節點順序相反的連線，會被當成「往回走」繞到旁邊。
