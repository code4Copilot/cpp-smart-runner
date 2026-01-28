@echo off
chcp 65001
echo ========================================
echo C/C++ Smart Runner - 編碼功能測試
echo ========================================
echo.

echo [1/3] 檢查 Node.js 環境...
node --version
if errorlevel 1 (
    echo ❌ Node.js 未安裝
    pause
    exit /b 1
)

echo [2/3] 安裝依賴套件...
call npm install
if errorlevel 1 (
    echo ❌ 依賴安裝失敗
    pause
    exit /b 1
)

echo [3/3] 編譯 TypeScript...
call npm run compile
if errorlevel 1 (
    echo ❌ 編譯失敗
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 所有步驟完成！
echo ========================================
echo.
echo 接下來請：
echo 1. 在 VS Code 中按 F5 啟動擴充套件
echo 2. 開啟一個 C/C++ 檔案
echo 3. 右鍵查看是否有「轉換編碼」選項
echo.
pause
