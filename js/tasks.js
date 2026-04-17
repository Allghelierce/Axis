let _undoToastTimer = null;
let _undoCallback = null;

function showUndoToast(text, onUndo) {
    const existing = document.getElementById('undoToast');
    if (existing) existing.remove();
    if (_undoToastTimer) clearTimeout(_undoToastTimer);

    _undoCallback = onUndo;

    const toast = document.createElement('div');
    toast.id = 'undoToast';
    toast.className = 'undo-toast';
    toast.innerHTML = `<span class="undo-toast-label">"${escapeHtml(text)}"</span><button class="undo-toast-btn" onclick="triggerUndo()">Undo</button>`;
    document.body.appendChild(toast);

    _undoToastTimer = setTimeout(() => {
        toast.remove();
        _undoCallback = null;
    }, 3000);
}

function triggerUndo() {
    const toast = document.getElementById('undoToast');
    if (toast) toast.remove();
    if (_undoToastTimer) clearTimeout(_undoToastTimer);
    if (_undoCallback) { _undoCallback(); _undoCallback = null; }
}

function addTask() {
    const text = document.getElementById('taskInput').value.trim();
    if (!text) return;
    state.tasks.push({ id: Date.now(), text, done: false });
    saveState();
    document.getElementById('taskInput').value = '';
    renderTasks();
    updateSidebars();
}

function toggleTask(id, skipRender = false) {
    const task = state.tasks.find(t => t.id === id);
    const justDone = task && !task.done;
    if (task) task.done = !task.done;
    saveState();

    if (justDone && !skipRender) {
        const el = document.querySelector(`.task-item[data-id="${id}"][data-type="task"]`);
        if (el) el.classList.add('completing');
        showUndoToast(task.text, () => {
            task.done = false;
            saveState();
            renderTasks();
            try { updateSidebars(); } catch(e) {}
        });
        setTimeout(() => renderTasks(), 220);
    } else if (!skipRender) {
        renderTasks();
    } else {
        const el = document.querySelector(`.task-item[data-id="${id}"][data-type="task"]`);
        if (el) {
            el.classList.toggle('done', task.done);
            const checkbox = el.querySelector('.task-checkbox');
            if (checkbox) checkbox.textContent = task.done ? '✓' : '';
        }
    }

    try { updateSidebars(); } catch(e) {}
    if (justDone && typeof onItemChecked === 'function') onItemChecked(null, 'task');
}

function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) undoStack.push({ type: 'task', data: task });
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveState();
    renderTasks();
    updateSidebars();
}

function renderTasks() {
    const container = document.getElementById('tasksList');
    container.innerHTML = '';
    const visible = state.tasks.filter(t => !t.done);
    if (visible.length === 0) {
        container.innerHTML = '<div class="empty-na">n/a</div>';
        return;
    }
    visible.forEach((task, index) => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.dataset.index = index;
        item.dataset.id = task.id;
        item.dataset.type = 'task';
        item.innerHTML = `
            <div class="task-checkbox" onclick="toggleTask(${task.id})"></div>
            <span class="task-text" onclick="toggleTask(${task.id})">${escapeHtml(task.text)}</span>
            <button class="task-delete" onclick="deleteTask(${task.id})">×</button>
        `;
        container.appendChild(item);
    });
}

let _goalFormType = 'simple';

function toggleGoalMenu() {
    const menu = document.getElementById('goalAddMenu');
    menu.classList.toggle('open');
}

function showGoalForm(type) {
    _goalFormType = type;
    const menu = document.getElementById('goalAddMenu');
    const form = document.getElementById('goalForm');
    menu.classList.remove('open');
    form.style.display = '';
    const input = document.getElementById('goalInput');
    input.placeholder = type === 'tracked' ? 'Tracked goal name...' : 'Goal name...';
    input.focus();
}

function _hideGoalForm() {
    const form = document.getElementById('goalForm');
    if (form) form.style.display = 'none';
    const input = document.getElementById('goalInput');
    if (input) input.value = '';
    const dateInput = document.getElementById('goalDateInput');
    if (dateInput) dateInput.value = '';
}

document.addEventListener('click', e => {
    const menu = document.getElementById('goalAddMenu');
    if (menu && menu.classList.contains('open') && !e.target.closest('.goal-title-dotted') && !e.target.closest('.goal-add-menu')) {
        menu.classList.remove('open');
    }
});

function addGoal() {
    const input = document.getElementById('goalInput');
    const dateInput = document.getElementById('goalDateInput');
    if (!input) return;
    const text = input.value.trim();
    const dueDate = dateInput ? dateInput.value : '';
    if (!text) return;
    const goal = { id: Date.now(), text, done: false, dueDate, type: _goalFormType };
    if (_goalFormType === 'tracked') goal.tracking = {};
    state.goals.push(goal);
    saveState();
    _hideGoalForm();
    renderGoals();
    updateSidebars();
}

function toggleGoal(id, skipRender = false) {
    const goal = state.goals.find(g => g.id === id);
    if (!goal) return;
    if (goal.type === 'tracked') return;
    const justDone = !goal.done;
    goal.done = !goal.done;
    saveState();

    if (justDone && !skipRender) {
        const el = document.querySelector(`.task-item[data-id="${id}"][data-type="goal"]`);
        if (el) el.classList.add('completing');
        showUndoToast(goal.text, () => {
            goal.done = false;
            saveState();
            renderGoals();
            try { updateSidebars(); } catch(e) {}
        });
        setTimeout(() => renderGoals(), 220);
    } else if (!skipRender) {
        renderGoals();
    } else {
        const el = document.querySelector(`.task-item[data-id="${id}"][data-type="goal"]`);
        if (el) {
            el.classList.toggle('done', goal.done);
            const checkbox = el.querySelector('.task-checkbox');
            if (checkbox) checkbox.textContent = goal.done ? '✓' : '';
        }
    }

    try { updateSidebars(); } catch(e) {}
    if (justDone && typeof onItemChecked === 'function') onItemChecked(null, 'goal');
}

function toggleGoalDay(id, dayKey) {
    const goal = state.goals.find(g => g.id === id);
    if (!goal || !goal.tracking) return;
    if (goal.tracking[dayKey]) {
        delete goal.tracking[dayKey];
    } else {
        goal.tracking[dayKey] = true;
    }
    saveState();
    renderGoals();
    updateSidebars();
}

function completeTrackedGoal(id) {
    const goal = state.goals.find(g => g.id === id);
    if (!goal) return;
    goal.done = true;
    saveState();
    renderGoals();
    updateSidebars();
}

function deleteGoal(id) {
    const goal = state.goals.find(g => g.id === id);
    if (goal) undoStack.push({ type: 'goal', data: goal });
    state.goals = state.goals.filter(g => g.id !== id);
    saveState();
    renderGoals();
    updateSidebars();
}

function _goalDueBadge(dueDate) {
    if (!dueDate) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + 'T00:00:00');
    const days = Math.ceil((due - today) / 86400000);
    let cls = 'goal-due-badge';
    if (days < 0) cls += ' goal-due-past';
    else if (days <= 3) cls += ' goal-due-urgent';
    else if (days <= 7) cls += ' goal-due-soon';
    const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'due today' : `${days}d left`;
    return `<span class="${cls}">${label}</span>`;
}

function _goalProgressInfo(goal) {
    if (!goal.tracking) return { percent: 0, checked: 0, total: 0 };
    const checked = Object.keys(goal.tracking).length;
    if (!goal.dueDate) return { percent: 0, checked, total: 0 };
    const start = new Date(goal.id);
    start.setHours(0, 0, 0, 0);
    const due = new Date(goal.dueDate + 'T00:00:00');
    const total = Math.max(1, Math.ceil((due - start) / 86400000) + 1);
    return { percent: Math.min(100, Math.round((checked / total) * 100)), checked, total };
}

function renderGoals() {
    const container = document.getElementById('goalsList');
    if (!container) return;
    container.innerHTML = '';
    const visible = state.goals.filter(g => !g.done);
    if (visible.length === 0) {
        container.innerHTML = '<div class="empty-na">n/a</div>';
        return;
    }
    visible.forEach((goal, index) => {
        if (goal.type === 'tracked') {
            const item = document.createElement('div');
            item.className = 'goal-tracked-item';
            item.dataset.index = index;
            item.dataset.id = goal.id;
            item.dataset.type = 'goal';

            const info = _goalProgressInfo(goal);

            let daysHTML = '<div class="goal-tracking-days">';
            for (let i = 13; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dk = d.toISOString().split('T')[0];
                const checked = goal.tracking && goal.tracking[dk];
                const isToday = i === 0;
                const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                daysHTML += `<div class="goal-day ${checked ? 'goal-day-done' : ''} ${isToday ? 'goal-day-today' : ''}" onclick="toggleGoalDay(${goal.id}, '${dk}')" title="${dateLabel}">${checked ? '✓' : ''}</div>`;
            }
            daysHTML += '</div>';

            let progressHTML = '';
            if (goal.dueDate) {
                progressHTML = `<div class="goal-progress-bar"><div class="goal-progress-fill" style="width:${info.percent}%"></div></div>`;
            }

            item.innerHTML = `
                <div class="goal-tracked-top">
                    <span class="goal-tracked-name">${escapeHtml(goal.text)}</span>
                    ${_goalDueBadge(goal.dueDate)}
                    <button class="goal-tracked-done-btn" onclick="completeTrackedGoal(${goal.id})" title="Mark complete">✓</button>
                    <button class="task-delete" onclick="deleteGoal(${goal.id})">×</button>
                </div>
                ${daysHTML}
                ${progressHTML}
            `;
            container.appendChild(item);
        } else {
            const item = document.createElement('div');
            item.className = 'task-item';
            item.dataset.index = index;
            item.dataset.id = goal.id;
            item.dataset.type = 'goal';
            item.innerHTML = `
                <div class="task-checkbox" onclick="toggleGoal(${goal.id})"></div>
                <span class="task-text" onclick="toggleGoal(${goal.id})">${escapeHtml(goal.text)}</span>
                ${_goalDueBadge(goal.dueDate)}
                <button class="task-delete" onclick="deleteGoal(${goal.id})">×</button>
            `;
            container.appendChild(item);
        }
    });
}

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedItem === this || !draggedItem) return false;

    const draggedType = draggedItem.dataset.type;
    const dropType = this.dataset.type;

    if (draggedType !== dropType) return false;

    const draggedIndex = parseInt(draggedItem.dataset.index);
    const dropIndex = parseInt(this.dataset.index);

    if (draggedType === 'task') {
        const temp = state.tasks[draggedIndex];
        state.tasks[draggedIndex] = state.tasks[dropIndex];
        state.tasks[dropIndex] = temp;
        saveState();
        renderTasks();
    } else if (draggedType === 'goal') {
        const temp = state.goals[draggedIndex];
        state.goals[draggedIndex] = state.goals[dropIndex];
        state.goals[dropIndex] = temp;
        saveState();
        renderGoals();
    }

    return false;
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
}
