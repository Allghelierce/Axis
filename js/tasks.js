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
    if (task) {
        task.done = !task.done;
        if (skipRender) {
            const el = document.querySelector(`.task-item[data-id="${id}"][data-type="task"]`);
            if (el) {
                el.classList.toggle('done', task.done);
                const checkbox = el.querySelector('.task-checkbox');
                if (checkbox) checkbox.textContent = task.done ? '✓' : '';
            }
        }
    }
    saveState();
    if (!skipRender) renderTasks();
    updateSidebars();
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
    if (state.tasks.length === 0) {
        container.innerHTML = '<div class="empty-state">No tasks added</div>';
        return;
    }
    state.tasks.forEach((task, index) => {
        const item = document.createElement('div');
        item.className = 'task-item' + (task.done ? ' done' : '');

        item.dataset.index = index;
        item.dataset.id = task.id;
        item.dataset.type = 'task';
        item.innerHTML = `
            <div class="drag-handle">⋮</div>
            <div class="task-checkbox" onclick="toggleTask(${task.id})">${task.done ? '✓' : ''}</div>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <button class="task-delete" onclick="deleteTask(${task.id})">×</button>
        `;
        // TODO: Drag listeners disabled - causing textbox interaction issues
        // item.addEventListener('dragstart', handleDragStart);
        // item.addEventListener('dragover', handleDragOver);
        // item.addEventListener('drop', handleDrop);
        // item.addEventListener('dragend', handleDragEnd);
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
}

function toggleGoal(id, skipRender = false) {
    const goal = state.goals.find(g => g.id === id);
    if (goal) {
        goal.done = !goal.done;
        if (skipRender) {
            const el = document.querySelector(`.task-item[data-id="${id}"][data-type="goal"]`);
            if (el) {
                el.classList.toggle('done', goal.done);
                const checkbox = el.querySelector('.task-checkbox');
                if (checkbox) checkbox.textContent = goal.done ? '✓' : '';
            }
        }
    }
    saveState();
    if (!skipRender) renderGoals();
}

function deleteGoal(id) {
    const goal = state.goals.find(g => g.id === id);
    if (goal) undoStack.push({ type: 'goal', data: goal });
    state.goals = state.goals.filter(g => g.id !== id);
    saveState();
    renderGoals();
}

function renderGoals() {
    const container = document.getElementById('goalsList');
    container.innerHTML = '';
    if (state.goals.length === 0) {
        container.innerHTML = '<div class="empty-state">No goals added</div>';
        return;
    }
    state.goals.forEach((goal, index) => {
        const item = document.createElement('div');
        item.className = 'task-item' + (goal.done ? ' done' : '');

        item.dataset.index = index;
        item.dataset.id = goal.id;
        item.dataset.type = 'goal';
        item.innerHTML = `
            <div class="drag-handle">⋮</div>
            <div class="task-checkbox" onclick="toggleGoal(${goal.id})">${goal.done ? '✓' : ''}</div>
            <div class="task-content">
                <span class="task-text">${escapeHtml(goal.text)}</span>
                ${goal.dueDate ? `<span class="task-date">${goal.dueDate}</span>` : ''}
            </div>
            <button class="task-delete" onclick="deleteGoal(${goal.id})">×</button>
        `;
        // TODO: Drag listeners disabled - causing textbox interaction issues
        // item.addEventListener('dragstart', handleDragStart);
        // item.addEventListener('dragover', handleDragOver);
        // item.addEventListener('drop', handleDrop);
        // item.addEventListener('dragend', handleDragEnd);
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
