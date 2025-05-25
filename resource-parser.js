// == 严格遵循 QX 规范的解析器 ==
function parse() {
    // 输入校验（防御性编程）
    if (typeof $configuration === "undefined" || !Array.isArray($configuration.allItems)) {
        return $done({ content: "" });
    }

    // 数据结构初始化
    const result = {
        rules: [],
        hostnames: new Set(),
        currentRemark: ""
    };

    // 输入处理管道（兼容多平台换行符）
    $configuration.allItems.forEach(item => {
        item.content.split(/\r?\n/).forEach(line => {
            const tline = line.trim();
            if (!tline) return;

            // 注释捕获（支持 # 和 //）
            if (/^(#|\/\/)/.test(tline)) {
                result.currentRemark = tline.replace(/^\/\//, "#");
                return;
            }

            // Hostname 处理（官方标准）
            if (/^hostname\s*=/i.test(tline)) {
                tline.split("=")[1]?.split(",")
                    .map(h => h.trim().replace(/^(\.|\*\.)/, ""))
                    .filter(h => /^[\w-]+\.[a-z]{2,}$/i.test(h))
                    .forEach(h => result.hostnames.add(`*.${h}`));
                result.currentRemark = "";
                return;
            }

            // 规则匹配（覆盖所有 QX 规则类型）
            const ruleMatch = tline.match(/^((?:http|h3)=)?([^\s]+)\s+(\S+)(?:\s+(.*))?/);
            if (ruleMatch) {
                const rule = ruleMatch[0]; // 完整规则
                result.rules.push(result.currentRemark ? `${result.currentRemark}\n${rule}` : rule);
                result.currentRemark = "";
            }
        });
    });

    // == 输出构建（关键修正点）==
    const output = [];
    
    // 1. 添加规则（确保每条规则独立）
    if (result.rules.length > 0) {
        output.push(...result.rules);
    }
    
    // 2. 添加 hostname（强制空行分隔）
    if (result.hostnames.size > 0) {
        output.push(""); // 必须的空行
        output.push(`hostname=${[...result.hostnames].sort().join(",")}`);
    }

    // == 最终返回（严格格式）==
    $done({
        content: output.join("\n") // 用 \n 不是 \r\n
    });
}

// == 异常安全启动 ==
(typeof $configuration !== "undefined") ? parse() : $done({ content: "" });
