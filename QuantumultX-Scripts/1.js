// Variables injected by Quantumult X environment:
// $resource: The raw resource content or response object.
// $prefs: An object for persistent storage.
// $notify(title, subtitle, message): Function to send notifications.
// $task: Object representing the current task.
// $utils: Utility functions provided by Quantumult X.

/**
 * @file Đây là một tập lệnh phân tích cú pháp tài nguyên cho Quantumult X.
 * @author KOP-XIAO
 * @repository https://github.com/KOP-XIAO/QuantumultX/
 * @version 2024-05-22
 * @license MIT
 */

const utils = {
    isResponseType: (obj) => typeof obj === "object" && obj !== null && "status" in obj && "headers" in obj && "body" in obj,
    isBase64: (str) => /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str),
    decodeBase64: (str) => {
        try {
            return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
        } catch (e) {
            return str; // Return original string if decoding fails
        }
    },
    resp முறைய resp: (resp) => (typeof resp === "object" && resp !== null ? resp : { body: resp }), // Ensure resp is an object with body
    mergeObjects: (target, ...sources) => {
        for (const source of sources) {
            for (const key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    if (typeof source[key] === "object" && source[key] !== null && !Array.isArray(source[key])) {
                        target[key] = utils.mergeObjects(target[key] || {}, source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    },
    parseHeaders: (headersString) => {
        const headers = {};
        if (!headersString) return headers;
        headersString.split("\n").forEach((line) => {
            const parts = line.split(/: (.+)/);
            if (parts.length === 3) {
                headers[parts[0].trim()] = parts[1].trim();
            }
        });
        return headers;
    },
    stringifyHeaders: (headers) => {
        return Object.entries(headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");
    },
    // Helper to determine if a string is likely a URL
    isUrl: (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
};

// --- 新增的辅助函数，用于合并 Quantumult X 配置中的多行 hostname ---
/**
 * 合并 Quantumult X 配置文本中的所有 'hostname = ...' 行。
 * 会将所有收集到的 hostname 去重后，合并成一行 'hostname = host1, host2, ...'，
 * 并放置在返回配置文本的开头。其他所有非 'hostname = ...' 的行会保持其原始相对顺序。
 *
 * @param {string} configText 原始配置文本。
 * @returns {string} 处理后的配置文本。
 */
function _qxHostnameGlobalMerger(configText) {
    // 确保输入是字符串类型，如果不是（例如，可能已经是解析后的对象），则直接返回
    if (typeof configText !== 'string') {
        return configText;
    }

    const lines = configText.split(/\r\n|\r|\n/); // 将配置文本按行分割
    const collectedHostnames = []; // 用于存储所有收集到的 hostname
    const otherConfigLines = [];   // 用于存储所有非 'hostname = ...' 的行

    // 正则表达式，用于匹配 'hostname = ' 开头的行，忽略前导空格和 'hostname' 的大小写
    const hostnamePattern = /^\s*hostname\s*=/i;

    for (const line of lines) {
        const trimmedLine = line.trim(); //去除行首尾的空白字符

        if (hostnamePattern.test(trimmedLine)) { // 如果当前行是 hostname 定义行
            //尝试提取 '=' 后面的主机名部分
            const parts = trimmedLine.split('=', 2); // 最多分割成两部分
            if (parts.length > 1) {
                const hostnamesString = parts[1].trim(); // 获取 '=' 后面的字符串并去除空白
                if (hostnamesString) { // 如果主机名字符串不为空
                    hostnamesString.split(',') // 按逗号分割多个主机名
                        .map(h => h.trim())    // 去除每个主机名周围的空白
                        .filter(h => h)        // 过滤掉空的主机名 (例如 "host1,,host2" 中的空隙)
                        .forEach(h => collectedHostnames.push(h)); // 添加到收集列表中
                } else {
                    // 如果是 "hostname =" 后面为空的情况，作为普通行保留
                    otherConfigLines.push(line);
                }
            } else {
                // 如果行以 "hostname" 开头但没有 "=", 作为普通行保留 (理论上hostnamePattern已匹配则此分支较少进入)
                otherConfigLines.push(line);
            }
        } else {
            // 如果不是 hostname 定义行，则将其加入到其他配置行的列表中
            otherConfigLines.push(line);
        }
    }

    let finalLines = []; // 用于构建最终输出的行数组
    if (collectedHostnames.length > 0) {
        // 使用 Set 对收集到的主机名进行去重，并保持首次出现的顺序（Set的特性）
        const uniqueHostnames = [...new Set(collectedHostnames)];
        // 构建合并后的 hostname 行
        finalLines.push(`hostname = ${uniqueHostnames.join(', ')}`);
    }

    // 将所有其他配置行追加到最终的行数组中
    finalLines.push(...otherConfigLines);
    // 将所有行用换行符连接成最终的配置文本
    return finalLines.join('\n');
}
// --- Hostname 合并辅助函数结束 ---


// Main parser function
function parser(raw, { // Options
    type = "filter", // filter, rewrite, server, node-list, sub-store, node-latency
    url = "",
    incompatible = false, // Force enable incompatible rules
    dns = false, // Enable DNS option for filter rules
    enhanced = false, // Enable enhanced mode for filter rules
    udpRelay = false, // Enable UDP relay for server rules
    tfo = false, // Enable TCP fast open for server rules
    appendType = false, // Append type to node name
    prefix = "", // Add prefix to node name
    // Config for sub-store
    addemoji = true, // Add regional emojis to node names
    emojimode = "add", // "add" or "replace"
    filter = "", // Filter nodes by name regex
    regfilter = "", // Filter nodes by name regex (alias for filter)
    exclude = "", // Exclude nodes by name regex
    regexcl = "", // Exclude nodes by name regex (alias for exclude)
    rename = "", // Rename nodes, format: "old@new;old2@new2"
    replace = false, // Replace mode for rename
    // Config for node-latency
    method = "tcp", // "tcp", "http"
    timeout = 1, // Timeout in seconds
    delay = 0, // Delay in seconds
    // Config for node-list
    tls13 = false, // Enable TLS 1.3 for nodes
    externalResolve = false, // Enable external resolve for nodes
    sort = "", // Sort nodes by name, format: "asc" or "desc"
    sortMethod = "original", // Sorting method: "original", "latency", "name" (name-asc, name-desc)
    // Config for server type
    serverObfs = "", // Default obfs for servers if not specified
    serverObfsHost = "www.bing.com", // Default obfs-host for servers
    serverTls = false, // Default tls for servers
    serverTag = "", // Default tag for servers
    serverUdp = false, // Default udp-relay for servers
    serverTfo = false, // Default tfo for servers
    serverSni = "", // Default sni for servers
    // Config for rewrite type
    rewriteUpdateInterval = 86400, // Update interval for rewrite rules
    rewriteOptParser = false, // Use optimized parser for rewrite rules
    // Default headers for sub-store items if not specified
    subStoreHeaders = {}
} = {}) {
    let content = utils.isResponseType(raw) ? raw.body : raw;
    const options = { type, url, incompatible, dns, enhanced, udpRelay, tfo, appendType, prefix, addemoji, emojimode, filter: filter || regfilter, exclude: exclude || regexcl, rename, replace, method, timeout, delay, tls13, externalResolve, sort, sortMethod, serverObfs, serverObfsHost, serverTls, serverTag, serverUdp, serverTfo, serverSni, rewriteUpdateInterval, rewriteOptParser, subStoreHeaders };


    // --- 在此处应用 Hostname 合并逻辑 ---
    // 仅当内容是字符串且类型是 filter 或 rewrite 时，才进行 hostname 合并
    if (typeof content === 'string' && (options.type === "filter" || options.type === "rewrite")) {
        content = _qxHostnameGlobalMerger(content);
    }
    // --- Hostname 合并逻辑结束 ---


    // Handle sub-store type, which may contain multiple resources
    if (options.type === "sub-store" && typeof content === "string") {
        // Replace specific placeholders in sub-store content
        content = content.replace(/\$ Baran|\$ BaranDNS|\$ QuanX|\$ Loon|\$ Surge|\$ Clash|\$ Stash/g, ""); // Remove placeholders
        content = content.replace(/ বারান ডিএনএস/g, ""); // Remove Bengali placeholder

        const subOptions = utils.mergeObjects({}, options); // Create a copy of options for sub-items
        delete subOptions.type; // Remove type from sub-options to avoid infinite recursion

        let resources = [];
        try {
            // Attempt to parse content as JSON (common for sub-store definitions)
            const parsedJson = JSON.parse(content);
            if (Array.isArray(parsedJson)) { // Check if it's an array of resources
                resources = parsedJson.map(item => {
                    if (typeof item === "string" && utils.isUrl(item)) { // If item is a URL string
                        return { url: item, type: "node-list", enabled: true }; // Default type for URL strings
                    } else if (typeof item === "object" && item !== null && item.url) { // If item is an object with a URL
                        return { ...item, enabled: item.enabled !== false }; // Ensure 'enabled' defaults to true
                    }
                    return null; // Invalid item format
                }).filter(item => item !== null);
            } else {
                throw new Error("Sub-store content is not a valid JSON array.");
            }
        } catch (e) {
            // If JSON parsing fails, treat content as a list of URLs separated by newlines
            resources = content.split(/\r\n|\r|\n/)
                .map(line => line.trim())
                .filter(line => utils.isUrl(line)) // Filter out non-URL lines
                .map(resUrl => ({ url: resUrl, type: "node-list", enabled: true })); // Default type for URL lines
        }

        // Process each resource in the sub-store
        const processedResources = resources.map(item => {
            const itemOptions = utils.mergeObjects({}, subOptions, { // Merge global sub-options with item-specific ones
                type: item.type || "node-list", // Default to node-list if type is not specified
                tag: item.tag || options.prefix || `item-${Math.random().toString(36).substring(7)}`, // Generate a tag if not present
                enabled: item.enabled !== false, // Default to true
                interval: item.interval || options.rewriteUpdateInterval || 86400, // Default interval
                policy: item.policy, // Policy for filter/rewrite
                headers: utils.mergeObjects({}, options.subStoreHeaders, item.headers || {}) // Merge headers
            });

            // If the item content is already provided (e.g., embedded config)
            if (item.content) {
                try {
                    const parsedItem = parser(item.content, itemOptions); // Recursively parse embedded content
                    return { ...item, content: parsedItem.result || parsedItem, error: parsedItem.error };
                } catch (err) {
                    return { ...item, error: `Error parsing embedded content for ${item.url || item.tag}: ${err.message}` };
                }
            }
            // If item is a URL to fetch
            else if (item.url) {
                // For Quantumult X, actual fetching is done by the app based on the resource list.
                // This parser just formats the resource definition.
                let resourceString = `${item.url}, tag=${item.tag}, enabled=${item.enabled}`;
                if (item.type === "filter" || item.type === "rewrite") {
                    resourceString += `, update-interval=${itemOptions.interval}`;
                    if (itemOptions.policy) resourceString += `, policy=${itemOptions.policy}`;
                    if (itemOptions.opt_parser !== undefined) resourceString += `, opt_parser=${itemOptions.opt_parser}`; // For rewrite
                }
                // Add other type-specific parameters if needed
                return resourceString; // Return formatted string for QX resource list
            }
            return null; // Skip invalid items
        }).filter(item => item !== null);

        // If sub-store itself is meant to return a single combined config (e.g. for some proxy tools)
        // This parser is for Quantumult X, which expects a list of resource URLs/definitions.
        return { result: processedResources.join("\n"), error: null }; // Return as a list of resource definitions
    }


    let result = "";
    const sections = {}; // For INI-like structures, not heavily used by QX simple lists
    let currentSection = ""; // Current section name

    // Standard filter and rewrite rule processing
    if (options.type === "filter" || options.type === "rewrite") {
        let lines = content.split(/\r\n|\r|\n/);
        let rules = [];
        const serverRelatedKeywords = ["server=", "server-list=", "server_local="]; // Keywords that might indicate server definitions

        for (let line of lines) {
            line = line.trim();

            // Preserve comments and empty lines
            if (line.startsWith("#") || line.startsWith(";") || line.startsWith("//") || line === "") {
                rules.push(line);
                continue;
            }

            // Handle section headers like [filter_local], [rewrite_local]
            if (line.startsWith("[") && line.endsWith("]")) {
                currentSection = line.substring(1, line.length - 1).toLowerCase();
                rules.push(line); // Keep section headers
                continue;
            }

            // Basic incompatible rule handling (example)
            if (!options.incompatible) {
                if (line.includes(" REJECT") && !line.includes("-dict")) { // Example: simple REJECT might be incompatible
                    // rules.push("# " + line + " (incompatible rule disabled)");
                    // continue;
                }
            }

            // DNS option for filter rules
            if (options.type === "filter" && options.dns && !line.startsWith("hostname") && !serverRelatedKeywords.some(kw => line.startsWith(kw))) {
                if (line.match(/^(ip-cidr|ip-asn|geoip|user-agent|host|host-keyword|host-suffix|url-regex|final)/i)) {
                    // These rule types typically don't need ,dns option
                } else if (line.match(/,\s*(reject|direct|proxy)/i)) { // If policy is specified
                     // Avoid adding ,dns if a policy like reject, direct, proxy is already there.
                     // More robust checking might be needed.
                } else {
                    // line += ", dns"; // This auto-addition might be too aggressive. User should specify.
                }
            }

            // Enhanced mode for filter rules (example: adding specific tags or modifying behavior)
            if (options.type === "filter" && options.enhanced) {
                // Example: add a comment indicating enhanced processing
                // if (!line.startsWith("#")) rules.push("# Processed in enhanced mode");
            }

            rules.push(line);
        }
        result = rules.join("\n");

        // For rewrite, specific headers might be added by QX based on the resource definition
        if (options.type === "rewrite") {
            // The parser usually just returns the rule content.
            // QX handles update-interval and opt_parser from the resource line.
        }

    } else if (options.type === "server" || options.type === "node-list") {
        // Server or node-list processing (e.g., proxies)
        let nodes = [];
        if (utils.isBase64(content.replace(/\s/g, ""))) { // Check if content (excluding whitespace) is Base64
            content = utils.decodeBase64(content);
        }

        content.split(/\r\n|\r|\n/).forEach(line => {
            line = line.trim();
            if (line.startsWith("#") || line.startsWith(";") || line.startsWith("//") || line === "") {
                // Keep comments if they are part of the final output structure, or discard
                // For node lists, often comments are discarded unless they are tags.
                return;
            }

            // Basic ss, vmess, trojan, http, https, socks5, socks5-tls parsing
            // This is a simplified example. Full parsing is complex.
            let node = null;
            if (line.startsWith("ss://")) {
                node = parseShadowsocks(line, options);
            } else if (line.startsWith("vmess://")) {
                node = parseVmess(line, options);
            } else if (line.startsWith("trojan://")) {
                node = parseTrojan(line, options);
            } else if (line.match(/^(https?|socks5(-tls)?)=/i)) { // HTTP/S, SOCKS5 proxies in QX format
                node = parseQXProxy(line, options);
            } else if (options.type === "server" && line.includes(",")) { // Generic QX server format
                node = parseQXServerLine(line, options);
            }


            if (node) {
                // Apply filters and renaming
                if (options.filter && !new RegExp(options.filter, "i").test(node.name)) return;
                if (options.exclude && new RegExp(options.exclude, "i").test(node.name)) return;
                if (options.rename) node.name = applyRenames(node.name, options.rename, options.replace);
                if (options.prefix) node.name = options.prefix + node.name;
                if (options.addemoji) node.name = addEmojiToName(node.name, node.server || "", options.emojimode); // Pass server for region detection
                if (options.appendType && node.type) node.name = `${node.name} [${node.type.toUpperCase()}]`;

                nodes.push(node);
            }
        });

        // Sort nodes if specified
        if (options.sortMethod && options.sortMethod !== "original" && nodes.length > 0) {
            nodes = sortNodes(nodes, options.sortMethod);
        }


        // Convert nodes to Quantumult X server format
        result = nodes.map(n => formatNodeAsQXServer(n, options)).join("\n");

    } else if (options.type === "node-latency") {
        // This type is usually for testing latency, not direct parsing into a config.
        // The parser might return a structured object or a specific format if needed.
        result = `Latency testing configuration: method=${options.method}, timeout=${options.timeout}s, delay=${options.delay}s. Content not directly parsed into rules.`;
        // Or, if the content itself is a list of servers to test:
        // const serversToTest = content.split(/\r\n|\r|\n/).filter(l => l.trim() && !l.startsWith("#"));
        // result = serversToTest.map(s => `${s}, latency-test=true, test-method=${options.method}`).join("\n");

    } else {
        // Default: return content as is if type is unknown or doesn't need parsing
        result = content;
    }

    return { result, error: null }; // Assuming no error for simplicity, add error handling as needed
}


// Helper functions for parsing different proxy types (simplified)
// These would need to be quite comprehensive for full support.

function parseShadowsocks(line, opts) {
    // ss://method:password@server:port#name
    // QX format: server_type, server_address, server_port, encryption_method, password, obfs=obfs_type, obfs-host=host, obfs-uri=uri, tag=name
    try {
        const url = new URL(line);
        const name = decodeURIComponent(url.hash.substring(1) || `ss-${url.hostname}`);
        const [method, password] = atob(url.username).split(":");

        return {
            type: "shadowsocks",
            name: name,
            server: url.hostname,
            port: url.port,
            method: method,
            password: password,
            obfs: url.searchParams.get("plugin") ? url.searchParams.get("plugin").split(";")[0] : (opts.serverObfs || ""),
            obfsHost: url.searchParams.get("plugin") ? (url.searchParams.get("plugin").includes("obfs-host=") ? url.searchParams.get("plugin").split("obfs-host=")[1].split(";")[0] : opts.serverObfsHost) : (opts.serverObfsHost || "www.bing.com"),
            // Other SS params like obfs-uri, tls, etc.
            udp: opts.serverUdp || false,
            tfo: opts.serverTfo || false,
            tag: opts.serverTag || name,
        };
    } catch (e) { return null; }
}

function parseVmess(line, opts) {
    // vmess://BASE64ENCODED_JSON
    // QX format: vmess, server_address, server_port, method, password, ws=true/false, ws-path="/path", ws-headers="Host:host.com", sni=example.com, tag=name
    try {
        const decoded = JSON.parse(utils.decodeBase64(line.substring(8)));
        const name = decoded.ps || decoded.add || `vmess-${decoded.add}`;
        return {
            type: "vmess",
            name: name,
            server: decoded.add,
            port: decoded.port,
            uuid: decoded.id,
            alterId: decoded.aid || "0",
            method: decoded.scy || "auto", // encryption method
            tls: decoded.tls === "tls" || opts.serverTls,
            sni: decoded.sni || opts.serverSni || decoded.host || "",
            network: decoded.net || "tcp", // "tcp", "ws", "h2", "grpc" etc.
            path: decoded.path || (decoded.net === "ws" ? "/" : ""),
            host: decoded.host || "", // For ws/h2 headers
            // Other VMess params
            udp: opts.serverUdp || false,
            tfo: opts.serverTfo || false,
            tag: opts.serverTag || name,
        };
    } catch (e) { return null; }
}

function parseTrojan(line, opts) {
    // trojan://password@server:port#name?sni=example.com&peer=example.com
    // QX format: trojan, server_address, server_port, password, sni=example.com, peer=example.com, tag=name
    try {
        const url = new URL(line);
        const name = decodeURIComponent(url.hash.substring(1) || `trojan-${url.hostname}`);
        return {
            type: "trojan",
            name: name,
            server: url.hostname,
            port: url.port,
            password: url.username,
            sni: url.searchParams.get("sni") || url.searchParams.get("peer") || opts.serverSni || url.hostname,
            // peer: url.searchParams.get("peer") || "", // QX uses sni for peer verification too
            udp: opts.serverUdp || false,
            tfo: opts.serverTfo || false,
            tag: opts.serverTag || name,
            tls13: opts.tls13 || false,
            externalResolve: opts.externalResolve || false,
        };
    } catch (e) { return null; }
}

function parseQXProxy(line, opts) {
    // http=server:port,username,password,tag=name
    // https=server:port,username,password,ca=ca_name_or_sha256,sni=example.com,tag=name
    // socks5=server:port,username,password,tag=name
    // socks5-tls=server:port,username,password,tls-host=host,ca=ca_name_or_sha256,tag=name
    try {
        const parts = line.split("=").map(p => p.trim());
        const type = parts[0].toLowerCase();
        const params = parts[1].split(",").map(p => p.trim());
        const [server, port] = params[0].split(":").map(p => p.trim());
        let name = `proxy-${server}`;
        let username = "", password = "";

        const node = { type, server, port, name, udp: opts.serverUdp, tfo: opts.serverTfo, tag: opts.serverTag || name };

        params.slice(1).forEach(p => {
            const [key, value] = p.split("=").map(s => s.trim());
            if (value !== undefined) { // key=value pair
                if (key === "tag") node.name = value;
                else if (key === "sni" || (type === "socks5-tls" && key === "tls-host")) node.sni = value;
                else if (key === "ca") node.ca = value; // or ca-sha256
                else if (key === "username") node.username = value;
                else if (key === "password") node.password = value;
                // Add other QX specific params
            } else { // Positional username/password
                if (!node.username) node.username = key;
                else if (!node.password) node.password = key;
            }
        });
        if (node.tag === node.name) node.tag = opts.serverTag || node.name; // Ensure tag is set if not from params

        return node;
    } catch (e) { return null; }
}


function parseQXServerLine(line, opts) {
    // Generic QX server line: type, address, port, method, password, options...
    // Example: shadowsocks, 1.2.3.4, 443, aes-128-gcm, "mypass", obfs=tls, obfs-host=bing.com, tag=MySS
    try {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 5) return null; // Basic fields: type, server, port, method, password

        const type = parts[0].toLowerCase();
        const server = parts[1];
        const port = parts[2];
        const methodOrPassword = parts[3]; // For SS: method, for Trojan/VMess: password/uuid
        const passwordOrUuid = parts[4];   // For SS: password

        let name = `${type}-${server}`; // Default name
        const node = { type, server, port, name, tag: opts.serverTag || name };

        if (type === "shadowsocks" || type === "ss") {
            node.type = "shadowsocks";
            node.method = methodOrPassword;
            node.password = passwordOrUuid;
        } else if (type === "trojan") {
            node.password = methodOrPassword; // QX trojan often just needs password
        } else if (type === "vmess") {
            node.uuid = methodOrPassword; // UUID
            node.method = passwordOrUuid; // Encryption method (e.g. "auto")
            node.alterId = "0"; // Default alterId
        } else if (type === "http" || type === "https" || type === "socks5" || type === "socks5-tls") {
            // Already handled by parseQXProxy if format is "http=..."
            // This is for lines like: http, 1.2.3.4, 8080, user, pass, tag=HTTP1
            node.username = methodOrPassword;
            node.password = passwordOrUuid;
        } else {
            return null; // Unknown type for this simple parser
        }


        // Parse additional options (key=value)
        for (let i = 5; i < parts.length; i++) {
            const [key, value] = parts[i].split('=').map(s => s.trim());
            if (value !== undefined) {
                if (key === "tag") { node.name = value; node.tag = value; }
                else if (key === "obfs") node.obfs = value;
                else if (key === "obfs-host") node.obfsHost = value;
                else if (key === "obfs-uri") node.obfsUri = value;
                else if (key === "sni") node.sni = value;
                else if (key === "tls" && value === "true") node.tls = true;
                else if (key === "ws" && value === "true") node.network = "ws";
                else if (key === "ws-path") node.path = value;
                else if (key === "ws-headers") node.wsHeaders = utils.parseHeaders(value.replace(/\\n/g, "\n")); // Handle \n in headers
                else if (key === "udp-relay" && value === "true") node.udp = true;
                else if (key === "tcp-fast-open" && value === "true") node.tfo = true;
                else if (key === "tls13" && value === "true") node.tls13 = true;
                else if (key === "external-resolve" && value === "true") node.externalResolve = true;
                // Add more QX specific parameters as needed
            }
        }
        if (node.tag === node.name && opts.serverTag) node.tag = opts.serverTag;


        return node;
    } catch (e) {
        return null;
    }
}


function formatNodeAsQXServer(node, opts) {
    // Formats a parsed node object into a Quantumult X server configuration line.
    // This needs to be comprehensive based on node.type
    let parts = [node.type, node.server, node.port];
    const options = [];

    if (node.type === "shadowsocks") {
        parts.push(node.method, `"${node.password}"`); // Enclose password in quotes if it contains special chars
        if (node.obfs) options.push(`obfs=${node.obfs}`);
        if (node.obfsHost) options.push(`obfs-host=${node.obfsHost}`);
        if (node.obfsUri) options.push(`obfs-uri=${node.obfsUri}`);
        // Add other SS specific options like tls, over-tls-host etc.
    } else if (node.type === "vmess") {
        parts.push(node.method || "auto", node.uuid); // method, uuid
        if (node.alterId !== undefined) options.push(`alterId=${node.alterId}`); // QX might not use alterId directly in line like this
        if (node.network === "ws") {
            options.push("ws=true");
            if (node.path) options.push(`ws-path=${node.path}`);
            if (node.host || (node.wsHeaders && node.wsHeaders["Host"])) { // ws-headers="Host: example.com"
                 const hostHeader = node.host || (node.wsHeaders ? node.wsHeaders["Host"] : "");
                 if (hostHeader) options.push(`ws-headers="Host: ${hostHeader}"`); // Simplified, QX handles complex headers
            }
        } else if (node.network === "h2") {
            options.push("h2=true");
            if (node.path) options.push(`h2-path=${node.path}`);
            if (node.host) options.push(`h2-host=${node.host}`);
        }
        if (node.tls) options.push("tls=true"); // QX implies tls for vmess if sni is set or specific opts
        if (node.sni) options.push(`sni=${node.sni}`);
    } else if (node.type === "trojan") {
        parts.push(`"${node.password}"`);
        if (node.sni) options.push(`sni=${node.sni}`);
        // if (node.peer) options.push(`peer=${node.peer}`); // QX often uses sni for peer
    } else if (node.type === "http" || node.type === "https" || node.type === "socks5" || node.type === "socks5-tls") {
        if (node.username) parts.push(node.username);
        if (node.password) parts.push(node.password); // Password might need quoting
        if (node.type === "https" || node.type === "socks5-tls") {
            if (node.sni) options.push(node.type === "https" ? `sni=${node.sni}` : `tls-host=${node.sni}`);
            if (node.ca) options.push(`ca=${node.ca}`); // ca name or sha256
        }
    }

    // Common options
    if (node.udp || (opts.serverUdp && node.udp !== false)) options.push("udp-relay=true");
    if (node.tfo || (opts.serverTfo && node.tfo !== false)) options.push("tcp-fast-open=true");
    if (node.tls13 || (opts.tls13 && node.tls13 !== false)) options.push("tls13=true");
    if (node.externalResolve || (opts.externalResolve && node.externalResolve !== false)) options.push("external-resolve=true");

    options.push(`tag=${node.name}`); // Tag is mandatory

    return parts.concat(options).join(", ");
}


// Helper for renaming
function applyRenames(name, renameRules, replaceMode) {
    if (!renameRules) return name;
    const rules = renameRules.split(";").map(r => r.split("@").map(s => s.trim()));
    for (const [oldName, newName] of rules) {
        if (oldName && newName) {
            try {
                const regex = new RegExp(oldName, replaceMode ? "gi" : "i"); // Global replace if replaceMode is true
                if (replaceMode) {
                    name = name.replace(regex, newName);
                } else if (regex.test(name)) {
                    name = name.replace(regex, newName);
                    break; // First match only if not global replace
                }
            } catch (e) {
                // Invalid regex, skip
            }
        }
    }
    return name;
}

// Helper for adding emoji
function addEmojiToName(name, serverAddress, mode = "add") {
    const region = getRegionFromHostname(serverAddress || name); // Use server address or name to guess region
    const emoji = region ? regionToEmoji(region) : "";

    if (emoji) {
        if (mode === "replace") {
            // Try to replace existing flag emoji or region code in name
            const flagRegex = /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g; // Regex for flag emojis
            name = name.replace(flagRegex, "").trim();
            // Could also try to remove region codes like HK, US, etc.
            name = name.replace(new RegExp(`\\b${region}\\b`, "ig"), "").trim();
            return emoji + " " + name;
        } else { // mode === "add"
            return emoji + " " + name;
        }
    }
    return name;
}

function getRegionFromHostname(hostname) {
    // Simplified region detection. A more robust solution would use a GeoIP database or API.
    if (!hostname) return "";
    hostname = hostname.toLowerCase();
    // Common TLDs and keywords
    if (/\.(hk|hkG|hongkong)$/i.test(hostname) || hostname.includes("hongkong")) return "HK";
    if (/\.(tw|twn|taiwan)$/i.test(hostname) || hostname.includes("taiwan")) return "TW";
    if (/\.(jp|jap|japan)$/i.test(hostname) || hostname.includes("japan")) return "JP";
    if (/\.(kr|kor|korea)$/i.test(hostname) || hostname.includes("korea")) return "KR";
    if (/\.(sg|sin|singapore)$/i.test(hostname) || hostname.includes("singapore")) return "SG";
    if (/\.(us|usa|unitedstates)$/i.test(hostname) || hostname.includes("united states")) return "US";
    if (/\.(gb|uk|unitedkingdom)$/i.test(hostname) || hostname.includes("united kingdom")) return "GB";
    if (/\.(de|deu|germany)$/i.test(hostname) || hostname.includes("germany")) return "DE";
    if (/\.(fr|fra|france)$/i.test(hostname) || hostname.includes("france")) return "FR";
    if (/\.(ca|can|canada)$/i.test(hostname) || hostname.includes("canada")) return "CA";
    if (/\.(au|aus|australia)$/i.test(hostname) || hostname.includes("australia")) return "AU";
    if (/\.(ru|rus|russia)$/i.test(hostname) || hostname.includes("russia")) return "RU";
    if (/\.(in|ind|india)$/i.test(hostname) || hostname.includes("india")) return "IN";
    // Add more regions as needed
    return ""; // Default if no region detected
}

function regionToEmoji(regionCode) {
    const map = {
        "HK": "🇭🇰", "TW": "🇹🇼", "JP": "🇯🇵", "KR": "🇰🇷", "SG": "🇸🇬",
        "US": "🇺🇸", "GB": "🇬🇧", "DE": "🇩🇪", "FR": "🇫🇷", "CA": "🇨🇦",
        "AU": "🇦🇺", "RU": "🇷🇺", "IN": "🇮🇳",
        // Add more mappings
    };
    return map[regionCode.toUpperCase()] || "";
}

// Sorting helper
function sortNodes(nodes, method) {
    // Latency sorting would require actual latency data, not available in parser directly.
    // This example only implements name sorting.
    if (method === "name-asc") {
        return nodes.sort((a, b) => a.name.localeCompare(b.name));
    } else if (method === "name-desc") {
        return nodes.sort((a, b) => b.name.localeCompare(a.name));
    }
    // Add latency sort if latencies are somehow provided or fetched
    return nodes; // Default: no sort or original
}
