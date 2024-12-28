console.log("Content script loaded");

declare const jsQR: any;

let isActive = false;

// 处理图片点击
async function handleImageClick(e: MouseEvent) {
  console.log("handleImageClick called", {
    isActive,
    x: e.clientX,
    y: e.clientY,
  });

  if (!isActive) {
    console.log("Picker not active, ignoring click");
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  // 检查点击的元素是否是图片
  const target = e.target as HTMLElement;
  if (!(target instanceof HTMLImageElement)) {
    console.log("Clicked element is not an image:", target);
    showError("请点击图片");
    isActive = false;
    document.removeEventListener("click", handleImageClick);
    removeHighlight();
    return;
  }

  console.log("Creating canvas for image processing");
  // 创建一个 canvas 来处理图片
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    console.error("Failed to get canvas context");
    return;
  }

  try {
    // 设置 canvas 大小为图片大小
    canvas.width = target.naturalWidth;
    canvas.height = target.naturalHeight;

    console.log("Canvas size:", { width: canvas.width, height: canvas.height });

    // 将图片绘制到 canvas 上
    context.drawImage(target, 0, 0);

    // 获取图片数据
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    console.log("Processing image data:", {
      width: imageData.width,
      height: imageData.height,
      dataLength: imageData.data.length,
    });

    // 识别二维码
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      console.log("QR code found:", code.data);
      showResult(code.data);
    } else {
      console.log("No QR code found");
      showError("未找到二维码");
    }
  } catch (error) {
    console.error("Error processing image:", error);
    showError("无法处理图片");
  } finally {
    // 清理
    console.log("Cleaning up");
    isActive = false;
    document.removeEventListener("click", handleImageClick);
    removeHighlight();
  }
}

// 显示结果
async function showResult(text: string) {
  console.log("Showing result:", text);

  // 保存到缓存
  try {
    const result = await chrome.storage.local.get(["qrScanHistory"]);
    console.log("Current history:", result.qrScanHistory);

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

    console.log("Saving history:", history);
    await chrome.storage.local.set({ qrScanHistory: history });
  } catch (error) {
    console.error("Error saving to storage:", error);
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
    font-family: Arial, sans-serif;
    font-size: 16px;
    line-height: 1.5;
  `;

  const textSpan = document.createElement("span");
  textSpan.textContent = text;
  textSpan.style.cssText = `
    color: #333;
    font-weight: bold;
    margin-bottom: 8px;
  `;

  const copyButton = document.createElement("button");
  copyButton.textContent = "复制";
  copyButton.style.cssText = `
    background: #8957e5;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    align-self: flex-end;
  `;
  copyButton.onmouseover = () => {
    copyButton.style.background = "#724bb7";
  };
  copyButton.onmouseout = () => {
    copyButton.style.background = "#8957e5";
  };
  copyButton.onclick = () => {
    navigator.clipboard.writeText(text);
    copyButton.textContent = "已复制";
    copyButton.style.background = "#67c23a";
  };

  container.appendChild(textSpan);
  container.appendChild(copyButton);
  document.body.appendChild(container);

  setTimeout(() => container.remove(), 5000);
}

// 显示错误
function showError(text: string) {
  console.log("Showing error:", text);
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
  console.log("Adding highlight");
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
  console.log("Removing highlight");
  const style = document.getElementById("qr-picker-style");
  if (style) {
    style.remove();
  }
}

// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);

  if (message.type === "START_PICKER") {
    console.log("Starting picker");
    isActive = true;
    addHighlight();
    document.addEventListener("click", handleImageClick);
    sendResponse({ success: true });
  }

  return true;
});
