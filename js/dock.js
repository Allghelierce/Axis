const DOCK_STORAGE_KEY = 'dockPanels';

let _dockData = JSON.parse(localStorage.getItem(DOCK_STORAGE_KEY) || '{}');
let _activeDockPanel = null;

const DOCK_PANELS = {
    wishlist: { title: 'Wishlist', placeholder: 'Add to wishlist...' },
    longterm: { title: 'Long Term', placeholder: 'Add long-term item...' },
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

function _renderDockList() {
    const list = document.getElementById('dockPanelList');
    const items = _dockData[_activeDockPanel] || [];
    list.innerHTML = items.map((item, i) => `
        <div class="dock-panel-item">
            <span class="dock-panel-item-text">${item}</span>
            <button class="dock-panel-item-delete" onclick="_deleteDockItem(${i})">&times;</button>
        </div>
    `).join('');
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
            _dockData[_activeDockPanel].push(input.value.trim());
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
