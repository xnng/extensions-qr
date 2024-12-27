/// <reference types="chrome"/>

interface Window {
  chrome: {
    tabs: typeof chrome.tabs;
  };
}
