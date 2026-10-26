// 记录专注模式是否开启，false = 关闭，true = 开启
let isActive = false;

// ---- 初始化：页面加载时读取上次保存的状态 ----
chrome.storage.local.get("focusMode", function(result) {

    // 如果之前保存过设置
    if (result.focusMode) {

        // 读取上次的开启状态，|| false 是防止 active 不存在时报错
        isActive = result.focusMode.active || false;

        // 根据读取到的状态更新按钮和文字显示
        updateUI();
    }
});

// ---- 主按钮点击事件 ----
document.getElementById("masterBtn").addEventListener("click", function() {

    // ! 取反：开启 → 关闭，关闭 → 开启
    isActive = !isActive;

    // 收集当前所有开关的状态，打包成 settings 对象
    let settings = {
        active:      isActive,                                        // 是否开启专注模式
        hideAds:     document.getElementById("hideAds").checked,     // 隐藏广告开关状态
        hideSidebar: document.getElementById("hideSidebar").checked, // 隐藏侧边栏开关状态
        hideVideos:  document.getElementById("hideVideos").checked,  // 隐藏视频推荐开关状态
        hidePopups:  document.getElementById("hidePopups").checked,  // 隐藏弹窗通知开关状态
    };

    // 把设置保存到 chrome.storage，下次打开弹窗时可以恢复
    chrome.storage.local.set({ focusMode: settings });

    // 找到当前活动的标签页，把设置发送给 content.js
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

        // chrome.tabs.sendMessage 向指定标签页的 content.js 发送消息
        // content.js 用 chrome.runtime.onMessage 监听并接收这条消息
        chrome.tabs.sendMessage(tabs[0].id, {
            type:     "FOCUS_MODE", // 消息类型，content.js 用这个判断要做什么
            settings: settings      // 把设置一起传过去
        });
    });

    // 更新弹窗的按钮文字和状态显示
    updateUI();
});

// ---- 更新弹窗 UI 显示 ----
function updateUI() {
    let btn    = document.getElementById("masterBtn"); // 主按钮
    let status = document.getElementById("status");    // 状态文字

    if (isActive) {
        // 开启状态：按钮文字变"关闭"，加深紫色（active 类），状态文字更新
        btn.textContent = "⏹ 关闭专注模式";
        btn.classList.add("active");       // 触发 CSS 里 #masterBtn.active 的深紫色样式
        status.textContent = "✅ 专注模式已开启";
    } else {
        // 关闭状态：按钮文字变"开启"，移除深紫色，状态文字恢复默认
        btn.textContent = "🎯 开启专注模式";
        btn.classList.remove("active");    // 移除 active 类，恢复浅紫色
        status.textContent = "点击按钮开始专注";
    }
}