function openStorageBin() {
    const overlay = document.getElementById('storageBinOverlay');
    overlay.style.display = 'flex';
    renderStorageBinList();
}

function closeStorageBin() {
    document.getElementById('storageBinOverlay').style.display = 'none';
    document.getElementById('storageBinList').style.display = '';
    document.getElementById('storageBinDetail').style.display = 'none';
}

function renderStorageBinList() {
    const list = document.getElementById('storageBinList');
    const detail = document.getElementById('storageBinDetail');
    list.style.display = '';
    detail.style.display = 'none';

    const logs = loadDailyLogs();

    if (logs.length === 0) {
        list.innerHTML = '<div class="storage-empty">No archived days yet. Logs are saved automatically when a new day begins.</div>';
        return;
    }

    let html = '';
    logs.forEach(log => {
        const d = new Date(log.date + 'T12:00:00');
        const dateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

        const tasksDone = log.tasks.filter(t => t.done).length;
        const tasksTotal = log.tasks.length;
        const totalCals = log.meals.reduce((s, m) => s + (m.calories || 0), 0);
        const totalProt = log.meals.reduce((s, m) => s + (m.protein || 0), 0);

        const chips = [];
        if (tasksTotal > 0) chips.push(`${tasksDone}/${tasksTotal} tasks`);
        if (totalCals > 0) chips.push(`${totalCals} kcal`);
        if (totalProt > 0) chips.push(`${totalProt}g P`);
        if (log.movementNotes || log.workoutNotes) chips.push('workout');
        if (log.dailyNote) chips.push('note');

        html += `
            <div class="storage-log-row" onclick="viewDailyLog('${log.date}')">
                <div class="storage-log-date">${dateLabel}</div>
                <div class="storage-log-chips">${chips.join(' · ')}</div>
            </div>
        `;
    });

    list.innerHTML = html;
}

function viewDailyLog(date) {
    const logs = loadDailyLogs();
    const log = logs.find(l => l.date === date);
    if (!log) return;

    const list = document.getElementById('storageBinList');
    const detail = document.getElementById('storageBinDetail');
    list.style.display = 'none';
    detail.style.display = '';

    const d = new Date(date + 'T12:00:00');
    const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    let html = `
        <button class="storage-back-btn" onclick="renderStorageBinList()">← All Logs</button>
        <div class="storage-detail-date">${dateLabel}</div>
    `;

    if (log.tasks.length > 0) {
        html += `<div class="storage-section">
            <div class="storage-section-title">Tasks</div>
            ${log.tasks.map(t => `<div class="storage-item ${t.done ? 'done' : ''}">${t.done ? '✓' : '○'} ${escapeHtml(t.text)}</div>`).join('')}
        </div>`;
    }

    if (log.goals.length > 0) {
        html += `<div class="storage-section">
            <div class="storage-section-title">Goals</div>
            ${log.goals.map(g => `<div class="storage-item ${g.done ? 'done' : ''}">${g.done ? '✓' : '○'} ${escapeHtml(g.text)}${g.dueDate ? ` <span class="storage-meta">${g.dueDate}</span>` : ''}</div>`).join('')}
        </div>`;
    }

    if (log.meals.length > 0) {
        const totalCals = log.meals.reduce((s, m) => s + (m.calories || 0), 0);
        const totalProt = log.meals.reduce((s, m) => s + (m.protein || 0), 0);
        html += `<div class="storage-section">
            <div class="storage-section-title">Macros <span class="storage-meta">${totalCals} kcal · ${totalProt}g P</span></div>
            ${log.meals.map(m => {
                const parts = [];
                if (m.calories) parts.push(`${m.calories} cal`);
                if (m.protein) parts.push(`${m.protein}g`);
                return `<div class="storage-item">${escapeHtml(m.name)} <span class="storage-meta">${parts.join(' · ')}</span></div>`;
            }).join('')}
        </div>`;
    }

    if (log.movementNotes || log.workoutNotes) {
        html += `<div class="storage-section">
            <div class="storage-section-title">Movement</div>
            <div class="storage-note">${escapeHtml(log.movementNotes || log.workoutNotes)}</div>
        </div>`;
    }

    if (log.dailyNote) {
        html += `<div class="storage-section">
            <div class="storage-section-title">Daily Note</div>
            <div class="storage-note">${escapeHtml(log.dailyNote)}</div>
        </div>`;
    }

    if (log.habits && log.habits.length > 0) {
        const tracked = log.habits.filter(h => h.status);
        if (tracked.length > 0) {
            html += `<div class="storage-section">
                <div class="storage-section-title">Habits</div>
                ${tracked.map(h => `<div class="storage-item ${h.status === 'completed' ? 'done' : ''}">${h.status === 'completed' ? '✓' : h.status === 'prevented' ? '—' : '○'} ${escapeHtml(h.name)}</div>`).join('')}
            </div>`;
        }
    }

    detail.innerHTML = html;
}
