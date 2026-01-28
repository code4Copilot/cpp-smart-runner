import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TextDecoder, TextEncoder } from 'util';

const execAsync = promisify(exec);

let outputChannel: vscode.OutputChannel;

interface CommandVariables {
    fileName: string;              // 檔名（含副檔名）例如: test.cpp
    fileNameWithoutExt: string;    // 檔名（不含副檔名）例如: test
    dir: string;                   // 檔案所在目錄
    fullFileName: string;          // 完整路徑
    workspaceFolder: string;       // 工作區資料夾
}

export function activate(context: vscode.ExtensionContext) {
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
    
    // 註冊手動轉換編碼命令
    let convertToUtf8Command = vscode.commands.registerCommand('cpp-smart-runner.convertToUtf8', async () => {
        await handleEncodingConversion('utf8');
    });

    let convertToBig5Command = vscode.commands.registerCommand('cpp-smart-runner.convertToBig5', async () => {
        await handleEncodingConversion('big5');
    });
    
    context.subscriptions.push(
        compileCommand, runCommand, compileAndRunCommand,
        convertToUtf8Command, convertToBig5Command, outputChannel
    );
    
    outputChannel.appendLine('C/C++ Smart Runner 已啟動');
}

function getCommandVariables(sourceFile: string): CommandVariables {
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

function replaceVariables(command: string, vars: CommandVariables): string {
    // 必須先替換較長的變數名稱，避免被較短的覆蓋
    return command
        .replace(/\$workspaceFolder/g, vars.workspaceFolder)
        .replace(/\$fullFileName/g, vars.fullFileName)
        .replace(/\$fileNameWithoutExt/g, vars.fileNameWithoutExt)
        .replace(/\$fileName/g, vars.fileName)
        .replace(/\$dir/g, vars.dir);
}

// 編碼檢查與轉換核心邏輯
async function handleEncodingConversion(target: 'utf8' | 'big5') {
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
            if (isUtf8(buffer)) {
                vscode.window.showInformationMessage('檔案已經是 UTF-8 編碼');
                return;
            }
            const content = new TextDecoder('big5').decode(buffer);
            fs.writeFileSync(filePath, content, 'utf8');
            vscode.window.showInformationMessage('✅ 已成功轉換為 UTF-8 (相容 AI/VS Code)');
            
            // 重新載入檔案以顯示正確內容
            await vscode.commands.executeCommand('workbench.action.files.revert');
        } else {
            // 轉換為 Big5
            const content = document.getText();
            
            // 優先使用 iconv-lite 套件
            try {
                const iconv = require('iconv-lite');
                const big5Buffer = iconv.encode(content, 'big5');
                fs.writeFileSync(filePath, big5Buffer);
                vscode.window.showInformationMessage('💾 已成功轉換為 Big5 (相容 Dev-C++)');
                
                // 重新載入檔案
                await vscode.commands.executeCommand('workbench.action.files.revert');
            } catch (requireError) {
                vscode.window.showErrorMessage('未安裝 iconv-lite 套件，請執行：npm install iconv-lite');
            }
        }
    } catch (err: any) {
        vscode.window.showErrorMessage(`編碼轉換失敗：${err.message}`);
    }
}

function isUtf8(buffer: Buffer): boolean {
    try {
        new TextDecoder('utf-8', { fatal: true }).decode(buffer);
        return true;
    } catch {
        return false;
    }
}

async function compileCurrentFile(): Promise<boolean> {
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
    if (config.get<boolean>('saveBeforeCompile', true) && document.isDirty) {
        await document.save();
    }
    
    const sourceFile = document.fileName;
    
    // 自動偵測並轉換為 UTF-8 (核心自動化功能)
    if (config.get<boolean>('autoConvertEncoding', true)) {
        try {
            const buffer = fs.readFileSync(sourceFile);
            if (!isUtf8(buffer)) {
                const content = new TextDecoder('big5').decode(buffer);
                fs.writeFileSync(sourceFile, content, 'utf8');
                outputChannel.appendLine('>>> 偵測到 ANSI (Big5) 檔案，已自動優化為 UTF-8');
                // 重新載入檔案
                await vscode.commands.executeCommand('workbench.action.files.revert');
            }
        } catch (err) {
            // 編碼轉換失敗不影響編譯流程
            outputChannel.appendLine(`>>> 編碼偵測失敗，使用原始編碼繼續編譯`);
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
    
    let compileCommand: string;
    
    // 檢查是否使用自訂命令
    const customCommand = config.get<string>('customCompileCommand', '');
    if (customCommand) {
        // 使用使用者自訂的編譯命令
        compileCommand = replaceVariables(customCommand, vars);
    } else {
        // 使用預設編譯命令（根據語言自動選擇編譯器）
        const isWindows = process.platform === 'win32';
        const compiler = languageId === 'cpp' ? 'g++' : 'gcc';
        const compilerFlags = config.get<string>('compilerFlags', '');
        const outputExt = isWindows ? '.exe' : '';
        const outputFile = `${vars.dir}/${vars.fileNameWithoutExt}${outputExt}`;
        
        // 組合編譯命令
        let compileCmd = `${compiler} "${vars.fullFileName}"`;
        // 加入 UTF-8 編碼支援參數
        compileCmd += ' -finput-charset=utf-8 -fexec-charset=utf-8';
        if (compilerFlags) {
            compileCmd += ` ${compilerFlags}`;
        }
        compileCmd += ` -o "${outputFile}"`;
        
        // Windows 加上 UTF-8 設定
        if (isWindows) {
            compileCommand = `chcp 65001 > nul && ${compileCmd}`;
        } else {
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
        } else {
            outputChannel.appendLine('==================== 編譯成功 ====================');
            vscode.window.showInformationMessage('✅ 編譯成功');
        }
        return true;
        
    } catch (error: any) {
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

async function runCurrentFile(skipTimeCheck: boolean = false): Promise<void> {
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
    if (config.get<boolean>('showExecutionMessage', true)) {
        outputChannel.appendLine('');
        outputChannel.appendLine('==================== 執行變數除錯 ====================');
        outputChannel.appendLine(`fileName: ${vars.fileName}`);
        outputChannel.appendLine(`fileNameWithoutExt: ${vars.fileNameWithoutExt}`);
        outputChannel.appendLine(`dir: ${vars.dir}`);
        outputChannel.appendLine('');
    }
    
    let execCommand: string;
    let outputFile: string;
    
    // 檢查是否使用自訂命令
    if (config.get<boolean>('useCustomCommand', false)) {
        const customCommand = config.get<string>('customRunCommand', '');
        if (!customCommand) {
            vscode.window.showErrorMessage('未設定自訂執行命令，請在設定中配置 cpp-smart-runner.customRunCommand');
            return;
        }
        execCommand = replaceVariables(customCommand, vars);
        
        // 嘗試從自訂命令中提取執行檔路徑（用於時間檢查）
        // 簡單處理：假設執行檔是命令中的第一個檔案路徑
        const match = execCommand.match(/"([^"]+)"|(\S+)/);
        outputFile = match ? (match[1] || match[2]) : getOutputPath(sourceFile, config);
    } else {
        outputFile = getOutputPath(sourceFile, config);
        const isWindows = process.platform === 'win32';
        execCommand = isWindows ? `"${outputFile}"` : `"${outputFile}"`;
    }
    
    // 檢查執行檔是否存在
    if (!fs.existsSync(outputFile)) {
        const choice = await vscode.window.showWarningMessage(
            '執行檔不存在，是否先編譯？',
            '編譯並執行',
            '取消'
        );
        
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
            const choice = await vscode.window.showWarningMessage(
                '⚠️ 警告：執行檔比原始檔舊，可能執行的是舊版本！',
                '重新編譯並執行',
                '仍然執行',
                '取消'
            );
            
            if (choice === '重新編譯並執行') {
                const success = await compileCurrentFile();
                if (success) {
                    await runCurrentFile(true);
                }
                return;
            } else if (choice === '取消') {
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
    
    if (config.get<boolean>('clearTerminal', true)) {
        const clearCommand = isWindows ? 'cls' : 'clear';
        terminal.sendText(clearCommand, true);
    }
    
    if (config.get<boolean>('showExecutionMessage', true)) {
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

function getCompiler(languageId: string, config: vscode.WorkspaceConfiguration): string {
    const customCompiler = config.get<string>('compilerPath', '');
    
    if (customCompiler) {
        return customCompiler;
    }
    
    // 自動偵測編譯器
    return languageId === 'cpp' ? 'g++' : 'gcc';
}

function getOutputPath(sourceFile: string, config: vscode.WorkspaceConfiguration): string {
    const outputDir = config.get<string>('outputDir', '');
    const isWindows = process.platform === 'win32';
    const ext = isWindows ? '.exe' : '';
    
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    
    if (outputDir) {
        // 確保輸出目錄存在
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        return path.join(outputDir, baseName + ext);
    } else {
        // 與原始檔同目錄
        return path.join(path.dirname(sourceFile), baseName + ext);
    }
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}