# GitHub Release 發布腳本

## 使用方式

```bash
# 賦予執行權限（首次）
chmod +x release.sh

# 執行發布
./release.sh 1.0.9 "修正 Big5/GBK 編碼偵測"
```

## 腳本內容

將以下內容儲存為 `release.sh`：

```bash
#!/bin/bash

# GitHub Release 自動發布腳本
# 使用方式: ./release.sh <版本號> <發布說明>
# 範例: ./release.sh 1.0.9 "修正 Big5/GBK 編碼偵測"

set -e  # 遇到錯誤立即停止

# 檢查參數
if [ $# -lt 1 ]; then
    echo "使用方式: $0 <版本號> [發布說明]"
    echo "範例: $0 1.0.9 \"修正 Big5/GBK 編碼偵測\""
    exit 1
fi

VERSION=$1
RELEASE_NOTES=${2:-"Release v$VERSION"}
TAG="v$VERSION"
EXTENSION_NAME="cpp-smart-runner"
VSIX_FILE="${EXTENSION_NAME}-${VERSION}.vsix"

echo "========================================="
echo "  準備發布版本: $VERSION"
echo "========================================="

# 1. 確認工作目錄乾淨
echo "📋 檢查 Git 狀態..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  警告: 工作目錄有未提交的變更"
    git status --short
    read -p "是否繼續? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. 編譯
echo ""
echo "🔨 編譯程式碼..."
npm run compile

# 3. 執行測試
echo ""
echo "🧪 執行測試..."
npm test

# 4. 打包擴充套件
echo ""
echo "📦 打包擴充套件..."
npx vsce package

# 檢查 .vsix 檔案是否存在
if [ ! -f "$VSIX_FILE" ]; then
    echo "❌ 錯誤: 找不到 $VSIX_FILE"
    exit 1
fi

echo "✅ 成功建立: $VSIX_FILE"

# 5. Git 提交和標記
echo ""
echo "📝 建立 Git tag..."
git tag -a "$TAG" -m "Release $VERSION: $RELEASE_NOTES"

# 6. 推送到 GitHub
echo ""
echo "⬆️  推送到 GitHub..."
git push origin main --tags

# 7. 建立 GitHub Release
echo ""
echo "🚀 建立 GitHub Release..."

# 檢查是否有發布說明檔案
RELEASE_FILE="RELEASE-${VERSION}.md"
if [ -f "$RELEASE_FILE" ]; then
    echo "使用發布說明檔案: $RELEASE_FILE"
    gh release create "$TAG" "$VSIX_FILE" \
        --title "v${VERSION}" \
        --notes-file "$RELEASE_FILE"
else
    echo "使用簡短發布說明"
    gh release create "$TAG" "$VSIX_FILE" \
        --title "v${VERSION}" \
        --notes "$RELEASE_NOTES"
fi

# 8. 完成
echo ""
echo "========================================="
echo "  ✅ 發布完成！"
echo "========================================="
echo ""
echo "📦 VSIX 檔案: $VSIX_FILE"
echo "🏷️  版本標籤: $TAG"
echo "🔗 GitHub Release: https://github.com/code4Copilot/cpp-smart-runner/releases/tag/$TAG"
echo ""
echo "使用者可以透過以下方式安裝："
echo "  code --install-extension $VSIX_FILE"
echo ""
```

---

## Windows PowerShell 版本

將以下內容儲存為 `release.ps1`：

```powershell
# GitHub Release 自動發布腳本 (PowerShell)
# 使用方式: .\release.ps1 -Version "1.0.9" -Notes "修正 Big5/GBK 編碼偵測"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$Notes = "Release v$Version"
)

$ErrorActionPreference = "Stop"

$Tag = "v$Version"
$ExtensionName = "cpp-smart-runner"
$VsixFile = "$ExtensionName-$Version.vsix"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  準備發布版本: $Version" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. 檢查 Git 狀態
Write-Host "`n📋 檢查 Git 狀態..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  警告: 工作目錄有未提交的變更" -ForegroundColor Yellow
    git status --short
    $continue = Read-Host "是否繼續? (y/N)"
    if ($continue -ne "y") {
        exit 1
    }
}

# 2. 編譯
Write-Host "`n🔨 編譯程式碼..." -ForegroundColor Yellow
npm run compile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 3. 執行測試
Write-Host "`n🧪 執行測試..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 4. 打包擴充套件
Write-Host "`n📦 打包擴充套件..." -ForegroundColor Yellow
npx vsce package
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 檢查 .vsix 檔案
if (-not (Test-Path $VsixFile)) {
    Write-Host "❌ 錯誤: 找不到 $VsixFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 成功建立: $VsixFile" -ForegroundColor Green

# 5. Git 標記
Write-Host "`n📝 建立 Git tag..." -ForegroundColor Yellow
git tag -a $Tag -m "Release $Version: $Notes"

# 6. 推送到 GitHub
Write-Host "`n⬆️  推送到 GitHub..." -ForegroundColor Yellow
git push origin main --tags

# 7. 建立 GitHub Release
Write-Host "`n🚀 建立 GitHub Release..." -ForegroundColor Yellow

$ReleaseFile = "RELEASE-$Version.md"
if (Test-Path $ReleaseFile) {
    Write-Host "使用發布說明檔案: $ReleaseFile" -ForegroundColor Cyan
    gh release create $Tag $VsixFile `
        --title "v$Version" `
        --notes-file $ReleaseFile
} else {
    Write-Host "使用簡短發布說明" -ForegroundColor Cyan
    gh release create $Tag $VsixFile `
        --title "v$Version" `
        --notes $Notes
}

# 8. 完成
Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "  ✅ 發布完成！" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📦 VSIX 檔案: $VsixFile" -ForegroundColor Cyan
Write-Host "🏷️  版本標籤: $Tag" -ForegroundColor Cyan
Write-Host "🔗 GitHub Release: https://github.com/code4Copilot/cpp-smart-runner/releases/tag/$Tag" -ForegroundColor Cyan
Write-Host ""
Write-Host "使用者可以透過以下方式安裝：" -ForegroundColor Yellow
Write-Host "  code --install-extension $VsixFile" -ForegroundColor White
Write-Host ""
```

## 使用說明

### Linux/Mac (Bash)

```bash
# 1. 建立腳本檔案
cat > release.sh << 'EOF'
# (貼上上面的 Bash 腳本內容)
EOF

# 2. 賦予執行權限
chmod +x release.sh

# 3. 執行發布
./release.sh 1.0.9 "修正 Big5/GBK 編碼偵測"
```

### Windows (PowerShell)

```powershell
# 1. 允許執行腳本（僅需一次）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 2. 執行發布
.\release.ps1 -Version "1.0.9" -Notes "修正 Big5/GBK 編碼偵測"
```

## 前置需求

確保已安裝：

```bash
# GitHub CLI
# Windows (winget)
winget install --id GitHub.cli

# Mac (Homebrew)
brew install gh

# Linux (Debian/Ubuntu)
sudo apt install gh

# 登入 GitHub
gh auth login
```

## 手動發布（不使用腳本）

如果不想使用自動化腳本，可以手動執行：

```bash
# 1. 編譯和測試
npm run compile && npm test

# 2. 打包
npx vsce package

# 3. 提交和標記
git add .
git commit -m "chore: release version 1.0.9"
git tag v1.0.9
git push origin main --tags

# 4. 建立 Release（上傳 .vsix）
gh release create v1.0.9 cpp-smart-runner-1.0.9.vsix \
  --title "v1.0.9 - 修正 Big5/GBK 編碼偵測" \
  --notes-file RELEASE-1.0.9.md

# 或透過瀏覽器：
# https://github.com/code4Copilot/cpp-smart-runner/releases/new
```

## 發布後驗證

1. 檢查 GitHub Release 頁面
2. 下載 .vsix 檔案測試
3. 安裝並驗證功能

```bash
# 下載並安裝
curl -LO https://github.com/code4Copilot/cpp-smart-runner/releases/download/v1.0.9/cpp-smart-runner-1.0.9.vsix
code --install-extension cpp-smart-runner-1.0.9.vsix
```

## 提供給使用者的安裝說明

在 README.md 中加入：

```markdown
## 安裝方式

### 從 GitHub Release 安裝

1. 前往 [Releases](https://github.com/code4Copilot/cpp-smart-runner/releases) 頁面
2. 下載最新的 `.vsix` 檔案
3. 在 VS Code 中執行：
   ```
   code --install-extension cpp-smart-runner-x.x.x.vsix
   ```
   或透過 GUI：Extensions → 三點選單 → Install from VSIX...

### 自動更新

當有新版本時，請重複上述步驟下載並安裝新版本。
```
