

/**
 * Quantumult X Resource Parser with Merged Hostnames
 *
 * 说明：
 *  1. 本脚本将整个配置按“hostname = …”作为分块，每个块内包含其对应的规则。
 *  2. 当不同块的 hostname 有交集时，将它们合并为一个块，合并后的 hostname 列表取并集，规则合并在一起。
 *  3. 输出时按 Quantumult X 格式生成，hostname 行与后续规则行之间以空行分隔。
 *
 * 使用方法：
 *  processConfig(input) 接受原始配置文本，返回合并后的最终配置文本。
 *
 * 例如，使用 Node.js 调用：
 *    const fs = require('fs');
 *    const { processConfig } = require('./resource-parser-merged');
 *    let input = fs.readFileSync('your-config.conf', 'utf8');
 *    let output = processConfig(input);
 *    fs.writeFileSync('new-config.conf', output);
 */

function parseResource(input) {
  // 将整个配置按行拆分，按 hostname 行分块
  const lines = input.split('\n');
  const blocks = [];
  let currentBlock = { hostnames: [], rules: [] };

  for (let line of lines) {
    let trimmed = line.trim();
    // 如果是空行或注释行，直接加入当前块（保留注释有助于阅读）
    if (trimmed === '' || trimmed.startsWith('#')) {
      currentBlock.rules.push(line);
      continue;
    }
    // 遇到 hostname 定义时，认为开启新块
    if (/^hostname\s*=/.test(trimmed)) {
      // 如果当前块已有内容，则保存后开启新块
      if (currentBlock.hostnames.length > 0 || currentBlock.rules.length > 0) {
        blocks.push(currentBlock);
        currentBlock = { hostnames: [], rules: [] };
      }
      // 提取 hostname 列表（支持多个，以逗号分隔）
      let hostsStr = trimmed.substring('hostname'.length);
      hostsStr = hostsStr.replace('=', '').trim();
      let hosts = hostsStr.split(',').map(h => h.trim()).filter(h => h !== '');
      currentBlock.hostnames = hosts;
    } else {
      // 普通规则行直接加入当前块
      currentBlock.rules.push(line);
    }
  }
  // 将最后一个块加入
  if (currentBlock.hostnames.length > 0 || currentBlock.rules.length > 0) {
    blocks.push(currentBlock);
  }
  return blocks;
}

function mergeBlocks(blocks) {
  // 对所有块进行合并：如果两个块的 hostname 存在交集，则认为它们属于同一组
  let merged = [];
  for (let block of blocks) {
    let mergedBlock = null;
    for (let mBlock of merged) {
      // 检查两个 hostname 数组是否有交集
      if (block.hostnames.some(h => mBlock.hostnames.includes(h))) {
        mergedBlock = mBlock;
        break;
      }
    }
    if (mergedBlock) {
      // 合并 hostname：取并集（避免重复）
      block.hostnames.forEach(h => {
        if (!mergedBlock.hostnames.includes(h)) {
          mergedBlock.hostnames.push(h);
        }
      });
      // 合并规则：简单拼接
      mergedBlock.rules = mergedBlock.rules.concat(block.rules);
    } else {
      merged.push({
        hostnames: block.hostnames.slice(),
        rules: block.rules.slice()
      });
    }
  }
  return merged;
}

function outputResource(blocks) {
  // 将合并后的块生成最终输出文本
  let output = [];
  for (let block of blocks) {
    if (block.hostnames.length > 0) {
      output.push(`hostname = ${block.hostnames.join(',')}`);
    }
    // 添加块内的其他规则
    output = output.concat(block.rules);
    output.push(''); // 每个块之间增加一个空行，便于阅读
  }
  return output.join('\n');
}

function processConfig(input) {
  let blocks = parseResource(input);
  let merged = mergeBlocks(blocks);
  let output = outputResource(merged);
  return output;
}

// 如果作为模块使用，导出 processConfig 函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { processConfig };
}

// 以下为调试示例，可直接在 Node.js 环境运行测试
if (require.main === module) {
  const exampleInput = `
# 小程序etc
hostname = marketing.etczs.net,gw.etczs.net
https?://marketing.etczs.net/marketplan/.*.gif url reject-dict
https://gw.etczs.net/api/activity/marketing/wx/trigger/selectTriggerAppDetail url reject-200

# 多点
hostname = download.dmallcdn.com
^https?:\\/\\/download\\.dmallcdn\\.com\\/marketing\\/.*\\.(jpg|png) url reject-200
`;
  console.log(processConfig(exampleInput));
}
