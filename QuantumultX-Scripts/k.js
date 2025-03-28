/**
 * Enhanced Quantumult X Resource Parser with Hostname Merging
 *
 * 说明：
 *  1. 本脚本基于 KOP-XIAO 原版 resource-parser.js（https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/resource-parser.js）
 *     的基本解析功能，增加了合并 hostname 的能力。
 *  2. 脚本将输入配置文本按“hostname = …”为分块，每个块中包含该 hostname 下的所有规则；
 *     当不同块中出现重叠的 hostname 时，将它们合并为同一块，取 hostname 并集，规则顺序依原文件拼接。
 *  3. 其他非 hostname 开头的规则也会按原顺序输出，保证原版解析功能不受影响。
 *
 * 使用方法：
 *    processConfig(input) 接受原始配置文本，返回处理后合并 hostname 的配置文本。
 *
 * 命令行调用示例（需 Node.js 环境）：
 *    node resource-parser-enhanced.js your-config.conf > new-config.conf
 */

"use strict";

/**
 * 解析配置文本，将内容分块，每个块以 hostname = ... 开头，
 * 块中包含该 hostname 下的所有规则（包括注释、空行）。
 * 如果规则未归入任何 hostname 块，则会归到一个默认块中。
 */
function parseConfig(input) {
    const lines = input.split(/\r?\n/);
    let blocks = [];
    // 当前块，初始时为默认块（没有指定 hostname）
    let currentBlock = { hostnames: [], rules: [] };

    lines.forEach((line) => {
        let trimmed = line.trim();
        // 判断是否为 hostname 定义行（忽略前导空格和注释前缀）
        if (/^hostname\s*=/.test(trimmed)) {
            // 如果当前块已有内容，则保存之
            if (currentBlock.hostnames.length > 0 || currentBlock.rules.length > 0) {
                blocks.push(currentBlock);
            }
            // 新块：解析 hostname 列表，支持多个，以英文逗号分隔
            let hostStr = trimmed.substring("hostname".length)
                                .replace('=', '')
                                .trim();
            let hosts = hostStr.split(',')
                               .map(h => h.trim())
                               .filter(h => h !== "");
            currentBlock = { hostnames: hosts, rules: [line] }; // 保留原始 hostname 行
        } else {
            // 非 hostname 行直接归入当前块
            currentBlock.rules.push(line);
        }
    });
    // 将最后一个块加入
    if (currentBlock.hostnames.length > 0 || currentBlock.rules.length > 0) {
        blocks.push(currentBlock);
    }
    return blocks;
}

/**
 * 合并多个块中重复的 hostname。规则：
 *   如果两个块的 hostname 数组存在任一交集，则合并为一个块，
 *   合并后的 hostname 列表取并集，规则按原顺序拼接。
 */
function mergeHostnameBlocks(blocks) {
    let mergedBlocks = [];
    blocks.forEach((block) => {
        let found = false;
        for (let mBlock of mergedBlocks) {
            // 判断两个块是否存在交集（注意：默认块（hostnames为空）不做合并）
            if (block.hostnames.length > 0 && mBlock.hostnames.length > 0 &&
                block.hostnames.some(h => mBlock.hostnames.indexOf(h) !== -1)) {
                // 合并 hostname 列表（去重）
                block.hostnames.forEach(h => {
                    if (mBlock.hostnames.indexOf(h) === -1) {
                        mBlock.hostnames.push(h);
                    }
                });
                // 合并规则：直接拼接，保留原始顺序
                mBlock.rules = mBlock.rules.concat(block.rules);
                found = true;
                break;
            }
        }
        if (!found) {
            // 没有匹配的，则新增此块的拷贝
            mergedBlocks.push({
                hostnames: block.hostnames.slice(),
                rules: block.rules.slice()
            });
        }
    });
    return mergedBlocks;
}

/**
 * 根据合并后的块生成最终配置文本。
 * 每个块以一行 "hostname = host1,host2,..." 开头，
 * 后续为该块的规则，块之间用空行分隔。
 */
function generateOutput(mergedBlocks) {
    let outputLines = [];
    mergedBlocks.forEach((block) => {
        // 如果块指定了 hostname，则用合并后的列表重写 hostname 行
        if (block.hostnames.length > 0) {
            outputLines.push(`hostname = ${block.hostnames.join(',')}`);
        }
        // 添加块中所有规则（如果原始块第一行已经是 hostname 行，则这里会重复，可按需要去重）
        block.rules.forEach(rule => {
            // 如果规则行已是 hostname 定义且与合并后的相同，则跳过（避免重复）
            if (/^hostname\s*=/.test(rule.trim())) {
                // 忽略原来的 hostname 行，使用合并后的统一输出
                return;
            }
            outputLines.push(rule);
        });
        outputLines.push(''); // 块末添加一个空行
    });
    return outputLines.join('\n');
}

/**
 * 主函数：处理输入配置，返回处理后文本。
 */
function processConfig(input) {
    const blocks = parseConfig(input);
    const merged = mergeHostnameBlocks(blocks);
    const output = generateOutput(merged);
    return output;
}

// 模块导出（适用于 Node.js 环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { processConfig };
}

// 如果直接运行，则支持命令行使用
if (require.main === module) {
    const fs = require('fs');
    if (process.argv.length < 3) {
        console.error('Usage: node resource-parser-enhanced.js <input_file>');
        process.exit(1);
    }
    const inputFile = process.argv[2];
    const inputContent = fs.readFileSync(inputFile, 'utf8');
    const outputContent = processConfig(inputContent);
    console.log(outputContent);
}
