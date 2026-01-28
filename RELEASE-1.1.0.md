# Release 1.1.0 - 編碼轉換功能大幅改進

**發布日期**：2026-01-28  
**版本類型**：次要版本更新（Minor Release）

## 🎯 重點功能

### 1. ✨ 可撤銷的編碼轉換

轉換為 UTF-8 時，不再直接覆寫檔案，而是在編輯器中修改內容：
- 🔄 **可撤銷**：按 **Ctrl+Z** 立即恢復
- 💾 **手動儲存**：只有按 **Ctrl+S** 才真正寫入
- 🛡️ **更安全**：避免轉換錯誤造成的資料損失

### 2. 📁 子選單讓您選擇原始編碼

新增「轉換編碼」子選單，提供 4 種轉換選項：
- **轉換為 UTF-8 (自動偵測)** - 智慧偵測原始編碼
- **從 Big5 轉換為 UTF-8** - 明確指定 Big5 編碼
- **從 GBK 轉換為 UTF-8** - 明確指定 GBK 編碼
- **轉換為 Big5 編碼** - 轉為 Dev-C++ 相容格式

## 📸 功能展示

### 使用子選單轉換
```
右鍵選單
├─ 編譯 C/C++ 程式
├─ 執行 C/C++ 程式
├─ 編譯並執行 C/C++ 程式
└─ 轉換編碼 ▶
   ├─ 轉換為 UTF-8 (自動偵測)
   ├─ 從 Big5 轉換為 UTF-8
   ├─ 從 GBK 轉換為 UTF-8
   └─ 轉換為 Big5 編碼
```

### 安全的轉換流程
```
1. 選擇轉換選項
2. 編輯器內容立即更新
3. 檢查中文顯示
4. 如果錯誤 → 按 Ctrl+Z 撤銷
5. 如果正確 → 按 Ctrl+S 儲存
```

## 🆕 新增內容

### 命令
- `cpp-smart-runner.convertFromBig5` - 從 Big5 轉換為 UTF-8
- `cpp-smart-runner.convertFromGbk` - 從 GBK 轉換為 UTF-8

### 介面
- 右鍵選單子選單「轉換編碼」
- 4 個轉換選項清楚列出

### 訊息提示
- 成功訊息包含「可按 Ctrl+Z 撤銷」提示
- 偵測失敗時建議使用子選單

## 🔧 技術改進

### 核心函數更新
```typescript
// 舊版本
async function handleEncodingConversion(target: 'utf8' | 'big5')

// 新版本
async function handleEncodingConversion(
    target: 'utf8' | 'big5', 
    sourceEncoding: 'auto' | 'big5' | 'gbk' = 'auto'
)
```

### 編輯器修改而非檔案寫入
```typescript
// 使用編輯器 API 修改內容
const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length)
);

await editor.edit(editBuilder => {
    editBuilder.replace(fullRange, decodedContent!);
});
```

## 🧪 測試

- **新增測試**：10 個編碼轉換功能測試
- **總測試數**：107 個測試
- **通過率**：100% ✅

測試涵蓋：
- 命令註冊驗證
- 編輯器修改測試
- 撤銷功能測試
- Big5/GBK 指定編碼轉換
- 錯誤處理測試
- package.json 配置驗證

## 📚 文件

### 新增
- [ENCODING-CONVERSION-IMPROVEMENTS.md](ENCODING-CONVERSION-IMPROVEMENTS.md) - 技術文件
- [VERSION-1.1.0-SUMMARY.md](VERSION-1.1.0-SUMMARY.md) - 版本摘要

### 更新
- [README.md](README.md) - 使用者指南
- [CHANGELOG.md](CHANGELOG.md) - 變更記錄

## 📦 安裝

### 從 Marketplace 安裝
```
1. 開啟 VS Code
2. 按 Ctrl+Shift+X 開啟擴充功能
3. 搜尋 "C/C++ Smart Runner"
4. 點擊「更新」
```

### 從 VSIX 安裝
```bash
code --install-extension cpp-smart-runner-1.1.0.vsix
```

## 🚀 使用範例

### 範例 1：從 Dev-C++ 匯入程式

```c
// 開啟這個檔案時中文是亂碼
#include <stdio.h>

int main() {
    printf("螎謇�"); // �Y�X
    return 0;
}
```

**步驟**：
1. 右鍵 → 轉換編碼 → 從 Big5 轉換為 UTF-8
2. 中文立即正確顯示
3. 按 Ctrl+S 儲存

### 範例 2：自動偵測編碼

```c
// 不確定是什麼編碼的檔案
#include <stdio.h>

int main() {
    printf("???"); // 亂碼
    return 0;
}
```

**步驟**：
1. 右鍵 → 轉換編碼 → 轉換為 UTF-8 (自動偵測)
2. 如果顯示錯誤，按 Ctrl+Z
3. 改用「從 Big5 轉換」或「從 GBK 轉換」
4. 找到正確編碼後按 Ctrl+S 儲存

### 範例 3：匯出到 Dev-C++

```c
// VS Code 中編輯的 UTF-8 檔案
#include <stdio.h>

int main() {
    printf("你好世界\n");
    return 0;
}
```

**步驟**：
1. 右鍵 → 轉換編碼 → 轉換為 Big5 編碼
2. 檔案自動儲存
3. 在 Dev-C++ 中開啟，中文正確顯示

## 🎯 使用場景

| 場景 | 推薦選項 | 說明 |
|------|---------|------|
| 從 Dev-C++ 匯入 | 從 Big5 轉換 | 台灣常用的 Dev-C++ 使用 Big5 |
| 從中國大陸程式 | 從 GBK 轉換 | 簡體中文系統常用 GBK |
| 不確定編碼 | 自動偵測 | 先試自動，失敗再手動選擇 |
| 匯出到 Dev-C++ | 轉為 Big5 | 確保 Dev-C++ 正確顯示 |

## ⚠️ 注意事項

### 轉換為 UTF-8
- ✅ 在編輯器中修改，可撤銷
- ✅ 按 Ctrl+Z 立即恢復
- ✅ 按 Ctrl+S 才儲存

### 轉換為 Big5
- ⚠️ 直接寫入檔案並重新載入
- ⚠️ 無法撤銷（但檔案內容仍在磁碟）
- ℹ️ 因為 VS Code 無法直接顯示 Big5

## 🔄 從 1.0.9 升級

### 相容性
- ✅ **完全相容**：所有現有功能正常運作
- ✅ **命令不變**：原有命令 ID 保持一致
- ✅ **設定不變**：不需修改設定檔案

### 變更
- 介面變更：轉換命令移到子選單
- 行為變更：轉換 UTF-8 時不立即寫入檔案

### 建議
1. 更新後先測試轉換功能
2. 體驗新的撤銷功能
3. 嘗試使用子選單選擇編碼

## 🐛 已知問題

無已知重大問題。

## 🔮 未來計畫

- 支援更多編碼格式（如 Shift-JIS、EUC-KR 等）
- 批次轉換多個檔案
- 編碼偵測信心度顯示
- 轉換預覽視窗

## 📞 回饋與支援

- 🐛 **回報問題**：[GitHub Issues](https://github.com/code4Copilot/cpp-smart-runner/issues)
- 💡 **功能建議**：[GitHub Discussions](https://github.com/code4Copilot/cpp-smart-runner/discussions)
- ⭐ **給予星星**：[GitHub Repository](https://github.com/code4Copilot/cpp-smart-runner)

## 👏 感謝

感謝所有使用者的回饋和建議，讓這個擴充功能持續改進！

---

**完整變更記錄**：[CHANGELOG.md](CHANGELOG.md)  
**技術文件**：[ENCODING-CONVERSION-IMPROVEMENTS.md](ENCODING-CONVERSION-IMPROVEMENTS.md)  
**版本摘要**：[VERSION-1.1.0-SUMMARY.md](VERSION-1.1.0-SUMMARY.md)
