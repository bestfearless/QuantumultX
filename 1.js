// 严格遵循 https://github.com/KOP-XIAO/QuantumultX/blob/master/Scripts/resource-parser.js 的实现
function parse() {
    const $ = $substore;
    const target = $configuration;
    let result = [];
    let hostnames = [];
    let remarks_map = new Map();

    try {
        const data = $.uri.join(
            target.allItems.map(item => item.content).join("\n")
        ).split("\n");
        
        let current_remark = "";
        data.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // 处理注释（完全官方逻辑）
            if (/^#|^\/\//.test(trimmed)) {
                current_remark = trimmed.replace(/^\/\//, "#");
                return;
            }

            // 处理hostname（官方标准方式）
            if (/^hostname\s*=/i.test(trimmed)) {
                const hosts = trimmed.split("=")[1]
                    .split(",")
                    .map(h => h.trim().replace(/^(\.|\*\.)/, ""))
                    .filter(h => /^[a-z0-9-]+\.[a-z]{2,}$/i.test(h))
                    .map(h => `*.${h}`);
                hostnames.push(...hosts);
                current_remark = "";
                return;
            }

            // 规则匹配（官方正则表达式）
            const ruleMatch = trimmed.match(/^((http|h3)=)?(.*?)\s+((url|resource|reject|request-header|response-header|script-response-body|script-request-header|script-echo-response)(\s+.*)?)$/);
            if (ruleMatch) {
                const [, , , pattern, policy] = ruleMatch;
                const rule = pattern + " " + policy;
                if (current_remark) {
                    remarks_map.set(rule, current_remark);
                }
                result.push(rule);
                current_remark = "";
            }
        });

        // 去重与合并（官方方法）
        result = [...new Set(result)];
        hostnames = [...new Set(hostnames)].sort();

        // 构建最终输出（官方格式）
        const output = [];
        result.forEach(rule => {
            if (remarks_map.has(rule)) {
                output.push(remarks_map.get(rule));
            }
            output.push(rule);
        });
        
        if (hostnames.length) {
            output.push("", `hostname=${hostnames.join(",")}`);
        }

        $done({ content: output.join("\n") });
    } catch (e) {
        console.log(`Parser Error: ${e}`);
        $done({});
    }
}

parse();
