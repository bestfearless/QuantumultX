// ====== 完整替换解析器内容 ======
var output = [];
var hostnames = new Set();

// 处理每一行配置
content.split("\n").forEach(line => {
    const trimmed = line.trim();
    
    // 捕获 hostname 行
    if (/^\s*hostname\s*=/i.test(trimmed)) {
        const domains = trimmed.split(/hostname\s*=\s*/i)[1] || "";
        domains.split(",").forEach(d => {
            const domain = d.trim();
            if (domain) hostnames.add(domain);
        });
        return; // 跳过原始行
    }
    
    // 保留其他规则
    if (trimmed) output.push(line);
});

// 合并 hostname 到末尾
if (hostnames.size > 0) {
    output.push(""); // 空行分隔
    output.push("hostname = " + Array.from(hostnames).join(", "));
}

// 返回最终配置（QuantumultX 固定要求返回数组）
output;
