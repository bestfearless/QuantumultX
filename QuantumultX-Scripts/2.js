// ====== 完整替换解析器内容 ======
var output = [];
var hostnames = [];

// 处理每行配置（兼容 ES5 语法）
var lines = content.split("\n");
for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var trimmed = line.trim();
    
    // 捕获 hostname 行（兼容所有格式）
    if (trimmed.toLowerCase().indexOf("hostname=") === 0) {
        var domains = trimmed.split(/hostname\s*=\s*/i)[1] || "";
        domains.split(",").forEach(function(d) {
            var domain = d.trim();
            if (domain && hostnames.indexOf(domain) === -1) {
                hostnames.push(domain);
            }
        });
        continue; // 删除原行
    }
    
    // 保留其他内容（含注释、空行）
    output.push(line);
}

// 合并 hostname 到末尾（严格遵循 QuantumultX 格式）
if (hostnames.length > 0) {
    output.push(""); // 空行分隔
    output.push("hostname = " + hostnames.join(", "));
}

// 返回结果（必须为数组且保留文件末尾空行）
output.push("");
output;
