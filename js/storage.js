let currentStorageSection = 'daybyday';
let _linkedFileHandle = null;
let _autoSaveTimer = null;

function _gatherAllData() {
    return {
        exportedAt: new Date().toISOString(),
        state: JSON.parse(localStorage.getItem('dashboardData') || '{}'),
        habits: JSON.parse(localStorage.getItem('habits') || '[]'),
        workoutFolders: JSON.parse(localStorage.getItem('workoutFolders') || '{}'),
        workoutNotesHistory: JSON.parse(localStorage.getItem('workoutNotesHistory') || '{}'),
        dailyLogs: JSON.parse(localStorage.getItem('axisDailyLogs') || '[]'),
        dailyNotes: JSON.parse(localStorage.getItem('axisDailyNotes') || '{}'),
        dockPanels: JSON.parse(localStorage.getItem('dockPanels') || '{}'),
        planData: JSON.parse(localStorage.getItem('planData') || '{}')
    };
}

async function _writeToLinkedFile() {
    if (!_linkedFileHandle) return;
    try {
        const writable = await _linkedFileHandle.createWritable();
        await writable.write(JSON.stringify(_gatherAllData(), null, 2));
        await writable.close();
    } catch (e) {
        console.error('Auto-save failed:', e);
        _linkedFileHandle = null;
        _updateLinkLabel();
    }
}

function _scheduleAutoSave() {
    if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(() => _writeToLinkedFile(), 1000);
}

function _updateLinkLabel() {
    const label = document.getElementById('linkFileLabel');
    if (!label) return;
    if (_linkedFileHandle) {
        label.textContent = 'Linked: ' + _linkedFileHandle.name;
        label.closest('button').classList.add('linked');
    } else {
        label.textContent = 'Link Local File';
        label.closest('button').classList.remove('linked');
    }
}

async function linkLocalFile() {
    if (_linkedFileHandle) {
        _linkedFileHandle = null;
        _updateLinkLabel();
        return;
    }
    try {
        _linkedFileHandle = await window.showSaveFilePicker({
            suggestedName: 'axis-data.json',
            types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        });
        _updateLinkLabel();
        await _writeToLinkedFile();
    } catch (e) {
        if (e.name !== 'AbortError') console.error('File link failed:', e);
    }
}

const _origSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
    _origSetItem(key, value);
    if (_linkedFileHandle) _scheduleAutoSave();
};

function openStorageBin() {
    const overlay = document.getElementById('storageBinOverlay');
    overlay.classList.add('open');
    currentStorageSection = 'daybyday';
    updateSidebarActive('daybyday');
    renderStorageContent();
}

function closeStorageBin() {
    document.getElementById('storageBinOverlay').classList.remove('open');
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('storageBinOverlay').classList.contains('open')) closeStorageBin();
});

function switchStorageSection(section) {
    currentStorageSection = section;
    updateSidebarActive(section);
    renderStorageContent();
}

function updateSidebarActive(section) {
    document.querySelectorAll('.storage-nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });
}

function renderStorageContent() {
    const container = document.getElementById('storageContent');

    if (currentStorageSection === 'wishlist' || currentStorageSection === 'subscriptions') {
        renderDockSection(container, currentStorageSection);
        return;
    }

    const logs = loadDailyLogs();

    if (logs.length === 0) {
        container.innerHTML = '<div class="storage-empty">No archived days yet. Logs are saved automatically when a new day begins.</div>';
        return;
    }

    if (currentStorageSection === 'workout') {
        renderWorkoutView(container, logs);
    } else {
        renderDayByDayView(container, logs);
    }
}

function renderDockSection(container, panelId) {
    const dockData = JSON.parse(localStorage.getItem('dockPanels') || '{}');
    const items = dockData[panelId] || [];
    const isSubs = panelId === 'subscriptions';

    let html = `<div class="storage-dock-section">
        <div class="storage-dock-input-row">
            <input type="text" class="storage-dock-input" id="storageDockInput" placeholder="Add ${panelId === 'wishlist' ? 'to wishlist' : 'subscription'}...">
        </div>
        <div class="storage-dock-list">`;

    if (items.length === 0) {
        html += '<div class="storage-empty">No items yet.</div>';
    } else {
        items.forEach((item, i) => {
            const text = typeof item === 'object' ? item.text : item;
            const date = typeof item === 'object' ? item.renewalDate : '';
            let badge = '';
            if (isSubs && date) {
                const today = new Date(); today.setHours(0,0,0,0);
                const due = new Date(date + 'T00:00:00');
                const days = Math.ceil((due - today) / 86400000);
                let cls = 'renewal-badge';
                if (days < 0) cls += ' renewal-past';
                else if (days <= 3) cls += ' renewal-urgent';
                else if (days <= 7) cls += ' renewal-soon';
                const label = days < 0 ? Math.abs(days) + 'd ago' : days === 0 ? 'today' : days + 'd';
                badge = `<span class="${cls}">${label}</span>`;
            }
            html += `<div class="storage-dock-item">
                <span class="storage-dock-item-text">${escapeHtml(text)}</span>
                ${isSubs ? `${badge}<input type="date" class="renewal-date-input" value="${date || ''}" onchange="_storageDockSetDate('${panelId}', ${i}, this.value)" title="Renewal date">` : ''}
                <button class="task-delete" onclick="_storageDockDelete('${panelId}', ${i})">×</button>
            </div>`;
        });
    }

    html += '</div></div>';
    container.innerHTML = html;

    const input = document.getElementById('storageDockInput');
    if (input) {
        input.focus();
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && input.value.trim()) {
                if (!dockData[panelId]) dockData[panelId] = [];
                const val = input.value.trim();
                dockData[panelId].push(isSubs ? { text: val, renewalDate: '' } : val);
                localStorage.setItem('dockPanels', JSON.stringify(dockData));
                input.value = '';
                renderStorageContent();
            }
        });
    }
}

function _storageDockDelete(panelId, index) {
    const dockData = JSON.parse(localStorage.getItem('dockPanels') || '{}');
    if (!dockData[panelId]) return;
    dockData[panelId].splice(index, 1);
    localStorage.setItem('dockPanels', JSON.stringify(dockData));
    renderStorageContent();
}

function _storageDockSetDate(panelId, index, dateStr) {
    const dockData = JSON.parse(localStorage.getItem('dockPanels') || '{}');
    if (!dockData[panelId] || !dockData[panelId][index]) return;
    const item = dockData[panelId][index];
    if (typeof item === 'string') {
        dockData[panelId][index] = { text: item, renewalDate: dateStr };
    } else {
        item.renewalDate = dateStr;
    }
    localStorage.setItem('dockPanels', JSON.stringify(dockData));
    renderStorageContent();
}

function getTodayLiveLog() {
    const todayKey = getTodayKey();
    const todayNotes = (typeof notes !== 'undefined' && notes[todayKey]) ? notes[todayKey].content || '' : '';
    const todayHabits = (typeof habits !== 'undefined') ? habits.map(h => ({
        name: h.name,
        status: h.tracking ? h.tracking[todayKey] || null : null
    })) : [];

    return {
        date: todayKey,
        tasks: (state.tasks || []).map(t => ({ text: t.text, done: t.done })),
        goals: (state.goals || []).map(g => ({ text: g.text, done: g.done, dueDate: g.dueDate })),
        meals: (state.meals || []).map(m => ({ name: m.name, calories: m.calories, protein: m.protein })),
        movementNotes: state.movementNotes || '',
        dailyNote: todayNotes,
        habits: todayHabits,
        workoutNotes: workoutNotesHistory[todayKey] || '',
        isLive: true
    };
}

function renderDayByDayView(container, logs) {
    let html = '';
    const todayLog = getTodayLiveLog();
    const allLogs = [todayLog, ...logs.filter(l => l.date !== getTodayKey())];

    allLogs.forEach(log => {
        const d = new Date(log.date + 'T12:00:00');
        const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        let sections = '';

        if (log.dailyNote) {
            sections += `<div class="storage-section">
                <div class="storage-section-title">Note</div>
                <div class="storage-note">${escapeHtml(log.dailyNote)}</div>
            </div>`;
        }

        if (log.tasks.length > 0) {
            const done = log.tasks.filter(t => t.done);
            const notDone = log.tasks.filter(t => !t.done);
            sections += `<div class="storage-section">
                <div class="storage-section-title">Tasks (${done.length}/${log.tasks.length})</div>
                ${notDone.map(t => `<div class="storage-item">○ ${escapeHtml(t.text)}</div>`).join('')}
                ${done.map(t => `<div class="storage-item done">✓ ${escapeHtml(t.text)}</div>`).join('')}
            </div>`;
        }

        if (log.goals.length > 0) {
            sections += `<div class="storage-section">
                <div class="storage-section-title">Goals</div>
                ${log.goals.map(g => `<div class="storage-item ${g.done ? 'done' : ''}">${g.done ? '✓' : '○'} ${escapeHtml(g.text)}${g.dueDate ? ` <span class="storage-meta">${g.dueDate}</span>` : ''}</div>`).join('')}
            </div>`;
        }

        if (log.meals.length > 0) {
            const totalCals = log.meals.reduce((s, m) => s + (m.calories || 0), 0);
            const totalProt = log.meals.reduce((s, m) => s + (m.protein || 0), 0);
            sections += `<div class="storage-section">
                <div class="storage-section-title">Macros <span class="storage-meta">${totalCals} kcal · ${totalProt}g P</span></div>
                ${log.meals.map(m => {
                    const parts = [];
                    if (m.calories) parts.push(`${m.calories} cal`);
                    if (m.protein) parts.push(`${m.protein}g`);
                    return `<div class="storage-item">${escapeHtml(m.name)} <span class="storage-meta">${parts.join(' · ')}</span></div>`;
                }).join('')}
            </div>`;
        }

        if (log.habits && log.habits.length > 0) {
            const tracked = log.habits.filter(h => h.status);
            if (tracked.length > 0) {
                sections += `<div class="storage-section">
                    <div class="storage-section-title">Habits</div>
                    ${tracked.map(h => `<div class="storage-item ${h.status === 'completed' ? 'done' : ''}">${h.status === 'completed' ? '✓' : h.status === 'prevented' ? '—' : '○'} ${escapeHtml(h.name)}</div>`).join('')}
                </div>`;
            }
        }

        if (log.movementNotes || log.workoutNotes) {
            const workoutText = log.movementNotes || log.workoutNotes;
            const preview = workoutText.length > 60 ? workoutText.substring(0, 60) + '…' : workoutText;
            sections += `<div class="storage-section">
                <div class="storage-section-title">Workout</div>
                <div class="storage-workout-link" onclick="switchStorageSection('workout')">
                    <span class="storage-workout-preview">${escapeHtml(preview)}</span>
                    <span class="storage-workout-arrow">→</span>
                </div>
            </div>`;
        }

        if (sections) {
            const liveClass = log.isLive ? ' storage-log-live' : '';
            const liveTag = log.isLive ? '<span class="storage-live-tag">live</span>' : '';
            html += `<div class="storage-log-card${liveClass}">
                <div class="storage-log-date">${dateLabel} ${liveTag}</div>
                ${sections}
            </div>`;
        }
    });

    if (!html) {
        html = '<div class="storage-empty">No entries yet.</div>';
    }

    container.innerHTML = html;
}

function renderWorkoutView(container, logs) {
    let html = '';
    const todayKey = getTodayKey();
    const todayWorkout = state.movementNotes || workoutNotesHistory[todayKey] || '';
    if (todayWorkout) {
        const d = new Date(todayKey + 'T12:00:00');
        const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        html += `<div class="storage-log-card storage-log-live">
            <div class="storage-log-date">${dateLabel} <span class="storage-live-tag">live</span></div>
            <div class="storage-note">${escapeHtml(todayWorkout)}</div>
        </div>`;
    }

    logs.forEach(log => {
        if (log.date === todayKey) return;
        if (!log.movementNotes && !log.workoutNotes) return;

        const d = new Date(log.date + 'T12:00:00');
        const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        const notes = log.movementNotes || log.workoutNotes;

        let splitLabel = '';
        if (log.splitName) {
            splitLabel = `<span class="storage-meta">${escapeHtml(log.splitName)}</span>`;
        }

        html += `<div class="storage-log-card">
            <div class="storage-log-date">${dateLabel} ${splitLabel}</div>
            <div class="storage-note">${escapeHtml(notes)}</div>
        </div>`;
    });

    if (!html) {
        html = '<div class="storage-empty">No workout entries yet.</div>';
    }

    container.innerHTML = html;
}

function handleObsidianImport(files) {
    if (!files || files.length === 0) return;

    const logs = loadDailyLogs();
    const existingDates = new Set(logs.map(l => l.date));
    let imported = 0;
    let skipped = 0;
    let pending = files.length;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = parseObsidianFile(file.name, reader.result);
            if (result && result.date && !existingDates.has(result.date)) {
                logs.push(result);
                existingDates.add(result.date);
                imported++;
            } else {
                skipped++;
            }

            pending--;
            if (pending === 0) {
                logs.sort((a, b) => b.date.localeCompare(a.date));
                localStorage.setItem(dailyLogsKey, JSON.stringify(logs));
                dailyLogs = logs;
                renderStorageContent();
                showImportResult(imported, skipped);
                document.getElementById('obsidianFileInput').value = '';
            }
        };
        reader.readAsText(file);
    });
}

function parseObsidianFile(filename, content) {
    const date = extractDateFromFilename(filename);
    if (!date) return null;

    let body = content;
    const frontmatterMatch = body.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (frontmatterMatch) {
        body = body.slice(frontmatterMatch[0].length);
    }

    const sections = parseSections(body);

    const tasks = [];
    const taskLines = extractLines(body, /^[-*]\s*\[( |x|X)\]\s*(.+)$/gm);
    taskLines.forEach(m => {
        tasks.push({ text: m[2].trim(), done: m[1] !== ' ' });
    });

    const meals = [];
    const mealSection = sections['meals'] || sections['macros'] || sections['food'] || sections['nutrition'] || '';
    if (mealSection) {
        mealSection.split('\n').forEach(line => {
            line = line.replace(/^[-*]\s*/, '').trim();
            if (!line) return;
            const calMatch = line.match(/(\d+)\s*(?:kcal|cal|calories)/i);
            const protMatch = line.match(/(\d+)\s*(?:g\s*(?:protein|prot|p)|\s*p\b)/i);
            meals.push({
                name: line.replace(/\d+\s*(?:kcal|cal|calories|g\s*(?:protein|prot|p))/gi, '').replace(/[,·\-|]+\s*$/,'').trim() || line,
                calories: calMatch ? parseInt(calMatch[1]) : 0,
                protein: protMatch ? parseInt(protMatch[1]) : 0
            });
        });
    }

    const workoutSection = sections['workout'] || sections['movement'] || sections['exercise'] || sections['training'] || sections['gym'] || '';
    const noteSection = sections['note'] || sections['daily note'] || sections['journal'] || sections['reflection'] || '';

    let dailyNote = noteSection;
    if (!dailyNote) {
        const knownKeys = new Set(['tasks', 'goals', 'meals', 'macros', 'food', 'nutrition', 'workout', 'movement', 'exercise', 'training', 'gym', 'note', 'daily note', 'journal', 'reflection', 'habits']);
        const uncategorized = [];
        let inSection = false;
        body.split('\n').forEach(line => {
            const headingMatch = line.match(/^#{1,3}\s+(.+)/);
            if (headingMatch) {
                inSection = knownKeys.has(headingMatch[1].trim().toLowerCase());
                return;
            }
            if (!inSection && !line.match(/^[-*]\s*\[[ xX]\]/) && line.trim()) {
                uncategorized.push(line);
            }
        });
        if (uncategorized.length > 0) {
            dailyNote = uncategorized.join('\n').trim();
        }
    }

    return {
        date,
        tasks: tasks.length > 0 ? tasks : [],
        goals: [],
        meals,
        movementNotes: workoutSection.trim(),
        dailyNote: dailyNote.trim(),
        habits: [],
        workoutNotes: workoutSection.trim()
    };
}

function extractDateFromFilename(filename) {
    const name = filename.replace(/\.md$/i, '');
    const isoMatch = name.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];

    const usMatch = name.match(/(\d{1,2})[-./](\d{1,2})[-./](\d{4})/);
    if (usMatch) {
        const m = usMatch[1].padStart(2, '0');
        const d = usMatch[2].padStart(2, '0');
        return `${usMatch[3]}-${m}-${d}`;
    }

    const naturalMatch = name.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})/i);
    if (naturalMatch) {
        const months = { january:'01', february:'02', march:'03', april:'04', may:'05', june:'06', july:'07', august:'08', september:'09', october:'10', november:'11', december:'12' };
        const m = months[naturalMatch[1].toLowerCase()];
        const d = naturalMatch[2].padStart(2, '0');
        return `${naturalMatch[3]}-${m}-${d}`;
    }

    return null;
}

function parseSections(body) {
    const sections = {};
    let currentKey = null;
    let currentLines = [];

    body.split('\n').forEach(line => {
        const headingMatch = line.match(/^#{1,3}\s+(.+)/);
        if (headingMatch) {
            if (currentKey) {
                sections[currentKey] = currentLines.join('\n').trim();
            }
            currentKey = headingMatch[1].trim().toLowerCase();
            currentLines = [];
        } else if (currentKey) {
            currentLines.push(line);
        }
    });

    if (currentKey) {
        sections[currentKey] = currentLines.join('\n').trim();
    }

    return sections;
}

function extractLines(text, regex) {
    const matches = [];
    let m;
    while ((m = regex.exec(text)) !== null) {
        matches.push(m);
    }
    return matches;
}

function showImportResult(imported, skipped) {
    const msg = document.createElement('div');
    msg.className = 'import-toast';
    msg.textContent = `Imported ${imported} note${imported !== 1 ? 's' : ''}${skipped > 0 ? `, ${skipped} skipped (no date or duplicate)` : ''}`;
    document.body.appendChild(msg);
    setTimeout(() => msg.classList.add('visible'), 10);
    setTimeout(() => {
        msg.classList.remove('visible');
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}
