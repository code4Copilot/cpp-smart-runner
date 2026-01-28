# 版本 1.0.8 更新完成

## ✅ 更新摘要

**發布日期**：2026-01-28  
**版本號**：1.0.8  
**測試狀態**：98/98 通過 ✅

## 🎯 核心改進

### 動態語言標準判斷
- **C 檔案**：自動使用 `gcc` + `-std=c11`
- **C++ 檔案**：自動使用 `g++` + `-std=c++17`
- **通用參數**：`compilerFlags` 改為 `-Wall -O2`（可自訂）

### 編譯命令範例

#### C 檔案
```bash
gcc "test.c" -std=c11 -finput-charset=utf-8 -fexec-charset=utf-8 -Wall -O2 -o "test.exe"
```

#### C++ 檔案
```bash
g++ "test.cpp" -std=c++17 -finput-charset=utf-8 -fexec-charset=utf-8 -Wall -O2 -o "test.exe"
```

## 📋 已更新檔案

### 核心檔案
- ✅ `package.json` - 版本號 1.0.8，compilerFlags 預設值更新
- ✅ `src/extension.ts` - 動態語言標準判斷實作
- ✅ `src/test/suite/extension.test.ts` - 新增 10 個編譯器參數測試

### 文件檔案
- ✅ `README.md` - 版本徽章、功能說明、設定範例
- ✅ `CHANGELOG.md` - 1.0.8 版本變更記錄
- ✅ `RELEASE-1.0.8.md` - 詳細發布說明
- ✅ `VERSION-1.0.8-CHECKLIST.md` - 更新檢查清單

## 🧪 測試結果

```
98 passing (653ms)
```

### 新增測試（Compiler Flags Test Suite）
1. ✅ Should use correct standard flag for C files
2. ✅ Should use correct standard flag for C++ files
3. ✅ Should use correct compiler for C files
4. ✅ Should use correct compiler for C++ files
5. ✅ Should build correct compile command for C files
6. ✅ Should build correct compile command for C++ files
7. ✅ Should maintain correct flag order in compile command
8. ✅ Should get default compilerFlags from configuration
9. ✅ Should handle custom compilerFlags
10. ✅ Should handle empty compilerFlags

## 💡 使用建議

### 推薦配置（預設即可）
```json
{
  "cpp-smart-runner.compilerFlags": "-Wall -O2"
}
```
語言標準會自動判斷，無需手動設定。

### 自訂通用參數
```json
{
  "cpp-smart-runner.compilerFlags": "-Wall -Wextra -O2 -g"
}
```

### 自訂語言標準（進階）
```json
{
  "cpp-smart-runner.customCompileCommand": "gcc \"$fullFileName\" -std=c17 -finput-charset=utf-8 -fexec-charset=utf-8 -Wall -O2 -o \"$dir/$fileNameWithoutExt.exe\""
}
```

## 📦 下一步：發布

### 選項 1：本地測試
```bash
# 打包為 .vsix 檔案
npx vsce package
```

### 選項 2：發布到市場
```bash
# 登入並發布
npx vsce publish
```

### 選項 3：Git 提交
```bash
git add .
git commit -m "chore: release version 1.0.8"
git tag v1.0.8
git push origin main --tags
```

## 📚 參考文件

- [CHANGELOG.md](CHANGELOG.md) - 完整變更歷史
- [README.md](README.md) - 使用說明
- [RELEASE-1.0.8.md](RELEASE-1.0.8.md) - 發布詳情
- [VERSION-1.0.8-CHECKLIST.md](VERSION-1.0.8-CHECKLIST.md) - 完整檢查清單

---

**狀態**：✅ 準備就緒，可以發布！
