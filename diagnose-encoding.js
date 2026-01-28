// 編碼診斷工具 - 分析檔案的字節內容
const fs = require('fs');
const path = require('path');

function analyzeFile(filePath) {
    console.log(`\n========== 分析檔案: ${filePath} ==========\n`);
    
    const buffer = fs.readFileSync(filePath);
    console.log(`檔案大小: ${buffer.length} bytes\n`);
    
    // 顯示前 200 個字節
    console.log('前 200 bytes (hex):');
    const displayBytes = Math.min(200, buffer.length);
    for (let i = 0; i < displayBytes; i += 16) {
        const chunk = buffer.slice(i, Math.min(i + 16, displayBytes));
        const hex = Array.from(chunk)
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
        const ascii = Array.from(chunk)
            .map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.')
            .join('');
        console.log(`${i.toString(16).padStart(4, '0')}: ${hex.padEnd(48, ' ')} | ${ascii}`);
    }
    
    // 統計分析
    console.log('\n===== 字節統計 =====');
    
    let big5Count = 0;
    let gbkCount = 0;
    let big5SpecificCount = 0;
    let gbkSpecificCount = 0;
    let asciiCount = 0;
    
    const sampleSize = Math.min(buffer.length - 1, 1000);
    
    for (let i = 0; i < sampleSize; i++) {
        const byte = buffer[i];
        
        // ASCII
        if (byte < 0x80) {
            asciiCount++;
            continue;
        }
        
        // 雙字節字符
        if (i < buffer.length - 1) {
            const byte1 = buffer[i];
            const byte2 = buffer[i + 1];
            
            // Big5 範圍
            if (byte1 >= 0xA1 && byte1 <= 0xF9) {
                if ((byte2 >= 0x40 && byte2 <= 0x7E) || (byte2 >= 0x80 && byte2 <= 0xFE)) {
                    big5Count++;
                    
                    // Big5 特有第二字節範圍
                    if (byte2 >= 0x40 && byte2 <= 0x7E && byte2 !== 0x7F) {
                        big5SpecificCount++;
                        console.log(`  Big5 特徵 @ ${i}: [${byte1.toString(16)} ${byte2.toString(16)}]`);
                    }
                }
            }
            
            // GBK 特有範圍 (0x81-0xA0)
            if (byte1 >= 0x81 && byte1 <= 0xA0) {
                if (byte2 >= 0x40 && byte2 <= 0xFE && byte2 !== 0x7F) {
                    gbkSpecificCount++;
                    console.log(`  GBK 特徵 @ ${i}: [${byte1.toString(16)} ${byte2.toString(16)}]`);
                }
            }
            
            // GBK 一般範圍
            if (byte1 >= 0x81 && byte1 <= 0xFE && byte2 >= 0x40 && byte2 <= 0xFE) {
                gbkCount++;
            }
        }
    }
    
    console.log(`\nASCII 字符數: ${asciiCount}`);
    console.log(`Big5 雙字節數: ${big5Count}`);
    console.log(`Big5 特有特徵數: ${big5SpecificCount} (權重 x2)`);
    console.log(`GBK 雙字節數: ${gbkCount}`);
    console.log(`GBK 特有特徵數: ${gbkSpecificCount} (權重 x2)`);
    
    const big5Total = big5Count + (big5SpecificCount * 2);
    const gbkTotal = gbkCount + (gbkSpecificCount * 2);
    
    console.log(`\nBig5 總分: ${big5Total}`);
    console.log(`GBK 總分: ${gbkTotal}`);
    
    // 判斷結果
    console.log('\n===== 判斷結果 =====');
    if (big5SpecificCount > 3 || (big5Total > gbkTotal && big5Count > 3)) {
        console.log('預測編碼: Big5 ✓');
        console.log(`理由: ${big5SpecificCount > 3 ? 'Big5特徵數 > 3' : 'Big5總分 > GBK總分'}`);
    } else if (gbkTotal > 5) {
        console.log('預測編碼: GBK');
        console.log(`理由: GBK總分 > 5`);
    } else {
        console.log('預測編碼: Big5 (預設)');
    }
    
    // UTF-8 檢測
    console.log('\n===== UTF-8 檢測 =====');
    let isValidUtf8 = false;
    try {
        const decoder = new TextDecoder('utf-8', { fatal: true });
        decoder.decode(buffer);
        console.log('UTF-8 驗證: 有效 ✓');
        isValidUtf8 = true;
    } catch (e) {
        console.log('UTF-8 驗證: 無效 (非UTF-8編碼)');
    }
    
    // 最終判斷 (模擬 detectEncoding 函數)
    console.log('\n===== 最終判斷 (按照 detectEncoding 邏輯) =====');
    if (isValidUtf8) {
        console.log('⭐ 最終編碼: UTF-8 (UTF-8驗證通過，應該在Big5/GBK判斷之前返回)');
    } else if (big5SpecificCount > 3 || (big5Total > gbkTotal && big5Count > 3)) {
        console.log('⭐ 最終編碼: Big5');
    } else if (gbkTotal > 5) {
        console.log('⭐ 最終編碼: GBK');
    } else {
        console.log('⭐ 最終編碼: Big5 (預設)');
    }
}

// 主程式
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('使用方式: node diagnose-encoding.js <檔案路徑>');
    console.log('\n範例:');
    console.log('  node diagnose-encoding.js test-encoding.c');
    console.log('  node diagnose-encoding.js src/test/fixtures/test.c');
    process.exit(1);
}

const filePath = args[0];
if (!fs.existsSync(filePath)) {
    console.error(`錯誤: 檔案不存在: ${filePath}`);
    process.exit(1);
}

analyzeFile(filePath);
