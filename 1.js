function parse() {
    const input = $configuration;
    if (!input || !input.allItems) return $done({});
    
    let output = [];
    let hosts = [];
    let remark = "";
    
    // 标准输入处理流程
    try {
        input.allItems.forEach(item => {
            item.content.split("\n").forEach(line => {
                const tline = line.trim();
                
                // 处理注释行
                if (/^(#|\/\/)/.test(tline)) {
                    remark = tline.replace(/^\/\//, "#");
                    return;
                }
                
                // 处理hostname
                if (/^hostname\s*=/i.test(tline)) {
                    tline.split("=")[1].split(",").forEach(h => {
                        const th = h.trim()
                            .replace(/^(\.|\*\.)/, "")
                            .replace(/\.$/, "");
                        if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(th)) {
                            hosts.push("*." + th);
                        }
                    });
                    return;
                }
                
                // 处理规则行
                if (/^(http|\^http|h3=|url\s)/.test(tline)) {
                    let ruleEntry = "";
                    if (remark) {
                        ruleEntry += remark + "\n";
                        remark = "";
                    }
                    ruleEntry += tline;
                    output.push(ruleEntry);
                }
            });
        });
    } catch (e) {
        console.log("Parser Error: " + e);
    }
    
    // 构建最终输出
    const result = {
        content: output.join("\n")
    };
    
    if (hosts.length > 0) {
        result.content += "\nhostname=" + [...new Set(hosts)].join(",");
    }
    
    $done(result);
}

// 必须立即执行
parse();
