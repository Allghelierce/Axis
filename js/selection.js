let isSelecting = false;
let startX, startY;
const selectionBox = document.getElementById('selectionBox');
let selectedElements = new Set();

document.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.target.closest('button, .pop-out-btn, .habit-drag-handle, .dock, .dock-panel')) return;

    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;

    selectionBox.style.display = 'block';
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';

    clearSelection();
});

document.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;

    e.preventDefault();

    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);

    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;

    updateSelection(left, top, width, height);
});

document.addEventListener('mouseup', () => {
    if (!isSelecting) return;
    isSelecting = false;
    selectionBox.style.display = 'none';
});

document.addEventListener('selectstart', (e) => {
    if (isSelecting) e.preventDefault();
});

function updateSelection(left, top, width, height) {
    const boxRect = { left, top, right: left + width, bottom: top + height };

    const targets = document.querySelectorAll('.task-item, .habit-day, .meal-item, .submitted-note-display');

    targets.forEach(el => {
        const elRect = el.getBoundingClientRect();
        const isIntersecting = !(elRect.left > boxRect.right ||
                                 elRect.right < boxRect.left ||
                                 elRect.top > boxRect.bottom ||
                                 elRect.bottom < boxRect.top);

        if (isIntersecting) {
            el.classList.add('selected');
            selectedElements.add(el);
        } else {
            el.classList.remove('selected');
            selectedElements.delete(el);
        }
    });
}

function clearSelection() {
    selectedElements.forEach(el => el.classList.remove('selected'));
    selectedElements.clear();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

        if (selectedElements.size > 0) {
            performBulkAction();
        }
    }
});

function performBulkAction() {
    let mealsDeleted = false;
    let notesDeleted = false;

    selectedElements.forEach(el => {
        if (el.classList.contains('task-item')) {
            const id = parseInt(el.dataset.id);
            const type = el.dataset.type;
            if (id) {
                if (type === 'task') {
                    state.tasks = state.tasks.filter(t => t.id !== id);
                } else if (type === 'goal') {
                    state.goals = state.goals.filter(g => g.id !== id);
                }
            }
        } else if (el.classList.contains('habit-day')) {
            const habitId = parseInt(el.dataset.habitId);
            const dayKey = el.dataset.dayKey;
            const habit = habits.find(h => h.id === habitId);
            if (habit) {
                delete habit.tracking[dayKey];
            }
        } else if (el.classList.contains('meal-item')) {
            const index = parseInt(el.dataset.index);
            const id = state.meals[index]?.id;
            if (id !== undefined) {
                state.meals = state.meals.filter(m => m.id !== id);
            }
            mealsDeleted = true;
        } else if (el.classList.contains('submitted-note-display')) {
            const key = getTodayNoteKey();
            if (notes[key]) {
                delete notes[key];
                saveNotes();
            }
            notesDeleted = true;
        }
    });

    saveState();
    saveHabits();
    renderTasks();
    renderGoals();
    renderHabits();
    if (mealsDeleted) renderMeals();
    if (notesDeleted) renderNotes();
    updateSidebars();

    clearSelection();
}
