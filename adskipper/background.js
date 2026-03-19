const DEFAULT_CONFIG = {
  sites: [
    { pattern: 'https://www.netflix.com/*', enabled: true },
    { pattern: 'https://www.amazon.com/*', enabled: false },
    { pattern: 'https://www.primevideo.com/*', enabled: false }
  ],
  selectors: [
    '.watch-video--adsInfo-container',
    '.watch-video--modular-ads-container'
  ],
  normalSpeed: 1,
  adSpeed: 16
};

// Initialize default config on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('config', (data) => {
    if (!data.config) {
      chrome.storage.sync.set({ config: DEFAULT_CONFIG });
    }
  });
});

// Inject content script into matching tabs when config changes
function injectContentScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  }).catch(() => {});
}

// Listen for tab updates to inject script on matching sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  chrome.storage.sync.get('config', (data) => {
    const config = data.config || DEFAULT_CONFIG;
    const enabled = config.sites.some(site => {
      if (!site.enabled) return false;
      const regex = new RegExp('^' + site.pattern.replace(/\*/g, '.*') + '$');
      return regex.test(tab.url);
    });

    if (enabled) {
      injectContentScript(tabId);
    }
  });
});
