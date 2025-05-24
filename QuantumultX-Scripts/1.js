// ====== 完整替换解析器内容 ======
var output = [];
var hostnames = new Set();

// 严格处理每行内容
var lines = content.split("\n");
for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var trimmed = line.trim();
    
    // 捕获 hostname 行
    if (/^hostname\s*=/i.test(trimmed)) {
        var domains = trimmed.split(/hostname\s*=\s*/i)[1] || "";
        domains.split(",").forEach(d => {
            var domain = d.trim();
            if (domain) hostnames.add(domain);
        });
        continue; // 跳过原始 hostname 行
    }
    
    // 保留非空原始行（包括注释和规则）
    if (line !== "") {
        output.push(line);
    }
}

// 合并 hostname 到末尾（严格遵循格式）
if (hostnames.size > 0) {
    output.push(""); // 空行分隔
    output.push("hostname = " + Array.from(hostnames).join(", "));
}

// 返回结果（必须保留文件末尾空行）
output.push("");
output;
