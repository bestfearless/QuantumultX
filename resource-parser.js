function parse() {
    const config = $configuration?.allItems;
    if (!config || !config.length) return $done({content: ""});

    const output = [];
    const hosts = new Set();
    let currentComment = "";

    // 输入处理管道
    config.forEach(item => {
        item.content.split(/\r?\n/).forEach(line => {
            const tline = line.trim();
            if (!tline) return;

            // 处理注释
            if (tline.startsWith("#") || tline.startsWith("//")) {
                currentComment = tline.replace("//", "#");
                return;
            }

            // 处理hostname
            if (tline.toLowerCase().startsWith("hostname")) {
                const hostPart = tline.split("=")[1] || "";
                hostPart.split(",").forEach(h => {
                    const host = h.trim()
                        .replace(/^(\.|\*\.)/, "")
                        .replace(/\.$/, "");
                    if (/^[a-z0-9-]+\.[a-z]{2,}$/i.test(host)) {
                        hosts.add(`*.${host}`);
                    }
                });
                currentComment = "";
                return;
            }

            // 匹配所有规则类型
            if (/^(http|url|h3|=)/i.test(tline)) {
                const ruleEntry = currentComment ? `${currentComment}\n${tline}` : tline;
                output.push(ruleEntry);
                currentComment = "";
            }
        });
    });

    // 构建输出
    const result = [];
    if (output.length > 0) result.push(...output);
    if (hosts.size > 0) {
        result.push("", `hostname=${[...hosts].sort().join(",")}`);
    }

    $done({ content: result.join("\n") });
}

parse();
