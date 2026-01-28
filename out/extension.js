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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let outputChannel;
function activate(context) {
    outputChannel = vscode.window.createOutputChannel('C/C++ Smart Runner');
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
    context.subscriptions.push(compileCommand, runCommand, compileAndRunCommand, outputChannel);
    outputChannel.appendLine('C/C++ Smart Runner 已啟動');
}
exports.activate = activate;
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
    // 必須先替換較長的變數名稱，避免被較短的覆蓋
    return command
        .replace(/\$workspaceFolder/g, vars.workspaceFolder)
        .replace(/\$fullFileName/g, vars.fullFileName)
        .replace(/\$fileNameWithoutExt/g, vars.fileNameWithoutExt)
        .replace(/\$fileName/g, vars.fileName)
        .replace(/\$dir/g, vars.dir);
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
        // 使用預設編譯命令（根據語言自動選擇編譯器）
        const isWindows = process.platform === 'win32';
        const compiler = languageId === 'cpp' ? 'g++' : 'gcc';
        const compilerFlags = config.get('compilerFlags', '');
        const outputExt = isWindows ? '.exe' : '';
        const outputFile = `${vars.dir}/${vars.fileNameWithoutExt}${outputExt}`;
        // 組合編譯命令
        let compileCmd = `${compiler} "${vars.fullFileName}"`;
        if (compilerFlags) {
            compileCmd += ` ${compilerFlags}`;
        }
        compileCmd += ` -o "${outputFile}"`;
        // Windows 加上 UTF-8 設定
        if (isWindows) {
            compileCommand = `chcp 65001 > nul && ${compileCmd}`;
        }
        else {
            compileCommand = compileCmd;
        }
    }
    outputChannel.clear();
    outputChannel.show(true);
    outputChannel.appendLine('==================== 編譯開始 ====================');
    outputChannel.appendLine(`原始檔: ${sourceFile}`);
    outputChannel.appendLine(`命令: ${compileCommand}`);
    outputChannel.appendLine('');
    try {
        // Windows 環境使用 cmd /c 執行命令以支援 chcp 等內建命令
        const isWindows = process.platform === 'win32';
        const execCommand = isWindows ? `cmd /c "${compileCommand}"` : compileCommand;
        const { stdout, stderr } = await execAsync(execCommand, {
            encoding: 'utf8',
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        // 檢查是否有警告
        let hasWarnings = false;
        if (stderr) {
            outputChannel.appendLine(stderr);
            // 檢查是否包含警告（warning）但不是錯誤（error）
            const lowerStderr = stderr.toLowerCase();
            hasWarnings = lowerStderr.includes('warning') && !lowerStderr.includes('error');
        }
        if (stdout) {
            outputChannel.appendLine(stdout);
        }
        outputChannel.appendLine('');
        if (hasWarnings) {
            // 統計警告數量
            const warningCount = (stderr.match(/warning:/gi) || []).length;
            outputChannel.appendLine(`==================== 編譯成功（有 ${warningCount} 個警告）====================`);
            vscode.window.showWarningMessage(`⚠️ 編譯成功，但有 ${warningCount} 個警告`);
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
        vscode.window.showErrorMessage('❌ 編譯失敗，請檢查錯誤訊息');
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
            vscode.window.showErrorMessage('未設定自訂執行命令，請在設定中配置 cpp-smart-runner.customRunCommand');
            return;
        }
        execCommand = replaceVariables(customCommand, vars);
        // 嘗試從自訂命令中提取執行檔路徑（用於時間檢查）
        // 簡單處理：假設執行檔是命令中的第一個檔案路徑
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
        const choice = await vscode.window.showWarningMessage('執行檔不存在，是否先編譯？', '編譯並執行', '取消');
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
            const choice = await vscode.window.showWarningMessage('⚠️ 警告：執行檔比原始檔舊，可能執行的是舊版本！', '重新編譯並執行', '仍然執行', '取消');
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
            // 選擇「仍然執行」則繼續執行
        }
    }
    // 建立終端機並執行
    const terminal = vscode.window.createTerminal({
        name: 'C/C++ Runner',
        shellPath: process.platform === 'win32' ? 'cmd.exe' : undefined
    });
    terminal.show();
    const isWindows = process.platform === 'win32';
    if (config.get('clearTerminal', true)) {
        const clearCommand = isWindows ? 'cls' : 'clear';
        terminal.sendText(clearCommand, true);
    }
    if (config.get('showExecutionMessage', true)) {
        outputChannel.appendLine('');
        outputChannel.appendLine('==================== 執行程式 ====================');
        outputChannel.appendLine(`執行命令: ${execCommand}`);
    }
    // Windows 環境下，確保 UTF-8 編碼設定生效
    if (isWindows) {
        terminal.sendText('chcp 65001', true);
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
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map