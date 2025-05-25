function parse() {
    const commentRegex = /^#.*/;
    const hostnameRegex = /^hostname\s*=\s*([^\s,]+[,]?)+/;
    const ruleRegex = /^(^http.+?) (url|reject|reject-dict|reject-array|reject-200|request-header|response-header|rewrite|script-response-body|script-request-header|script-echo-response)/;
    
    let currentComment = "";
    let hostnames = new Set();
    let rules = [];
    let processed = new Set();
    
    $configuration.allItems
        .map(item => item.content)
        .join("\n")
        .split("\n")
        .forEach(line => {
            let trimmed = line.trim();
            if (!trimmed || processed.has(trimmed)) return;

            processed.add(trimmed);
            
            if (commentRegex.test(trimmed)) {
                currentComment = trimmed;
            } else if (hostnameRegex.test(trimmed)) {
                trimmed.split("=")[1]
                    .split(",")
                    .map(h => h.trim())
                    .filter(h => h)
                    .forEach(h => hostnames.add(h));
            } else if (ruleRegex.test(trimmed)) {
                if (currentComment) {
                    rules.push({comment: currentComment, rule: trimmed});
                    currentComment = "";
                }
            }
        });

    let result = [];
    rules.forEach(r => {
        result.push(r.comment + "\n" + r.rule);
    });

    if (hostnames.size > 0) {
        result.push("\nhostname = " + [...hostnames].join(", "));
    }

    $done(result.join("\n"));
}

// 重要：QuantumultX 需要最后执行函数
parse();
