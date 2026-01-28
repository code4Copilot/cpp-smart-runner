@echo off
chcp 65001
echo ========================================
echo 建立 VS Code 擴充套件 VSIX 檔案
echo ========================================
echo.

echo [1/4] 檢查 vsce 是否已安裝...
where vsce >nul 2>&1
if errorlevel 1 (
    echo ⚠️  vsce 未安裝，正在安裝...
    call npm install -g @vscode/vsce
    if errorlevel 1 (
        echo ❌ vsce 安裝失敗
        pause
        exit /b 1
    )
    echo ✅ vsce 安裝完成
) else (
    echo ✅ vsce 已安裝
)

echo.
echo [2/4] 編譯 TypeScript...
call npm run compile
if errorlevel 1 (
    echo ❌ 編譯失敗
    pause
    exit /b 1
)

echo.
echo [3/4] 執行測試...
call npm test
if errorlevel 1 (
    echo ⚠️  測試失敗，是否繼續打包？ (Y/N)
    set /p continue=
    if /i not "%continue%"=="Y" (
        echo 取消打包
        pause
        exit /b 1
    )
)

echo.
echo [4/4] 打包擴充套件...
call vsce package
if errorlevel 1 (
    echo ❌ 打包失敗
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ VSIX 檔案建立成功！
echo ========================================
echo.
echo 檔案位置：
for %%f in (*.vsix) do (
    echo   %%~nxf
)
echo.
echo 安裝方式：
echo   1. 在 VS Code 中按 Ctrl+Shift+P
echo   2. 輸入 "Extensions: Install from VSIX..."
echo   3. 選擇上述 .vsix 檔案
echo.
echo 或使用命令列：
echo   code --install-extension cpp-smart-runner-1.0.6.vsix
echo.
pause
