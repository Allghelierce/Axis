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
        document.getElementById('workoutFolders'),
        document.getElementById('analyticsWorkoutFolders')
    ];
    
    containers.forEach(container => {
        if (!container) return;
        container.innerHTML = '';

        const folders = Object.entries(workoutFolders);

        if (folders.length === 0) {
            container.innerHTML = '<div class="empty-state">No folders added</div>';
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
                if (container.id === 'analyticsWorkoutFolders') {
                    // Maybe blink or something to show selected?
                }
            };
            container.appendChild(folder);
        });
    });
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
        state.splitInput = select.options[0].value;
        saveState();
    }
}
