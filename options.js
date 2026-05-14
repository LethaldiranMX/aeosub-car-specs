/**
 * EV Spec Tool - Settings Script
 * Author: lethaldiranMX
 */

// 保存设置
document.getElementById('save').addEventListener('click', () => {
    const settings = {
        companyName: document.getElementById('companyName').value,
        slogan: document.getElementById('slogan').value,
        watermark: document.getElementById('watermark').value,
        contactName: document.getElementById('contactName').value,
        contactPhone: document.getElementById('contactPhone').value,
        contactWeChat: document.getElementById('contactWeChat').value,
        contactWhatsApp: document.getElementById('contactWhatsApp').value,
        contactEmail: document.getElementById('contactEmail').value,
        def_jiapei: document.getElementById('def_jiapei').value,
        def_wuliu: document.getElementById('def_wuliu').value,
        def_lirun: document.getElementById('def_lirun').value
    };

    chrome.storage.sync.set(settings, () => {
        const status = document.getElementById('status');
        status.textContent = '设置已保存！请刷新预览页。';
        status.style.color = '#28a745';
        setTimeout(() => {
            status.textContent = '';
        }, 2000);
    });
});

// 加载设置
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get({
        companyName: 'Your Company Name',
        slogan: 'Your Company Slogan',
        watermark: 'yourwebsite.com',
        contactName: 'Lanny',
        contactPhone: '+86 17729666782',
        contactWeChat: '',
        contactWhatsApp: '',
        contactEmail: '',
        def_jiapei: '280',
        def_wuliu: '3500',
        def_lirun: '0'
    }, (items) => {
        document.getElementById('companyName').value = items.companyName;
        document.getElementById('slogan').value = items.slogan;
        document.getElementById('watermark').value = items.watermark;
        
        document.getElementById('contactName').value = items.contactName;
        document.getElementById('contactPhone').value = items.contactPhone;
        document.getElementById('contactWeChat').value = items.contactWeChat;
        document.getElementById('contactWhatsApp').value = items.contactWhatsApp;
        document.getElementById('contactEmail').value = items.contactEmail;

        document.getElementById('def_jiapei').value = items.def_jiapei;
        document.getElementById('def_wuliu').value = items.def_wuliu;
        document.getElementById('def_lirun').value = items.def_lirun;
    });
});