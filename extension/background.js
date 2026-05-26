// background.js — service worker for ScrollBreak extension

const PLATFORM_MAP = {
  'twitter.com': 'Twitter/X',
  'x.com': 'Twitter/X',
  'instagram.com': 'Instagram',
  'tiktok.com': 'TikTok',
  'youtube.com': 'YouTube',
  'reddit.com': 'Reddit',
  'news.google.com': 'News',
  'bbc.com': 'News',
  'cnn.com': 'News'
};

// Track which tabs have been cleared (intention set)
const clearedTabs = new Set();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading') return;
  if (!tab.url) return;

  const hostname = new URL(tab.url).hostname.replace('www.', '');
  const platform = Object.keys(PLATFORM_MAP).find(k => hostname.includes(k));
  if (!platform) return;

  // If already cleared for this tab navigation, allow
  if (clearedTabs.has(tabId)) {
    clearedTabs.delete(tabId);
    return;
  }

  // Inject the intention overlay
  chrome.scripting.executeScript({
    target: { tabId },
    func: (platformName) => {
      window.__scrollbreakPlatform = platformName;
    },
    args: [PLATFORM_MAP[platform]]
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearedTabs.delete(tabId);
});

// Message from content script: user set intention, clear this tab
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'INTENTION_SET' && sender.tab?.id) {
    clearedTabs.add(sender.tab.id);
  }
  if (msg.type === 'GET_GROQ_KEY') {
    chrome.storage.local.get(['sb_groq_key'], (result) => {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'GROQ_KEY', key: result.sb_groq_key || ''
      });
    });
  }
});
