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
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
npm run compile
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ 編譯失敗" -ForegroundColor Red
    exit $LASTEXITCODE 
}

# 3. 執行測試
Write-Host "`n🧪 執行測試..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ 測試失敗" -ForegroundColor Red
    exit $LASTEXITCODE 
}

# 4. 打包擴充套件
Write-Host "`n📦 打包擴充套件..." -ForegroundColor Yellow
npx vsce package
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ 打包失敗" -ForegroundColor Red
    exit $LASTEXITCODE 
}

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

# 檢查是否安裝 gh CLI
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghInstalled) {
    Write-Host "❌ 錯誤: 未安裝 GitHub CLI (gh)" -ForegroundColor Red
    Write-Host "請執行: winget install --id GitHub.cli" -ForegroundColor Yellow
    Write-Host "或手動建立 Release: https://github.com/code4Copilot/cpp-smart-runner/releases/new" -ForegroundColor Yellow
    exit 1
}

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

if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ 建立 Release 失敗" -ForegroundColor Red
    Write-Host "請手動建立: https://github.com/code4Copilot/cpp-smart-runner/releases/new" -ForegroundColor Yellow
    exit $LASTEXITCODE 
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
