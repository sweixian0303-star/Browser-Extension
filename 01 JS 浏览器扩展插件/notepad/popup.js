// ---- 获取页面元素，后面频繁用到 ----
let noteArea  = document.getElementById("noteArea");   // 笔记输入框
let status    = document.getElementById("status");     // 底部状态文字
let wordCount = document.getElementById("wordCount");  // 字数统计
let saveBtn   = document.getElementById("saveBtn");    // 保存按钮
let clearBtn  = document.getElementById("clearBtn");   // 清除按钮

// ---- 初始化：页面加载时读取上次保存的笔记 ----
chrome.storage.local.get("note", function(result) {

    // 如果之前保存过笔记内容
    if (result.note) {
        noteArea.value = result.note; // 把上次的笔记填入输入框
        updateWordCount();            // 同步更新字数统计
    }
});

// ---- 自动保存计时器 ----
// null 表示当前没有计时器在运行
let autoSaveTimer = null;

// 监听输入框的 input 事件（每次输入/删除文字都会触发）
noteArea.addEventListener("input", function() {
    updateWordCount();             // 每次输入都实时更新字数
    status.textContent = "未保存..."; // 提示用户有未保存的内容

    // 清除上一个计时器（如果用户还在输入，就重置倒计时）
    // 这样可以避免每按一个键就保存一次，只在停止输入 1 秒后才保存
    clearTimeout(autoSaveTimer);

    // 重新开始 1 秒倒计时，1 秒后自动保存
    autoSaveTimer = setTimeout(function() {
        saveNote();
    }, 1000); // 1000 毫秒 = 1 秒
});

// ---- 字数统计函数 ----
function updateWordCount() {
    // noteArea.value.length 统计输入框里的字符总数
    wordCount.textContent = noteArea.value.length + " 个字符";
}

// ---- 保存按钮：点击时手动保存 ----
// 直接把 saveNote 函数作为点击事件的处理函数
saveBtn.addEventListener("click", saveNote);

// ---- 清除按钮：点击时清空笔记 ----
clearBtn.addEventListener("click", function() {

    // confirm() 弹出确认对话框，用户点"确定"返回 true，点"取消"返回 false
    if (confirm("确定清除所有笔记吗？")) {
        noteArea.value = "";                        // 清空输入框
        chrome.storage.local.remove("note");        // 从 storage 里删除保存的笔记
        status.textContent = "已清除";              // 更新状态文字
        updateWordCount();                          // 字数归零
    }
});

// ---- 保存函数 ----
function saveNote() {
    // chrome.storage.local.set 把数据写入扩展专用存储
    // 键名是 "note"，值是输入框里的内容
    chrome.storage.local.set({ note: noteArea.value }, function() {

        // 保存成功后的回调：更新状态文字，显示保存时间
        // toLocaleTimeString() 返回本地时间格式，如 "11:30:05 AM"
        status.textContent = "✅ 已保存 " + new Date().toLocaleTimeString();
    });
}