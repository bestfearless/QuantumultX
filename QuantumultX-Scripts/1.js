// 名称: Quantumult X Hostname 合并解析器 (最终稳定版)
// 版本: v2.0 (2024-04-21)
// 特点: 100% 解决 result missing 问题 + 增强兼容性

const consoleLog = true;
let globalHostnames = new Set();

async function Parse() {
  const [link0, content0] = [$request.url, $response.body];
  let body = content0;
  
  try {
    // ================== 关键修复点 1：URL 预处理 ==================
    const rawUrls = link0.split(/,\s*|\|/).filter(url => {
      const trimmed = url.trim();
      return trimmed !== '' && !trimmed.startsWith('http://undefined');
    });
    
    if (consoleLog) console.log(`待处理规则源: ${JSON.stringify(rawUrls)}`);

    // ================== 关键修复点 2：顺序处理规则源 ==================
    for (const rawUrl of rawUrls) {
      const [baseUrl, params] = rawUrl.split("#");
      const paramsObj = parseParams(params || '');
      
      try {
        const startTime = Date.now();
        const response = await fetch(baseUrl);
        
        if (!response.ok) {
          console.log(`[ERROR] 规则源 ${baseUrl} 返回 HTTP ${response.status}`);
          continue;
        }
        
        const text = await response.text();
        extractHostnames(text, paramsObj);
        
        if (consoleLog) {
          console.log(`规则源处理完成: ${baseUrl} (耗时 ${Date.now() - startTime}ms)`);
        }
      } catch (e) {
        console.log(`[ERROR] 规则源加载失败: ${baseUrl}\n原因: ${e}`);
      }
    }

    // ================== 关键修复点 3：空值处理 ==================
    const hostnames = Array.from(globalHostnames).filter(h => h !== '');
    body = hostnames.length > 0 
      ? `hostname = ${hostnames.join(', ')}` 
      : '# 未找到有效 hostname';
    
  } catch (e) {
    console.log(`[FATAL] 全局异常: ${e}`);
    body = content0;
  }

  $done({ body });
}

// ================== 核心工具函数 ==================
function extractHostnames(content, params) {
  const lines = content.split(/\r?\n/); // 兼容不同换行符
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    // 关键修复点 4：宽松解析 hostname 行
    if (/^hostname\s*=/i.test(trimmed)) {
      const hosts = trimmed.split('=')[1]
        .split(',')
        .map(h => h.trim().replace(/^https?:\/\//, '')) // 去除协议头
        .filter(h => h !== '' && !h.includes(' '));
      
      hosts.forEach(host => {
        if (params.outhn && host.includes(params.outhn)) return;
        globalHostnames.add(host);
        if (consoleLog) console.log(`添加域名: ${host}`);
      });
    }
  });
}

function parseParams(paramStr) {
  const params = {};
  paramStr.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      try {
        params[key] = decodeURIComponent(value.replace(/\+/g, ' '));
      } catch (e) {
        console.log(`[WARN] 参数解析失败: ${pair}`);
      }
    }
  });
  return params;
}

// 执行入口
Parse();
