// Quantumult X 资源解析器脚本
// 功能：将多行 hostname 定义合并到末尾，并保留其他规则和注释

/**
 * 解析并转换 Quantumult X 规则文本。
 * @param {string} inputText - 原始规则文本。
 * @returns {string} - 转换后的规则文本。
 */
function parseAndTransformRules(inputText) {
    if (typeof inputText !== 'string') {
        console.log('输入内容非字符串，无法解析。');
        return ''; // 或者返回 inputText 以防意外
    }

    const lines = inputText.split(/\r?\n/); // 按行分割，兼容不同换行符
    const ruleLinesAndComments = []; // 存储非 hostname = ... 的行
    const hostnamesList = [];       // 存储提取的 hostname

    for (const line of lines) {
        if (line.startsWith("hostname = ")) {
            const hostnameValue = line.substring("hostname = ".length).trim();
            if (hostnameValue) { // 确保提取的 hostname 非空
                hostnamesList.push(hostnameValue);
            }
        } else {
            ruleLinesAndComments.push(line); // 保留其他行
        }
    }

    // 将规则、注释和它们之间的空行重新组合
    let outputString = ruleLinesAndComments.join("\n");

    // 如果收集到了 hostname
    if (hostnamesList.length > 0) {
        const combinedHostnameString = "hostname = " + hostnamesList.join(", ");

        // 如果 outputString 有实际内容 (不仅仅是空白符)
        if (outputString.trim().length > 0) {
            // 在现有内容和合并的 hostname 字符串之间确保有一个换行符
            outputString += "\n" + combinedHostnameString;
        } else {
            // 如果之前没有其他内容，则直接使用合并的 hostname 字符串
            outputString = combinedHostnameString;
        }
    }

    return outputString;
}

// Quantumult X 脚本执行入口
try {
    // $resource.content 是 Quantumult X 提供的资源内容
    const originalContent = $resource.content;
    
    const modifiedContent = parseAndTransformRules(originalContent);
    
    // $done() 用于返回处理结果给 Quantumult X
    // 对于资源解析器，通常直接返回修改后的文本内容
    $done(modifiedContent);

} catch (e) {
    console.log("Quantumult X 资源解析脚本发生错误: " + e.message);
    // 发生错误时，可以选择返回原始内容，或者一个空字符串/对象，
    // 以避免破坏 Quantumult X 的配置。返回原始内容通常更安全。
    if (typeof $resource !== 'undefined' && typeof $resource.content !== 'undefined') {
        $done($resource.content);
    } else {
        $done(''); // Fallback if $resource.content is not available
    }
}
