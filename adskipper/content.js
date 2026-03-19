// Prevent double injection
if (window.__adSkipperLoaded) {
  console.log('[AdSkipper] Already loaded, skipping');
} else {
  window.__adSkipperLoaded = true;

  let normalSpeed = 1;
  let adSelectors = [];
  let adSpeed = 16;
  let adActive = false;

  function getVideo() {
    return document.querySelector('video');
  }

  function setSpeed(rate) {
    const video = getVideo();
    if (video) {
      video.playbackRate = rate;
      video.muted = rate > normalSpeed;
    }
  }

  function isAdPlaying() {
    return adSelectors.some(sel => document.querySelector(sel) !== null);
  }

  function checkAd() {
    const adNow = isAdPlaying();

    if (adNow && !adActive) {
      adActive = true;
      setSpeed(adSpeed);
      console.log('[AdSkipper] Ad detected — speeding up to', adSpeed, 'x');
    } else if (!adNow && adActive) {
      adActive = false;
      setSpeed(normalSpeed);
      console.log('[AdSkipper] Ad ended — back to normal speed', normalSpeed, 'x');
    }
  }

  // Load config and start
  chrome.storage.sync.get('config', (data) => {
    if (data.config) {
      adSelectors = data.config.selectors || [];
      normalSpeed = data.config.normalSpeed || 1;
      adSpeed = data.config.adSpeed || 16;
    }

    // Apply normal speed immediately
    setSpeed(normalSpeed);

    if (adSelectors.length === 0) {
      console.log('[AdSkipper] No selectors configured, using normal speed:', normalSpeed, 'x');
      return;
    }

    const observer = new MutationObserver(() => checkAd());
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(checkAd, 500);
    checkAd();

    console.log('[AdSkipper] Loaded — watching selectors:', adSelectors);
  });

  // Keyboard shortcuts for speed control
  function showSpeedToast(rate) {
    let toast = document.getElementById('__adSkipperToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = '__adSkipperToast';
      toast.style.cssText = 'position:fixed;top:16px;left:16px;background:rgba(0,0,0,0.45);color:rgba(255,255,255,0.8);padding:6px 14px;border-radius:4px;font:20px system-ui,sans-serif;z-index:2147483647;pointer-events:none;transition:opacity 0.3s;';
      document.body.appendChild(toast);
    }
    toast.textContent = rate.toFixed(1) + 'x';
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 1000);
  }

  function adjustNormalSpeed(delta) {
    if (adActive) return;
    normalSpeed = Math.max(0.25, Math.min(16, normalSpeed + delta));
    setSpeed(normalSpeed);
    showSpeedToast(normalSpeed);
    // Persist to storage
    chrome.storage.sync.get('config', (data) => {
      const config = data.config || {};
      config.normalSpeed = normalSpeed;
      chrome.storage.sync.set({ config });
    });
  }

  document.addEventListener('keydown', (e) => {
    // Skip if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    if (e.key === 'd' || e.key === 'D') {
      adjustNormalSpeed(0.1);
    } else if (e.key === 'a' || e.key === 'A') {
      adjustNormalSpeed(-0.1);
    } else if (e.key === 's' || e.key === 'S') {
      normalSpeed = 1;
      if (!adActive) setSpeed(normalSpeed);
      showSpeedToast(normalSpeed);
      chrome.storage.sync.get('config', (data) => {
        const config = data.config || {};
        config.normalSpeed = 1;
        chrome.storage.sync.set({ config });
      });
    }
  });

  // Listen for config updates
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.config) {
      const config = changes.config.newValue;
      adSelectors = config.selectors || [];
      normalSpeed = config.normalSpeed || 1;
      adSpeed = config.adSpeed || 16;
      if (!adActive) setSpeed(normalSpeed);
      console.log('[AdSkipper] Config updated — selectors:', adSelectors, 'normalSpeed:', normalSpeed, 'adSpeed:', adSpeed);
    }
  });
}
