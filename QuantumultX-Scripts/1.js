// ====== 插入到文件顶部（无需其他修改） ======
var __hostnames = [];
var __originalParse = typeof parse === "function" ? parse : function() {};

// 劫持解析流程
parse = function(content) {
  // 预处理：收集所有 hostname
  content.split("\n").forEach(line => {
    var l = line.trim();
    if (/^hostname\s*=/i.test(l)) {
      var domains = l.split(/hostname\s*=\s*/i)[1] || "";
      domains.split(",").forEach(d => {
        var domain = d.trim();
        if (domain) __hostnames.push(domain);
      });
    }
  });
  
  // 生成原始配置
  var originalOutput = __originalParse(content);
  
  // 合并 hostname 到末尾
  if (__hostnames.length > 0) {
    var uniqueHosts = [...new Set(__hostnames)];
    originalOutput += "\nhostname = " + uniqueHosts.join(", ");
  }
  
  return originalOutput;
};
