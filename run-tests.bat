@echo off
chcp 65001
echo ========================================
echo C/C++ Smart Runner - 執行測試
echo ========================================
echo.

echo [1/3] 安裝測試依賴...
call npm install
if errorlevel 1 (
    echo ❌ 依賴安裝失敗
    pause
    exit /b 1
)

echo.
echo [2/3] 編譯 TypeScript...
call npm run compile
if errorlevel 1 (
    echo ❌ 編譯失敗
    pause
    exit /b 1
)

echo.
echo [3/3] 執行測試...
call npm test
if errorlevel 1 (
    echo ❌ 測試失敗
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 所有測試通過！
echo ========================================
echo.
pause
