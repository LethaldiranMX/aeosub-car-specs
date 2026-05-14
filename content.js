/**
 * EV Spec Tool - Content Script
 * Author: lethaldiranMX
 */

(() => {
  // 查找目标容器，逻辑与原书签代码一致
  const targetElement = document.querySelector('form + .tw-relative');

  if (targetElement) {
    const htmlContent = targetElement.outerHTML;
    
    // 将数据保存到 Chrome 本地存储
    chrome.storage.local.set({ 'scrapedCarData': htmlContent }, () => {
      // 通知 background.js 数据已准备好
      chrome.runtime.sendMessage({ action: "dataCaptured" });
    });
  } else {
    alert('⚠️ 提示：当前页面未检测到车辆参数表。\n\n👉 请确保您已打开“汽车之家”某款具体车型的“参数配置”页面，然后再点击本插件。');
  }
})();