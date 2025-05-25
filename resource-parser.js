function transformQuantumultXRules(inputText) {
    // 使用正则表达式 \r?\n 来分割行，以兼容 Windows (CRLF) 和 Unix (LF) 换行符
    const lines = inputText.split(/\r?\n/);
    
    const ruleLinesAndComments = []; // 用于存储非 hostname 指令的行（规则、注释、空行等）
    const hostnamesList = [];       // 用于存储从 hostname 指令中提取的主机名

    for (const line of lines) {
        // 检查当前行是否以 "hostname = " 开头
        // 注意：示例格式中 "hostname" 和 "=" 及值之间有空格，此检查基于该格式
        if (line.startsWith("hostname = ")) {
            // 提取 "hostname = " 后面的部分作为主机名，并去除首尾可能存在的空格
            const hostnameValue = line.substring("hostname = ".length).trim();
            if (hostnameValue) { // 确保提取的主机名非空
                hostnamesList.push(hostnameValue);
            }
            // 如果 "hostname = " 后面没有值（例如 "hostname =  "），则 hostnameValue 会是空字符串，不会被添加
        } else {
            // 如果不是 hostname 指令行，则将其原样添加到 ruleLinesAndComments 数组中
            ruleLinesAndComments.push(line);
        }
    }
    
    // 将收集到的规则、注释和空行用换行符重新连接成一个字符串
    let outputString = ruleLinesAndComments.join("\n");
    
    // 如果收集到了任何主机名
    if (hostnamesList.length > 0) {
        // 将所有主机名用 ", " 连接起来，并加上 "hostname = " 前缀
        const combinedHostnameString = "hostname = " + hostnamesList.join(", ");
        
        // 如果 outputString (即规则和注释部分) 不为空，
        // 则在其后添加一个换行符，以确保合并的主机名行在新的一行开始。
        // 如果 outputString 为空 (例如，输入只包含 hostname 行)，则不需要前置换行符。
        if (outputString.length > 0) {
            outputString += "\n";
        }
        outputString += combinedHostnameString; // 追加合并后的主机名行
    }
    
    return outputString; // 返回最终处理过的字符串
}
