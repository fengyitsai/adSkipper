const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const status = document.getElementById('status');
const logEl = document.getElementById('log');
const filterInput = document.getElementById('filter');

function sendCommand(command) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { command });
  });
}

startBtn.addEventListener('click', () => {
  sendCommand('start');
  status.textContent = 'Observing...';
  status.className = 'on';
});

stopBtn.addEventListener('click', () => {
  sendCommand('stop');
  status.textContent = 'Stopped';
  status.className = 'off';
});

clearBtn.addEventListener('click', () => {
  logEl.innerHTML = '';
  sendCommand('clear');
});

// Listen for log entries from content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== 'dom-change') return;

  const filter = filterInput.value.toLowerCase();
  const text = msg.text;
  if (filter && !text.toLowerCase().includes(filter)) return;

  const line = document.createElement('div');
  line.textContent = text;

  if (msg.action === 'add') line.className = 'log-add';
  else if (msg.action === 'remove') line.className = 'log-remove';
  else if (msg.action === 'attr') line.className = 'log-attr';

  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
});

// Check current state on popup open
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  chrome.tabs.sendMessage(tabs[0].id, { command: 'status' }, (response) => {
    if (chrome.runtime.lastError) return;
    if (response && response.observing) {
      status.textContent = 'Observing...';
      status.className = 'on';
    }
  });
});
