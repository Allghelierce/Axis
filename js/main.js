// Independent Timer
(function() {
    function updateTimer() {
        const el = document.getElementById('dayCountdown');
        if (!el) return;
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;
        if (diff <= 0) { el.textContent = "00:00:00"; return; }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const pad = n => n.toString().padStart(2, '0');
        el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    setInterval(updateTimer, 1000);
    updateTimer();
})();

function updateDate() {
    document.getElementById('dateDisplay').textContent = today.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}



function startCountdown() {
    function tick() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;

        if (diff <= 0) {
            document.getElementById('dayCountdown').textContent = "00:00:00";
            return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        const pad = n => String(n).padStart(2, '0');
        const el = document.getElementById('dayCountdown');
        if (el) {
            el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
        }
    }

    tick();
    setInterval(tick, 1000);
}



function init() {
    try {
        updateDate();
        console.log('✓ updateDate');
    } catch (e) { console.error('✗ updateDate:', e); }

    try {
        setupEventListeners();
        console.log('✓ setupEventListeners');
    } catch (e) { console.error('✗ setupEventListeners:', e); }

    try {
        initShiftDrag();
        console.log('✓ initShiftDrag');
    } catch (e) { console.error('✗ initShiftDrag:', e); }

    try {
        render();
        console.log('✓ render');
    } catch (e) { console.error('✗ render:', e); }

    try {
        renderHabits();
        console.log('✓ renderHabits');
    } catch (e) { console.error('✗ renderHabits:', e); }

    try {
        renderNotes();
        console.log('✓ renderNotes');
    } catch (e) { console.error('✗ renderNotes:', e); }

    try {
        initNotesEventListeners();
        console.log('✓ initNotesEventListeners');
    } catch (e) { console.error('✗ initNotesEventListeners:', e); }

    try {
        updateSidebars();
        console.log('✓ updateSidebars');
    } catch (e) { console.error('✗ updateSidebars:', e); }

    try {
        startCountdown();
        console.log('✓ startCountdown');
    } catch (e) { console.error('✗ startCountdown:', e); }

    try {
        if (state.viewState && state.viewState.analyticsActive) {
            openFullscreenAnalytics();
        }
        console.log('✓ restoreViewState');
    } catch (e) { console.error('✗ restoreViewState:', e); }
}

function setupEventListeners() {
    console.log('setupEventListeners starting...');
    const addFoodBtn = document.getElementById('addFoodBtn');
    if (addFoodBtn) {
        addFoodBtn.addEventListener('click', addMeal);
        console.log('✓ addFoodBtn listener attached');
    } else {
        console.warn('✗ addFoodBtn not found');
    }

    const foodInput = document.getElementById('foodInput');
    if (foodInput) {
        foodInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addMeal();
        });
        console.log('✓ foodInput listener attached');
    } else {
        console.warn('✗ foodInput not found');
    }

    const photoUpload = document.getElementById('photoUpload');
    if (photoUpload) {
        photoUpload.addEventListener('click', () => {
            document.getElementById('photoInput').click();
        });
    }

    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            handlePhotoUpload(e.files);
        });
    }

    const splitSelect = document.getElementById('splitSelect');
    if (splitSelect) {
        splitSelect.addEventListener('change', (e) => {
            state.splitInput = e.target.value;
            updateWorkoutFolders();
            saveState();
        });
    }

    const addFolderBtn = document.getElementById('addFolderBtn');
    if (addFolderBtn) {
        addFolderBtn.addEventListener('click', () => {
            const name = prompt('Folder name:');
            if (name && name.trim()) {
                const trimmed = name.trim();
                if (!workoutFolders[trimmed]) {
                    workoutFolders[trimmed] = [];
                    saveWorkoutFolders();
                    renderWorkoutFolders();
                    renderSplitSelect();
                }
            }
        });
    }

    const movementNotes = document.getElementById('movementNotes');
    if (movementNotes) {
        movementNotes.addEventListener('change', (e) => {
            state.movementNotes = e.target.value;
            workoutNotesHistory[getTodayKey()] = e.target.value;
            saveWorkoutNotesHistory();
            saveState();
        });
    }

    const fsBtn = document.getElementById('fullscreenAnalyticsBtn');
    if (fsBtn) fsBtn.addEventListener('click', openFullscreenAnalytics);

    const closeFsBtn = document.getElementById('closeFullscreenBtn');
    if (closeFsBtn) closeFsBtn.addEventListener('click', closeFullscreenAnalytics);

    const settingsBtn = document.getElementById('openSettingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', openSettings);

    const habitsAddBtn = document.getElementById('habitsAddBtn');
    if (habitsAddBtn) habitsAddBtn.addEventListener('click', addHabit);

    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) addTaskBtn.addEventListener('click', addTask);

    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
        console.log('✓ taskInput listener attached');
    } else {
        console.warn('✗ taskInput not found');
    }

    const addGoalBtn = document.getElementById('addGoalBtn');
    if (addGoalBtn) addGoalBtn.addEventListener('click', addGoal);

    const goalInput = document.getElementById('goalInput');
    if (goalInput) {
        goalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addGoal();
        });
    }

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            handleUndo();
        }
    });
}

let isMouseDownMain = false;
let isShiftDraggingMain = false;
let draggedOverElementsMain = new Set();

function initShiftDrag() {
    window.addEventListener('mousedown', (e) => {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        isMouseDownMain = true;
        if (e.shiftKey) {
            const target = e.target.closest('.habit-day, .task-checkbox');
            if (target) {
                isShiftDraggingMain = true;
                draggedOverElementsMain.clear();
                draggedOverElementsMain.add(target);
                e.preventDefault();
                handleBoxInteraction(target, e);
            }
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isMouseDownMain && isShiftDraggingMain) {
            const target = e.target.closest('.habit-day, .task-checkbox');
            if (target && !draggedOverElementsMain.has(target)) {
                draggedOverElementsMain.add(target);
                handleBoxInteraction(target, e);
            }
        }
    });

    window.addEventListener('mouseup', () => {
        if (isShiftDraggingMain) {
            // Final render to ensure everything is synced
            renderHabits();
            renderTasks();
            renderGoals();
        }
        isMouseDownMain = false;
        isShiftDraggingMain = false;
        draggedOverElementsMain.clear();
    });
}

function handleBoxInteraction(el, event) {
    if (el.classList.contains('habit-day')) {
        const habitId = parseInt(el.dataset.habitId);
        const dayKey = el.dataset.dayKey;
        toggleHabitDay(habitId, dayKey, el, event, true);
    } else if (el.classList.contains('task-checkbox')) {
        const item = el.closest('.task-item');
        if (item) {
            const id = parseInt(item.dataset.id);
            if (item.dataset.type === 'task') {
                toggleTask(id, true);
            } else if (item.dataset.type === 'goal') {
                toggleGoal(id, true);
            }
        }
    }
}

function handleUndo() {
    const item = undoStack.pop();
    if (!item) return;

    switch (item.type) {
        case 'meal':
            state.meals.push(item.data);
            renderMeals();
            break;
        case 'photo':
            state.photos.push(item.data);
            renderGallery();
            break;
        case 'task':
            state.tasks.push(item.data);
            renderTasks();
            break;
        case 'goal':
            state.goals.push(item.data);
            renderGoals();
            break;
        case 'habit':
            const habit = habits.find(h => h.id === item.data.habitId);
            if (habit) {
                if (item.data.previousStatus === undefined) {
                    delete habit.tracking[item.data.dayKey];
                } else {
                    habit.tracking[item.data.dayKey] = item.data.previousStatus;
                }
                saveHabits();
                renderHabits();
            }
            break;
    }
    saveState();
    updateSidebars();
}



function render() {
    renderSplitSelect();
    renderTasks();
    renderGoals();
    renderMeals();
    renderGallery();
    document.getElementById('movementNotes').value = state.movementNotes;
    renderWorkoutFolders();
}


// Boot
try {
    init();
    console.log('Init completed successfully');
} catch (e) {
    console.error('Error during init:', e);
}

try {
    initMap();
    console.log('InitMap completed successfully');
} catch (e) {
    console.error('Error during initMap:', e);
}

