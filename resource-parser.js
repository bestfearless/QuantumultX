function parse() {
    const config = $configuration?.allItems;
    if (!config) return $done({});

    const hostnames = new Set();
    const rules = [];
    let currentComment = "";

    // 输入处理（兼容多行拼接）
    const rawLines = config
        .map(item => item.content.split(/\r?\n/))
        .flat()
        .map(line => line.trim())
        .filter(line => line && !/^\[.*\]$/.test(line));

    // 核心解析逻辑
    rawLines.forEach(line => {
        if (/^#|^\/\//.test(line)) {
            currentComment = line.replace(/^\/\//, "#");
            return;
        }

        if (/^hostname\s*=/i.test(line)) {
            line.split("=")[1]?.split(",")
                .map(h => h.trim().replace(/^(\.|\*\.?)+/, ""))
                .filter(h => /^[a-z0-9-.]+\.[a-z]{2,}$/i.test(h))
                .forEach(h => hostnames.add(`*.${h}`));
            currentComment = "";
            return;
        }

        const ruleMatch = line.match(/^(?:url\s+)?(https?:\/\/[^\s]+)\s+(.+)/);
        if (ruleMatch) {
            const [_, pattern, policy] = ruleMatch;
            const rule = currentComment ? `${currentComment}\n${line}` : line;
            rules.push(rule);
            currentComment = "";
        }
    });

    // 构建输出（严格遵循官方格式）
    const output = [];
    if (rules.length) output.push(...rules);
    if (hostnames.size) {
        output.push("", `hostname=${[...hostnames].sort().join(",")}`);
    }

    $done({ content: output.join("\n") });
}

parse();
