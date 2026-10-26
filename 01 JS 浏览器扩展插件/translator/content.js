// ---- 初始化函数：等待 document.body 存在后再执行 ----
function init() {

    // 检查 body 是否已经存在
    // 某些页面加载很慢，content.js 注入时 body 可能还没创建
    if (!document.body) {
        setTimeout(init, 50); // body 还没准备好，50ms 后重试
        return;               // 先退出，等下次重试
    }

    // ---- 创建翻译弹窗元素 ----
    let popup = document.createElement("div"); // 动态创建一个 div
    popup.id  = "translator-popup";            // 设置 id，方便调试时查找

    // cssText 一次性设置多条 CSS 样式
    popup.style.cssText = `
        position: fixed;          
        background: #1e1e2e;      
        color: #cdd6f4;           
        border-radius: 12px;      
        padding: 12px 16px;       
        font-size: 14px;
        font-family: "Microsoft YaHei", sans-serif;
        max-width: 280px;         
        min-width: 160px;         
        box-shadow: 0 8px 32px rgba(0,0,0,0.3); 
        z-index: 999999;          
        display: none;            
        line-height: 1.6;
        border: 1px solid #45475a; 
    `;

    // 把弹窗插入到页面 body 里
    document.body.appendChild(popup);

    // ---- 监听鼠标松开事件（用户选完文字会松开鼠标）----
    // async 表示函数内部有 await 等待异步操作
    document.addEventListener("mouseup", async function(e) {

        // window.getSelection() 获取用户当前选中的文字
        // .toString().trim() 转成字符串并去掉首尾空格
        let selectedText = window.getSelection().toString().trim();

        // 没有选中文字（点击空白处），隐藏弹窗
        if (!selectedText) {
            popup.style.display = "none";
            return;
        }

        // 选中超过 200 个字符，太长不翻译
        if (selectedText.length > 200) {
            showPopup("⚠️ 选中文字太长", e.clientX, e.clientY);
            return;
        }

        // 先显示"翻译中"，让用户知道正在处理
        showPopup("⏳ 翻译中...", e.clientX, e.clientY);

        try {
            // await 等待翻译结果返回（网络请求需要时间）
            let result = await translate(selectedText);

            // 翻译成功，显示结果
            showPopup(`
                <div style="font-size:11px; color:#6c7086; margin-bottom:6px">
                    📖 ${selectedText.length > 30
                        ? selectedText.substring(0, 30) + "..."  
                        : selectedText}                           
                </div>
                <div style="font-size:15px; font-weight:bold; color:#89b4fa">
                    ${result}  
                </div>
            `, e.clientX, e.clientY);

        } catch (error) {
            // 网络出错或 API 失败时显示错误提示
            showPopup("❌ 翻译失败，请检查网络", e.clientX, e.clientY);
        }
    });

    // ---- 点击弹窗以外的地方时隐藏弹窗 ----
    document.addEventListener("mousedown", function(e) {

        // e.target 是被点击的元素
        // popup.contains(e.target) 检查点击的是否是弹窗内部的元素
        // 两个条件都不满足，说明点击了弹窗以外的地方
        if (e.target !== popup && !popup.contains(e.target)) {
            popup.style.display = "none";
        }
    });

    // ---- 显示弹窗函数 ----
    function showPopup(content, x, y) {
        popup.innerHTML     = content;      // 设置弹窗内容
        popup.style.display = "block";      // 显示弹窗

        // 默认显示在鼠标右下方 10px 处
        let left = x + 10;
        let top  = y + 10;

        // 防止弹窗超出屏幕右边：如果右边放不下，改到鼠标左边
        if (left + 280 > window.innerWidth)  left = x - 290;

        // 防止弹窗超出屏幕底部：如果下面放不下，改到鼠标上方
        if (top + 150 > window.innerHeight)  top  = y - 160;

        popup.style.left = left + "px";
        popup.style.top  = top  + "px";
    }

    // ---- 翻译函数：调用 MyMemory 免费翻译 API ----
    async function translate(text) {

        // 用正则表达式检测文字里有没有中文字符
        // \u4e00-\u9fff 是中文字符的 Unicode 范围
        let hasChinese = /[\u4e00-\u9fff]/.test(text);

        // 有中文就翻译成英文，没有就翻译成中文
        let langPair = hasChinese ? "zh|en" : "en|zh";

        // encodeURIComponent 把文字转成 URL 安全格式
        // 例如空格变成 %20，中文变成 %E4%B8%AD 等
        let url      = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        let response = await fetch(url);        // 发送 HTTP 请求
        let data     = await response.json();   // 解析返回的 JSON 数据

        // responseStatus 200 表示翻译成功
        if (data.responseStatus === 200) {
            return data.responseData.translatedText; // 返回翻译结果
        } else {
            throw new Error("翻译失败"); // 抛出错误，被上面的 catch 捕获
        }
    }
}

// 立即调用 init，开始检查 body 是否准备好
init();