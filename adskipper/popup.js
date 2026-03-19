const sitesEl = document.getElementById('sites');
const selectorsEl = document.getElementById('selectors');
const normalSpeedEl = document.getElementById('normalSpeed');
const adSpeedEl = document.getElementById('adSpeed');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');

function createSiteRow(pattern, enabled) {
  const row = document.createElement('div');
  row.className = 'site-row';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = enabled;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = pattern;
  input.placeholder = 'https://www.example.com/*';

  const removeBtn = document.createElement('button');
  removeBtn.textContent = '×';
  removeBtn.onclick = () => row.remove();

  row.appendChild(checkbox);
  row.appendChild(input);
  row.appendChild(removeBtn);
  sitesEl.appendChild(row);
}

function createSelectorRow(selector) {
  const row = document.createElement('div');
  row.className = 'selector-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = selector;
  input.placeholder = '.ad-container';

  const removeBtn = document.createElement('button');
  removeBtn.textContent = '×';
  removeBtn.onclick = () => row.remove();

  row.appendChild(input);
  row.appendChild(removeBtn);
  selectorsEl.appendChild(row);
}

function loadConfig() {
  chrome.storage.sync.get('config', (data) => {
    const config = data.config || { sites: [], selectors: [], normalSpeed: 1, adSpeed: 16 };

    config.sites.forEach(s => createSiteRow(s.pattern, s.enabled));
    config.selectors.forEach(s => createSelectorRow(s));
    normalSpeedEl.value = config.normalSpeed || 1;
    adSpeedEl.value = config.adSpeed || 16;
  });
}

function saveConfig() {
  const sites = [...sitesEl.querySelectorAll('.site-row')].map(row => ({
    pattern: row.querySelector('input[type="text"]').value.trim(),
    enabled: row.querySelector('input[type="checkbox"]').checked
  })).filter(s => s.pattern);

  const selectors = [...selectorsEl.querySelectorAll('.selector-row')]
    .map(row => row.querySelector('input').value.trim())
    .filter(Boolean);

  const normalSpeed = parseFloat(normalSpeedEl.value) || 1;
  const adSpeed = parseInt(adSpeedEl.value) || 16;

  const config = { sites, selectors, normalSpeed, adSpeed };
  chrome.storage.sync.set({ config }, () => {
    statusEl.textContent = 'Saved!';
    setTimeout(() => { statusEl.textContent = ''; }, 2000);
  });
}

document.getElementById('addSite').addEventListener('click', () => {
  createSiteRow('', true);
});

document.getElementById('addSelector').addEventListener('click', () => {
  createSelectorRow('');
});

saveBtn.addEventListener('click', saveConfig);

loadConfig();
