// ══════════════════════════════════════════════════════
//  INTERACTIVE MAP ENGINE
// ══════════════════════════════════════════════════════
const mapKey = 'axisMapData';

let mapData = loadMapData();
let mapView = { x: 0, y: 0, zoom: 1 };
let selectedNode = null;
let dragging = null;          // {nodeId, startX, startY, origX, origY}
let panning = null;          // {startX, startY, origPanX, origPanY}
let edgeDraw = null;          // {fromId, tempLine}

function loadMapData() {
    const saved = localStorage.getItem(mapKey);
    if (saved) return JSON.parse(saved);
    return { nodes: [], edges: [], nextId: 1 };
}

function saveMapData() {
    localStorage.setItem(mapKey, JSON.stringify(mapData));
}

// ── Coordinate helpers ──────────────────────────────────
function canvasToWorld(cx, cy) {
    const rect = document.getElementById('mapCanvas').getBoundingClientRect();
    return {
        x: (cx - rect.left - mapView.x) / mapView.zoom,
        y: (cy - rect.top - mapView.y) / mapView.zoom
    };
}

function applyTransform() {
    const w = document.getElementById('mapWorld');
    w.style.transform = `translate(${mapView.x}px, ${mapView.y}px) scale(${mapView.zoom})`;
}

// ── Render all nodes + edges ────────────────────────────
function renderMap() {
    const world = document.getElementById('mapWorld');
    // Remove old nodes (keep svg)
    Array.from(world.children).forEach(c => {
        if (c.id !== 'mapSvg') c.remove();
    });
    mapData.nodes.forEach(n => renderNode(n));
    renderEdges();
}

function renderNode(n) {
    const world = document.getElementById('mapWorld');
    const div = document.createElement('div');
    div.className = 'map-node' + (selectedNode === n.id ? ' selected' : '');
    div.dataset.id = n.id;
    div.style.left = n.x + 'px';
    div.style.top = n.y + 'px';
    div.style.borderColor = n.color || '#3a3a3a';

    div.innerHTML = `
        <button class="map-node-del" data-id="${n.id}">×</button>
        <div class="map-node-text" data-id="${n.id}">${escapeHtml(n.text || 'Note')}</div>
        <div class="map-node-handle" data-id="${n.id}"></div>
    `;

    // Node drag
    div.addEventListener('mousedown', onNodeMousedown);
    // Double-click to edit
    div.addEventListener('dblclick', onNodeDblclick);
    // Delete button
    div.querySelector('.map-node-del').addEventListener('click', e => {
        e.stopPropagation();
        deleteMapNode(parseInt(e.target.dataset.id));
    });
    // Handle drag (start edge)
    div.querySelector('.map-node-handle').addEventListener('mousedown', onHandleMousedown);

    world.appendChild(div);
}

function renderEdges() {
    const svg = document.getElementById('mapSvg');
    svg.innerHTML = '';

    mapData.edges.forEach(e => {
        const from = mapData.nodes.find(n => n.id === e.from);
        const to = mapData.nodes.find(n => n.id === e.to);
        if (!from || !to) return;

        const x1 = from.x + 70, y1 = from.y + 30;
        const x2 = to.x + 70, y2 = to.y + 30;

        const dx = x2 - x1, dy = y2 - y1;
        const cx1 = x1 + dx * 0.5, cy1 = y1;
        const cx2 = x2 - dx * 0.5, cy2 = y2;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`);
        path.setAttribute('stroke', 'rgba(255,255,255,0.25)');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', 'url(#arrowhead)');

        // invisible wider stroke for easier clicking
        const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hitPath.setAttribute('d', `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`);
        hitPath.setAttribute('stroke', 'transparent');
        hitPath.setAttribute('stroke-width', '12');
        hitPath.setAttribute('fill', 'none');
        hitPath.style.cursor = 'pointer';
        hitPath.addEventListener('click', () => deleteMapEdge(e.id));

        // arrowhead marker
        if (!svg.querySelector('defs')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '8');
            marker.setAttribute('markerHeight', '6');
            marker.setAttribute('refX', '8');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 8 3, 0 6');
            polygon.setAttribute('fill', 'rgba(255,255,255,0.3)');
            marker.appendChild(polygon);
            defs.appendChild(marker);
            svg.appendChild(defs);
        }

        svg.appendChild(hitPath);
        svg.appendChild(path);
    });
}

// ── Node interaction ────────────────────────────────────
function onNodeMousedown(e) {
    if (e.target.classList.contains('map-node-handle')) return;
    if (e.target.classList.contains('map-node-del')) return;
    if (e.target.classList.contains('map-node-text') && e.currentTarget.classList.contains('editing')) return;
    e.stopPropagation();

    const id = parseInt(e.currentTarget.dataset.id);
    selectNode(id);

    const n = mapData.nodes.find(n => n.id === id);
    dragging = {
        nodeId: id,
        startX: e.clientX,
        startY: e.clientY,
        origX: n.x,
        origY: n.y
    };
}

function onNodeDblclick(e) {
    if (e.target.classList.contains('map-node-handle')) return;
    if (e.target.classList.contains('map-node-del')) return;
    e.stopPropagation();

    const div = e.currentTarget;
    const textEl = div.querySelector('.map-node-text');
    const id = parseInt(div.dataset.id);

    div.classList.add('editing');
    div.style.cursor = 'default';
    textEl.contentEditable = 'true';
    textEl.focus();

    const range = document.createRange();
    range.selectNodeContents(textEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function finishEdit() {
        div.classList.remove('editing');
        div.style.cursor = 'grab';
        textEl.contentEditable = 'false';
        const n = mapData.nodes.find(n => n.id === id);
        if (n) n.text = textEl.textContent;
        saveMapData();
        textEl.removeEventListener('blur', finishEdit);
        textEl.removeEventListener('keydown', onEditKey);
    }

    function onEditKey(e) {
        if (e.key === 'Escape') { finishEdit(); }
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishEdit(); }
        e.stopPropagation();
    }

    textEl.addEventListener('blur', finishEdit);
    textEl.addEventListener('keydown', onEditKey);
}

function onHandleMousedown(e) {
    e.stopPropagation();
    e.preventDefault();
    const id = parseInt(e.target.dataset.id);
    const svg = document.getElementById('mapSvg');
    const from = mapData.nodes.find(n => n.id === id);

    const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tempLine.setAttribute('stroke', 'rgba(255,255,255,0.4)');
    tempLine.setAttribute('stroke-width', '1.5');
    tempLine.setAttribute('stroke-dasharray', '4 3');
    tempLine.setAttribute('x1', from.x + 70);
    tempLine.setAttribute('y1', from.y + 30);
    tempLine.setAttribute('x2', from.x + 70);
    tempLine.setAttribute('y2', from.y + 30);
    svg.appendChild(tempLine);

    edgeDraw = { fromId: id, tempLine };
}

function selectNode(id) {
    selectedNode = id;
    renderMap();
}

function deselect() {
    selectedNode = null;
    document.querySelectorAll('.map-node').forEach(n => n.classList.remove('selected'));
}

// ── Add / Delete ────────────────────────────────────────
function addMapNodeAt(worldX, worldY) {
    const n = {
        id: mapData.nextId++,
        x: worldX - 70,
        y: worldY - 20,
        text: 'Note',
        color: '#3a3a3a'
    };
    mapData.nodes.push(n);
    saveMapData();
    renderMap();
    // auto-enter edit mode for new node
    setTimeout(() => {
        const el = document.querySelector(`.map-node[data-id="${n.id}"]`);
        if (el) el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    }, 50);
}

function deleteMapNode(id) {
    mapData.nodes = mapData.nodes.filter(n => n.id !== id);
    mapData.edges = mapData.edges.filter(e => e.from !== id && e.to !== id);
    if (selectedNode === id) selectedNode = null;
    saveMapData();
    renderMap();
}

function deleteMapEdge(id) {
    mapData.edges = mapData.edges.filter(e => e.id !== id);
    saveMapData();
    renderEdges();
}

// ── Canvas mouse events ─────────────────────────────────
function initMapEvents() {
    const canvas = document.getElementById('mapCanvas');

    // Pan (middle-button or space+drag)
    canvas.addEventListener('mousedown', e => {
        if (e.button === 1 || (e.button === 0 && e.target === canvas)) {
            e.preventDefault();
            panning = { startX: e.clientX, startY: e.clientY, origX: mapView.x, origY: mapView.y };
        }
        if (e.button === 0 && e.target === canvas) deselect();
    });

    // Dblclick on empty canvas = create node
    canvas.addEventListener('dblclick', e => {
        if (e.target !== canvas && e.target !== document.getElementById('mapWorld')) return;
        const w = canvasToWorld(e.clientX, e.clientY);
        addMapNodeAt(w.x, w.y);
    });

    window.addEventListener('mousemove', e => {
        if (panning) {
            mapView.x = panning.origX + (e.clientX - panning.startX);
            mapView.y = panning.origY + (e.clientY - panning.startY);
            applyTransform();
        }
        if (dragging) {
            const n = mapData.nodes.find(n => n.id === dragging.nodeId);
            if (n) {
                n.x = dragging.origX + (e.clientX - dragging.startX) / mapView.zoom;
                n.y = dragging.origY + (e.clientY - dragging.startY) / mapView.zoom;
                const el = document.querySelector(`.map-node[data-id="${n.id}"]`);
                if (el) {
                    el.style.left = n.x + 'px';
                    el.style.top = n.y + 'px';
                }
                renderEdges();
            }
        }
        if (edgeDraw) {
            const w = canvasToWorld(e.clientX, e.clientY);
            edgeDraw.tempLine.setAttribute('x2', w.x);
            edgeDraw.tempLine.setAttribute('y2', w.y);
        }
    });

    window.addEventListener('mouseup', e => {
        if (dragging) {
            saveMapData();
            dragging = null;
        }
        if (panning) { panning = null; }
        if (edgeDraw) {
            edgeDraw.tempLine.remove();
            // detect target node under cursor
            const els = document.elementsFromPoint(e.clientX, e.clientY);
            const targetEl = els.find(el => el.classList.contains('map-node') && parseInt(el.dataset.id) !== edgeDraw.fromId);
            if (targetEl) {
                const toId = parseInt(targetEl.dataset.id);
                const exists = mapData.edges.some(ed => ed.from === edgeDraw.fromId && ed.to === toId);
                if (!exists) {
                    mapData.edges.push({ id: mapData.nextId++, from: edgeDraw.fromId, to: toId });
                    saveMapData();
                    renderEdges();
                }
            }
            edgeDraw = null;
        }
    });

    // Scroll to zoom
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        mapView.x = mx - (mx - mapView.x) * factor;
        mapView.y = my - (my - mapView.y) * factor;
        mapView.zoom *= factor;
        mapView.zoom = Math.min(Math.max(mapView.zoom, 0.1), 4);
        applyTransform();
    }, { passive: false });

    // Delete selected node with backspace/delete
    window.addEventListener('keydown', e => {
        const mapPanel = document.getElementById('fsMapPanel');
        if (!mapPanel.classList.contains('active')) return;
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode !== null) {
            const editing = document.querySelector('.map-node.editing');
            if (editing) return;
            deleteMapNode(selectedNode);
        }
    });

    // Toolbar buttons
    document.getElementById('mapAddBtn').addEventListener('click', () => {
        addMapNodeAt(-mapView.x / mapView.zoom + 200, -mapView.y / mapView.zoom + 150);
    });
    document.getElementById('mapZoomIn').addEventListener('click', () => {
        const canvas = document.getElementById('mapCanvas');
        const cx = canvas.clientWidth / 2, cy = canvas.clientHeight / 2;
        mapView.x = cx - (cx - mapView.x) * 1.2;
        mapView.y = cy - (cy - mapView.y) * 1.2;
        mapView.zoom = Math.min(mapView.zoom * 1.2, 4);
        applyTransform();
    });
    document.getElementById('mapZoomOut').addEventListener('click', () => {
        const canvas = document.getElementById('mapCanvas');
        const cx = canvas.clientWidth / 2, cy = canvas.clientHeight / 2;
        mapView.x = cx - (cx - mapView.x) * 0.8;
        mapView.y = cy - (cy - mapView.y) * 0.8;
        mapView.zoom = Math.max(mapView.zoom * 0.8, 0.1);
        applyTransform();
    });
    document.getElementById('mapReset').addEventListener('click', () => {
        mapView = { x: 0, y: 0, zoom: 1 };
        applyTransform();
    });
}

// ── Tab switching ───────────────────────────────────────
function initTabs() {
    document.querySelectorAll('.fs-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.fs-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.fs-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panelId = tab.dataset.tab === 'map' ? 'fsMapPanel' : 'fsAnalyticsPanel';
            document.getElementById(panelId).classList.add('active');
            if (tab.dataset.tab === 'map') renderMap();
        });
    });
}

// ── Boot ──────────────────────────────────────────────
function initMap() {
    initTabs();
    initMapEvents();
    renderMap();
}
