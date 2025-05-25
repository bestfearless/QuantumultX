// == QuantumultX 解析器标准模板 ==
function parse() {
    // 输入验证
    if (typeof $configuration === "undefined" || !Array.isArray($configuration.allItems)) {
        return $done({ content: "" });
    }

    const output = [];
    const hostnames = new Set();
    let currentRemark = "";

    // 输入处理管道
    $configuration.allItems.forEach(item => {
        item.content.split(/\r?\n/).forEach(line => {
            const tline = line.trim();
            if (!tline) return;

            // 阶段 1: 处理注释
            if (/^(#|\/\/)/.test(tline)) {
                currentRemark = tline.replace(/^\/\//, "#");
                return;
            }

            // 阶段 2: 处理hostname
            if (/^hostname\s*=/i.test(tline)) {
                tline.split("=")[1]?.split(",")
                    .map(h => h.trim().replace(/^(\.|\*\.)/, ""))
                    .filter(h => /^[a-z0-9-]+\.[a-z]{2,}$/i.test(h))
                    .forEach(h => hostnames.add(`*.${h}`));
                currentRemark = "";
                return;
            }

            // 阶段 3: 处理规则（覆盖所有类型）
            const rulePatterns = [
                /^(?:http|h3)=/i,        // 协议指定规则
                /^url\s+/i,              // 基础URL规则
                /^resource\s+/i,         // 资源类型
                /^(?:reject|reject-)/i, // 拒绝策略
                /^script-/i,            // 脚本类规则
                /^request-header/i,      // 请求头修改
                /^response-header/i,     // 响应头修改
                /^\//i                   // 路径匹配规则
            ];

            if (rulePatterns.some(pattern => pattern.test(tline))) {
                const rule = currentRemark ? `${currentRemark}\n${tline}` : tline;
                output.push(rule);
                currentRemark = "";
            }
        });
    });

    // 构建输出（严格遵循格式）
    const result = [];
    if (output.length > 0) {
        result.push(...output);
    }
    if (hostnames.size > 0) {
        result.push(""); // 必须的空行分隔
        result.push(`hostname=${[...hostnames].sort().join(",")}`);
    }

    // 最终返回（强制格式校验）
    $done({ content: result.join("\n") });
}

// == 必须的启动代码 ==
typeof $configuration !== "undefined" ? parse() : $done({ content: "" });
