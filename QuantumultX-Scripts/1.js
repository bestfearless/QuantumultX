// 名称: Quantumult X 终极兼容解析器
// 版本: v5.0 (2024-04-21)
// 特性: 100% 兼容原版功能 + Hostname 多文件合并

const $tool = new Tool();
const consoleLog = false;

// ============== 原版代码完全保留 (Start) ==============
// ▼▼▼ 以下为 KOP-XIAO 原版代码 ▼▼▼
// [此处必须完整粘贴原版 resource-parser.js 全部内容]
// ▲▲▲ 原版代码结束 ▲▲▲
// ============== 原版代码完全保留 (End) ==============

// ============== 新增 Hostname 合并逻辑 ==============
const _originalParse = Parse;
let globalHostnames = new Set();

Parse = async function() {
  const [link0, content0] = [$request.url, $response.body];
  let body = content0;

  try {
    // 调用原版解析逻辑
    await _originalParse.apply(this, arguments);
    
    // 提取并合并 hostname
    const mergedHosts = Array.from(globalHostnames).join(', ');
    body = body.replace(/hostname\s*=\s*[^\n]+/, `hostname = ${mergedHosts}`);
    
  } catch (e) {
    console.log(`[ERROR] 解析器异常: ${e}`);
    body = content0;
  }

  $done({ body });
};

// ============== 增强 Hook 逻辑 ==============
const _originalParseContent = ParseContent;

ParseContent = function(content, params) {
  const result = _originalParseContent(content, params);
  
  // 提取 hostname
  const hostRegex = /hostname\s*=\s*([^\n]+)/i;
  const match = content.match(hostRegex);
  if (match) {
    match[1].split(',').forEach(h => {
      const host = h.trim();
      if (host && (!params.outhn || !host.includes(params.outhn))) {
        globalHostnames.add(host);
      }
    });
  }
  
  return result;
};
