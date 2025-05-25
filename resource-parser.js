/*************************************

Quantumult X Resource Parser (Hostname Merger)
Author: ChatGPT
Description: 合并 hostname，保留规则和注释，符合 QuantumultX parser 要求
Based on: https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/resource-parser.js

**************************************/

let url = $request.url;
if (!$response.body) $done({});

let body = $response.body;
let lines = body.split('\n');

let ruleLines = [];
let hostnames = new Set();
let comments = [];

for (let line of lines) {
  let trimmed = line.trim();
  if (trimmed.length === 0) continue;

  if (trimmed.startsWith("#")) {
    comments.push(trimmed);
  } else if (trimmed.startsWith("hostname")) {
    let hosts = trimmed.split("=")[1].split(",").map(h => h.trim());
    hosts.forEach(h => {
      if (h) hostnames.add(h);
    });
  } else {
    ruleLines.push(trimmed);
  }
}

let result = [];
result.push(...comments);
result.push(...ruleLines);

if (hostnames.size > 0) {
  result.push("");
  result.push("hostname = " + Array.from(hostnames).join(", "));
}

$done({ body: result.join("\n") });
