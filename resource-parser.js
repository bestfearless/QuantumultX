function parse() {
    // 输入数据完整性校验
    if (!$configuration || !Array.isArray($configuration.allItems)) {
        return $done({});
    }

    const result = {
        rules: [],
        hostnames: new Set(),
        currentComment: null
    };

    // 官方标准输入处理管道
    try {
        $configuration.allItems.forEach(item => {
            item.content.split(/\r?\n/).forEach(processLine);
        });
    } catch (e) {
        console.log(`解析失败: ${e.message}`);
        return $done({});
    }

    function processLine(rawLine) {
        const line = rawLine.trim();
        if (!line) return;

        // 处理注释（严格兼容官方格式）
        if (/^[#;]/.test(line)) {
            result.currentComment = line.replace(/^[#;]+/, '#');
            return;
        }

        // 处理hostname（官方兼容格式）
        if (/^hostname\s*=/i.test(line)) {
            const hosts = line.split('=')[1]
                .split(',')
                .map(h => h.trim().replace(/^(\.|\*\.?)+|\.+$/g, '')) // 标准化处理
                .filter(h => /^[a-z0-9-]+\.[a-z]{2,}$/i.test(h)) // 域名有效性验证
                .map(h => `*.${h}`);
            
            hosts.forEach(h => result.hostnames.add(h));
            result.currentComment = null;
            return;
        }

        // 匹配所有规则类型（官方正则）
        const ruleMatch = line.match(/^((?:http|h[23]?)=)?([^\s]+)(\s+)(\S+)(\s+)?([^\n]*)/);
        if (ruleMatch) {
            const [_, prefix, pattern, , policy, __, args] = ruleMatch;
            const rule = prefix ? 
                `${prefix}${pattern} ${policy}${args ? ` ${args}` : ''}` : 
                `${pattern} ${policy}${args ? ` ${args}` : ''}`;

            // 构建带注释的规则
            if (result.currentComment) {
                result.rules.push(`${result.currentComment}\n${rule}`);
                result.currentComment = null;
            } else {
                result.rules.push(rule);
            }
        }
    }

    // 构建最终输出（官方格式要求）
    const output = [];
    if (result.rules.length) {
        output.push(...result.rules);
    }
    if (result.hostnames.size) {
        output.push('', `hostname=${[...result.hostnames].sort().join(',')}`);
    }

    // 严格遵循官方输出规范
    $done({ content: output.join('\n') });
}

// 异常安全执行
try {
    parse();
} catch (e) {
    console.log(`致命错误: ${e.stack}`);
    $done({});
}
