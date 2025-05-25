function parse() {
    const config = $configuration?.allItems;
    if (!config) return $done({});

    const hostnames = new Set();
    const rules = [];
    let currentComment = "";

    // 输入处理管道
    config.forEach(item => {
        item.content.split(/\r?\n/).forEach(line => {
            const tline = line.trim();
            if (!tline) return;

            // 处理注释
            if (/^(#|\/\/)/.test(tline)) {
                currentComment = tline.replace(/^\/\//, "#");
                return;
            }

            // 处理hostname
            if (/^hostname\s*=/i.test(tline)) {
                tline.split("=")[1]?.split(",")
                    .map(h => h.trim().replace(/^(\.|\*\.?)+/, ""))
                    .filter(h => /^[a-z0-9-]+\.[a-z]{2,}$/i.test(h))
                    .forEach(h => hostnames.add(`*.${h}`));
                currentComment = "";
                return;
            }

            // 匹配所有规则
            if (/^(?:https?|h3|=)/i.test(tline)) {
                const rule = currentComment ? `${currentComment}\n${tline}` : tline;
                rules.push(rule);
                currentComment = "";
            }
        });
    });

    // 构建输出
    const output = [];
    if (rules.length) output.push(...rules);
    if (hostnames.size) {
        output.push("", `hostname=${[...hostnames].sort().join(",")}`);
    }

    $done({ content: output.join("\n") });
}

parse();
