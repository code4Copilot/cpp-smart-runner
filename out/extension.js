"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const util_2 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let outputChannel;
function activate(context) {
    // 避免重複創建 outputChannel（測試環境可能多次啟動）
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('C/C++ Smart Runner');
    }
    // 註冊編譯命令
    let compileCommand = vscode.commands.registerCommand('cpp-smart-runner.compile', async () => {
        await compileCurrentFile();
    });
    // 註冊執行命令
    let runCommand = vscode.commands.registerCommand('cpp-smart-runner.run', async () => {
        await runCurrentFile();
    });
    // 註冊編譯並執行命令
    let compileAndRunCommand = vscode.commands.registerCommand('cpp-smart-runner.compileAndRun', async () => {
        const success = await compileCurrentFile();
        if (success) {
            await runCurrentFile(true);
        }
    });
    // 註冊手動轉換編碼命令（自動偵測）
    let convertToUtf8Command = vscode.commands.registerCommand('cpp-smart-runner.convertToUtf8', async () => {
        await handleEncodingConversion('utf8', 'auto');
    });
    // 註冊從特定編碼轉換的命令
    let convertFromBig5Command = vscode.commands.registerCommand('cpp-smart-runner.convertFromBig5', async () => {
        await handleEncodingConversion('utf8', 'big5');
    });
    let convertFromGbkCommand = vscode.commands.registerCommand('cpp-smart-runner.convertFromGbk', async () => {
        await handleEncodingConversion('utf8', 'gbk');
    });
    let convertToBig5Command = vscode.commands.registerCommand('cpp-smart-runner.convertToBig5', async () => {
        await handleEncodingConversion('big5', 'auto');
    });
    context.subscriptions.push(compileCommand, runCommand, compileAndRunCommand, convertToUtf8Command, convertFromBig5Command, convertFromGbkCommand, convertToBig5Command, outputChannel);
    outputChannel.appendLine('C/C++ Smart Runner 已啟動');
}
function getCommandVariables(sourceFile) {
    const ext = path.extname(sourceFile);
    const fileName = path.basename(sourceFile);
    const fileNameWithoutExt = path.basename(sourceFile, ext);
    const dir = path.dirname(sourceFile);
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || dir;
    return {
        fileName,
        fileNameWithoutExt,
        dir,
        fullFileName: sourceFile,
        workspaceFolder
    };
}
function replaceVariables(command, vars) {
    // 必須先替換較長的變數名稱,避免被較短的覆蓋
    return command
        .replace(/\$workspaceFolder/g, vars.workspaceFolder)
        .replace(/\$fullFileName/g, vars.fullFileName)
        .replace(/\$fileNameWithoutExt/g, vars.fileNameWithoutExt)
        .replace(/\$fileName/g, vars.fileName)
        .replace(/\$dir/g, vars.dir);
}
// ===== 改進的編碼檢測函數 =====
function isUtf8(buffer) {
    try {
        new util_2.TextDecoder('utf-8', { fatal: true }).decode(buffer);
        return true;
    }
    catch {
        return false;
    }
}
function detectEncoding(buffer) {
    // 檢查是否為 UTF-8
    if (isUtf8(buffer)) {
        return 'utf8';
    }
    // 檢查 UTF-8 BOM
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return 'utf8';
    }
    // 改進的 Big5 vs GBK 判斷邏輯
    let big5Score = 0;
    let gbkScore = 0;
    let big5SpecificScore = 0; // Big5 特有字節範圍
    for (let i = 0; i < Math.min(buffer.length - 1, 1000); i++) {
        const byte1 = buffer[i];
        const byte2 = buffer[i + 1];
        // Big5 特有範圍 (更嚴格的判斷)
        // Big5 第一字節: 0xA1-0xF9
        // Big5 第二字節: 0x40-0x7E 或 0x80-0xFE (但不是 0x7F)
        if (byte1 >= 0xA1 && byte1 <= 0xF9) {
            if ((byte2 >= 0x40 && byte2 <= 0x7E) || (byte2 >= 0x80 && byte2 <= 0xFE)) {
                big5Score++;
                // Big5 特有的第二字節範圍 (0x40-0x7E)，GBK 較少使用
                if (byte2 >= 0x40 && byte2 <= 0x7E && byte2 !== 0x7F) {
                    big5SpecificScore += 2; // 更高權重
                }
            }
        }
        // GBK 特有範圍
        // GBK 第一字節: 0x81-0xFE
        // GBK 第二字節: 0x40-0xFE
        // 但要排除 Big5 的高分區域
        if (byte1 >= 0x81 && byte1 <= 0xA0) { // 0x81-0xA0 是 GBK 特有，Big5 從 0xA1 開始
            if (byte2 >= 0x40 && byte2 <= 0xFE && byte2 !== 0x7F) {
                gbkScore += 2; // GBK 特有區域給更高分
            }
        }
        else if (byte1 >= 0xA1 && byte1 <= 0xFE && byte2 >= 0x40 && byte2 <= 0xFE) {
            gbkScore++; // 重疊區域只給基本分
        }
    }
    // 判斷邏輯：優先考慮特有特徵
    const totalBig5 = big5Score + big5SpecificScore;
    if (big5SpecificScore > 3 || (totalBig5 > gbkScore && big5Score > 3)) {
        return 'big5'; // 有 Big5 特徵或總分更高
    }
    else if (gbkScore > 5) {
        return 'gbk';
    }
    // 預設假設 Big5 (台灣常用)
    return 'big5';
}
function tryDecodeWithFallback(buffer) {
    const detectedEncoding = detectEncoding(buffer);
    if (detectedEncoding === 'utf8') {
        return { content: buffer.toString('utf8'), encoding: 'utf8' };
    }
    // 嘗試編碼列表
    const encodings = [detectedEncoding, 'big5', 'gbk', 'cp950'];
    for (const enc of encodings) {
        try {
            // 使用 iconv-lite 如果可用
            try {
                const iconv = require('iconv-lite');
                const content = iconv.decode(buffer, enc);
                // 驗證:檢查是否有過多的替換字元
                const replacementCount = (content.match(/�/g) || []).length;
                if (replacementCount < content.length * 0.05) { // 少於5%替換字元
                    return { content, encoding: enc };
                }
            }
            catch {
                // iconv-lite 不可用,使用內建 TextDecoder
                if (enc === 'big5' || enc === 'cp950') {
                    const content = new util_2.TextDecoder('big5').decode(buffer);
                    return { content, encoding: 'big5' };
                }
            }
        }
        catch (err) {
            continue;
        }
    }
    return null;
}
// ===== 編碼轉換核心邏輯 =====
async function handleEncodingConversion(target, sourceEncoding = 'auto') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('沒有開啟的檔案');
        return;
    }
    const document = editor.document;
    const filePath = document.fileName;
    if (!fs.existsSync(filePath)) {
        vscode.window.showErrorMessage('檔案不存在');
        return;
    }
    const buffer = fs.readFileSync(filePath);
    try {
        if (target === 'utf8') {
            // 偵測是否已經是 UTF-8
            const currentEncoding = detectEncoding(buffer);
            if (currentEncoding === 'utf8') {
                vscode.window.showInformationMessage('檔案已經是 UTF-8 編碼');
                return;
            }
            let decodedContent = null;
            let detectedEncoding = '';
            if (sourceEncoding === 'auto') {
                // 自動偵測
                const result = tryDecodeWithFallback(buffer);
                if (!result) {
                    vscode.window.showErrorMessage('❌ 無法偵測檔案編碼，請使用子選單選擇原始編碼');
                    return;
                }
                decodedContent = result.content;
                detectedEncoding = result.encoding;
            }
            else {
                // 使用指定的編碼
                try {
                    const iconv = require('iconv-lite');
                    decodedContent = iconv.decode(buffer, sourceEncoding);
                    detectedEncoding = sourceEncoding;
                }
                catch (requireError) {
                    vscode.window.showErrorMessage('未安裝 iconv-lite 套件，請執行: npm install iconv-lite');
                    return;
                }
            }
            // ✨ 在編輯器中替換內容（可撤銷）
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
            const success = await editor.edit(editBuilder => {
                editBuilder.replace(fullRange, decodedContent);
            });
            if (success) {
                vscode.window.showInformationMessage(`✅ 已成功轉換為 UTF-8 (原編碼: ${detectedEncoding.toUpperCase()}) | 可按 Ctrl+Z 撤銷`);
            }
            else {
                vscode.window.showErrorMessage('編碼轉換失敗：無法修改編輯器內容');
            }
        }
        else {
            // 轉換為 Big5
            // ✅ 檢查是否有未儲存的修改
            if (document.isDirty) {
                const action = await vscode.window.showWarningMessage('⚠️ 檔案有未儲存的修改，轉換為 Big5 前需要先儲存', '儲存並轉換', '取消');
                if (action !== '儲存並轉換') {
                    return;
                }
                await document.save();
            }
            // 📋 提示用戶這是單向操作
            const confirmAction = await vscode.window.showWarningMessage('⚠️ 轉換為 Big5 後，VS Code 將無法正確顯示此檔案。\n' +
                '檔案將被儲存為 ANSI Big5 編碼並關閉，請使用 Dev-C++ 等支援 Big5 的編輯器開啟。\n' +
                '若要在 VS Code 繼續編輯，請使用「轉換為 UTF-8」功能。', { modal: true }, '確定轉換', '取消');
            if (confirmAction !== '確定轉換') {
                return;
            }
            const content = document.getText();
            try {
                const iconv = require('iconv-lite');
                const big5Buffer = iconv.encode(content, 'big5');
                // 💾 直接寫入 Big5 編碼檔案（ANSI 格式）
                fs.writeFileSync(filePath, big5Buffer);
                // 🚪 關閉檔案（避免在 VS Code 中顯示為亂碼）
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                // ✅ 顯示成功訊息
                vscode.window.showInformationMessage('✅ 已成功轉換並儲存為 Big5 (ANSI) 編碼\n' +
                    '📝 請使用 Dev-C++ 或其他支援 Big5 的編輯器開啟\n' +
                    '💡 若要在 VS Code 繼續編輯，請重新開啟並使用「轉換為 UTF-8」功能');
            }
            catch (requireError) {
                vscode.window.showErrorMessage('未安裝 iconv-lite 套件，請執行: npm install iconv-lite');
            }
        }
    }
    catch (err) {
        vscode.window.showErrorMessage(`編碼轉換失敗: ${err.message}`);
    }
}
async function compileCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('沒有開啟的檔案');
        return false;
    }
    const document = editor.document;
    const languageId = document.languageId;
    if (languageId !== 'c' && languageId !== 'cpp') {
        vscode.window.showErrorMessage('目前檔案不是 C/C++ 程式');
        return false;
    }
    const config = vscode.workspace.getConfiguration('cpp-smart-runner');
    // 儲存檔案
    if (config.get('saveBeforeCompile', true) && document.isDirty) {
        await document.save();
    }
    const sourceFile = document.fileName;
    // 自動偵測並轉換為 UTF-8 (改進版)
    if (config.get('autoConvertEncoding', true)) {
        try {
            const buffer = fs.readFileSync(sourceFile);
            const currentEncoding = detectEncoding(buffer);
            if (currentEncoding !== 'utf8') {
                const result = tryDecodeWithFallback(buffer);
                if (result) {
                    // ✅ 使用 editor.edit() 使轉換可撤銷
                    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
                    const success = await editor.edit(editBuilder => {
                        editBuilder.replace(fullRange, result.content);
                    });
                    if (success) {
                        outputChannel.appendLine(`>>> 偵測到 ${result.encoding.toUpperCase()} 編碼,已自動轉換為 UTF-8`);
                        // 自動儲存轉換後的內容
                        await document.save();
                    }
                    else {
                        outputChannel.appendLine('>>> 編碼轉換失敗,使用原始編碼繼續編譯');
                    }
                }
                else {
                    outputChannel.appendLine('>>> 編碼偵測失敗,使用原始編碼繼續編譯');
                }
            }
        }
        catch (err) {
            // 編碼轉換失敗不影響編譯流程
            outputChannel.appendLine(`>>> 編碼處理失敗,使用原始編碼繼續編譯`);
        }
    }
    const vars = getCommandVariables(sourceFile);
    // 除錯輸出
    outputChannel.appendLine('==================== 變數除錯 ====================');
    outputChannel.appendLine(`fileName: ${vars.fileName}`);
    outputChannel.appendLine(`fileNameWithoutExt: ${vars.fileNameWithoutExt}`);
    outputChannel.appendLine(`dir: ${vars.dir}`);
    outputChannel.appendLine(`fullFileName: ${vars.fullFileName}`);
    outputChannel.appendLine('');
    let compileCommand;
    // 檢查是否使用自訂命令
    const customCommand = config.get('customCompileCommand', '');
    if (customCommand) {
        // 使用使用者自訂的編譯命令
        compileCommand = replaceVariables(customCommand, vars);
    }
    else {
        // 使用預設編譯命令(根據語言自動選擇編譯器)
        const isWindows = process.platform === 'win32';
        const compiler = languageId === 'cpp' ? 'g++' : 'gcc';
        const compilerFlags = config.get('compilerFlags', '');
        const outputExt = isWindows ? '.exe' : '';
        const outputFile = path.join(vars.dir, `${vars.fileNameWithoutExt}${outputExt}`);
        // 動態判斷語言標準
        const standardFlag = languageId === 'cpp' ? '-std=c++17' : '-std=c11';
        // 組合編譯命令
        let compileCmd = `${compiler} "${vars.fullFileName}" ${standardFlag}`;
        // 加入 UTF-8 編碼支援參數
        compileCmd += ' -finput-charset=utf-8 -fexec-charset=utf-8';
        if (compilerFlags) {
            compileCmd += ` ${compilerFlags}`;
        }
        compileCmd += ` -o "${outputFile}"`;
        // ⚠️ 移除 chcp 65001 (因為已統一使用 UTF-8)
        compileCommand = compileCmd;
    }
    outputChannel.clear();
    outputChannel.show(true);
    outputChannel.appendLine('==================== 編譯開始 ====================');
    outputChannel.appendLine(`原始檔: ${sourceFile}`);
    outputChannel.appendLine(`命令: ${compileCommand}`);
    outputChannel.appendLine('');
    try {
        const { stdout, stderr } = await execAsync(compileCommand, {
            encoding: 'utf8',
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
            // eslint-disable-next-line @typescript-eslint/naming-convention
            env: { ...process.env, LANG: 'en_US.UTF-8' } // 確保 UTF-8 環境
        });
        // 檢查是否有警告
        let hasWarnings = false;
        if (stderr) {
            outputChannel.appendLine(stderr);
            const lowerStderr = stderr.toLowerCase();
            hasWarnings = lowerStderr.includes('warning') && !lowerStderr.includes('error');
        }
        if (stdout) {
            outputChannel.appendLine(stdout);
        }
        outputChannel.appendLine('');
        if (hasWarnings) {
            const warningCount = (stderr.match(/warning:/gi) || []).length;
            outputChannel.appendLine(`==================== 編譯成功(有 ${warningCount} 個警告)====================`);
            vscode.window.showWarningMessage(`⚠️ 編譯成功,但有 ${warningCount} 個警告`);
        }
        else {
            outputChannel.appendLine('==================== 編譯成功 ====================');
            vscode.window.showInformationMessage('✅ 編譯成功');
        }
        return true;
    }
    catch (error) {
        outputChannel.appendLine('');
        outputChannel.appendLine('==================== 編譯失敗 ====================');
        outputChannel.appendLine(error.message);
        if (error.stderr) {
            outputChannel.appendLine(error.stderr);
        }
        vscode.window.showErrorMessage('❌ 編譯失敗,請檢查錯誤訊息');
        return false;
    }
}
async function runCurrentFile(skipTimeCheck = false) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('沒有開啟的檔案');
        return;
    }
    const document = editor.document;
    const languageId = document.languageId;
    if (languageId !== 'c' && languageId !== 'cpp') {
        vscode.window.showErrorMessage('目前檔案不是 C/C++ 程式');
        return;
    }
    const sourceFile = document.fileName;
    const config = vscode.workspace.getConfiguration('cpp-smart-runner');
    const vars = getCommandVariables(sourceFile);
    // 除錯輸出
    if (config.get('showExecutionMessage', true)) {
        outputChannel.appendLine('');
        outputChannel.appendLine('==================== 執行變數除錯 ====================');
        outputChannel.appendLine(`fileName: ${vars.fileName}`);
        outputChannel.appendLine(`fileNameWithoutExt: ${vars.fileNameWithoutExt}`);
        outputChannel.appendLine(`dir: ${vars.dir}`);
        outputChannel.appendLine('');
    }
    let execCommand;
    let outputFile;
    // 檢查是否使用自訂命令
    if (config.get('useCustomCommand', false)) {
        const customCommand = config.get('customRunCommand', '');
        if (!customCommand) {
            vscode.window.showErrorMessage('未設定自訂執行命令,請在設定中配置 cpp-smart-runner.customRunCommand');
            return;
        }
        execCommand = replaceVariables(customCommand, vars);
        // 嘗試從自訂命令中提取執行檔路徑(用於時間檢查)
        const match = execCommand.match(/"([^"]+)"|(\S+)/);
        outputFile = match ? (match[1] || match[2]) : getOutputPath(sourceFile, config);
    }
    else {
        outputFile = getOutputPath(sourceFile, config);
        const isWindows = process.platform === 'win32';
        execCommand = isWindows ? `"${outputFile}"` : `"${outputFile}"`;
    }
    // 檢查執行檔是否存在
    if (!fs.existsSync(outputFile)) {
        const choice = await vscode.window.showWarningMessage('執行檔不存在,是否先編譯?', '編譯並執行', '取消');
        if (choice === '編譯並執行') {
            const success = await compileCurrentFile();
            if (success) {
                await runCurrentFile(true);
            }
        }
        return;
    }
    // 檢查檔案時間戳記
    if (!skipTimeCheck) {
        const sourceStats = fs.statSync(sourceFile);
        const outputStats = fs.statSync(outputFile);
        if (outputStats.mtime < sourceStats.mtime) {
            const choice = await vscode.window.showWarningMessage('⚠️ 警告:執行檔比原始檔舊,可能執行的是舊版本!', '重新編譯並執行', '仍然執行', '取消');
            if (choice === '重新編譯並執行') {
                const success = await compileCurrentFile();
                if (success) {
                    await runCurrentFile(true);
                }
                return;
            }
            else if (choice === '取消') {
                return;
            }
        }
    }
    // 建立終端機並執行（使用使用者的預設終端機）
    const terminal = vscode.window.createTerminal({
        name: 'C/C++ Runner'
    });
    terminal.show();
    const isWindows = process.platform === 'win32';
    // 偵測終端機類型
    const shellPath = (vscode.env.shell || '').toLowerCase();
    const isPowerShell = shellPath.includes('powershell') || shellPath.includes('pwsh');
    if (config.get('clearTerminal', true)) {
        const clearCommand = isWindows ? 'cls' : 'clear';
        terminal.sendText(clearCommand, true);
    }
    // Windows 環境設定 UTF-8（根據終端機類型使用對應語法）
    if (isWindows) {
        if (isPowerShell) {
            // PowerShell 需要設定控制台和輸出編碼
            terminal.sendText('chcp 65001 2>&1 | Out-Null', true);
            terminal.sendText('[Console]::OutputEncoding = [System.Text.Encoding]::UTF8', true);
        }
        else {
            // CMD 只需要 chcp
            terminal.sendText('chcp 65001 >nul 2>&1', true);
        }
    }
    // 為 PowerShell 調整執行命令（添加 .\ 前綴）
    if (isWindows && isPowerShell && !config.get('useCustomCommand', false)) {
        // 檢查是否為絕對路徑
        const isAbsolutePath = path.isAbsolute(outputFile);
        if (isAbsolutePath) {
            // 絕對路徑：使用 & 運算符
            execCommand = `& "${outputFile}"`;
        }
        else {
            // 相對路徑：使用 .\
            const fileName = path.basename(outputFile);
            execCommand = `.\\${fileName}`;
        }
    }
    if (config.get('showExecutionMessage', true)) {
        outputChannel.appendLine('');
        outputChannel.appendLine('==================== 執行程式 ====================');
        outputChannel.appendLine(`終端機類型: ${isPowerShell ? 'PowerShell' : 'CMD'}`);
        outputChannel.appendLine(`執行命令: ${execCommand}`);
    }
    terminal.sendText(execCommand);
}
function getCompiler(languageId, config) {
    const customCompiler = config.get('compilerPath', '');
    if (customCompiler) {
        return customCompiler;
    }
    // 自動偵測編譯器
    return languageId === 'cpp' ? 'g++' : 'gcc';
}
function getOutputPath(sourceFile, config) {
    const outputDir = config.get('outputDir', '');
    const isWindows = process.platform === 'win32';
    const ext = isWindows ? '.exe' : '';
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    if (outputDir) {
        // 確保輸出目錄存在
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        return path.join(outputDir, baseName + ext);
    }
    else {
        // 與原始檔同目錄
        return path.join(path.dirname(sourceFile), baseName + ext);
    }
}
function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}
//# sourceMappingURL=extension.js.map