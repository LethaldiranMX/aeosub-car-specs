/**
 * EV Spec Tool - Background Worker
 * Author: lethaldiranMX
 */

// 监听插件图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 在当前标签页执行内容脚本抓取数据
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

// 监听来自 content.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "dataCaptured") {
    // 数据已保存到 storage，打开预览页
    chrome.tabs.create({ url: 'viewer.html' });
  }
});