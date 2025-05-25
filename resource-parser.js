function parse() {
    const input = $configuration?.allItems;
    if (!input) return $done({ content: "" });

    let rules = [], hostnames = new Set(), remark = "";
    
    // 输入处理
    input.forEach(item => {
        item.content.split(/\r?\n/).forEach(line => {
            const tline = line.trim();
            if (!tline) return;

            // 处理注释
            if (/^(#|\/\/)/.test(tline)) {
                remark = tline.replace(/^\/\//, "#");
                return;
            }

            // 处理hostname（官方标准方法）
            if (/^hostname\s*=/i.test(tline)) {
                tline.split("=")[1]?.split(",")
                    .map(h => h.trim().replace(/^(\.|\*\.)/, ""))
                    .filter(h => /^[a-z0-9-]+\.[a-z]{2,}$/i.test(h))
                    .forEach(h => hostnames.add(`*.${h}`));
                remark = "";
                return;
            }

            // 匹配所有规则类型（覆盖官方支持类型）
            if (/^(?:http|h3|url|resource|reject|script|request-header|response-header|\/)/i.test(tline)) {
                rules.push(remark ? `${remark}\n${tline}` : tline);
                remark = "";
            }
        });
    });

    // 构建输出（严格格式校验）
    const output = [];
    if (rules.length) output.push(...rules);
    if (hostnames.size) {
        output.push(""); // 必须的空行分隔
        output.push(`hostname=${[...hostnames].sort().join(",")}`);
    }

    $done({ content: output.join("\n") });
}

parse();
