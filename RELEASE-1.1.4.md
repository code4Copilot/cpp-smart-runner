# C/C++ Smart Runner v1.1.4 Release Notes

**發佈日期：** 2026-01-30

## 🐛 Bug 修正

### 自訂命令回退邏輯修正
修正啟用自訂命令但未設定時會出現錯誤的問題，改善 Dev-C++ 用戶體驗。

**問題描述：**
- 當 `useCustomCommand` 設為 `true` 但 `customCompileCommand` 為空時會顯示錯誤
- 當 `useCustomCommand` 設為 `true` 但 `customRunCommand` 為空時會顯示錯誤
- 對新用戶不友善，特別是從 Dev-C++ 轉移過來的用戶

**解決方案：**
- ✅ 未設定自訂命令時靜默回退到預設命令
- ✅ 移除不必要的錯誤訊息
- ✅ 自訂命令設計為進階功能，不設定時自動使用預設的 gcc/g++ 編譯
- ✅ 保持所有預設值的完整功能

**影響範圍：**
- 編譯命令：啟用但未設定自訂編譯命令時，回退到 `gcc/g++ + 標準旗標 + 編譯器旗標`
- 執行命令：啟用但未設定自訂執行命令時，回退到 `.\filename.exe` 相對路徑格式

## 🧪 測試改進

新增 **Custom Command Fallback Test Suite** - 12 個新測試確保回退邏輯正確運作：

### 編譯命令測試
1. ✅ 未啟用自訂命令時使用預設命令
2. ✅ 啟用但未設定時回退到預設命令
3. ✅ 啟用且設定時使用自訂命令
4. ✅ 不同語言（C/C++）的回退處理

### 執行命令測試
5. ✅ 未啟用自訂命令時使用預設路徑格式
6. ✅ 啟用但未設定時回退到預設格式
7. ✅ 啟用且設定時使用自訂命令
8. ✅ 處理包含空格的檔案名稱

### 配置測試
9. ✅ `useCustomCommand` 預設為 false
10. ✅ `customCompileCommand` 可設為空字串
11. ✅ `customRunCommand` 可設為空字串
12. ✅ 回退時不會拋出錯誤

**總測試數量：** 138 個測試（全部通過 ✅）

## 📦 使用情境

### 情境 1：Dev-C++ 用戶（推薦）
不需要任何設定，直接使用：
```json
{
  "cpp-smart-runner.useCustomCommand": false  // 預設值
}
```
自動使用 `gcc/g++` 配合預設編譯旗標。

### 情境 2：啟用但未設定
即使不小心啟用了自訂命令：
```json
{
  "cpp-smart-runner.useCustomCommand": true,
  "cpp-smart-runner.customCompileCommand": "",  // 空值
  "cpp-smart-runner.customRunCommand": ""       // 空值
}
```
也會自動回退到預設命令，不會出錯。

### 情境 3：進階用戶（自訂命令）
需要完全控制編譯命令時：
```json
{
  "cpp-smart-runner.useCustomCommand": true,
  "cpp-smart-runner.customCompileCommand": "clang++ -std=c++17 -O3 \"$fullFileName\" -o \"$dir/$fileNameWithoutExt.exe\"",
  "cpp-smart-runner.customRunCommand": "\"$dir/$fileNameWithoutExt.exe\""
}
```

## 🔄 升級指南

從 v1.1.3 升級到 v1.1.4：
- ✅ 完全向下兼容，無需修改設定
- ✅ 如果之前因為空的自訂命令設定出錯，現在會自動修復
- ✅ 所有現有功能保持不變

## 🎯 設計理念

此版本的核心理念：
1. **預設即可用**：不設定任何自訂選項也能正常使用
2. **靜默回退**：缺少設定時不打擾用戶，自動使用合理預設值
3. **漸進增強**：需要進階功能時再設定，保持簡單性

## 📝 相關連結

- [完整更新日誌](CHANGELOG.md)
- [問題回報](https://github.com/code4Copilot/cpp-smart-runner/issues)
- [原始碼](https://github.com/code4Copilot/cpp-smart-runner)

## 💬 回饋

如有任何問題或建議，歡迎在 [GitHub Issues](https://github.com/code4Copilot/cpp-smart-runner/issues) 提出。
