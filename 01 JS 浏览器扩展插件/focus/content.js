// ---- 选择器字典：定义每种干扰元素的 CSS 选择器 ----
// [class*='ad'] 表示 class 属性里包含 'ad' 的元素
// [id*='ad']    表示 id 属性里包含 'ad' 的元素
const SELECTORS = {

    // 广告相关元素的选择器
    hideAds: [
        "[class*='ad']",            // class 含 'ad' 的元素
        "[id*='ad']",               // id 含 'ad' 的元素
        "[class*='advertisement']", // class 含 'advertisement' 的元素
        "[class*='banner']",        // class 含 'banner' 的元素（横幅广告）
        "[id*='banner']",           // id 含 'banner' 的元素
        "iframe[src*='ads']",       // src 含 'ads' 的 iframe（嵌入式广告）
        "[class*='sponsor']",       // class 含 'sponsor' 的元素（赞助内容）
        "[id*='sponsor']"           // id 含 'sponsor' 的元素
    ],

    // 侧边栏相关元素的选择器
    hideSidebar: [
        "aside",                    // HTML5 语义标签，通常是侧边栏
        "[class*='sidebar']",       // class 含 'sidebar' 的元素
        "[id*='sidebar']",          // id 含 'sidebar' 的元素
        "[class*='side-bar']",      // class 含 'side-bar' 的元素
        "[role='complementary']"    // ARIA 角色为辅助内容的元素
    ],

    // 视频推荐相关元素的选择器
    hideVideos: [
        "[class*='recommended']",       // 推荐内容
        "[class*='suggestion']",        // 建议内容
        "[class*='related']",           // 相关内容
        "[id*='related']",              // id 含 'related' 的元素
        "ytd-compact-video-renderer"    // YouTube 侧边推荐视频的专属元素
    ],

    // 弹窗通知相关元素的选择器
    hidePopups: [
        "[class*='popup']",      // 弹窗
        "[class*='modal']",      // 模态框
        "[class*='overlay']",    // 遮罩层
        "[class*='cookie']",     // Cookie 同意弹窗
        "[id*='cookie']",        // id 含 'cookie' 的元素
        "[class*='newsletter']"  // 订阅通知弹窗
    ]
};

// 记录所有被隐藏的元素，关闭专注模式时用来恢复
let hiddenElements = [];

// ---- 监听来自 popup.js 的消息 ----
// chrome.runtime.onMessage 是扩展内部的消息总线
// 当 popup.js 发送消息时，这里会收到并处理
chrome.runtime.onMessage.addListener(function(message) {

    // 判断消息类型是否是专注模式
    if (message.type === "FOCUS_MODE") {

        if (message.settings.active) {
            enableFocus(message.settings); // 开启专注模式
        } else {
            disableFocus();                // 关闭专注模式
        }
    }
});

// ---- 开启专注模式 ----
function enableFocus(settings) {
    hiddenElements = []; // 清空上次记录，重新开始

    // Object.keys(settings) 取出 settings 的所有键名
    // 例如：["active", "hideAds", "hideSidebar", "hideVideos", "hidePopups"]
    Object.keys(settings).forEach(function(key) {

        // settings[key] 为 true 且 SELECTORS 里有对应的选择器才处理
        if (settings[key] && SELECTORS[key]) {

            // 遍历该类别下的每个 CSS 选择器
            SELECTORS[key].forEach(function(selector) {
                try {
                    // querySelectorAll 找到页面上所有符合选择器的元素
                    document.querySelectorAll(selector).forEach(function(el) {

                        // 只隐藏还没被隐藏的元素，避免重复处理
                        if (el.style.display !== "none") {
                            el.dataset.focusHidden = "true"; // 打标记，方便识别
                            el.style.display = "none";       // 隐藏元素
                            hiddenElements.push(el);         // 记录到列表里
                        }
                    });
                } catch(e) {
                    // 某些选择器格式不合法会报错，用 try/catch 跳过避免崩溃
                }
            });
        }
    });

    // 显示提示条，告诉用户隐藏了多少个元素
    showToast(`🎯 专注模式已开启，隐藏了 ${hiddenElements.length} 个干扰元素`);
}

// ---- 关闭专注模式 ----
function disableFocus() {

    // 遍历所有被隐藏的元素，逐一恢复
    hiddenElements.forEach(function(el) {
        el.style.display = "";           // 清除 display:none，恢复原始显示
        delete el.dataset.focusHidden;   // 删除我们打的标记
    });

    hiddenElements = []; // 清空记录列表
    showToast("✅ 专注模式已关闭，所有元素已恢复显示");
}

// ---- 显示页面内提示条（Toast）----
function showToast(message) {
    let toast = document.createElement("div"); // 动态创建提示条元素

    // cssText 一次性设置多条 CSS 样式
    toast.style.cssText = `
        position: fixed;       /* 固定在屏幕上，不随页面滚动 */
        top: 20px;             /* 距离顶部 20px */
        right: 20px;           /* 距离右边 20px */
        background: #7c3aed;   /* 紫色背景 */
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-family: "Microsoft YaHei", sans-serif;
        z-index: 999999;       /* 确保显示在页面最上层 */
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    toast.textContent = message;       // 设置提示文字
    document.body.appendChild(toast); // 插入到页面里

    // 3 秒后自动消失
    setTimeout(function() {
        toast.style.opacity    = "0";          // 先变透明
        toast.style.transition = "opacity 0.3s"; // 透明度过渡动画

        // 再过 300ms（动画结束后）彻底从 DOM 里移除
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ---- 初始化：页面加载时检查是否需要自动开启专注模式 ----
chrome.storage.local.get("focusMode", function(result) {

    // 如果上次退出时专注模式是开启状态，则自动重新开启
    if (result.focusMode && result.focusMode.active) {
        enableFocus(result.focusMode);
    }
});