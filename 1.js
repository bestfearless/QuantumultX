function transformQuantumultXRules(inputText) {
    // 使用正则表达式 \r?\n 来分割行，以兼容 Windows (CRLF) 和 Unix (LF) 换行符
    const lines = inputText.split(/\r?\n/);
    
    const ruleLinesAndComments = [];
    const hostnamesList = [];
    
    for (const line of lines) {
        // 检查行是否以 "hostname = " 开头
        if (line.startsWith("hostname = ")) {
            try {
                // 提取等号 (=) 后面的主机名部分，并去除首尾空格
                const hostnameValue = line.substring(line.indexOf("=") + 1).trim();
                if (hostnameValue) { // 确保主机名非空
                    hostnamesList.push(hostnameValue);
                } else {
                    // 如果 "hostname = " 后面没有值，也当作普通行处理
                    ruleLinesAndComments.push(line);
                }
            } catch (e) {
                // 如果在解析 "hostname = " 行时发生错误（理论上 substring 和 trim 不会轻易出错）
                // 为了稳健性，也将其视为普通行
                ruleLinesAndComments.push(line);
            }
        } else {
            // 其他所有行（注释、规则、空行等）都按原样添加到列表中
            ruleLinesAndComments.push(line);
        }
    }
    
    // 在添加合并的 hostname 行之前，移除 ruleLinesAndComments 末尾可能存在的空行
    // 这确保了 hostname 行紧随最后一个有效规则/注释之后，除非原始输入本身在规则块之间有特定空行
    while (ruleLinesAndComments.length > 0 && ruleLinesAndComments[ruleLinesAndComments.length - 1].trim() === "") {
        ruleLinesAndComments.pop();
    }
    
    // 如果收集到了主机名，则将它们合并并添加到输出列表的末尾
    if (hostnamesList.length > 0) {
        const combinedHostnameString = "hostname = " + hostnamesList.join(", ");
        ruleLinesAndComments.push(combinedHostnameString);
    }
    
    return ruleLinesAndComments.join("\n");
}
