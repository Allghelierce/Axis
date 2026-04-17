const DOCK_STORAGE_KEY = 'dockPanels';

let _dockData = JSON.parse(localStorage.getItem(DOCK_STORAGE_KEY) || '{}');
let _activeDockPanel = null;

const DOCK_PANELS = {
    wishlist: { title: 'Wishlist', placeholder: 'Add to wishlist...' },
    subscriptions: { title: 'Subscriptions', placeholder: 'Add subscription...' }
};

function _saveDockData() {
    localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(_dockData));
}

function openDockPanel(panelId) {
    const config = DOCK_PANELS[panelId];
    if (!config) return;

    _activeDockPanel = panelId;
    if (!_dockData[panelId]) _dockData[panelId] = [];

    document.getElementById('dockPanelTitle').textContent = config.title;
    const input = document.getElementById('dockPanelInput');
    input.placeholder = config.placeholder;
    input.value = '';

    _renderDockList();

    document.getElementById('dockPanelOverlay').classList.add('open');
    document.getElementById('dockPanel').classList.add('open');
    input.focus();
}

function closeDockPanel() {
    _activeDockPanel = null;
    document.getElementById('dockPanelOverlay').classList.remove('open');
    document.getElementById('dockPanel').classList.remove('open');
}

function _daysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    return Math.ceil((target - today) / 86400000);
}

function _renewalBadge(dateStr) {
    if (!dateStr) return '';
    const days = _daysUntil(dateStr);
    let cls = 'renewal-badge';
    if (days < 0) cls += ' renewal-past';
    else if (days <= 3) cls += ' renewal-urgent';
    else if (days <= 7) cls += ' renewal-soon';
    const label = days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? 'today' : `${days}d`;
    return `<span class="${cls}" title="Renews ${dateStr}">${label}</span>`;
}

function _renderDockList() {
    const list = document.getElementById('dockPanelList');
    const items = _dockData[_activeDockPanel] || [];
    const isSubs = _activeDockPanel === 'subscriptions';

    list.innerHTML = items.map((item, i) => {
        const text = typeof item === 'object' ? item.text : item;
        const date = typeof item === 'object' ? item.renewalDate : '';
        return `
        <div class="dock-panel-item">
            <span class="dock-panel-item-text">${text}</span>
            ${isSubs ? `${_renewalBadge(date)}<input type="date" class="renewal-date-input" value="${date || ''}" onchange="_setRenewalDate(${i}, this.value)" title="Renewal date">` : ''}
            <button class="dock-panel-item-delete" onclick="_deleteDockItem(${i})">&times;</button>
        </div>`;
    }).join('');
}

function _setRenewalDate(index, dateStr) {
    const items = _dockData[_activeDockPanel];
    if (!items || !items[index]) return;
    if (typeof items[index] === 'string') {
        items[index] = { text: items[index], renewalDate: dateStr };
    } else {
        items[index].renewalDate = dateStr;
    }
    _saveDockData();
    _renderDockList();
}

function _deleteDockItem(index) {
    _dockData[_activeDockPanel].splice(index, 1);
    _saveDockData();
    _renderDockList();
}

function _initDock() {
    const input = document.getElementById('dockPanelInput');
    if (!input) return;
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && input.value.trim()) {
            if (!_dockData[_activeDockPanel]) _dockData[_activeDockPanel] = [];
            const val = input.value.trim();
            _dockData[_activeDockPanel].push(_activeDockPanel === 'subscriptions' ? { text: val, renewalDate: '' } : val);
            _saveDockData();
            input.value = '';
            _renderDockList();
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && _activeDockPanel) closeDockPanel();
    });
}

_initDock();
