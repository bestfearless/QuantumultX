// 处理逻辑：合并所有 hostname 行到末尾
var output = content.split("\n").filter(line => {
    const trimmed = line.trim();
    // 捕获 hostname 行并收集域名
    if (/^\s*hostname\s*=/i.test(trimmed)) {
        const domains = trimmed.split(/hostname\s*=\s*/i)[1] || "";
        domains.split(",").forEach(d => {
            const domain = d.trim();
            if (domain) hostnames.push(domain);
        });
        return false; // 删除原 hostname 行
    }
    return true; // 保留其他行
});

// 去重并合并 hostname
var hostnames = [...new Set(hostnames)];
if (hostnames.length > 0) {
    output.push(""); // 空行分隔
    output.push("hostname = " + hostnames.join(", "));
}

// 返回结果（必须为数组且保留原始换行）
output;
