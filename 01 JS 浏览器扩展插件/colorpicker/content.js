// chrome.storage.local.get() 从扩展专业存储里读取数据
// 第一个参数 "pageColor" 是要读取的键名
// 第二个参数是回调函数， 读取完成后自动执行
chrome.storage.local.get("pageColor", function(result){

    // result 是一个对象, 包含读取到的所有数据
    // 例如: {pageColor: "#ff0000"}
    // 如果 pageColor 存在（不是underfined 或 null), 才执行下面的代码
    if(result.pageColor){

        // document.body 是页面的 <body> 元素
        // .style.background 直接修改它的背景颜色样式
        // result.pageColor 是上次保存的颜色值
        document.body.style.background = result.pageColor;
    }
}); // 回调函数和 get() 的括号在这里关闭