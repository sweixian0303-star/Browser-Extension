// 预设颜色列表：15 个颜色代码，从浅色到深色
// 这些颜色会被动态生成成按钮显示在弹窗里
const PRESET_COLORS = [
    "#ffffff", "#f8f9fa", "#fff3cd", "#d1ecf1", "#d4edda",  // 浅色系
    "#f8d7da", "#e2d9f3", "#fde8d8", "#1a1a2e", "#16213e",  // 粉紫深色系
    "#0f3460", "#533483", "#2d6a4f", "#b5179e", "#f72585"   // 深色系
];

// 获取颜色格子容器，后面动态生成的按钮会插入这里
let colorGrid = document.getElementById("colorGrid");

// 遍历每个颜色，为每个颜色创建一个按钮
PRESET_COLORS.forEach(function(color) {
    let btn = document.createElement("button"); // 动态创建 <button> 元素
    btn.className        = "color-btn";         // 套用 CSS 样式
    btn.style.background = color;               // 按钮背景色 = 对应颜色
    btn.title            = color;               // 鼠标悬停时显示颜色代码

    // 点击颜色按钮时触发
    btn.addEventListener("click", function() {
        applyColor(color); // 把这个颜色应用到网页

        // 先移除所有按钮的 active 状态（取消之前的选中）
        document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("active"));

        // 再给当前点击的按钮加上 active 状态（显示选中边框）
        btn.classList.add("active");
    });

    colorGrid.appendChild(btn); // 把按钮插入到颜色格子容器里
});

// 监听自定义颜色选择器的变化
// input 事件在每次颜色改变时触发（比 change 更实时）
document.getElementById("customColor").addEventListener("input", function() {
    applyColor(this.value); // this.value 是当前选中的颜色代码
});

// 重置按钮：恢复网页原始背景
document.getElementById("resetBtn").addEventListener("click", function() {
    applyColor("");  // 传空字符串表示清除背景色

    // 移除所有颜色按钮的选中状态
    document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("active"));

    // 更新显示文字
    document.getElementById("currentColor").textContent = "当前：已重置";
});

// ---- 核心函数：把颜色注入到当前网页 ----
function applyColor(color) {

    // chrome.tabs.query 找到当前活动的标签页
    // active: true 表示当前激活的标签页
    // currentWindow: true 表示当前窗口
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

        // chrome.scripting.executeScript 在网页里执行一段代码
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id }, // 指定要注入的标签页 id

            // func 是要在网页里执行的函数
            // 注意：这个函数运行在网页环境里，不是扩展环境
            func: function(bgColor) {
                if (bgColor === "") {
                    document.body.style.background = ""; // 清除样式，恢复原始背景
                } else {
                    document.body.style.background = bgColor; // 设置新背景色
                }
            },

            args: [color] // 把 color 变量作为参数传进 func 函数
        });
    });

    // 只有有颜色时才更新显示和保存（重置时不需要）
    if (color) {
        // 更新弹窗底部的当前颜色文字
        document.getElementById("currentColor").textContent = "当前：" + color;

        // 把颜色保存到 chrome.storage，下次打开页面时可以恢复
        chrome.storage.local.set({ pageColor: color });
    }
}

// ---- 初始化：页面加载时读取上次保存的颜色 ----
chrome.storage.local.get("pageColor", function(result) {
    if (result.pageColor) {
        // 把上次的颜色设置到自定义颜色选择器里
        document.getElementById("customColor").value = result.pageColor;

        // 更新底部显示文字
        document.getElementById("currentColor").textContent = "当前：" + result.pageColor;
    }
});