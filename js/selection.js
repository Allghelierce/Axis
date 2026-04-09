let isSelecting = false;
let startX, startY;
const selectionBox = document.getElementById('selectionBox');
let selectedElements = new Set();

document.addEventListener('mousedown', (e) => {
    // Only start selection if clicking on the background or near lists, not on inputs/buttons
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA' || e.target.closest('.pop-out-btn')) return;
    
    // To prevent conflict with drag and drop if re-enabled
    if (e.target.closest('.habit-drag-handle')) return;

    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;

    selectionBox.style.display = 'block';
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';

    // Clear previous selection
    clearSelection();
});

document.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;

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

function updateSelection(left, top, width, height) {
    const boxRect = { left, top, right: left + width, bottom: top + height };
    
    // Target elements: tasks, goals, habit-days
    const targets = document.querySelectorAll('.task-item, .habit-day');
    
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
        // Only if not focused on an input
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

        if (selectedElements.size > 0) {
            performBulkAction();
        }
    }
});

function performBulkAction() {
    const tasksToDelete = [];
    const internalHabitUpdates = [];

    selectedElements.forEach(el => {
        // Check if it's a task or goal
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
        } 
        // Check if it's a habit day
        else if (el.classList.contains('habit-day')) {
            const habitId = parseInt(el.dataset.habitId);
            const dayKey = el.dataset.dayKey;
            
            // Find habit and reset tracking for that day
            const habit = habits.find(h => h.id === habitId);
            if (habit) {
                delete habit.tracking[dayKey];
            }
        }
    });

    // Save and refresh
    saveState();
    saveHabits();
    renderTasks();
    renderGoals();
    renderHabits();
    updateSidebars();
    
    clearSelection();
}
