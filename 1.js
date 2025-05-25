/*************************************

Quantumult X Resource Parser
功能：合并 hostname，保留规则注释
说明：适用于将带 hostname 的规则合并输出，统一写在末尾

**************************************/

let body = $response.body;
let lines = body.split('\n');

let finalRules = [];
let hostnames = new Set();
let tempLines = [];

for (let line of lines) {
  let trimmed = line.trim();

  if (trimmed.startsWith("hostname")) {
    let hosts = trimmed.split("=")[1].split(",").map(h => h.trim());
    hosts.forEach(h => {
      if (h) hostnames.add(h);
    });
  } else if (trimmed.length > 0) {
    tempLines.push(line);
  }
}

finalRules = [...tempLines];

// 添加空行后统一添加合并的 hostname
if (hostnames.size > 0) {
  finalRules.push("");
  finalRules.push("hostname = " + [...hostnames].join(", "));
}

$done({ body: finalRules.join("\n") });
