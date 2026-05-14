/**
 * EV Spec Tool - Auto Calculator & Previewer
 * Author: lethaldiranMX
 * WeChat: lethaldiranMX
 * Mobile: 13310282690
 * Email: senluoyunhai@gmail.com
 */

// 初始化逻辑
document.addEventListener('DOMContentLoaded', () => {
    initViewer();
});

// 全局配置变量 (更新默认值为您的特定信息)
let userSettings = {
    companyName: 'SiCILY | HiLUCK',
    slogan: 'Your Trusted Chinese EV Partner',
    watermark: 'HiLUCKEV.COM',
    contactName: 'Lanny', // 默认销售经理
    contactPhone: '+86 17729666782', // 默认手机
    contactWeChat: '', // 默认留空，需设置
    contactWhatsApp: '', // 默认留空，需设置
    contactEmail: '', // 默认留空
    def_jiapei: '280',
    def_wuliu: '3500',
    def_lirun: '0'
};

function initViewer() {
    chrome.storage.local.get(['scrapedCarData'], (localData) => {
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
        }, (settings) => {
            userSettings = settings;
            
            if (userSettings.watermark) {
                document.body.style.setProperty('--watermark-text', `"${userSettings.watermark}"`);
            } else {
                document.body.style.setProperty('--watermark-text', '""');
            }

            const container = document.getElementById('content-placeholder');
            const statusEl = document.getElementById('status-message');

            if (localData.scrapedCarData) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = localData.scrapedCarData;

                // 清除原网页带来的所有 a 标签跳转链接，替换为普通的 span
                const allLinks = tempDiv.querySelectorAll('a');
                allLinks.forEach(link => {
                    const span = document.createElement('span');
                    span.innerHTML = link.innerHTML;
                    if (link.className) span.className = link.className;
                    link.parentNode.replaceChild(span, link);
                });

                const header = tempDiv.querySelector('.style_table_head__dVWgY');
                if (header) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'header-placeholder';
                    placeholder.innerHTML = `${userSettings.companyName}<span class="slogan">${userSettings.slogan}</span>`;
                    header.insertBefore(placeholder, header.firstChild);
                }

                container.innerHTML = tempDiv.innerHTML;
                
                // 使车型标题可编辑
                const carNameEls = container.querySelectorAll('.style_col_spec_name__xEEU6');
                carNameEls.forEach(el => {
                    el.setAttribute('contenteditable', 'true');
                    el.style.borderBottom = '1px dashed #ccc';
                    el.style.outline = 'none';
                    el.title = '点击编辑车型名称';
                });

                // 设置页面标题
                try {
                    const firstCarNameEl = container.querySelector('.style_table_head_spec__9XixG .style_col_spec_name__xEEU6');
                    if (firstCarNameEl && firstCarNameEl.textContent.trim()) {
                        document.title = firstCarNameEl.textContent.trim() + " - 参数报告";
                    }
                } catch (e) { console.warn("标题设置失败", e); }

                hideUnwantedRows();
                const numCols = container.querySelector('.style_table_head__dVWgY').querySelectorAll('.style_table_head_spec__9XixG').length;
                
                createCalculatorModule(numCols);
                createStockEntryModule(numCols);
                createStockDisplayRow(numCols);
                
                // --- 插入页脚 (文档末尾) ---
                createFooter();

                document.getElementById('price-options').style.display = 'flex';
                statusEl.textContent = '数据加载成功！';
                statusEl.style.color = '#28a745';

                for (let i = 0; i < numCols; i++) {
                    recalculateColumn(i);
                }
            } else {
                statusEl.textContent = '未找到数据，请回到详情页重新点击插件图标。';
                statusEl.style.color = 'red';
            }
        });
    });

    setupEventListeners();
}

function createFooter() {
    // 如果没有任何联系信息，则不创建页脚
    if (!userSettings.contactName && !userSettings.contactPhone && !userSettings.contactEmail && !userSettings.contactWeChat && !userSettings.contactWhatsApp) return;

    const captureContainer = document.getElementById('capture-container');
    const footer = document.createElement('div');
    footer.className = 'report-footer';
    
    // 使用 Emoji 图标
    let footerHtml = '';
    if (userSettings.contactName) footerHtml += `<div class="footer-item">🧑‍💼 销售经理: <span>${userSettings.contactName}</span></div>`;
    if (userSettings.contactPhone) footerHtml += `<div class="footer-item">📱 手机/Mobile: <span>${userSettings.contactPhone}</span></div>`;
    if (userSettings.contactWhatsApp) footerHtml += `<div class="footer-item">💬 WhatsApp: <span>${userSettings.contactWhatsApp}</span></div>`;
    if (userSettings.contactWeChat) footerHtml += `<div class="footer-item">💬 WeChat: <span>${userSettings.contactWeChat}</span></div>`;
    if (userSettings.contactEmail) footerHtml += `<div class="footer-item">📧 Email: <span>${userSettings.contactEmail}</span></div>`;
    
    footer.innerHTML = footerHtml;
    captureContainer.appendChild(footer);
}

function setupEventListeners() {
    document.getElementById('showDealerPrice').addEventListener('change', (e) => togglePriceRowVisibility('itemtitle_2', e.target.checked));
    document.getElementById('showMsrp').addEventListener('change', (e) => togglePriceRowVisibility('itemtitle_3', e.target.checked));
    document.getElementById('showFOBPrice').addEventListener('change', (e) => toggleDynamicPriceRow('fob', 'FOB价格', e.target.checked));
    document.getElementById('showSeaFreight').addEventListener('change', (e) => toggleDynamicPriceRow('haiyun', '海运费', e.target.checked));
    document.getElementById('showCIFPrice').addEventListener('change', (e) => toggleDynamicPriceRow('cif', 'CIF价格', e.target.checked));
    document.getElementById('showStockColor').addEventListener('change', (e) => {
        const stockRow = document.getElementById('stock-display-row');
        if (stockRow) stockRow.style.display = e.target.checked ? 'flex' : 'none';
    });

    document.getElementById('addImageButton').addEventListener('click', handleAddImage);
    document.getElementById('fetchRatesButton').addEventListener('click', fetchLatestRates);
    
    document.getElementById('openSettingsButton').addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });

    // 打印预览 (已包含另存为 PDF 功能)
    document.getElementById('printButton').addEventListener('click', () => {
        window.print();
    });


// 在 setupEventListeners() 内部添加监听
document.getElementById('copyStaticHtmlButton').addEventListener('click', copyStaticTableForWP);


    
    // 下载长图
    document.getElementById('downloadImageButton').addEventListener('click', () => {
        const element = document.getElementById('capture-container');
        const btn = document.getElementById('downloadImageButton');
        btn.textContent = '⏳ 生成中...';
        btn.disabled = true;

        if (typeof html2canvas === 'undefined') {
            alert('错误：未检测到 html2canvas 库，请检查是否已将 html2canvas.min.js 放入插件目录。');
            btn.textContent = '📸 下载长图';
            btn.disabled = false;
            return;
        }

        html2canvas(element, {
            scale: 2, // 提高清晰度
            useCORS: true,
            backgroundColor: '#ffffff',
            ignoreElements: (el) => {
                // 在截长图时排除内部工具模块
                if (el.id === 'calculator-section' || el.id === 'stock-entry-module') return true;
                // 同时排除汽车之家的无用小提示栏
                if (el.classList && el.classList.contains('style_table_title_prompt__XcBX9')) return true;
                return false;
            }
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `EV_Spec_Report_${new Date().toISOString().slice(0,10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            btn.textContent = '📸 下载长图';
            btn.disabled = false;
        }).catch(err => {
            console.error(err);
            alert('生成图片失败，请查看控制台错误。');
            btn.textContent = '📸 下载长图';
            btn.disabled = false;
        });
    });

    const currencyInputs = document.querySelectorAll('input[name="currency_toggle"], #globalRateUSD, #globalRateEUR');
    currencyInputs.forEach(input => {
        input.addEventListener('input', () => {
            const numCols = document.querySelectorAll('.style_table_head_spec__9XixG').length;
            for (let i = 0; i < numCols; i++) recalculateColumn(i);
            updateAllDynamicRowAppearances();
        });
    });
}

// --- 辅助函数 ---
function parseWanToYuan(text) {
    if (!text) return 0;
    const cleanedText = text.replace(/[¥￥,]/g, '').trim(); 
    const match = cleanedText.match(/[\d\.]+/);
    if (match) {
        let value = parseFloat(match[0]);
        if (cleanedText.includes('万')) value *= 10000;
        return value;
    }
    return 0;
}

function hideUnwantedRows() {
    const container = document.getElementById('content-placeholder');
    const allRows = container.querySelectorAll('.style_row__XPu4s');
    allRows.forEach(row => {
        const titleCell = row.querySelector('.style_col_title__evR1W');
        if (titleCell && (titleCell.textContent.includes('质保') || titleCell.textContent.toLowerCase().includes('warranty'))) {
            row.style.display = 'none';
        }
    });
}

function togglePriceRowVisibility(dataSelectTitle, isVisible) {
    const rows = document.querySelectorAll(`#content-placeholder .style_row__XPu4s[data-select-title="${dataSelectTitle}"]`);
    rows.forEach(row => {
        row.style.display = isVisible ? 'flex' : 'none';
    });
}

function handleAddImage() {
    const imageUrlsInput = document.getElementById('imageURLInput');
    const imageUrls = imageUrlsInput.value.split(/[ ,]+/).filter(url => url.trim() !== '');
    const imageContainer = document.getElementById('image-placeholder');
    imageUrls.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = '用户上传的图片';
        img.addEventListener('click', function() { this.remove(); });
        imageContainer.appendChild(img);
    });
    imageUrlsInput.value = '';
}

// ======================= 动态价格行 =====================
function toggleDynamicPriceRow(fieldKey, labelText, isChecked) {
    const container = document.getElementById('content-placeholder');
    const rowId = 'dynamic-row-' + fieldKey;
    const existingRow = document.getElementById(rowId);

    if (isChecked) {
        if (existingRow) return;
        const numCols = container.querySelector('.style_table_head__dVWgY').querySelectorAll('.style_table_head_spec__9XixG').length;
        if (numCols === 0) return;

        const newRow = document.createElement('div');
        newRow.className = 'style_row__XPu4s'; newRow.id = rowId;

        const currencySymbol = getCurrencySymbol();
        const titleCol = document.createElement('div');
        titleCol.className = 'style_col__xFg86 style_col_title__evR1W';
        titleCol.textContent = `${labelText} (${currencySymbol})`;
        newRow.appendChild(titleCol);

        for (let i = 0; i < numCols; i++) {
            const dataCol = document.createElement('div');
            dataCol.className = 'style_col__xFg86';
            const input = document.createElement('input');
            input.type = 'text'; input.className = 'dynamic-price-input';
            input.dataset.colIndex = i; input.dataset.field = fieldKey; 
            
            const huilv = getActiveExchangeRate(); 
            const rmbCalcInput = document.querySelector(`.calculator-input[data-col-index="${i}"][data-field="${fieldKey}"]`);
            let rmbValue = 0;

            if (fieldKey === 'haiyun') {
                const usdHuilv = parseFloat(document.getElementById('globalRateUSD').value) || 7.3;
                const haiyun_USD = rmbCalcInput ? (parseFloat(rmbCalcInput.value) || 0) : 0;
                rmbValue = haiyun_USD * usdHuilv;
            } else {
                rmbValue = rmbCalcInput ? (parseFloat(rmbCalcInput.value) || 0) : 0;
            }
            
            const rawExternalValue = rmbValue / huilv;
            const roundedExternalValue = roundUpToTen(rawExternalValue);
            const formattedValue = formatNumberWithCommas(roundedExternalValue);
            input.placeholder = `${currencySymbol} ${formattedValue}`;
            
            dataCol.appendChild(input);
            newRow.appendChild(dataCol);
        }

        let anchorElement = container.querySelector('.style_row__XPu4s[data-select-title="itemtitle_3"]');
        if (fieldKey === 'haiyun') { 
            const fobRow = document.getElementById('dynamic-row-fob');
            if (fobRow) anchorElement = fobRow;
        } else if (fieldKey === 'cif') { 
            const haiyunRow = document.getElementById('dynamic-row-haiyun');
            const fobRow = document.getElementById('dynamic-row-fob');
            if (haiyunRow) anchorElement = haiyunRow;
            else if (fobRow) anchorElement = fobRow;
        }

        if (anchorElement && anchorElement.parentNode) {
            anchorElement.parentNode.insertBefore(newRow, anchorElement.nextSibling);
        }
    } else {
        if (existingRow) existingRow.remove();
    }
}

// ======================== 计算器相关函数 =======================
function roundUpToTen(num) { return Math.ceil(num / 10) * 10; }

function formatNumberWithCommas(number) {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0, minimumFractionDigits: 0 
    }).format(number);
}

function getActiveExchangeRate() {
    let huilv = 1;
    const activeRadio = document.querySelector('input[name="currency_toggle"]:checked');
    if (activeRadio) {
        const rateInput = document.getElementById(activeRadio.dataset.rateId);
        huilv = parseFloat(rateInput.value) || 1; 
    }
    return huilv;
}

function getCurrencySymbol() {
    let currencySymbol = 'CNY';
    const activeRadio = document.querySelector('input[name="currency_toggle"]:checked');
    if (activeRadio) {
        if (activeRadio.value === 'usd') currencySymbol = 'USD';
        if (activeRadio.value === 'eur') currencySymbol = 'EUR';
    }
    return currencySymbol;
}

function recalculateColumn(colIndex) {
    const section = document.getElementById('calculator-section');
    if (!section) return;

    const getVal = (field) => {
        const el = section.querySelector(`.calculator-input[data-col-index="${colIndex}"][data-field="${field}"]`);
        return el ? (parseFloat(el.value) || 0) : 0;
    };
    const setVal = (field, value) => {
        const el = section.querySelector(`.calculator-input[data-col-index="${colIndex}"][data-field="${field}"]`);
        const formattedValue = isNaN(value) ? '0.00' : value.toFixed(2);
        if (el) el.value = formattedValue;
        return formattedValue;
    };
    
    const zhidaojia = getVal('zhidaojia'); const youhui = getVal('youhui');
    const jiapei = getVal('jiapei'); const wuliu = getVal('wuliu');
    const lirun = getVal('lirun'); const gangza_RMB = getVal('gangza'); 
    const haiyun_USD = getVal('haiyun'); 
    const usdHuilv = parseFloat(document.getElementById('globalRateUSD').value) || 7.3;
    const haiyun_RMB = haiyun_USD * usdHuilv;

    const tuishui = (zhidaojia - youhui) / 1.13 * 0.13;
    setVal('tuishui', tuishui);
    
    const rmbCost = (zhidaojia - youhui + jiapei + wuliu + gangza_RMB - tuishui);
    const fob_RMB = rmbCost + lirun;
    const fobFormatted_RMB = setVal('fob', fob_RMB);
    
    const cif_RMB = fob_RMB + haiyun_RMB; 
    const cifFormatted_RMB = setVal('cif', cif_RMB);
    
    const maoli_RMB = fob_RMB - rmbCost;
    setVal('maoli', maoli_RMB);
    
    updateExternalDisplayForColumn(colIndex, {
        fob_rmb: fobFormatted_RMB,
        cif_rmb: cifFormatted_RMB,
        haiyun_rmb: haiyun_RMB 
    });
}

function updateExternalDisplayForColumn(colIndex, rmbValues = {}) {
    const huilv = getActiveExchangeRate();
    const currencySymbol = getCurrencySymbol();

    const updateField = (fieldKey) => {
        const dynamicInput = document.querySelector(`.dynamic-price-input[data-col-index="${colIndex}"][data-field="${fieldKey}"]`);
        if (dynamicInput) {
            let rmb_val = rmbValues[`${fieldKey}_rmb`];
            if (rmb_val === undefined) {
                const rmbCalcInput = document.querySelector(`.calculator-input[data-col-index="${colIndex}"][data-field="${fieldKey}"]`);
                if(fieldKey === 'haiyun') {
                    const usdHuilv = parseFloat(document.getElementById('globalRateUSD').value) || 7.3;
                    const haiyun_USD = rmbCalcInput ? (parseFloat(rmbCalcInput.value) || 0) : 0;
                    rmb_val = haiyun_USD * usdHuilv;
                } else {
                    rmb_val = rmbCalcInput ? (parseFloat(rmbCalcInput.value) || 0) : 0;
                }
            }
            const rawExternalValue = parseFloat(rmb_val) / huilv;
            const roundedExternalValue = roundUpToTen(rawExternalValue);
            const formattedValue = formatNumberWithCommas(roundedExternalValue);
            dynamicInput.placeholder = `${currencySymbol} ${formattedValue}`;
        }
    };

    updateField('fob'); updateField('cif'); updateField('haiyun');
}

function createCalculatorModule(numCols) {
    const container = document.getElementById('content-placeholder');
    const allTitles = Array.from(container.querySelectorAll('.style_table_title__JuEBv'));
    const baseParamsTitle = allTitles.find(el => el.textContent.includes('基本参数'));
    if (!baseParamsTitle || numCols === 0) return;

    // 使用配置的默认值
    const fields = [
        { label: '指导价 (RMB)', field: 'zhidaojia', type: 'number' }, 
        { label: '优惠 (RMB)', field: 'youhui', type: 'number' },
        { label: '加配及附件 (RMB)', field: 'jiapei', type: 'number', value: userSettings.def_jiapei }, 
        { label: '国内物流及上牌 (RMB)', field: 'wuliu', type: 'number', value: userSettings.def_wuliu }, 
        { label: '港杂费 (RMB)', field: 'gangza', type: 'select', options: [ 
            { text: '-- 选择港杂 --', value: '0' },
            { text: '一柜2台 (RMB 4500/台)', value: '4500' },
            { text: '一柜3台 (RMB 2800/台)', value: '2800' },
            { text: '一柜4台 (RMB 2000/台)', value: '2000' }
        ]}, 
        { label: '退税 (RMB)', field: 'tuishui', type: 'output' },
        { label: '加利润 (RMB)', field: 'lirun', type: 'number', value: userSettings.def_lirun }, 
        { label: '海运费 (USD)', field: 'haiyun', type: 'number' }, 
        { label: 'FOB价格 (RMB)', field: 'fob', type: 'output' },    
        { label: 'CIF价格 (RMB)', field: 'cif', type: 'output' },    
        /* ★★★ 修正：FOB报价毛利单位修正为 RMB ★★★ */
        { label: 'FOB报价毛利 (RMB)', field: 'maoli', type: 'output' } 
    ];
    
    const calculatorSection = document.createElement('div');
    calculatorSection.id = 'calculator-section';
    const moduleTitle = document.createElement('div');
    moduleTitle.className = 'style_table_title__JuEBv internal-tool-title';
    moduleTitle.innerHTML = '<span class="style_table_title_col__smmZt">报价计算器 （内部预览，不会显示在报告内）</span>';
    calculatorSection.appendChild(moduleTitle);

    fields.forEach(item => {
        const row = document.createElement('div');
        row.className = 'style_row__XPu4s';
        const titleCol = document.createElement('div');
        titleCol.className = 'style_col_title__evR1W';
        titleCol.textContent = item.label; 
        row.appendChild(titleCol);
        
        for (let i = 0; i < numCols; i++) {
            const dataCol = document.createElement('div');
            dataCol.className = 'style_col__xFg86';
            let inputEl;
            if (item.type === 'select') {
                inputEl = document.createElement('select');
                inputEl.className = 'calculator-input';
                item.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value; option.textContent = opt.text;
                    inputEl.appendChild(option);
                });
                inputEl.addEventListener('change', () => recalculateColumn(i));
            } else {
                inputEl = document.createElement('input');
                inputEl.className = 'calculator-input';
                if (item.type === 'output') {
                    inputEl.readOnly = true; 
                    inputEl.classList.add('calculator-output');
                    inputEl.type = 'text';
                } else {
                    inputEl.type = 'number'; inputEl.step = '0.01';
                    inputEl.addEventListener('input', () => recalculateColumn(i));
                    if (item.value) inputEl.value = item.value;
                    if (item.field === 'zhidaojia') {
                        const msrpCell = container.querySelector(`.style_row__XPu4s[data-select-title="itemtitle_3"] .style_col__xFg86:nth-of-type(${i + 2})`);
                        if (msrpCell) {
                            const rmbValue = parseWanToYuan(msrpCell.textContent || "");
                            if (rmbValue > 0) inputEl.value = rmbValue.toFixed(0);
                        }
                    }
                }
            }
            inputEl.dataset.colIndex = i; inputEl.dataset.field = item.field;
            dataCol.appendChild(inputEl);
            row.appendChild(dataCol);
        }
        calculatorSection.appendChild(row);
    });
    baseParamsTitle.parentNode.insertBefore(calculatorSection, baseParamsTitle);
}

// ===================== 库存输入 =====================
function createStockEntryModule(numCols) {
    const container = document.getElementById('content-placeholder');
    const allTitles = Array.from(container.querySelectorAll('.style_table_title__JuEBv'));
    const colorTitle = allTitles.find(el => el.textContent.includes('颜色'));
    const baseParamsTitle = allTitles.find(el => el.textContent.includes('基本参数'));
    if (!colorTitle || !baseParamsTitle) return;

    const stockEntryModule = document.createElement('div');
    stockEntryModule.id = 'stock-entry-module';
    
    const clonedTitle = colorTitle.cloneNode(true);
    clonedTitle.classList.add('internal-tool-title');
    const titleSpan = clonedTitle.querySelector('.style_table_title_col__smmZt');
    if (titleSpan) titleSpan.innerHTML += ' （内部预览，不会显示在报告内）';
    stockEntryModule.appendChild(clonedTitle);

    let nextEl = colorTitle.nextElementSibling;
    while (nextEl && !nextEl.classList.contains('style_table_title__JuEBv')) {
        if (nextEl.classList.contains('style_row__XPu4s')) {
            const clonedRow = nextEl.cloneNode(true);
            const titleText = clonedRow.querySelector('.style_col_title__evR1W').textContent.trim();
            const colorType = titleText.includes('外观') ? 'exterior' : (titleText.includes('内饰') ? 'interior' : 'other');
            
            if (colorType !== 'other') {
                const dataCells = Array.from(clonedRow.children).slice(1); 
                dataCells.forEach((cell, i) => { 
                    const colorItems = cell.querySelectorAll('.style_col_colorcontent__hjkjT');
                    colorItems.forEach(item => {
                        const colorName = item.querySelector('.style_col_color_text__jwxzK').textContent.trim();
                        const colorBlock = item.querySelector('.style_col_color_block__f4_UW span');
                        const colorValue = colorBlock ? colorBlock.style.backgroundColor : '#ccc';
                        
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.className = 'stock-color-checkbox';
                        checkbox.dataset.colIndex = i; 
                        checkbox.dataset.colorType = colorType;
                        checkbox.dataset.colorName = colorName.split(' ')[0];
                        checkbox.dataset.colorValue = colorValue; 
                        checkbox.addEventListener('change', handleColorSelectionChange);
                        item.appendChild(checkbox);
                    });
                });
            }
            stockEntryModule.appendChild(clonedRow);
        }
        nextEl = nextEl.nextElementSibling;
    }

    const actionRow = document.createElement('div');
    actionRow.className = 'style_row__XPu4s';
    actionRow.id = 'stock-action-row';
    const actionTitle = document.createElement('div');
    actionTitle.className = 'style_col__xFg86 style_col_title__evR1W';
    actionTitle.textContent = '添加库存';
    actionRow.appendChild(actionTitle);

    for (let i = 0; i < numCols; i++) { 
        const actionCell = document.createElement('div');
        actionCell.className = 'style_col__xFg86 stock-action-cell';
        actionCell.id = `stock-action-cell-${i}`; 
        
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.className = 'stock-qty-input';
        qtyInput.placeholder = '数量';
        qtyInput.disabled = true;
        
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'stock-add-button';
        addButton.textContent = '添加';
        addButton.dataset.colIndex = i; 
        addButton.disabled = true;
        addButton.addEventListener('click', handleAddToStock);

        actionCell.appendChild(qtyInput);
        actionCell.appendChild(addButton);
        actionRow.appendChild(actionCell);
    }
    stockEntryModule.appendChild(actionRow);

    const calculatorSection = document.getElementById('calculator-section');
    if (calculatorSection) {
        calculatorSection.parentNode.insertBefore(stockEntryModule, calculatorSection.nextSibling); 
    } else {
        baseParamsTitle.parentNode.insertBefore(stockEntryModule, baseParamsTitle); 
    }
}

function createStockDisplayRow(numCols) {
    const calculatorSection = document.getElementById('calculator-section');
    if (!calculatorSection) return;

    const displayRow = document.createElement('div');
    displayRow.className = 'style_row__XPu4s';
    displayRow.id = 'stock-display-row';
    displayRow.style.display = 'none'; 

    const titleCell = document.createElement('div');
    titleCell.className = 'style_col__xFg86 style_col_title__evR1W';
    titleCell.textContent = '库存颜色';
    displayRow.appendChild(titleCell);

    for (let i = 0; i < numCols; i++) { 
        const dataCell = document.createElement('div');
        dataCell.className = 'style_col__xFg86 stock-display-cell';
        dataCell.id = `stock-display-cell-${i}`; 
        displayRow.appendChild(dataCell);
    }
    
    calculatorSection.parentNode.insertBefore(displayRow, calculatorSection);
}

function handleColorSelectionChange(event) {
    const target = event.target;
    const colIndex = parseInt(target.dataset.colIndex, 10);
    const colorType = target.dataset.colorType;
    const isChecked = target.checked;

    const allCheckboxes = document.querySelectorAll(`#stock-entry-module .stock-color-checkbox[data-col-index="${colIndex}"][data-color-type="${colorType}"]`);
    allCheckboxes.forEach(cb => { if (cb !== target) cb.disabled = isChecked; });
    checkActionUIState(colIndex);
}

function checkActionUIState(colIndex) { 
    const exteriorChecked = document.querySelector(`#stock-entry-module .stock-color-checkbox[data-col-index="${colIndex}"][data-color-type="exterior"]:checked`);
    const interiorChecked = document.querySelector(`#stock-entry-module .stock-color-checkbox[data-col-index="${colIndex}"][data-color-type="interior"]:checked`);
    
    const actionCell = document.getElementById(`stock-action-cell-${colIndex}`);
    if (!actionCell) return; 
    
    const qtyInput = actionCell.querySelector('.stock-qty-input');
    const addButton = actionCell.querySelector('.stock-add-button');

    if (exteriorChecked && interiorChecked) {
        qtyInput.disabled = false; addButton.disabled = false;
    } else {
        qtyInput.disabled = true; addButton.disabled = true;
    }
}

function handleAddToStock(event) {
    const colIndex = parseInt(event.target.dataset.colIndex, 10);
    const exteriorCheckbox = document.querySelector(`#stock-entry-module .stock-color-checkbox[data-col-index="${colIndex}"][data-color-type="exterior"]:checked`);
    const interiorCheckbox = document.querySelector(`#stock-entry-module .stock-color-checkbox[data-col-index="${colIndex}"][data-color-type="interior"]:checked`);
    
    if (!exteriorCheckbox || !interiorCheckbox) return;
    
    const exteriorColor = exteriorCheckbox.dataset.colorName;
    const interiorColor = interiorCheckbox.dataset.colorName;
    const exteriorColorValue = exteriorCheckbox.dataset.colorValue;
    const interiorColorValue = interiorCheckbox.dataset.colorValue;
    
    const actionCell = document.getElementById(`stock-action-cell-${colIndex}`);
    const displayCell = document.getElementById(`stock-display-cell-${colIndex}`);
    if (!actionCell || !displayCell) return; 

    const qtyInput = actionCell.querySelector('.stock-qty-input');
    const addButton = actionCell.querySelector('.stock-add-button');
    const qty = qtyInput.value;

    if (!qty || qty <= 0) {
        qtyInput.style.borderColor = 'red';
        setTimeout(() => { qtyInput.style.borderColor = '#ccc'; }, 2000);
        return;
    }

    const stockItem = document.createElement('div');
    stockItem.className = 'stock-color-item';
    
    const colorCombination = document.createElement('div');
    colorCombination.className = 'stock-color-combination';
    
    const exteriorPair = document.createElement('div');
    exteriorPair.className = 'stock-color-pair';
    const exteriorBlock = document.createElement('span');
    exteriorBlock.className = 'stock-color-block';
    exteriorBlock.style.backgroundColor = exteriorColorValue;
    exteriorPair.appendChild(exteriorBlock);
    exteriorPair.appendChild(document.createTextNode(exteriorColor));
    
    const interiorPair = document.createElement('div');
    interiorPair.className = 'stock-color-pair';
    const interiorBlock = document.createElement('span');
    interiorBlock.className = 'stock-color-block';
    interiorBlock.style.backgroundColor = interiorColorValue;
    interiorPair.appendChild(interiorBlock);
    interiorPair.appendChild(document.createTextNode(interiorColor));
    
    colorCombination.appendChild(exteriorPair);
    colorCombination.appendChild(document.createTextNode('/'));
    colorCombination.appendChild(interiorPair);
    
    const qtyDisplay = document.createElement('span');
    qtyDisplay.className = 'stock-qty-display';
    qtyDisplay.textContent = `× ${qty}`;
    
    stockItem.appendChild(colorCombination);
    stockItem.appendChild(qtyDisplay);
    displayCell.appendChild(stockItem);

    const allCheckboxes = document.querySelectorAll(`#stock-entry-module .stock-color-checkbox[data-col-index="${colIndex}"]`);
    allCheckboxes.forEach(cb => { cb.checked = false; cb.disabled = false; });
    qtyInput.value = ''; qtyInput.disabled = true; addButton.disabled = true;
}

function updateAllDynamicRowAppearances() {
    updateDynamicRowAppearance('fob', 'FOB价格');
    updateDynamicRowAppearance('haiyun', '海运费');
    updateDynamicRowAppearance('cif', 'CIF价格');
}

function updateDynamicRowAppearance(fieldKey, labelText) {
    const row = document.getElementById('dynamic-row-' + fieldKey);
    if (!row) return;

    const currencySymbol = getCurrencySymbol();
    const huilv = getActiveExchangeRate();

    const titleCol = row.querySelector('.style_col_title__evR1W');
    if (titleCol) titleCol.textContent = `${labelText} (${currencySymbol})`;

    const inputs = row.querySelectorAll('.dynamic-price-input');
    inputs.forEach(input => {
        const i = input.dataset.colIndex;
        const rmbCalcInput = document.querySelector(`.calculator-input[data-col-index="${i}"][data-field="${fieldKey}"]`);
        let rmbValue = 0;
        if (fieldKey === 'haiyun') {
            const usdHuilv = parseFloat(document.getElementById('globalRateUSD').value) || 7.3;
            const haiyun_USD = rmbCalcInput ? (parseFloat(rmbCalcInput.value) || 0) : 0;
            rmbValue = haiyun_USD * usdHuilv;
        } else {
            rmbValue = rmbCalcInput ? (parseFloat(rmbCalcInput.value) || 0) : 0;
        }
        
        const rawExternalValue = rmbValue / huilv;
        const roundedExternalValue = roundUpToTen(rawExternalValue);
        const formattedValue = formatNumberWithCommas(roundedExternalValue);
        input.placeholder = `${currencySymbol} ${formattedValue}`;
    });
}

async function fetchLatestRates() {
    const statusEl = document.getElementById('rate-status');
    const buttonEl = document.getElementById('fetchRatesButton');
    const usdInput = document.getElementById('globalRateUSD');
    const eurInput = document.getElementById('globalRateEUR');
    
    statusEl.textContent = '正在获取...';
    statusEl.style.color = '#007bff';
    buttonEl.disabled = true;

    try {
        const response = await fetch('https://api.frankfurter.app/latest?from=CNY&to=USD,EUR');
        if (!response.ok) throw new Error('API 请求失败');
        const data = await response.json();
        
        const rateUSD_to_CNY = 1 / data.rates.USD;
        const rateEUR_to_CNY = 1 / data.rates.EUR;
        
        usdInput.value = rateUSD_to_CNY.toFixed(4);
        eurInput.value = rateEUR_to_CNY.toFixed(4);
        
        statusEl.textContent = `汇率已更新 (1 USD = ${rateUSD_to_CNY.toFixed(4)} CNY / 1 EUR = ${rateEUR_to_CNY.toFixed(4)} CNY)`;
        statusEl.style.color = '#28a745';
        
        const numCols = document.querySelectorAll('.style_table_head_spec__9XixG').length;
        for (let i = 0; i < numCols; i++) recalculateColumn(i);
        
    } catch (error) {
        console.error('获取汇率失败:', error);
        statusEl.textContent = '获取汇率失败，请检查网络或手动输入。';
        statusEl.style.color = '#dc3545';
    } finally {
        buttonEl.disabled = false;
    }
}


function copyStaticTableForWP() {
    const btn = document.getElementById('copyStaticHtmlButton');
    const originalText = btn.textContent;
    btn.textContent = '⚡ 生成中...';

    const mySchemaId = "https://aeosub.com/#lethaldiranMX"; 

    try {
        // --- 第一步：克隆容器 ---
        const container = document.getElementById('capture-container');
        if (!container) throw new Error("未找到表格容器");
        const clone = container.cloneNode(true);

        // --- 第二步：移除无用模块 ---
        const removeSelectors = [
            '#stock-entry-module',               
            '#calculator-section',               
            '.style_table_title_prompt__XcBX9',  
            '.report-footer'                     
        ];
        removeSelectors.forEach(sel => {
            const els = clone.querySelectorAll(sel);
            els.forEach(el => el.remove());
        });

        // --- 第三步：移除垃圾表头格 ---
        const headerRow = clone.querySelector('.style_table_head__dVWgY');
        if (headerRow) {
            const headerCells = Array.from(headerRow.children);
            const junkCell = headerCells.find(cell => {
                const text = cell.textContent.replace(/\s+/g, '');
                const isJunkClass = cell.classList.contains('style_table_total__XWEuj');
                const hasJunkText = (text.includes('共') && text.includes('款')) || 
                                    text.includes('高亮') || 
                                    text.includes('隐藏相同');
                return isJunkClass || hasJunkText;
            });
            if (junkCell) junkCell.remove();
        }

        // --- 第四步：表头内容净化 ---
        const validHeaderCells = clone.querySelectorAll('.style_table_head_spec__9XixG');
        validHeaderCells.forEach(cell => {
            const nameElement = cell.querySelector('.style_col_spec_name__xEEU6');
            const cleanName = nameElement ? nameElement.textContent.trim() : cell.innerText.split('\n')[0];
            cell.innerHTML = `<div class="style_col_spec_name__xEEU6" style="font-weight:bold; font-size:15px; line-height:1.4;">${cleanName}</div>`;
        });

        // --- 第五步：常规清理 ---
        const links = clone.querySelectorAll('a');
        links.forEach(a => {
            const span = document.createElement('span');
            span.innerHTML = a.innerHTML;
            if (a.parentNode) a.parentNode.replaceChild(span, a);
        });

        const originalRows = container.querySelectorAll('.style_row__XPu4s');
        const clonedRows = clone.querySelectorAll('.style_row__XPu4s');
        originalRows.forEach((row, index) => {
            if (getComputedStyle(row).display === 'none') {
                if (clonedRows[index]) clonedRows[index].remove();
            }
        });

        const inputs = clone.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.remove(); return;
            }
            const val = input.value;
            const span = document.createElement('span');
            span.textContent = val;
            span.style.fontWeight = "bold";
            if (input.classList.contains('dynamic-price-input')) span.style.color = '#198754';
            if (input.parentNode) input.parentNode.replaceChild(span, input);
        });
        clone.querySelectorAll('select').forEach(el => el.remove());

        // --- 第六步：深度清理 ---
        clone.querySelectorAll('*').forEach(el => {
            el.removeAttribute('data-select-title');
            if (el.classList.contains('style_table_title__JuEBv')) {
                el.style.width = ''; 
                el.removeAttribute('id');
            }
        });

        if (mySchemaId) {
            const headerPlaceholder = clone.querySelector('.header-placeholder');
            const schemaTag = `<link itemprop="maintainer" href="${mySchemaId}" />`;
            
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML += schemaTag;
            } else {
                clone.innerHTML += schemaTag;
            }
        }

        // --- 第七步：SEO & AI 语义增强 ---
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'wp-ev-table';
        
        tableWrapper.setAttribute('role', 'table');
        tableWrapper.setAttribute('itemscope', '');
        tableWrapper.setAttribute('itemtype', 'https://schema.org/Table');
        tableWrapper.setAttribute('aria-label', 'Vehicle Specifications');
        
        if (headerRow) {
            headerRow.setAttribute('role', 'row');
            Array.from(headerRow.children).forEach(cell => {
                cell.setAttribute('role', 'columnheader');
            });
        }

        const dataRows = clone.querySelectorAll('.style_row__XPu4s');
        dataRows.forEach(row => {
            row.setAttribute('role', 'row');
            Array.from(row.children).forEach((cell, idx) => {
                if (idx === 0) cell.setAttribute('role', 'rowheader');
                else cell.setAttribute('role', 'cell');
            });
        });

        // --- 第八步：CSS 注入 ---
        const cssStyle = `
        <style>
            .wp-ev-table {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                font-size: 13px;
                line-height: 1.5;
                color: #333;
                background: #fff;
                width: 100%;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                position: relative;
                border-top: 3px solid #007bff;
            }
            
            .wp-ev-table [role="row"] {
                display: flex;
                border-bottom: 1px solid #eee;
                width: max-content;
                min-width: 100%;
            }

            .wp-ev-table [role="cell"],
            .wp-ev-table [role="columnheader"],
            .wp-ev-table [role="rowheader"],
            .wp-ev-table .header-placeholder {
                flex: 0 0 160px;
                padding: 12px 8px;
                border-left: 1px solid #eee;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }

            /* 左侧固定列 */
            .wp-ev-table [role="rowheader"],
            .wp-ev-table .header-placeholder {
                position: sticky;
                left: 0;
                z-index: 10;
                background-color: #f8f9fa !important;
                border-right: 2px solid #ddd;
                align-items: flex-start !important;
                padding-left: 15px !important;
                text-align: left !important;
                border-left: none !important;
            }
            
            .wp-ev-table .header-placeholder {
                z-index: 11;
                align-items: flex-start !important;
                justify-content: center !important;
            }
            .wp-ev-table .header-placeholder .slogan {
                font-size: 12px; font-weight: normal; color: #666; margin-top: 4px;
            }

            /* 黑色大标题栏修正 */
            .wp-ev-table .style_table_title__JuEBv {
                background-color: #000 !important;
                color: #fff !important;
                margin-top: 20px;
                font-weight: bold;
                width: max-content; 
                min-width: 100%;
                box-sizing: border-box;
                display: flex;
                align-items: center;
                padding: 0; 
            }

            .wp-ev-table .style_table_title_col__smmZt {
                position: sticky;
                left: 0;
                z-index: 15;
                background-color: #000 !important;
                color: #fff !important;
                padding: 8px 15px;
                display: flex;
                align-items: center;
            }
            
            .wp-ev-table .style_table_title_col__smmZt::after {
                content: " ( ● Standard  ○ Optional  - N/A )";
                font-size: 11px; color: #ccc; font-weight: normal; margin-left: 10px;
                white-space: nowrap; 
            }

            .wp-ev-table i.style_col_dot__0ePLw { font-style: normal; margin-right: 4px; }
            .wp-ev-table i.style_col_dot_solid__GmFKI::before { content: "●"; color: #333; }
            .wp-ev-table i.style_col_dot_outline__Sb2er::before { content: "○"; color: #333; }

            .wp-ev-table .style_col_color_block__f4_UW span {
                display: inline-block; width: 14px; height: 14px; border: 1px solid #ccc; vertical-align: middle; margin-right: 5px;
            }
            .wp-ev-table .style_col_color__5_Vkp { display: flex; align-items: center; justify-content: center; margin-bottom: 2px;}

            .wp-ev-table .image-row-container {
                display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 15px; 
                padding: 10px; width: 100%; box-sizing: border-box;
            }
            .wp-ev-table .image-row-container img {
                max-width: 200px; height: auto; border: 1px solid #eee;
            }
            
            @media (max-width: 768px) {
                .wp-ev-table [role="rowheader"],
                .wp-ev-table .header-placeholder { flex: 0 0 120px; }
                .wp-ev-table [role="cell"], 
                .wp-ev-table [role="columnheader"] { flex: 0 0 140px; }
            }
        </style>`;

        // 最终组合
        tableWrapper.innerHTML = cssStyle + clone.innerHTML;

        const finalHtml = tableWrapper.outerHTML;

        navigator.clipboard.writeText(finalHtml).then(() => {
            btn.textContent = '✅ 已生成';
            btn.style.backgroundColor = '#28a745';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '#fd7e14';
            }, 2000);
        }).catch(err => {
            console.error(err);
            alert('复制失败');
            btn.textContent = originalText;
        });

    } catch (e) {
        console.error("生成代码时出错:", e);
        alert('处理出错，请查看控制台');
        btn.textContent = "❌ 出错";
    }
}