function parse() {
    const $ = $substore;
    const target = $configuration.allItems;
    if (!target) return $done({});

    const result = {
        rules: [],
        hostnames: new Set(),
        comments: new Map()
    };

    // 多级输入处理管道
    const contentStream = target
        .map(item => item.content.split(/\r?\n/)) // 支持跨平台换行符
        .flat()
        .map(line => line.replace(/(^\s+|\s+$)/g, "")) // 彻底清理空格
        .filter(line => !/^\[.*\]$/.test(line)); // 过滤[section]标签

    // 状态追踪器
    let context = {
        currentComment: [],
        inMultiLineComment: false,
        hostnamePhase: false
    };

    // 核心解析逻辑
    contentStream.forEach(line => {
        // 处理多行注释块
        if (/\/\*/.test(line)) {
            context.inMultiLineComment = true;
            line = line.replace(/^\/\*+/, "");
        }
        if (context.inMultiLineComment) {
            if (/\*\//.test(line)) {
                line = line.replace(/\*\/.*/, "");
                context.inMultiLineComment = false;
            } else {
                return;
            }
        }

        // 注释捕获(支持# // ;三种格式)
        if (/^(#|\/\/|;)/.test(line)) {
            context.currentComment.push(line.replace(/^[#\/;]+/, "#"));
            return;
        }

        // Hostname处理(官方标准方式)
        if (/^hostname\s*=/i.test(line)) {
            line.split("=")[1]
                .split(",")
                .map(h => h.trim().replace(/^(\*\.|\.)|\.$/g, "")) // 标准化处理
                .filter(h => /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(h)) // 严格域名验证
                .forEach(h => result.hostnames.add(`*.${h}`));
            attachCommentToNextRule(context, result);
            return;
        }

        // 完整规则解析(兼容所有QX语法)
        const ruleMatch = line.match(/^((?:http|h[23]?)=)?([^\s]+)(\s+)([^\s]+)(\s+)?([^\n]*)/);
        if (ruleMatch) {
            const [_, prefix, pattern, , policy, __, args] = ruleMatch;
            const fullRule = prefix ? 
                `${prefix}${pattern} ${policy}${args ? ` ${args}` : ""}` : 
                `${pattern} ${policy}${args ? ` ${args}` : ""}`;

            if (context.currentComment.length > 0) {
                result.comments.set(fullRule, [...context.currentComment]);
            }
            result.rules.push(fullRule);
            attachCommentToNextRule(context, result);
        }
    });

    // 构建最终输出结构
    const output = [];
    result.rules.forEach(rule => {
        if (result.comments.has(rule)) {
            output.push(result.comments.get(rule).join("\n"));
        }
        output.push(rule);
    });

    if (result.hostnames.size > 0) {
        output.push(""); // 添加空行分隔
        output.push(`hostname=${[...result.hostnames].sort().join(",")}`);
    }

    $done({ content: output.join("\n") });
}

// 注释关联处理函数
function attachCommentToNextRule(context, result) {
    if (context.currentComment.length > 0) {
        result.latestComment = [...context.currentComment];
        context.currentComment = [];
    }
}

// 必须立即执行
try {
    parse();
} catch (e) {
    $done({}); // 确保异常时返回空对象
}
