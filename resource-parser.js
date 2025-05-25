function parse() {
    const target = $configuration;
    if (!target || !target.allItems) return $done({});
    
    const allHosts = new Set();
    const rules = [];
    let currentComment = '';
    let currentLine = '';
    
    // 严格遵循官方输入处理方式
    const rawData = target.allItems
        .map(item => item.content)
        .join('\n')
        .split(/\r?\n/);

    for (const line of rawData) {
        currentLine = line.trim();
        if (!currentLine) continue;

        // 处理注释 (支持#和//两种格式)
        if (/^(#|\/\/)/.test(currentLine)) {
            currentComment = currentLine.replace(/^[#\/]+/, '#');
            continue;
        }

        // 处理hostname (兼容=前后空格)
        if (/^hostname\s*=/i.test(currentLine)) {
            currentLine.split('=')[1]
                .split(',')
                .map(h => h.trim().replace(/^\.+|\.+$/g, '')) // 处理.example.com.
                .filter(h => h && /^[a-z0-9-\.]+$/.test(h))
                .forEach(h => allHosts.add(h));
            currentComment = '';
            continue;
        }

        // 严格验证规则格式 (官方核心逻辑)
        const ruleMatch = currentLine.match(/^((?:http|^[a-z]+)=)?((https?|h[23]?)[^\s]*)(\s+)(.*)/);
        if (ruleMatch) {
            const [_, prefix, pattern, protocol, , policy] = ruleMatch;
            const fullRule = prefix ? `${prefix}${pattern}${policy}` : `${pattern}${policy}`;
            
            // 生成带注释的规则
            const finalRule = currentComment ? `${currentComment}\n${fullRule}` : fullRule;
            
            // 去重处理
            if (!rules.includes(finalRule)) {
                rules.push(finalRule);
            }
            currentComment = '';
        }
    }

    // 构建最终结果 (官方输出格式)
    const result = [];
    if (rules.length > 0) {
        result.push(...rules);
    }
    if (allHosts.size > 0) {
        result.push('', `hostname=${[...allHosts].sort().join(',')}`);
    }

    $done({ content: result.join('\n') });
}

// QuantumultX强制要求立即执行
parse();
