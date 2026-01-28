# 版本 1.1.0 摘要

**發布日期**：2026-01-28  
**版本類型**：次要版本（Minor Release）  
**主要變更**：編碼轉換功能大幅改進

## 🎯 核心改進

### 1. ✨ 在編輯器中轉換（可撤銷）

**問題**：
- 之前的編碼轉換直接覆寫檔案
- 轉換錯誤無法回復
- 使用者無法預覽轉換結果

**解決方案**：
- 使用 `editor.edit()` API 修改編輯器內容
- 不立即寫入檔案，只修改編輯器顯示
- 使用者可以用 **Ctrl+Z** 撤銷
- 按 **Ctrl+S** 才真正儲存

**技術實作**：
```typescript
const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length)
);

await editor.edit(editBuilder => {
    editBuilder.replace(fullRange, decodedContent!);
});
```

### 2. 📁 子選單讓使用者選擇原始編碼

**問題**：
- 自動偵測有時會錯誤（Big5 被誤判為 GBK）
- 使用者無法指定原始編碼
- 偵測失敗只能放棄

**解決方案**：
- 新增右鍵子選單「轉換編碼」
- 提供 4 個選項：
  1. **轉換為 UTF-8 (自動偵測)** - 原有功能
  2. **從 Big5 轉換為 UTF-8** - 明確指定 Big5
  3. **從 GBK 轉換為 UTF-8** - 明確指定 GBK
  4. **轉換為 Big5 編碼** - 轉換為 Dev-C++ 相容格式

**技術實作**：
```typescript
// 函數簽名更新
async function handleEncodingConversion(
    target: 'utf8' | 'big5', 
    sourceEncoding: 'auto' | 'big5' | 'gbk' = 'auto'
)

// package.json 子選單配置
{
  "submenus": [
    {
      "id": "cpp-smart-runner.encodingMenu",
      "label": "轉換編碼",
      "icon": "$(symbol-text)"
    }
  ]
}
```

## 📊 測試覆蓋

### 新增測試檔案
- **src/test/suite/encodingConversion.test.ts** - 10 個新測試

### 測試項目
1. ✅ 所有命令正確註冊
2. ✅ 編輯器中轉換不寫入檔案
3. ✅ 撤銷功能正常運作
4. ✅ Big5 指定編碼轉換
5. ✅ GBK 指定編碼轉換
6. ✅ 沒有開啟檔案時錯誤處理
7. ✅ UTF-8 檔案正確識別
8. ✅ package.json 子選單配置
9. ✅ package.json 命令定義
10. ✅ 子選單結構驗證

### 測試統計
- **新增測試**：10 個
- **現有測試**：98 個
- **總測試數量**：108 個
- **通過率**：預期 100%

## 📝 文件更新

### 新增文件
- [ENCODING-CONVERSION-IMPROVEMENTS.md](ENCODING-CONVERSION-IMPROVEMENTS.md)
  - 詳細說明改進內容
  - 技術實作細節
  - 使用範例

### 更新文件
- [README.md](README.md)
  - 版本資訊更新為 1.1.0
  - 新增子選單使用說明
  - 新增使用場景範例
  - 更新功能特色列表

- [CHANGELOG.md](CHANGELOG.md)
  - 新增 1.1.0 版本記錄
  - 詳細列出所有變更
  - 分類：新增功能、改進、測試、技術細節、文件

- [package.json](package.json)
  - 版本號更新為 1.1.0
  - 新增 3 個命令定義
  - 新增子選單配置

## 🔧 技術變更

### 修改的檔案

#### 1. src/extension.ts
```typescript
// 新增命令註冊
let convertFromBig5Command = vscode.commands.registerCommand(...)
let convertFromGbkCommand = vscode.commands.registerCommand(...)

// 函數簽名更新
async function handleEncodingConversion(
    target: 'utf8' | 'big5', 
    sourceEncoding: 'auto' | 'big5' | 'gbk' = 'auto'
)

// 改用編輯器修改
await editor.edit(editBuilder => {
    editBuilder.replace(fullRange, decodedContent!);
});
```

#### 2. package.json
```json
{
  "version": "1.1.0",
  "contributes": {
    "commands": [
      // 新增 3 個命令
      "cpp-smart-runner.convertFromBig5",
      "cpp-smart-runner.convertFromGbk"
    ],
    "submenus": [
      // 新增子選單定義
      {
        "id": "cpp-smart-runner.encodingMenu",
        "label": "轉換編碼"
      }
    ],
    "menus": {
      "editor/context": [
        // 改為子選單
        {
          "submenu": "cpp-smart-runner.encodingMenu"
        }
      ],
      "cpp-smart-runner.encodingMenu": [
        // 4 個子選單項目
      ]
    }
  }
}
```

## 🎯 使用者體驗改進

### 改進前
```
❌ 右鍵 → 轉換為 UTF-8 編碼
   - 直接覆寫檔案
   - 轉換錯誤無法回復
   - 無法選擇原始編碼
```

### 改進後
```
✅ 右鍵 → 轉換編碼（子選單）
   ├─ 轉換為 UTF-8 (自動偵測)
   ├─ 從 Big5 轉換為 UTF-8
   ├─ 從 GBK 轉換為 UTF-8
   └─ 轉換為 Big5 編碼
   
   - 在編輯器中轉換
   - 可按 Ctrl+Z 撤銷
   - 可選擇原始編碼
   - 轉換後按 Ctrl+S 儲存
```

## 💡 使用場景

### 場景 1：從 Dev-C++ 匯入程式
```
1. 開啟 .c 檔案（中文亂碼）
2. 右鍵 → 轉換編碼 → 從 Big5 轉換為 UTF-8
3. 檢查中文顯示
4. 如果錯誤，按 Ctrl+Z 撤銷，改選 GBK
5. 確認無誤後按 Ctrl+S 儲存
```

### 場景 2：不確定編碼的檔案
```
1. 右鍵 → 轉換編碼 → 轉換為 UTF-8 (自動偵測)
2. 檢查結果
3. 如果錯誤，按 Ctrl+Z 撤銷
4. 改用子選單指定編碼
```

### 場景 3：匯出到 Dev-C++
```
1. 編輯完成
2. 右鍵 → 轉換編碼 → 轉換為 Big5 編碼
3. 檔案自動儲存
4. 在 Dev-C++ 中開啟
```

## 🚀 升級指南

### 從 1.0.9 升級到 1.1.0

1. **更新擴充功能**
   ```bash
   # 重新編譯
   npm run compile
   
   # 執行測試
   npm test
   
   # 打包 VSIX
   vsce package
   ```

2. **使用者體驗變更**
   - 原有的「轉換為 UTF-8 編碼」命令移到子選單
   - 現在從右鍵選單選擇「轉換編碼」展開子選單
   - 轉換後可以用 Ctrl+Z 撤銷

3. **相容性**
   - ✅ 完全向下相容
   - ✅ 命令 ID 保持不變
   - ✅ 現有功能不受影響
   - ✅ 設定檔案不需更改

## 📦 發布檢查清單

- [x] 版本號更新為 1.1.0
- [x] 新增單元測試（10 個測試）
- [x] 更新 README.md
- [x] 更新 CHANGELOG.md
- [x] 新增 ENCODING-CONVERSION-IMPROVEMENTS.md
- [x] 新增 VERSION-1.1.0-SUMMARY.md
- [x] 程式碼編譯通過
- [ ] 執行所有測試並通過
- [ ] 手動測試所有功能
- [ ] 打包 VSIX
- [ ] 發布到 Marketplace

## 🔗 相關連結

- [CHANGELOG.md](CHANGELOG.md) - 完整變更記錄
- [README.md](README.md) - 使用者文件
- [ENCODING-CONVERSION-IMPROVEMENTS.md](ENCODING-CONVERSION-IMPROVEMENTS.md) - 技術文件
- [src/test/suite/encodingConversion.test.ts](src/test/suite/encodingConversion.test.ts) - 測試檔案

## 🎉 總結

版本 1.1.0 大幅改進了編碼轉換功能：
- ✅ **更安全**：可撤銷的轉換
- ✅ **更靈活**：可選擇原始編碼
- ✅ **更直觀**：子選單清楚列出選項
- ✅ **更可靠**：新增 10 個測試確保品質

這是一個重要的功能改進版本，顯著提升了使用者體驗和資料安全性！
