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
        container.innerHTML = '<div class="empty-state">No tasks added</div>';
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

function addGoal() {
    const text = document.getElementById('goalInput').value.trim();
    const dueDate = document.getElementById('goalDateInput').value;
    if (!text) return;
    state.goals.push({ id: Date.now(), text, done: false, dueDate });
    saveState();
    document.getElementById('goalInput').value = '';
    document.getElementById('goalDateInput').value = '';
    renderGoals();
    updateSidebars();
}

function toggleGoal(id, skipRender = false) {
    const goal = state.goals.find(g => g.id === id);
    const justDone = goal && !goal.done;
    if (goal) goal.done = !goal.done;
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

function deleteGoal(id) {
    const goal = state.goals.find(g => g.id === id);
    if (goal) undoStack.push({ type: 'goal', data: goal });
    state.goals = state.goals.filter(g => g.id !== id);
    saveState();
    renderGoals();
    updateSidebars();
}

function renderGoals() {
    const container = document.getElementById('goalsList');
    container.innerHTML = '';
    const visible = state.goals.filter(g => !g.done);
    if (visible.length === 0) {
        container.innerHTML = '<div class="empty-state">No goals added</div>';
        return;
    }
    visible.forEach((goal, index) => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.dataset.index = index;
        item.dataset.id = goal.id;
        item.dataset.type = 'goal';
        item.innerHTML = `
            <div class="task-checkbox" onclick="toggleGoal(${goal.id})"></div>
            <span class="task-text" onclick="toggleGoal(${goal.id})">${escapeHtml(goal.text)}</span>
            ${goal.dueDate ? `<span class="task-date">${goal.dueDate}</span>` : ''}
            <button class="task-delete" onclick="deleteGoal(${goal.id})">×</button>
        `;
        container.appendChild(item);
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
