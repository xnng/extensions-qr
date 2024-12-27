let isPickingElement = false;
let highlightElement: HTMLElement | null = null;

// 创建高亮元素
const createHighlightElement = () => {
  const element = document.createElement('div');
  element.style.position = 'fixed';
  element.style.border = '2px solid #409EFF';
  element.style.backgroundColor = 'rgba(64, 158, 255, 0.1)';
  element.style.pointerEvents = 'none';
  element.style.zIndex = '2147483647';
  element.style.transition = 'all 0.2s ease-in-out';
  return element;
};

// 更新高亮元素位置
const updateHighlightPosition = (target: HTMLElement) => {
  if (!highlightElement) return;
  const rect = target.getBoundingClientRect();
  highlightElement.style.top = rect.top + window.scrollY + 'px';
  highlightElement.style.left = rect.left + window.scrollX + 'px';
  highlightElement.style.width = rect.width + 'px';
  highlightElement.style.height = rect.height + 'px';
};

// 处理鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!isPickingElement) return;

  const target = e.target as HTMLElement;
  if (target instanceof HTMLImageElement) {
    updateHighlightPosition(target);
  }
};

// 处理点击事件
const handleClick = (e: MouseEvent) => {
  if (!isPickingElement) return;
  e.preventDefault();
  e.stopPropagation();

  const target = e.target as HTMLElement;
  if (target instanceof HTMLImageElement) {
    chrome.runtime.sendMessage({
      action: 'imageSelected',
      imageUrl: target.src
    });
  }

  stopPicking();
};

// 开始选取
const startPicking = () => {
  isPickingElement = true;
  document.body.style.cursor = 'crosshair';
  
  if (!highlightElement) {
    highlightElement = createHighlightElement();
    document.body.appendChild(highlightElement);
  }

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick, true);
};

// 停止选取
const stopPicking = () => {
  isPickingElement = false;
  document.body.style.cursor = '';
  
  if (highlightElement) {
    highlightElement.remove();
    highlightElement = null;
  }

  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleClick, true);
};

// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'startPicking') {
    startPicking();
  }
});
