function parse() {
    const config = $configuration?.allItems;
    if (!config) return $done({});
    
    const hostnames = new Set();
    const rules = [];
    let currentComment = [];
    
    // 深度处理原始数据
    const processLine = (line) => {
        line = line.trim().replace(/^\s*#.*|\/\*[\s\S]*?\*\//g, ''); // 清理行内注释
        
        if (!line) return;
        
        // 捕获多行注释
        if (/^#|^\/\//.test(line)) {
            currentComment.push(line.replace(/^\/\//, '#'));
            return;
        }
        
        // 处理hostname (支持所有通配符格式)
        if (/^hostname\s*=\s*/i.test(line)) {
            line.split('=')[1]
                .split(',')
                .map(h => h.trim().replace(/^(\.|\*\.?)+|\.+$/g, '')) // 标准化处理
                .filter(h => h && /^[a-zA-Z0-9-.]+\.[a-zA-Z]{2,}$/.test(h))
                .forEach(h => hostnames.add(`*.${h}`));
            currentComment = [];
            return;
        }
        
        // 完整规则解析 (支持所有QX规则类型)
        const ruleMatch = line.match(/^((?:http|h[23]?)=)?([^\s]+)(\s+)([^\s]+)(\s+)?([^\n]*)/);
        if (ruleMatch) {
            const [_, prefix, pattern, , policy, __, args] = ruleMatch;
            const fullRule = prefix ? 
                `${prefix}${pattern} ${policy}${args ? ' ' + args : ''}` : 
                `${pattern} ${policy}${args ? ' ' + args : ''}`;
            
            // 构建带注释的规则
            if (currentComment.length > 0) {
                rules.push(currentComment.join('\n') + '\n' + fullRule);
                currentComment = [];
            } else {
                rules.push(fullRule);
            }
        }
    };
    
    // 多层数据解构
    config.forEach(item => {
        item.content
            .split(/\r?\n/g)
            .map(line => line.trim())
            .filter(line => !/^\[.*\]$/.test(line)) // 过滤[section]标签
            .forEach(processLine);
    });
    
    // 构建最终输出
    const output = [];
    if (rules.length > 0) {
        output.push(...new Set(rules)); // 严格去重
    }
    if (hostnames.size > 0) {
        output.push('', `hostname=${[...hostnames].sort().join(',')}`);
    }
    
    $done({content: output.join('\n')});
}

// 必须立即执行
parse();
