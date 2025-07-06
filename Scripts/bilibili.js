// Quantumult X 脚本示例
// 脚本文件名: bilibili_proto_bypass.js

// 判断路径做分流
let url = $request.url;

if (url.includes("/Teenagers/ModeStatus")) {
  // 返回示例内容: 禁用青少年模式
  $done({
    body: Buffer.from("AAAAABMKEQgCEgl0ZWVuYWdlcnMgAioA", "base64").toString("binary")
  });
} else if (url.includes("/Search/DefaultWords")) {
  // 返回示例内容: 空搜索词
  $done({
    body: Buffer.from("AAAAACkaHeaQnOe0ouinhumikeOAgeeVquWJp+aIlnVw5Li7IgAoAToAQgBKAA==", "base64").toString("binary")
  });
} else if (url.includes("/TFInfo")) {
  // 返回示例内容: 空 TFInfo
  $done({
    body: Buffer.from("AAAAAAIIAQ==", "base64").toString("binary")
  });
} else {
  $done({});
}
