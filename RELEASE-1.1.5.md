# C/C++ Smart Runner v1.1.5 發布說明

**發布日期**: 2026-01-30

## 🐛 Bug 修復

### 終端機重用機制
解決多次執行累積終端機視窗的問題，改善資源管理和使用者體驗。

**問題描述**：
- 每次執行程式都會創建新的終端機視窗
- 多次編譯和執行後會累積大量終端機分頁
- 造成視窗混亂和資源浪費

**解決方案**：
- ✅ 實作終端機重用邏輯
- ✅ 多次執行使用同一個「C/C++ Runner」終端機
- ✅ 自動偵測終端機是否關閉，需要時重新創建
- ✅ 在擴充套件停用時正確清理終端機資源
- ✅ 保持終端機清空功能（可配置）

**技術細節**：
```typescript
// 新增全域終端機變數追蹤
let runnerTerminal: vscode.Terminal | undefined;

// 檢查並重用終端機
if (!runnerTerminal || runnerTerminal.exitStatus !== undefined) {
    runnerTerminal = vscode.window.createTerminal({
        name: 'C/C++ Runner'
    });
}
```

## 🧪 測試覆蓋

新增 **8 個終端機管理測試**，確保重用機制正確運作：

1. ✅ 第一次執行時創建終端機
2. ✅ 第二次執行時重用終端機
3. ✅ 終端機關閉後重新創建
4. ✅ 多次編譯並執行重用同一終端機
5. ✅ 純編譯命令不創建終端機
6. ✅ 清空終端機內容後重用
7. ✅ 尊重 clearTerminal 配置設定
8. ✅ 配置測試確保設定正確

**測試檔案**: `src/test/suite/terminal.test.ts`

**總測試數量**: 146 個測試（全部通過 ✅）

## 📦 安裝和升級

### 從 VS Code Marketplace 安裝
```
ext install hueyanchen.cpp-smart-runner
```

### 從現有版本升級
VS Code 會自動提示更新，或手動執行：
1. 開啟擴充套件面板 (Ctrl+Shift+X)
2. 搜尋 "C/C++ Smart Runner"
3. 點擊「更新」按鈕

## 🔄 相容性

- ✅ **向後相容**: 完全相容 v1.1.4 和更早版本
- ✅ **無需配置變更**: 現有配置無需修改
- ✅ **無破壞性變更**: 所有現有功能正常運作

## 🎯 影響範圍

此修復影響：
- ✅ `cpp-smart-runner.run` 命令
- ✅ `cpp-smart-runner.compileAndRun` 命令
- ✅ 終端機資源管理
- ✅ 擴充套件生命週期管理

不影響：
- ⚪ 編譯功能（僅使用 outputChannel）
- ⚪ 編碼轉換功能
- ⚪ 配置設定

## 📝 使用體驗改善

**之前的體驗**：
```
執行 3 次程式 → 創建 3 個終端機分頁
終端機列表：
  - C/C++ Runner
  - C/C++ Runner
  - C/C++ Runner
```

**現在的體驗**：
```
執行 N 次程式 → 始終只有 1 個終端機分頁
終端機列表：
  - C/C++ Runner  ← 重複使用，內容自動清空
```

## 🙏 致謝

感謝用戶回報終端機累積的問題，幫助我們改進擴充套件的使用體驗。

## 📚 相關文件

- [完整變更日誌](CHANGELOG.md)
- [使用說明](README.md)
- [問題回報](https://github.com/code4Copilot/cpp-smart-runner/issues)

---

**完整變更**: [v1.1.4...v1.1.5](https://github.com/code4Copilot/cpp-smart-runner/compare/v1.1.4...v1.1.5)
