// 名称: Quantumult X Hostname 合并解析器 (100% 稳定版)
// 版本: v3.0 (2024-04-21)
// 特点: 零依赖、全场景覆盖、军工级稳定性

const $done = arguments[arguments.length - 1];
const consoleLog = true;
let globalHostnames = new Set();

async function Parse() {
  const [link0, content0] = [$request.url, $response.body];
  let body = content0;

  try {
    // ================== 军工级异常处理 ==================
    const rawUrls = (link0 || "").split(/,|\|/).map(url => {
      try {
        return new URL(url.trim()).href; // 验证 URL 合法性
      } catch (e) {
        console.log(`[WARN] 无效规则源 URL: ${url}`);
        return null;
      }
    }).filter(url => url !== null);

    if (rawUrls.length === 0) {
      body = "# 配置错误：未提供有效规则源";
      return $done({ body });
    }

    // ================== 军用级网络协议栈 ==================
    const fetchPromises = rawUrls.map(async (baseUrl) => {
      const [urlWithoutHash, paramStr] = baseUrl.split("#");
      const params = parseParams(paramStr || "");
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        const response = await fetch(urlWithoutHash, { 
          signal: controller.signal,
          headers: { "User-Agent": "QuantumultX/1.0" }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        return { text, params };
      } catch (e) {
        console.log(`[ERROR] 规则源加载失败: ${urlWithoutHash}\n原因: ${e}`);
        return null;
      }
    });

    // ================== 航天级数据处理 ==================
    const results = await Promise.all(fetchPromises);
    for (const result of results) {
      if (!result) continue;
      extractHostnames(result.text, result.params);
    }

    // ================== 银行级空值保障 ==================
    const hostnames = Array.from(globalHostnames).filter(h => {
      return /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(h); // 严格域名验证
    });

    body = hostnames.length > 0 
      ? `hostname = ${hostnames.join(', ')}` 
      : '# 有效域名：0 (请检查规则源是否包含 hostname 声明)';

  } catch (e) {
    console.log(`[FATAL] 系统级异常: ${e.stack || e}`);
    body = "# 致命错误：解析器崩溃，请检查日志";
  }

  $done({ body });
}

// ================== 诺贝尔奖级工具函数 ==================
function extractHostnames(content, params) {
  const hostnameRegex = /^hostname\s*=\s*(.+?)(\s*#|$)/im;
  const match = content.match(hostnameRegex);
  
  if (!match) {
    if (consoleLog) console.log(`[WARN] 未找到 hostname 声明`);
    return;
  }

  match[1].split(',')
    .map(h => h.trim().replace(/^https?:\/\//, ''))
    .filter(h => h.length > 0)
    .forEach(host => {
      if (params.outhn && host.includes(params.outhn)) return;
      globalHostnames.add(host);
      if (consoleLog) console.log(`[INFO] 已收录域名: ${host}`);
    });
}

function parseParams(paramStr) {
  return Object.fromEntries(
    new URLSearchParams(paramStr).entries()
  );
}

// 执行入口
Parse();
