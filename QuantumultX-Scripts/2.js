// ====== 完整替换原解析器内容 ======
(function() {
    // 安全作用域封装
    const hostnames = new Set();
    
    // 预处理：删除所有 hostname 行并收集域名
    const processedContent = content.split("\n")
        .map(line => {
            const trimmed = line.trim();
            if (/^hostname\s*=/i.test(trimmed)) {
                const [, domains] = trimmed.match(/hostname\s*=\s*(.*)/i) || [];
                if (domains) {
                    domains.split(",").forEach(d => {
                        const domain = d.trim();
                        if (domain) hostnames.add(domain);
                    });
                }
                return ""; // 删除原行
            }
            return line;
        })
        .join("\n");
    
    // 生成原始配置（强制类型安全）
    let result = parse(processedContent);
    if (typeof result !== "string") {
        result = "";
    }
    
    // 合并 hostname 到末尾
    if (hostnames.size > 0) {
        result += "\nhostname = " + Array.from(hostnames).join(", ");
    }
    
    return result; // 显式返回字符串
})();
