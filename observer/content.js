let observer = null;
let observing = false;

function describeElement(el) {
  if (el.nodeType !== 1) return null;
  let desc = el.tagName.toLowerCase();
  if (el.id) desc += `#${el.id}`;
  if (el.className && typeof el.className === 'string') {
    desc += '.' + el.className.trim().split(/\s+/).join('.');
  }
  return desc;
}

function sendLog(action, text) {
  chrome.runtime.sendMessage({ type: 'dom-change', action, text });
  // Also log to console for when popup is closed
  const prefix = action === 'add' ? '+' : action === 'remove' ? '-' : '~';
  console.log(`[AdDetector ${prefix}]`, text);
}

function startObserving() {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      // Added nodes
      for (const node of m.addedNodes) {
        const desc = describeElement(node);
        if (desc) {
          sendLog('add', `+ ${desc}`);
        }
      }
      // Removed nodes
      for (const node of m.removedNodes) {
        const desc = describeElement(node);
        if (desc) {
          sendLog('remove', `- ${desc}`);
        }
      }
      // Attribute changes
      if (m.type === 'attributes') {
        const target = describeElement(m.target);
        const val = m.target.getAttribute(m.attributeName);
        // Skip noisy attributes
        if (['style', 'aria-valuenow', 'aria-valuetext'].includes(m.attributeName)) continue;
        if (target) {
          sendLog('attr', `~ ${target} [${m.attributeName}="${val}"]`);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'id', 'data-uia', 'data-testid', 'data-automation-id', 'hidden', 'aria-hidden']
  });

  observing = true;
  console.log('[AdDetector] Started observing DOM changes');
}

function stopObserving() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  observing = false;
  console.log('[AdDetector] Stopped observing');
}

// Auto-start on page load
startObserving();

// Listen for commands from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.command === 'start') startObserving();
  else if (msg.command === 'stop') stopObserving();
  else if (msg.command === 'status') sendResponse({ observing });
  else if (msg.command === 'clear') console.clear();
  return true;
});
