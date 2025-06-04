console.log('[QR Extension] Content script loaded and ready');

declare const jsQR: any;

let isActive = false;

// 处理图片点击
async function handleImageClick(e: MouseEvent) {
  console.log('[QR Extension] handleImageClick called', {
    isActive,
    x: e.clientX,
    y: e.clientY,
  });

  if (!isActive) {
    console.log('[QR Extension] Picker not active, ignoring click');
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  // 检查点击的元素是否是图片
  const target = e.target as HTMLElement;
  if (!(target instanceof HTMLImageElement)) {
    console.log('[QR Extension] Clicked element is not an image:', target);
    showError("Please click on an image");
    isActive = false;
    document.removeEventListener("click", handleImageClick);
    removeHighlight();
    return;
  }

  console.log('[QR Extension] Creating canvas for image processing');
  // 创建一个 canvas 来处理图片
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    console.error('[QR Extension] Failed to get canvas context');
    return;
  }

  try {
    // 设置 canvas 大小为图片大小
    canvas.width = target.naturalWidth;
    canvas.height = target.naturalHeight;

    console.log('[QR Extension] Canvas size:', { width: canvas.width, height: canvas.height });

    // 将图片绘制到 canvas 上
    context.drawImage(target, 0, 0);

    // 获取图片数据
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    console.log('[QR Extension] Processing image data:', {
      width: imageData.width,
      height: imageData.height,
      dataLength: imageData.data.length,
    });

    // 识别二维码
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      console.log('[QR Extension] QR code found:', code.data);
      showResult(code.data);
    } else {
      console.log('[QR Extension] No QR code found');
      showError("No QR code found");
    }
  } catch (error) {
    console.error('[QR Extension] Error processing image:', error);
    showError("Cannot process image");
  } finally {
    // 清理
    console.log('[QR Extension] Cleaning up');
    isActive = false;
    document.removeEventListener("click", handleImageClick);
    removeHighlight();
  }
}

// 显示结果
async function showResult(text: string) {
  console.log('[QR Extension] Showing result:', text);

  // 保存到缓存
  try {
    const result = await chrome.storage.local.get(["qrScanHistory"]);
    console.log('[QR Extension] Current history:', result.qrScanHistory);

    let history: any = [];
    if (result.qrScanHistory && Array.isArray(result.qrScanHistory)) {
      history = result.qrScanHistory;
    }

    history.unshift({
      text,
      time: new Date().toISOString(),
    });

    // 最多保存 50 条记录
    if (history.length > 50) {
      history.pop();
    }

    console.log('[QR Extension] Saving history:', history);
    await chrome.storage.local.set({ qrScanHistory: history });
  } catch (error) {
    console.error('[QR Extension] Error saving to storage:', error);
  }

  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 16px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 80vw;
  `;

  const content = document.createElement("div");
  content.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  const textSpan = document.createElement("span");
  textSpan.textContent = text;
  textSpan.style.cssText = `
    color: #606266;
    font-size: 14px;
    line-height: 1.4;
    word-break: break-all;
  `;

  const buttons = document.createElement("div");
  buttons.style.cssText = `
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  `;

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.cssText = `
    background: #f4f4f5;
    color: #909399;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  `;
  closeButton.onmouseover = () => {
    closeButton.style.background = "#e9e9eb";
  };
  closeButton.onmouseout = () => {
    closeButton.style.background = "#f4f4f5";
  };
  closeButton.onclick = () => {
    container.remove();
  };

  const copyButton = document.createElement("button");
  copyButton.textContent = "Copy";
  copyButton.style.cssText = `
    background: #8957e5;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  `;
  copyButton.onmouseover = () => {
    copyButton.style.background = "#724bb7";
  };
  copyButton.onmouseout = () => {
    if (copyButton.textContent !== "Copied") {
      copyButton.style.background = "#8957e5";
    }
  };
  copyButton.onclick = () => {
    navigator.clipboard.writeText(text);
    copyButton.textContent = "Copied";
    copyButton.style.background = "#67c23a";
    setTimeout(() => {
      container.remove();
    }, 1000);
  };

  buttons.appendChild(closeButton);
  buttons.appendChild(copyButton);

  content.appendChild(textSpan);
  content.appendChild(buttons);

  container.appendChild(content);
  document.body.appendChild(container);
}

// 显示错误
function showError(text: string) {
  console.log('[QR Extension] Showing error:', text);
  const container = document.createElement("div");
  container.textContent = text;
  container.style.cssText = `
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: #f56c6c;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    z-index: 999999;
  `;
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 3000);
}

// 添加高亮效果
function addHighlight() {
  console.log('[QR Extension] Adding highlight');
  const style = document.createElement("style");
  style.textContent = `
    img {
      cursor: pointer !important;
      transition: all 0.2s;
    }
    img:hover {
      outline: 2px solid #8957e5 !important;
    }
  `;
  style.id = "qr-picker-style";
  document.head.appendChild(style);
}

// 移除高亮效果
function removeHighlight() {
  console.log('[QR Extension] Removing highlight');
  const style = document.getElementById("qr-picker-style");
  if (style) {
    style.remove();
  }
}

// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[QR Extension] Content script received message:', message);
  
  if (message.type === 'START_PICKER') {
    console.log('[QR Extension] Starting picker mode');
    isActive = true;
    addHighlight();
    document.addEventListener('click', handleImageClick);
    sendResponse({ success: true });
    console.log('[QR Extension] Picker mode started');
  }
  
  return true;
});
