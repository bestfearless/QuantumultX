// 主机名处理（仅合并多行，去除过滤逻辑）
function HostNamecheck(content) {
    // 1. 合并所有 hostname 行（兼容 hostname =、HostName= 等格式）
    const hostLines = content.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => /^hostname\s*=/i.test(line));

    // 2. 提取所有主机名并去重
    let allHnames = [];
    for (const line of hostLines) {
        const [, value] = line.split(/hostname\s*=\s*/i);
        if (value) {
            const values = value.split(',').map(v => v.trim()).filter(Boolean);
            allHnames.push(...values);
        }
    }
    allHnames = [...new Set(allHnames)]; // 去重

    // 3. 直接返回合并后的 hostname（跳过所有过滤和通知）
    return allHnames.length > 0 ? `hostname = ${allHnames.join(", ")}` : "";
}
