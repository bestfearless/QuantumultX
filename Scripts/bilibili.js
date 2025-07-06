// 统一处理B站gRPC接口响应
const pathMap = {
    "Teenagers/ModeStatus": "AAAAABMKEQgCEgl0ZWVuYWdlcnMgAioA",
    "Search/DefaultWords": "AAAAACkaHeaQnOe0ouinhumikeOAgeeVquWJp+aIlnVw5Li7IgAoAToAQgBKAA==",
    "View/TFInfo": "AAAAAAIIAQ=="
};

// 获取请求路径的关键部分
const getPathKey = url => {
    if (url.includes("Teenagers/ModeStatus")) return "Teenagers/ModeStatus";
    if (url.includes("Search/DefaultWords")) return "Search/DefaultWords";
    if (url.includes("View/TFInfo")) return "View/TFInfo";
    return null;
};

// 主处理逻辑
const pathKey = getPathKey($request.url);
if (pathKey && pathMap[pathKey]) {
    $done({
        body: pathMap[pathKey],
        isBase64: true
    });
} else {
    $done({}); // 放行其他请求
}
