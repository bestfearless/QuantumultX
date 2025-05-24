// 开始 解析器正常使用，调试注释此部分

let [link0, content0, subinfo] = [$resource.link, $resource.content, $resource.info]
let version = typeof $environment != "undefined" ? Number($environment.version.split("build")[1]) : 0 // 版本号
let Perror = 0 // 错误类型

const ADDRes = `quantumult-x:///add-resource?remote-resource=url-encoded-json`
var RLink0 = {
    "filter_remote": [],
    "rewrite_remote": [],
    "server_remote": [],
}
const Field = {
    "filter" :

// prompt 被截断，保留现有代码...

    return nodes;
}

function mergeHostnames(nodes) {
    // 合并相同的 hostname
    const mergedNodes = [];
    const seenHostnames = new Set();

    for (const node of nodes) {
        if (!node.hostname) continue;

        if (seenHostnames.has(node.hostname)) {
            const lastNode = mergedNodes.find(n => n.hostname === node.hostname);
            // 合并规则：保留最后一个或合并配置（可自定义逻辑）
            if (lastNode) {
                // 示例：将新节点的配置添加到已存在的节点中
                lastNode.rules.push(...node.rules);
                lastNode.servers.push(...node.servers);
            }
        } else {
            mergedNodes.push(node);
            seenHostnames.add(node.hostname);
        }
    }

    return mergedNodes;
}

function getNodeInfo(nodes) {
    const filter = [];
    for (let i of nodes) {
        if (!i.type || !i.data) continue;
        const type = i.type;

        switch (type) {
            case "filter_remote":
                filter.push(i);
                break;
            default:
                // 其他处理
                break;
        }
    }

    return { filter, rename };
}

function AND(...args) {
    return args.reduce((a, b) => a.map((c, i) => b[i] && c));
}

function OR(...args) {
    return args.reduce((a, b) => a.map((c, i) => b[i] || c));
}

function NOT(array) {
    return array.map(c => !c);
}
