function parse() {
    // 输入数据校验
    if (typeof $configuration === 'undefined' || !$configuration.allItems) {
        $done({});
        return;
    }

    const allHostnames = new Set();
    const ruleSet = new Set();
    let currentComment = '';
    
    // 官方标准输入处理方式
    const lines = $configuration.allItems
        .map(item => item.content)
        .join('\n')
        .split(/\r?\n/)
        .map(line => line.trim());
    
    // 核心解析逻辑
    lines.forEach(line => {
        if (!line) return;
        
        // 捕获注释
        if (line.startsWith('#')) {
            currentComment = line;
            return;
        }
        
        // 处理hostname
        if (line.toLowerCase().startsWith('hostname')) {
            line.split('=')[1]
                ?.split(',')
                .map(h => h.trim())
                .filter(h => h)
                .forEach(h => allHostnames.add(h));
            currentComment = '';
            return;
        }
        
        // 严格验证规则格式
        if (/^https?:\/\//.test(line)) {
            const [_, policy] = line.split(/(url\s+[^\s]+)/);
            if (!policy) return;
            
            const formattedRule = currentComment 
                ? `${currentComment}\n${line}`
                : line;
            
            ruleSet.add(formattedRule);
            currentComment = '';
        }
    });
    
    // 构建最终结果
    const result = [];
    if (ruleSet.size > 0) {
        result.push(...Array.from(ruleSet));
    }
    if (allHostnames.size > 0) {
        result.push('\nhostname=' + Array.from(allHostnames).join(','));
    }
    
    $done({content: result.join('\n')});
}

// QuantumultX 必须调用入口函数
parse();
