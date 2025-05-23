/**
 ☑️ 资源解析器 ©𝐒𝐡𝐚𝐰𝐧  ⟦2025-05-16 10:58⟧
 增强版：合并多行 hostname，仅在最终输出时插入
*/

// —— 全局收集所有 hostname —— 
let GlobalHostNameSet = new Set();

// 其余原始脚本从这里开始，完整保留...
// ============================ START ORIGINAL ============================
/** 
☑️ 资源解析器 ©𝐒𝐡𝐚𝐰𝐧  ⟦2025-05-16 10:58⟧
… （此处请粘贴你完整的原始 resource-parser.js 内容） …
*/

// ============================ END ORIGINAL =============================

// —— 在 HostNamecheck 函数里收集每个模块/每次调用的 hostname —— 
function HostNamecheck(content, parain, paraout) {
    var hname = content.replace(/ /g, "").split("=")[1].split(",");
    var nname = [];
    var dname = [];
    // —— 原有筛选逻辑不变 —— 

    for (var i = 0; i < hname.length; i++) {
        var dd = hname[i];
        const excludehn = (item) => dd.indexOf(item) != -1;
        if (paraout && paraout != "") {
            if (!paraout.some(excludehn)) {
                if (parain && parain != "") {
                    if (parain.some(excludehn)) {
                        nname.push(hname[i]);
                    } else {
                        dname.push(hname[i]);
                    }
                } else {
                    nname.push(hname[i]);
                }
            } else {
                dname.push(hname[i]);
            }
        } else if (parain && parain != "") {
            if (parain.some(excludehn)) {
                nname.push(hname[i]);
            } else {
                dname.push(hname[i]);
            }
        } else {
            nname.push(hname[i]);
        }
    }
    // —— 原有通知逻辑不变 —— 

    if (Pntf0 != 0) {
        // … 通知部分省略 …
    }
    if (nname.length == 0) {
        // … 通知空列表 …
    }
    if (Preg) {
        nname = nname.map(Regex).filter(Boolean);
        RegCheck(nname, "主机名hostname","regex", Preg);
    }
    if (Pregout) {
        nname = nname.map(RegexOut).filter(Boolean);
        RegCheck(nname, "主机名hostname","regout", Pregout);
    }

    // —— **关键：收集到全局集合** —— 
    nname.forEach(h => GlobalHostNameSet.add(h));

    // —— 返回该模块处理后的 hostname 字符串，不再 push 到 finalConf —— 
    return "hostname=" + nname.join(", ");
}

// —— 新增：生成合并后 hostname—— 
function GetMergedHostName() {
  if (GlobalHostNameSet.size === 0) return "";
  return "hostname=" + Array.from(GlobalHostNameSet).join(",");
}

// —— 修改最终输出处：只在最后一次 $done 前插入合并后的 hostname —— 
// 在脚本中找到最后的 $done({ content: total }); 或 $done({ content: finalConf.join('\n') });

/*
  假设是 $done({ content: total });
  将其替换为：
    const mergedHost = GetMergedHostName();
    total = [mergedHost, total].filter(Boolean).join('\n');
    $done({ content: total });
*/

// 例如：
$done({ content: GetMergedHostName() + "\n" + total });

// 或者如果最后使用 finalConf：
/*
const mergedHost = GetMergedHostName();
finalConf.unshift(mergedHost);
$done({ content: finalConf.join('\n') });
*/
