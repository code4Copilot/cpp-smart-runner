# 編碼轉換功能改進

## 版本：1.0.10（開發中）

## 改進內容

### 1. ✨ 在編輯器中轉換（可撤銷）

**問題**：之前的轉換方式直接覆寫檔案，如果轉換錯誤無法回復。

**解決方案**：
- 轉換為 UTF-8 時，改為在編輯器中修改內容，不立即寫入檔案
- 使用者可以用 **Ctrl+Z** 撤銷轉換
- 只有在儲存檔案時才真正寫入磁碟
- 提供更安全的轉換體驗

```typescript
// 新的實作方式
const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length)
);

await editor.edit(editBuilder => {
    editBuilder.replace(fullRange, decodedContent!);
});
```

### 2. 📁 子選單支援

**問題**：自動偵測有時會錯誤，需要讓使用者手動選擇原始編碼。

**解決方案**：
- 新增右鍵選單子選單：**「轉換編碼」**
- 子選單包含以下選項：
  - **轉換為 UTF-8 (自動偵測)** - 原有的自動偵測功能
  - **從 Big5 轉換為 UTF-8** - 明確指定原始編碼為 Big5
  - **從 GBK 轉換為 UTF-8** - 明確指定原始編碼為 GBK
  - **轉換為 Big5 編碼** - 轉換為 Dev-C++ 相容的 Big5

### 3. 函數簽名更新

```typescript
// 舊版本
async function handleEncodingConversion(target: 'utf8' | 'big5')

// 新版本
async function handleEncodingConversion(
    target: 'utf8' | 'big5', 
    sourceEncoding: 'auto' | 'big5' | 'gbk' = 'auto'
)
```

## 使用方式

### 方法一：右鍵選單（推薦）

1. 在 C/C++ 檔案中點擊右鍵
2. 選擇「轉換編碼」子選單
3. 選擇適合的轉換選項

### 方法二：命令面板

按 `F1` 或 `Ctrl+Shift+P`，輸入：
- `轉換為 UTF-8 (自動偵測)`
- `從 Big5 轉換為 UTF-8`
- `從 GBK 轉換為 UTF-8`
- `轉換為 Big5 編碼`

## 轉換流程

### UTF-8 轉換（新版本）

```
1. 讀取檔案內容到 Buffer
2. 根據 sourceEncoding 參數：
   - auto：自動偵測編碼
   - big5/gbk：使用指定編碼解碼
3. 在編輯器中替換內容（不寫入檔案）
4. 顯示成功訊息，提示可用 Ctrl+Z 撤銷
5. 使用者可以：
   - 按 Ctrl+Z 撤銷
   - 按 Ctrl+S 儲存
```

### Big5 轉換

```
1. 讀取編輯器內容
2. 編碼為 Big5
3. 寫入檔案（因為 VS Code 無法直接顯示 Big5）
4. 重新載入檔案
```

## 註解說明

```typescript
// ✨ 在編輯器中替換內容（可撤銷）
const success = await editor.edit(editBuilder => {
    editBuilder.replace(fullRange, decodedContent!);
});

if (success) {
    vscode.window.showInformationMessage(
        `✅ 已成功轉換為 UTF-8 (原編碼: ${detectedEncoding.toUpperCase()}) | 可按 Ctrl+Z 撤銷`
    );
}
```

## 為什麼 Big5 轉換仍需寫入檔案？

VS Code 的編輯器本質上是 UTF-8 的，無法直接顯示 Big5 編碼的文字。因此轉換為 Big5 時：
1. 必須寫入檔案
2. 使用 `workbench.action.files.revert` 重新載入
3. 讓系統以正確的編碼讀取檔案

## 錯誤處理

- 如果自動偵測失敗，會提示使用子選單選擇原始編碼
- 如果 iconv-lite 未安裝，會顯示安裝提示
- 如果編輯器修改失敗，會顯示錯誤訊息

## package.json 配置

```json
{
  "submenus": [
    {
      "id": "cpp-smart-runner.encodingMenu",
      "label": "轉換編碼",
      "icon": "$(symbol-text)"
    }
  ],
  "menus": {
    "editor/context": [
      {
        "when": "resourceLangId == c || resourceLangId == cpp",
        "submenu": "cpp-smart-runner.encodingMenu",
        "group": "navigation@93"
      }
    ],
    "cpp-smart-runner.encodingMenu": [
      {
        "command": "cpp-smart-runner.convertToUtf8",
        "group": "1_utf8@1"
      },
      {
        "command": "cpp-smart-runner.convertFromBig5",
        "group": "1_utf8@2"
      },
      {
        "command": "cpp-smart-runner.convertFromGbk",
        "group": "1_utf8@3"
      },
      {
        "command": "cpp-smart-runner.convertToBig5",
        "group": "2_other@1"
      }
    ]
  }
}
```

## 測試建議

1. **測試自動偵測**：
   - 開啟 Big5 檔案
   - 右鍵 → 轉換編碼 → 轉換為 UTF-8 (自動偵測)
   - 按 Ctrl+Z 測試撤銷功能

2. **測試指定編碼**：
   - 開啟 Big5/GBK 檔案
   - 右鍵 → 轉換編碼 → 從 Big5/GBK 轉換為 UTF-8
   - 確認中文正確顯示

3. **測試 Big5 轉換**：
   - 開啟 UTF-8 檔案
   - 右鍵 → 轉換編碼 → 轉換為 Big5 編碼
   - 用 Dev-C++ 開啟確認相容性

## 優勢

✅ **可撤銷**：轉換錯誤可以立即用 Ctrl+Z 復原  
✅ **更安全**：不立即覆寫檔案，給使用者預覽機會  
✅ **更靈活**：可以手動選擇原始編碼，避免偵測錯誤  
✅ **更直觀**：子選單清楚列出所有選項  

## 相關檔案

- [extension.ts](src/extension.ts) - 主要實作
- [package.json](package.json) - 命令與選單配置
