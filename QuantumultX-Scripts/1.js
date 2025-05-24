// ====== 自动合并多行 hostname ======
var output = [];
var hostnames = new Set();

// 处理每行内容
content.split("\n").forEach(function(line) {
    var trimmed = line.trim();
    
    // 捕获并合并 hostname 行
    if (/^\s*hostname\s*=/i.test(trimmed)) {
        var domains = trimmed.split(/hostname\s*=\s*/i)[1] || "";
        domains.split(",").forEach(function(d) {
            var domain = d.trim();
            if (domain) hostnames.add(domain);
        });
        return; // 删除原 hostname 行
    }
    
    // 保留其他规则（含注释和空行）
    output.push(line);
});

// 合并 hostname 到配置末尾
if (hostnames.size > 0) {
    output.push(""); // 空行分隔
    output.push("hostname = " + Array.from(hostnames).join(", "));
}

// 返回结果（严格遵循 QuantumultX 数组格式）
output;
