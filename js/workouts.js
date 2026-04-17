function showLastWorkout(splitName) {
    const panel = document.getElementById('lastWorkoutPanel');
    if (!panel) return;

    if (!splitName || splitName === 'N/A') {
        panel.style.display = 'none';
        return;
    }

    const dates = workoutFolders[splitName] || [];
    const pastDates = dates.filter(d => d !== getTodayKey());

    if (pastDates.length === 0) {
        panel.style.display = 'none';
        return;
    }

    const lastDate = pastDates[0];
    const lastNotes = workoutNotesHistory[lastDate] || '';
    const d = new Date(lastDate + 'T12:00:00');
    const dateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    document.getElementById('lastWorkoutLabel').textContent = `Last ${splitName}`;
    document.getElementById('lastWorkoutDate').textContent = dateLabel;
    document.getElementById('lastWorkoutNotes').textContent = lastNotes || 'No notes recorded.';

    let historyHtml = '';
    pastDates.slice(1, 4).forEach(dateStr => {
        const hd = new Date(dateStr + 'T12:00:00');
        const hdLabel = hd.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const preview = (workoutNotesHistory[dateStr] || 'No notes').substring(0, 50);
        historyHtml += `<div class="last-workout-history-item" onclick="openWorkoutNotesSidebar('${splitName}')">${hdLabel} — ${preview}</div>`;
    });
    document.getElementById('lastWorkoutHistory').innerHTML = historyHtml;

    panel.style.display = '';
}

function updateWorkoutFolders() {
    if (!state.splitInput || !state.splitInput.trim()) return;

    const category = state.splitInput;
    const todayKey = getTodayKey();

    if (!workoutFolders[category]) {
        workoutFolders[category] = [];
    }

    if (!workoutFolders[category].includes(todayKey)) {
        workoutFolders[category].unshift(todayKey);
    }

    saveWorkoutFolders();
    renderWorkoutFolders();
}

function deleteFolder(name) {
    if (confirm(`Delete folder "${name}" and all its history?`)) {
        delete workoutFolders[name];
        if (state.splitInput === name) {
            state.splitInput = Object.keys(workoutFolders)[0] || '';
        }
        saveWorkoutFolders();
        renderWorkoutFolders();
        renderSplitSelect();
    }
}

function renderWorkoutFolders() {
    const containers = [
        document.getElementById('workoutFolders')
    ];
    
    containers.forEach(container => {
        if (!container) return;
        container.innerHTML = '';

        const folders = Object.entries(workoutFolders);

        if (folders.length === 0) {
            container.innerHTML = '<div class="empty-na">n/a</div>';
            return;
        }

        folders.forEach(([name, dates]) => {
            const folder = document.createElement('div');
            folder.className = 'workout-folder';

            const lastDateStr = dates.length > 0 ? dates[0] : null;
            let statusStr = 'Never';
            if (lastDateStr) {
                const lastDate = new Date(lastDateStr);
                const daysAgo = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
                statusStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
            }

            folder.innerHTML = `
                <button class="folder-delete" onclick="event.stopPropagation(); deleteFolder('${name}')">×</button>
                <div class="folder-name">${name}</div>
            `;
            folder.onclick = () => {
                const select = document.getElementById('splitSelect');
                if (select) select.value = name;
                state.splitInput = name;
                saveState();
            };
            container.appendChild(folder);
        });
    });
}

function openWorkoutNotesSidebar(folderName) {
    const sidebar = document.getElementById('workoutNotesSidebar');
    document.getElementById('workoutNotesFolderName').textContent = folderName;

    const dates = workoutFolders[folderName] || [];
    const datesList = document.getElementById('workoutNotesDates');
    const contentEl = document.getElementById('workoutNotesContent');
    datesList.innerHTML = '';
    contentEl.textContent = '';

    if (dates.length === 0) {
        datesList.innerHTML = '<div class="wn-empty">No entries yet</div>';
    } else {
        dates.forEach((dateStr, i) => {
            const item = document.createElement('div');
            item.className = 'wn-date-item';
            const d = new Date(dateStr + 'T00:00:00');
            item.textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            item.dataset.date = dateStr;
            item.onclick = () => selectWorkoutNoteDate(dateStr, item);
            datesList.appendChild(item);
            if (i === 0) {
                item.classList.add('active');
                contentEl.textContent = workoutNotesHistory[dateStr] || 'No notes for this session.';
            }
        });
    }

    sidebar.classList.add('active');
}

function selectWorkoutNoteDate(dateStr, itemEl) {
    document.querySelectorAll('.wn-date-item').forEach(el => el.classList.remove('active'));
    itemEl.classList.add('active');
    const note = workoutNotesHistory[dateStr] || '';
    document.getElementById('workoutNotesContent').textContent = note || 'No notes for this session.';
}

function closeWorkoutNotesSidebar() {
    document.getElementById('workoutNotesSidebar').classList.remove('active');
}

function renderSplitSelect() {
    const select = document.getElementById('splitSelect');
    if (!select) return;
    const current = state.splitInput;
    select.innerHTML = '';

    Object.keys(workoutFolders).sort().forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (name === current) opt.selected = true;
        select.appendChild(opt);
    });

    if (!current && select.options.length > 0) {
        const naOpt = Array.from(select.options).find(o => o.value === 'N/A');
        state.splitInput = naOpt ? naOpt.value : select.options[0].value;
        saveState();
    }
}

function openDailyWorkoutLogs(dateStr) {
    const sidebar = document.getElementById('workoutNotesSidebar');
    const folderNameEl = document.getElementById('workoutNotesFolderName');
    const datesList = document.getElementById('workoutNotesDates');
    const contentEl = document.getElementById('workoutNotesContent');

    const d = new Date(dateStr + 'T00:00:00');
    folderNameEl.textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
    
    // Find all folders for this day
    const foldersThisDay = [];
    Object.entries(workoutFolders).forEach(([name, dates]) => {
        if (dates.includes(dateStr)) foldersThisDay.push(name);
    });

    datesList.innerHTML = '<div class="wn-date-item active">Folders Today</div>';
    
    let summaryHTML = `<div style="margin-bottom: 1rem; opacity: 0.6; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em;">Categories: ${foldersThisDay.join(', ')}</div>`;
    summaryHTML += `<div class="wn-note-text" style="white-space: pre-wrap;">${workoutNotesHistory[dateStr] || 'No notes for this session.'}</div>`;
    
    contentEl.innerHTML = summaryHTML;
    sidebar.classList.add('active');
}

function seedWorkoutTestData() {
    if (localStorage.getItem('workoutTestDataSeeded')) return;

    const pushDates = ['2026-04-14', '2026-04-10', '2026-04-07', '2026-04-03'];
    const pullDates = ['2026-04-15', '2026-04-11', '2026-04-08'];
    const legDates = ['2026-04-16', '2026-04-12', '2026-04-09'];

    workoutFolders['Push'] = pushDates;
    workoutFolders['Pull'] = pullDates;
    workoutFolders['Legs'] = legDates;

    workoutNotesHistory['2026-04-14'] = 'Bench Press 225x5, 225x5, 225x4\nIncline DB Press 80x8, 80x8, 80x7\nCable Flies 40x12, 40x12\nTricep Pushdowns 60x12, 60x10\nOverhead Ext 45x10, 45x10';
    workoutNotesHistory['2026-04-10'] = 'Bench Press 220x5, 220x5, 220x5\nIncline DB Press 75x8, 75x8, 75x8\nCable Flies 35x12, 35x12\nTricep Pushdowns 55x12, 55x12\nDips BWx12, BWx10';
    workoutNotesHistory['2026-04-07'] = 'Bench Press 215x5, 215x5, 215x5\nIncline DB Press 75x8, 75x7\nPec Deck 130x12, 130x12\nSkull Crushers 65x10, 65x10';
    workoutNotesHistory['2026-04-03'] = 'Bench Press 210x5, 210x5, 210x5\nIncline DB Press 70x8, 70x8\nCable Flies 30x12, 30x12\nTricep Pushdowns 50x12, 50x12';

    workoutNotesHistory['2026-04-15'] = 'Deadlift 315x5, 315x5, 315x3\nBarbell Rows 185x8, 185x8, 185x7\nLat Pulldowns 150x10, 150x10\nFace Pulls 40x15, 40x15\nHammer Curls 35x10, 35x10';
    workoutNotesHistory['2026-04-11'] = 'Deadlift 305x5, 305x5, 305x5\nBarbell Rows 180x8, 180x8\nSeated Cable Row 140x10, 140x10\nFace Pulls 35x15, 35x15\nBarbell Curls 75x10, 75x8';
    workoutNotesHistory['2026-04-08'] = 'Deadlift 300x5, 300x5, 300x5\nBarbell Rows 175x8, 175x8\nLat Pulldowns 140x10, 140x10\nRear Delt Flies 20x15, 20x15';

    workoutNotesHistory['2026-04-16'] = 'Squat 275x5, 275x5, 275x4\nRDL 225x8, 225x8, 225x8\nLeg Press 450x10, 450x10\nLeg Curls 120x12, 120x12\nCalf Raises 180x15, 180x15';
    workoutNotesHistory['2026-04-12'] = 'Squat 270x5, 270x5, 270x5\nRDL 215x8, 215x8\nBulgarian Split Squats BWx10, BWx10\nLeg Curls 110x12, 110x12\nCalf Raises 170x15, 170x15';
    workoutNotesHistory['2026-04-09'] = 'Squat 265x5, 265x5, 265x5\nRDL 205x8, 205x8\nLeg Press 430x10, 430x10\nLeg Extensions 100x12, 100x12';

    saveWorkoutFolders();
    saveWorkoutNotesHistory();
    localStorage.setItem('workoutTestDataSeeded', 'true');
}
