// 主机名处理（支持合并多行 hostname）
function HostNamecheck(content, parain, paraout) {
    // 合并多行 hostname= 开头的配置，并去重
    var hostLines = content.split(/\r?\n/).filter(line => line.trim().startsWith("hostname="));
    var allHnames = [];
    for (var line of hostLines) {
        var hPart = line.replace(/ /g, "").split("=")[1].split(",");
        allHnames = allHnames.concat(hPart);
    }
    var hname = [...new Set(allHnames)]; // 去重

    var nname = [];
    var dname = []; //删除项
    for (var i = 0; i < hname.length; i++) {
        dd = hname[i]
        const excludehn = (item) => dd.indexOf(item) != -1;
        if (paraout && paraout != "") { //存在 out 参数时
            if (!paraout.some(excludehn)) { //out 未命中🎯️
                if (parain && parain != "") {
                    if (parain.some(excludehn)) { //Pin 命中🎯️
                        nname.push(hname[i])
                    } else {
                        dname.push(hname[i])
                    } //Pin 未命中🎯️的记录
                } else { nname.push(hname[i]) } //无in 参数    
            } else { dname.push(hname[i]) } //out 参数命中
        } else if (parain && parain != "") { //不存在 out，但有 in 参数时
            if (parain.some(excludehn)) { //Pin 命中🎯️
                nname.push(hname[i])
            } else { dname.push(hname[i]) }
        } else {
            nname.push(hname[i])
        }
    } //for j

    // 原有通知逻辑保持不变
    if (Pntf0 != 0) { /* ... */ } 
    if (Preg) { /* ... */ }
    if (Pregout) { /* ... */ }

    // 返回合并后的 hostname 行
    return "hostname=" + nname.join(", ");
}
