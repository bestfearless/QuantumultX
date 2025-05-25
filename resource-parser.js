function parse() {
    const isStrict = false; // 是否严格模式
    const target = $configuration;
    const hostnames = new Set();
    const rules = [];
    const comments = new Map();
    
    let currentComment = "";
    let lineIndex = 0;

    // 输入预处理
    const content = target.allItems
        .map(item => item.content)
        .join("\n")
        .split(/\r?\n/)
        .map(line => line.replace(/#.*|\/\*[\s\S]*?\*\//g, "").trim()) // 清理注释
        .filter(line => line !== "");

    // 核心解析逻辑
    while (lineIndex < content.length) {
        const line = content[lineIndex];
        
        // 捕获注释
        if (line.startsWith("#")) {
            currentComment = line;
            lineIndex++;
            continue;
        }

        // 处理hostname
        if (line.toLowerCase().startsWith("hostname")) {
            const hosts = line.split("=")[1]
                .split(",")
                .map(h => h.trim())
                .filter(h => h !== "");
            hosts.forEach(h => hostnames.add(h));
            lineIndex++;
            continue;
        }

        // 处理规则行
        const ruleComponents = line.match(/^([^ ]+) +(\S+)(?: +(\S+))?/);
        if (ruleComponents) {
            const [_, pattern, policy, args] = ruleComponents;
            if (isValidRule(pattern, policy)) {
                const ruleEntry = currentComment 
                    ? `${currentComment}\n${line}` 
                    : line;
                rules.push(ruleEntry);
                if (currentComment) comments.set(line, currentComment);
            }
            currentComment = "";
            lineIndex++;
            continue;
        }

        lineIndex++;
    }

    // 构建最终结果
    const result = [];
    if (rules.length > 0) {
        result.push(...[...new Set(rules)]); // 规则去重
    }
    if (hostnames.size > 0) {
        result.push("\nhostname=" + [...hostnames].filter(Boolean).join(","));
    }

    $done({ content: result.join("\n") });
}

// 有效性验证函数
function isValidRule(pattern, policy) {
    const validPolicies = new Set([
        "reject", "reject-200", "reject-dict", 
        "reject-array", "request-header", 
        "response-header", "script-response-body",
        "script-request-header", "script-echo-response"
    ]);
    
    return pattern.startsWith("^http") && 
           validPolicies.has(policy) && 
           /^https?:\/\/(.*?)(\/|$)/.test(pattern);
}

// 必须调用parse函数
parse();
