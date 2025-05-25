function parse() {
    const config = $configuration?.allItems;
    if (!config) return $done({});
    
    const hostnames = new Set();
    const rules = [];
    let currentComment = '';
    
    // 多级内容提取
    const rawText = config
        .flatMap(item => item.content
            .split(/\r?\n/)
            .map(line => line.trim())
        )
        .filter(line => line && !/^\[.*\]$/.test(line)); // 过滤[section]标记

    rawText.forEach(line => {
        // 捕获带#或//的注释
        if (/^(#|\/\/)/.test(line)) {
            currentComment = line.replace(/^\/\//, '#');
            return;
        }

        // 处理带通配符的hostname
        if (/^hostname\s*=/i.test(line)) {
            line.split('=')[1]
                ?.split(',')
                .map(h => h.trim().replace(/^(\.\*?|\*\.)/, '')) // 标准化hostname
                .filter(h => h.includes('.'))
                .forEach(h => hostnames.add(h));
            currentComment = '';
            return;
        }

        // 匹配所有支持的规则类型
        if (/^(?:http|h[23]?|^[^\s=]+)=?/.test(line)) {
            const formattedRule = currentComment ? `${currentComment}\n${line}` : line;
            if (!rules.includes(formattedRule)) {
                rules.push(formattedRule);
            }
            currentComment = '';
        }
    });

    // 构建最终输出
    const output = [];
    if (rules.length) output.push(...rules);
    if (hostnames.size) {
        output.push('', `hostname=${[...hostnames].map(h => `*.${h}`).join(',')}`);
    }

    $done({content: output.join('\n')});
}

parse();
