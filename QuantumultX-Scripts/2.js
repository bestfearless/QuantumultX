// 名称: Quantumult X 终极稳定版解析器 (修复 Type Error)
// 版本: v5.1 (2024-04-21)

// ============== 原版代码完全保留 ==============
// ▼▼▼ 完整粘贴 KOP-XIAO 原版代码 ▼▼▼
// [必须确保此部分与原版 resource-parser.js 完全一致]
// ▲▲▲ 原版代码结束 ▲▲▲

// ============== 增强逻辑 ==============
const _originalParse = Parse;
let globalHostnames = new Set();

Parse = async function() {
  const [link0, content0] = [$request.url, $response.body];
  let body = content0;

  try {
    // 调用原版解析
    await _originalParse.apply(this, arguments);
    
    // 确保 body 是字符串
    if (typeof body !== 'string') body = String(body || '');

    // 合并 hostname 逻辑
    const hostLine = `hostname = ${Array.from(globalHostnames).join(', ')}`;
    
    // 安全替换 hostname 行
    const newBody = body.replace(
      /hostname\s*=\s*[^\n]*/i, 
      hostLine
    ).replace(
      /\[general\]\s*\n/, 
      `[general]\n${hostLine}\n`
    );

    // 确保最终输出合法性
    body = newBody.includes('hostname =') 
      ? newBody 
      : `[general]\n${hostLine}\n\n${newBody}`;

  } catch (e) {
    console.log(`[FATAL] ${e.stack || e}`);
    body = content0;
  }

  // 强制类型保障
  $done({ body: String(body) });
};

// ============== Hostname 提取增强 ==============
const _originalParseContent = ParseContent;

ParseContent = function(content, params) {
  const result = _originalParseContent(content, params);
  
  // 强化 hostname 提取
  const hostRegex = /hostname\s*=\s*([^\n]+)/gi;
  let match;
  
  while ((match = hostRegex.exec(content)) !== null) {
    match[1].split(',').forEach(h => {
      const host = h.trim().replace(/^https?:\/\//, '');
      if (host && (!params.outhn || !host.includes(params.outhn))) {
        globalHostnames.add(host);
      }
    });
  }
  
  return result;
};
