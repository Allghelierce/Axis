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
