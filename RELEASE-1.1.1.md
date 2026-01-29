# Release 1.1.1 - Bug Fixes & Improvements

**發布日期**: 2026-01-29

## 🐛 修正問題

### 1. Big5 轉換前檢查未儲存修改
**問題**: 轉換為 Big5 編碼時，沒有檢查檔案是否有未儲存的修改，直接覆蓋檔案會導致使用者編輯的內容丟失。

**修正**:
- 在轉換前檢查 `document.isDirty` 狀態
- 如果有未儲存修改，彈出警告視窗
- 使用者可以選擇「儲存並轉換」或「取消」
- 確保不會意外覆蓋未儲存的內容

**程式碼位置**: [extension.ts](src/extension.ts) 第 275-288 行

### 2. 自動編碼轉換改為可撤銷
**問題**: 自動編碼轉換直接寫入檔案（不可撤銷），與手動轉換的行為（可撤銷）不一致。

**修正**:
- 自動轉換改用 `editor.edit()` API
- 轉換後可以用 Ctrl+Z 撤銷
- 轉換完成後自動儲存
- 與手動轉換行為保持一致

**程式碼位置**: [extension.ts](src/extension.ts) 第 329-347 行

## ✨ 改進

### 測試資源管理優化
- 在所有測試套件添加 `teardown` 清理
- 防止 `outputChannel` 重複創建
- 減少測試環境的資源洩漏警告
- 測試通過率: **109/109** ✅

## 🧪 測試

### 新增測試
- ✅ Big5 轉換前未儲存修改檢查測試
- ✅ 自動編碼轉換可撤銷性測試

### 測試結果
```
109 passing (3s)
```

## 📦 升級指引

### 從 1.1.0 升級
此版本為 bug fix 版本，完全向後相容，可直接升級。

### 使用者影響
1. **Big5 轉換更安全**: 不會意外覆蓋未儲存的編輯
2. **行為更一致**: 自動轉換和手動轉換都可以撤銷
3. **體驗更好**: 減少資料丟失的風險

## 🔗 相關資源

- [完整更新日誌](CHANGELOG.md)
- [安裝指南](INSTALL.md)
- [使用說明](README.md)
- [問題回報](https://github.com/code4Copilot/cpp-smart-runner/issues)

## 🙏 致謝

感謝所有使用者的回饋和建議，幫助我們不斷改進這個擴充套件。

---

**下載連結**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=hueyanchen.cpp-smart-runner)
