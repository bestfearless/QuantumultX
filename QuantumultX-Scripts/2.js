// 名称: Quantumult X Hostname 合并解析器 (修复版)
// 版本: v1.1 (2024-04-21)
// 修复点: 网络请求错误处理 + 增强日志

const consoleLog = true; // 开启详细日志
let globalHostnames = new Set();

async function Parse() {
  const [link0, content0] = [$request.url, $response.body];
  let body = content0;
  
  try {
    const rawUrls = link0.split(/,|\|/).filter(url => url.trim() !== '');
    if (consoleLog) console.log(`待处理规则源: ${rawUrls}`);

    for (const url of rawUrls) {
      const [baseUrl, params] = url.split("#");
      const paramsObj = parseParams(params);
      
      try {
        const response = await fetch(baseUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        if (consoleLog) console.log(`规则源 ${baseUrl} 加载成功`);
        extractHostnames(text, paramsObj);
      } catch (e) {
        console.log(`规则源 ${baseUrl} 加载失败: ${e}`);
      }
    }

    body = `hostname = ${Array.from(globalHostnames).join(', ')}`;
    if (consoleLog) console.log(`合并后 hostname:\n${body}`);

  } catch (e) {
    console.log(`全局错误: ${e}`);
    body = content0;
  }

  $done({ body });
}

// ================== 工具函数 ==================
function extractHostnames(content, params) {
  const lines = content.split('\n');
  lines.forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    if (line.toLowerCase().startsWith('hostname')) {
      const hosts = line.split('=')[1].split(',').map(h => h.trim()).filter(h => h !== '');
      hosts.forEach(host => {
        if (!params.outhn || !host.includes(params.outhn)) {
          globalHostnames.add(host);
          if (consoleLog) console.log(`添加域名: ${host}`);
        }
      });
    }
  });
}

function parseParams(paramStr) {
  const params = {};
  if (!paramStr) return params;
  
  paramStr.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) params[key] = decodeURIComponent(value);
  });
  
  if (consoleLog) console.log(`解析参数: ${JSON.stringify(params)}`);
  return params;
}

// 执行入口
Parse();
