@echo off
chcp 65001
echo ========================================
echo 安裝測試框架依賴
echo ========================================
echo.

echo 正在安裝測試相關套件...
echo.

call npm install --save-dev @types/mocha@^10.0.6
call npm install --save-dev @types/glob@^8.1.0
call npm install --save-dev @vscode/test-electron@^2.3.9
call npm install --save-dev mocha@^10.3.0
call npm install --save-dev glob@^10.3.10

echo.
echo ========================================
echo ✅ 測試依賴安裝完成！
echo ========================================
echo.
echo 現在可以執行測試了：
echo   npm test
echo.
echo 或執行：
echo   run-tests.bat
echo.
pause
