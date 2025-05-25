function parse() {
    const config = $configuration?.allItems;
    if (!config || !Array.isArray(config)) return $done({});

    const hostnames = new Set();
    const rules = [];
    let currentComment = null;

    // 输入处理管道（兼容多级嵌套）
    const lines = config
        .flatMap(item => item.content.split(/\r?\n/))
        .map(line => line.trim())
        .filter(line => line && !/^\[.*\]$/.test(line));

    // 核心解析逻辑（严格匹配官方实现）
    lines.forEach(line => {
        // 处理注释（支持 # 和 //）
        if (/^(#|\/\/)/.test(line)) {
            currentComment = line.replace(/^\/\//, '#');
            return;
        }

        // 处理 Hostname（兼容 = 前后空格）
        if (/^hostname\s*=/i.test(line)) {
            line.split('=')[1]?.split(',')
                .map(h => h.trim().replace(/^(\.|\*\.?)+/, ''))
                .filter(h => /^[a-z0-9-]+\.[a-z]{2,}$/i.test(h))
                .forEach(h => hostnames.add(`*.${h}`));
            currentComment = null;
            return;
        }

        // 匹配所有规则类型（包括 h3=、script 等）
        const ruleMatch = line.match(/^(?:(http|h3)=)?([^\s]+)(?:\s+)(.+)/);
        if (ruleMatch) {
            const [_, prefix, pattern, policy] = ruleMatch;
            const fullRule = prefix ? `${prefix}=${pattern} ${policy}` : line;
            const formattedRule = currentComment ? `${currentComment}\n${fullRule}` : fullRule;
            rules.push(formattedRule);
            currentComment = null;
        }
    });

    // 构建输出（强制符合官方格式）
    const output = [];
    if (rules.length > 0) output.push(...rules);
    if (hostnames.size > 0) {
        output.push('', `hostname=${[...hostnames].sort().join(',')}`);
    }

    $done({ content: output.join('\n') });
}

parse();
