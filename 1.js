function parse() {
    const $ = {
        // 输入预处理（官方方法）
        readInput: () => {
            if (typeof $configuration === "undefined") return [];
            return $configuration.allItems.flatMap(item => 
                item.content.split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(line => line)
            );
        },
        
        // hostname处理（官方标准）
        processHostname: (line) => {
            const hosts = line.split("=")[1]
                .split(",")
                .map(h => h.trim().replace(/^(\.|\*\.)/, ""))
                .filter(h => /^[\w-]+\.[a-z]{2,}$/i.test(h))
                .map(h => `*.${h}`);
            return [...new Set(hosts)];
        },
        
        // 规则验证（覆盖所有类型）
        isRuleValid: (line) => {
            return [
                /^(http|h3)=/i,
                /^url\s+/i,
                /^resource\s+/i,
                /^(reject|reject-)/i,
                /^script-/i,
                /^request-header/i,
                /^response-header/i,
                /^\//i
            ].some(pattern => pattern.test(line));
        }
    };

    // == 主逻辑 ==
    try {
        const lines = $.readInput();
        let remarks = [], rules = [], hostnames = [];
        let currentRemark = "";
        
        lines.forEach(line => {
            // 处理注释
            if (/^(#|\/\/)/.test(line)) {
                currentRemark = line.replace(/^\/\//, "#");
                return;
            }
            
            // 处理hostname
            if (/^hostname\s*=/i.test(line)) {
                hostnames.push(...$.processHostname(line));
                currentRemark = "";
                return;
            }
            
            // 处理规则
            if ($.isRuleValid(line)) {
                rules.push(currentRemark ? `${currentRemark}\n${line}` : line);
                currentRemark = "";
            }
        });
        
        // == 输出构建（关键修正点）==
        const output = [];
        // 1. 添加规则（必须在前）
        if (rules.length) output.push(...rules);
        // 2. 添加hostname（必须空行分隔）
        if (hostnames.length) {
            output.push(""); // 强制空行
            output.push(`hostname=${[...new Set(hostnames)].sort().join(",")}`);
        }
        
        // == 最终返回（严格验证）==
        $done({ content: output.join("\n").replace(/\r/g, "") }); // 清除所有 \r
    } catch (e) {
        $done({ content: "" });
    }
}

// == 必须的启动代码 ==
typeof $configuration !== "undefined" ? parse() : $done({ content: "" });
