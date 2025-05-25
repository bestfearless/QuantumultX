// 最终验证通过的解析器代码
function parse() {
    if (!$configuration?.allItems) return $done({});
    
    const output = [];
    const hosts = new Set();
    let comment = "";
    
    $configuration.allItems.forEach(item => {
        item.content.split(/\r?\n/).forEach(line => {
            const tline = line.trim();
            if (!tline) return;

            // 捕获注释
            if (/^(#|\/\/)/.test(tline)) {
                comment = tline.replace(/^\/\//, "#");
                return;
            }

            // 处理hostname
            if (/^hostname\s*=/i.test(tline)) {
                tline.split("=")[1].split(",").forEach(h => {
                    const host = h.trim().replace(/^(\.|\*\.)/, "");
                    if (/^[a-z0-9-]+\.[a-z]{2,}$/i.test(host)) {
                        hosts.add(`*.${host}`);
                    }
                });
                comment = "";
                return;
            }

            // 匹配规则
            if (/^(?:http|h3|=|\^)/i.test(tline)) {
                output.push(comment ? `${comment}\n${tline}` : tline);
                comment = "";
            }
        });
    });

    // 构建结果
    const result = [];
    if (output.length) result.push(...output);
    if (hosts.size) result.push("", `hostname=${[...hosts].sort().join(",")}`);
    
    $done({ content: result.join("\n") });
}

parse();
