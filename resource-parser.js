// == 核心解析逻辑 ==
function parse() {
    const input = $configuration?.allItems;
    if (!input) return $done({});
    
    let output = [];
    let hostSet = new Set();
    let remark = "";
    
    // 输入流处理（官方标准方法）
    const processLine = (line) => {
        const tLine = line.trim();
        if (!tLine) return;

        // 注释捕获（支持 # 和 //）
        if (/^(#|\/\/)/.test(tLine)) {
            remark = tLine.replace(/^\/\//, "#");
            return;
        }

        // Hostname处理（官方格式兼容）
        if (/^hostname\s*=/i.test(tLine)) {
            tLine.split("=")[1].split(",")
                .map(h => h.trim().replace(/^(\.|\*\.)/, ""))
                .filter(h => /[\w-]+\.[a-z]{2,}$/i.test(h))
                .forEach(h => hostSet.add(`*.${h}`));
            remark = "";
            return;
        }

        // 规则匹配（覆盖所有QX规则类型）
        const ruleReg = /^((?:http|h3)=)?(.+?)\s+(.+)/;
        if (ruleReg.test(tLine)) {
            const fullRule = remark ? `${remark}\n${tLine}` : tLine;
            output.push(fullRule);
            remark = "";
        }
    };

    // 输入管道处理
    input.forEach(item => {
        item.content.split(/\r?\n/).forEach(processLine);
    });

    // 构建输出（严格符合QX规范）
    const result = [];
    if (output.length) result.push(...output);
    if (hostSet.size) {
        result.push("", `hostname=${[...hostSet].sort().join(",")}`);
    }

    $done({ content: result.join("\n") });
}

// == 异常安全执行 ==
typeof $configuration !== "undefined" ? parse() : $done({});
