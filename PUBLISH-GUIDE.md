# VS Code 擴充套件發布流程

## 🎯 推薦方案：GitHub Release（簡單快速）

### 為什麼選擇 GitHub Release？

✅ **優點**：
- 不需要 Azure DevOps 帳號
- 不需要建立 Publisher
- 不需要管理 Personal Access Token
- 流程簡單，類似 npm publish
- 使用者可以直接下載 .vsix 安裝
- 完整的版本控制和發布歷史

❌ **缺點**：
- 不會出現在 VS Code Marketplace（搜尋不到）
- 使用者需要手動下載並安裝
- 沒有自動更新通知

### GitHub Release 快速流程

```bash
# 1. 編譯和測試
npm run compile
npm test

# 2. 打包擴充套件
npx vsce package

# 3. 提交並推送到 GitHub
git add .
git commit -m "chore: release version 1.0.9"
git tag v1.0.9
git push origin main --tags

# 4. 在 GitHub 上建立 Release（或使用 GitHub CLI）
gh release create v1.0.9 cpp-smart-runner-1.0.9.vsix \
  --title "v1.0.9 - 修正 Big5/GBK 編碼偵測" \
  --notes-file RELEASE-1.0.9.md
```

### 使用者安裝方式

```bash
# 方法 1：從 GitHub Release 下載 .vsix
# 然後在 VS Code 中執行
code --install-extension cpp-smart-runner-1.0.9.vsix

# 方法 2：VS Code GUI
# Extensions → 三點選單 → Install from VSIX...
```

---

## 📋 發布前準備清單

### 1. 版本檢查
- [ ] 版本號已更新（package.json）
- [ ] CHANGELOG.md 已更新
- [ ] README.md 已更新
- [ ] 所有測試通過
- [ ] 程式碼已編譯無錯誤

### 2. 必要資訊
- [ ] 擴充套件名稱和描述
- [ ] 發行者 ID (publisher)
- [ ] 圖示檔案（可選，建議 128x128）
- [ ] LICENSE 檔案
- [ ] README.md（至少包含基本說明）

### 3. Git 提交
- [ ] 所有變更已提交
- [ ] 已標記版本標籤

## 🔧 發布流程

### 步驟 1：安裝 vsce 工具

```bash
npm install -g @vscode/vsce
```

驗證安裝：
```bash
vsce --version
```

### 步驟 2：建立 Azure DevOps 帳號

1. 前往 [Azure DevOps](https://dev.azure.com/)
2. 使用 Microsoft 帳號登入
3. 建立組織（如果還沒有）

### 步驟 3：建立 Personal Access Token (PAT)

1. 點擊右上角的使用者圖示
2. 選擇 **Security** → **Personal access tokens**
3. 點擊 **+ New Token**
4. 設定 Token：
   - **Name**: 給 Token 一個名稱（如：vscode-publish）
   - **Organization**: 選擇你的組織（或 All accessible organizations）
   - **Expiration**: 設定到期日（建議 90 天或自訂）
   - **Scopes**: 選擇 **Custom defined**
   - 在 **Marketplace** 下勾選：
     - ✅ **Manage** (完整權限)
     - 或至少 ✅ **Acquire** 和 ✅ **Publish**
5. 點擊 **Create**
6. **⚠️ 重要**：複製並儲存 Token（只會顯示一次！）

### 步驟 4：建立發行者 (Publisher)

#### 方法一：透過網頁建立

1. 前往 [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. 使用剛才的 Microsoft 帳號登入
3. 點擊 **+ New Publisher**
4. 填寫資訊：
   - **ID**: 發行者 ID（如：hueyanchen）
   - **Name**: 顯示名稱
   - **Email**: 聯絡信箱
5. 點擊 **Create**

#### 方法二：透過 vsce 建立

```bash
vsce create-publisher <your-publisher-id>
```

### 步驟 5：登入 vsce

```bash
vsce login <your-publisher-id>
```

系統會要求輸入 Personal Access Token，貼上剛才建立的 Token。

成功後會顯示：
```
Personal Access Token for publisher '<your-publisher-id>': ****
The Personal Access Token verification succeeded for the publisher '<your-publisher-id>'.
```

### 步驟 6：打包擴充套件（可選）

在發布前可以先打包測試：

```bash
vsce package
```

這會產生 `.vsix` 檔案，例如：`cpp-smart-runner-1.0.9.vsix`

#### 本地測試 .vsix 檔案

```bash
code --install-extension cpp-smart-runner-1.0.9.vsix
```

### 步驟 7：發布到市場

```bash
vsce publish
```

或指定版本號：
```bash
vsce publish 1.0.9
```

或自動遞增版本：
```bash
vsce publish patch   # 1.0.9 → 1.0.10
vsce publish minor   # 1.0.9 → 1.1.0
vsce publish major   # 1.0.9 → 2.0.0
```

### 步驟 8：驗證發布

1. 前往 [VS Code Marketplace](https://marketplace.visualstudio.com/)
2. 搜尋你的擴充套件
3. 或直接訪問：`https://marketplace.visualstudio.com/items?itemName=<publisher>.<extension-name>`

⏰ **注意**：發布後可能需要幾分鐘才會在市場上顯示。

## 🔄 更新現有擴充套件

### GitHub Release 方式（推薦）

```bash
# 1. 更新版本號和文件
# 編輯 package.json, CHANGELOG.md, README.md

# 2. 編譯和測試
npm run compile
npm test

# 3. 打包
npx vsce package

# 4. Git 提交和標記
git add .
git commit -m "chore: release version 1.0.9"
git tag v1.0.9
git push origin main --tags

# 5. 建立 GitHub Release
gh release create v1.0.9 cpp-smart-runner-1.0.9.vsix \
  --title "v1.0.9 - 修正 Big5/GBK 編碼偵測" \
  --notes "$(cat RELEASE-1.0.9.md)"
```

### VS Code Marketplace 方式（完整但複雜）

```bash
# 1. 更新版本號和文件
# 2. 編譯程式碼
npm run compile

# 3. 執行測試
npm test

# 4. Git 提交
git add .
git commit -m "chore: release version 1.0.9"
git tag v1.0.9
git push origin main --tags

# 5. 發布
vsce publish
```

### 快速發布（自動遞增版本）

```bash
vsce publish patch -m "修正 Big5 編碼偵測問題"
```

## 📦 打包選項

### 包含/排除檔案

在 `package.json` 中設定：

```json
{
  "files": [
    "out/**",
    "src/**",
    "LICENSE.md",
    "README.md",
    "CHANGELOG.md"
  ],
  "ignore": [
    "**/*.ts",
    "**/*.map",
    ".vscode/**",
    ".vscode-test/**",
    "src/test/**",
    "node_modules/**"
  ]
}
```

或使用 `.vscodeignore` 檔案（類似 `.gitignore`）。

### 查看打包內容

```bash
vsce ls
```

## 🚫 常見問題與解決

### 問題 1：找不到 README.md

**錯誤**：
```
ERROR  Make sure to edit the README.md file before you package or publish your extension.
```

**解決**：確保 README.md 不是預設範本內容，至少包含 50 個字元的實際說明。

### 問題 2：未設定 repository

**警告**：
```
WARN   A 'repository' field is missing from the 'package.json'
```

**解決**：在 package.json 中加入：
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/your-repo.git"
  }
}
```

### 問題 3：未設定 license

**警告**：
```
WARN   A 'license' field is missing from the 'package.json'
```

**解決**：在 package.json 中加入：
```json
{
  "license": "MIT"
}
```

### 問題 4：Token 無效

**錯誤**：
```
ERROR  Failed request: Unauthorized(401)
```

**解決**：
1. 重新建立 Personal Access Token
2. 確保 Token 有正確的 Marketplace 權限
3. 重新登入：`vsce login <publisher-id>`

### 問題 5：Publisher 不存在

**錯誤**：
```
ERROR  Publisher '<publisher-id>' doesn't exist.
```

**解決**：
1. 前往 [Marketplace Publisher Management](https://marketplace.visualstudio.com/manage) 建立 Publisher
2. 或使用 `vsce create-publisher <publisher-id>`

## 🎯 本專案發布步驟

### 針對 cpp-smart-runner 1.0.9

```bash
# 1. 確認所有變更已提交
git status

# 2. 提交並標記版本
git add .
git commit -m "chore: release version 1.0.9 - 修正 Big5/GBK 編碼偵測"
git tag v1.0.9

# 3. 編譯
npm run compile

# 4. 測試
npm test

# 5. 登入 vsce（第一次需要）
vsce login hueyanchen

# 6. 發布
vsce publish

# 7. 推送到 GitHub
git push origin main --tags
```

### 驗證發布

訪問：[https://marketplace.visualstudio.com/items?itemName=hueyanchen.cpp-smart-runner](https://marketplace.visualstudio.com/items?itemName=hueyanchen.cpp-smart-runner)

## 📊 發布後管理

### 查看統計資料

1. 前往 [Publisher Management](https://marketplace.visualstudio.com/manage/publishers/hueyanchen)
2. 查看下載數、評分、評論等

### 更新擴充套件資訊

1. 更新 `package.json` 中的 `description`、`keywords` 等
2. 更新 `README.md`
3. 重新發布

### 取消發布（撤回）

```bash
vsce unpublish <publisher>.<extension-name>
```

⚠️ **警告**：這會完全移除擴充套件，使用者將無法下載。

## 🔐 安全最佳實踐

1. **不要將 PAT 提交到 Git**
   - 將 Token 儲存在安全的地方（如密碼管理器）
   - 不要寫入程式碼或設定檔

2. **定期更新 Token**
   - 設定合理的到期時間
   - 到期前更新 Token

3. **使用最小權限**
   - Token 只給予必要的 Marketplace 權限

4. **備份 Token**
   - Token 只顯示一次，務必儲存
   - 如遺失需重新建立

## 📚 參考資源

- [官方文件：Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce 工具文件](https://github.com/microsoft/vscode-vsce)
- [Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
- [Azure DevOps](https://dev.azure.com/)

## ✅ 發布檢查清單（快速版）

```
□ 版本號已更新
□ 文件已更新（CHANGELOG、README）
□ 測試通過
□ 程式碼已編譯
□ Git 已提交並標記
□ vsce 已安裝
□ PAT 已建立
□ Publisher 已建立
□ 已登入 vsce
□ 執行 vsce publish
□ 驗證市場上的擴充套件
```

---

**提示**：第一次發布需要完成所有步驟，之後更新只需執行步驟 6-7。
