// 名称: Quantumult X 纯净 Hostname 合并解析器
// 功能: 多规则源 Hostname 合并 + 参数过滤
// 作者: 由您的需求定制
// 版本: v1.0 (2024-04-21)

// ================== 核心逻辑 ==================
const consoleLog = true; // 调试开关
let globalHostnames = new Set(); // 全局存储 hostname

async function Parse() {
  const [link0, content0] = [$request.url, $response.body];
  let body = content0;

  try {
    const rawUrls = link0.split(/,|\|/); // 支持逗号或竖线分隔多个规则源
    
    // 遍历所有规则源
    for (const url of rawUrls) {
      const [baseUrl, params] = url.split("#");
      const paramsObj = parseParams(params); // 解析参数
      const response = await fetch(baseUrl);
      const text = await response.text();
      
      // 提取 hostname 并合并
      extractHostnames(text, paramsObj);
    }

    // 生成最终配置
    body = `hostname = ${Array.from(globalHostnames).join(', ')}`;

  } catch (e) {
    console.log(`解析失败: ${e}`);
    body = content0; // 失败时返回原始内容
  }

  $done({ body });
}

// ================== 工具函数 ==================
// 提取 hostname 并应用参数过滤
function extractHostnames(content, params) {
  const lines = content.split('\n');
  
  lines.forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    // 处理 hostname 行
    if (line.startsWith('hostname')) {
      const hosts = line.split('=')[1].split(',').map(h => h.trim());
      hosts.forEach(host => {
        // 应用 outhn 参数过滤
        if (!params.outhn || !host.includes(params.outhn)) {
          globalHostnames.add(host);
        }
      });
    }
  });
}

// 解析 URL 参数（例如 #outhn=example.com）
function parseParams(paramStr) {
  const params = {};
  if (!paramStr) return params;
  
  paramStr.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[key] = decodeURIComponent(value);
    }
  });
  return params;
}

// 执行入口
Parse().catch(e => $done({ body: `解析器崩溃: ${e}` }));
