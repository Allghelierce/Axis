function updateMovementNa() {
    const na = document.getElementById('movementNa');
    if (!na) return;
    na.style.display = state.movementNotesSubmitted ? 'none' : '';
}

function updateDailyNoteNa() {
    const na = document.getElementById('dailyNoteNa');
    if (!na) return;
    const key = getTodayKey();
    const hasNote = typeof notes !== 'undefined' && notes[key]?.submitted;
    na.style.display = hasNote ? 'none' : '';
}

const PLAN_STORAGE_KEY = 'planData';
let _planData = JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || '{}');

function _savePlanData() {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(_planData));
}

function _formatPlanText(raw) {
    const bulletMatch = raw.match(/^\*\s+(.+)/);
    if (bulletMatch) return `<span class="plan-bullet">•</span>${bulletMatch[1]}`;
    const numMatch = raw.match(/^(\d+)\)\s+(.+)/);
    if (numMatch) return `<span class="plan-num">${numMatch[1]}.</span>${numMatch[2]}`;
    return raw;
}

function _renderAllPlans() {
    document.querySelectorAll('.section-plan').forEach(area => {
        const key = area.dataset.plan;
        const items = _planData[key] || [];
        const list = area.querySelector('.plan-list');
        if (!list) return;
        list.innerHTML = items.map((text, i) =>
            `<div class="plan-item"><span class="plan-item-text">${_formatPlanText(text)}</span><button class="plan-item-delete" onclick="_deletePlanItem('${key}', ${i})">&times;</button></div>`
        ).join('');
    });
    _updatePlanMacros();
}

function _updatePlanMacros() {
    const items = _planData.macros || [];
    let totalCals = 0, totalProt = 0;
    items.forEach(text => {
        const calMatch = text.match(/(\d+)\s*(?:kcal|cal|c)\b/i);
        if (calMatch) totalCals += parseInt(calMatch[1]);
        const protMatch = text.match(/(\d+)\s*p\b/i);
        if (protMatch) totalProt += parseInt(protMatch[1]);
    });
    const calsEl = document.getElementById('planTotalCals');
    const protEl = document.getElementById('planTotalProt');
    if (calsEl) calsEl.textContent = totalCals;
    if (protEl) protEl.textContent = totalProt;
}

function _deletePlanItem(key, index) {
    if (!_planData[key]) return;
    _planData[key].splice(index, 1);
    _savePlanData();
    _renderAllPlans();
}

function _initPlanFields() {
    document.querySelectorAll('.section-plan .plan-field').forEach(input => {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && input.value.trim()) {
                const key = input.closest('.section-plan').dataset.plan;
                if (!_planData[key]) _planData[key] = [];
                _planData[key].push(input.value.trim());
                _savePlanData();
                input.value = '';
                _renderAllPlans();
            }
        });
    });
    _renderAllPlans();
}

const PLAN_LOCK_KEY = 'planLockedDate';

function _checkPlanLock() {
    const lockedDate = localStorage.getItem(PLAN_LOCK_KEY);
    if (lockedDate === getTodayKey()) {
        document.body.classList.add('plan-locked');
    } else {
        document.body.classList.remove('plan-locked');
        localStorage.removeItem(PLAN_LOCK_KEY);
    }
}

function _initPlanLock() {
    const btn = document.getElementById('planLockBtn');
    if (!btn) return;
    let holdTimer = null;

    btn.addEventListener('mousedown', () => {
        btn.classList.add('holding');
        holdTimer = setTimeout(() => {
            localStorage.setItem(PLAN_LOCK_KEY, getTodayKey());
            document.body.classList.add('plan-locked');
            btn.classList.remove('holding');
        }, 1000);
    });

    btn.addEventListener('mouseup', () => {
        clearTimeout(holdTimer);
        btn.classList.remove('holding');
    });

    btn.addEventListener('mouseleave', () => {
        clearTimeout(holdTimer);
        btn.classList.remove('holding');
    });

    _checkPlanLock();
}

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



function resetUIState() {
    const detail = document.querySelector('.habit-detail-view');
    if (detail) detail.style.display = 'none';
    const habitsView = document.querySelector('.habits-view');
    if (habitsView) habitsView.style.display = '';
    const overlay = document.getElementById('dockPanelOverlay');
    if (overlay) overlay.classList.remove('open');
    const panel = document.getElementById('dockPanel');
    if (panel) panel.classList.remove('open');
    const summary = document.getElementById('summaryOverlay');
    if (summary) summary.style.display = 'none';
    const settings = document.getElementById('settingsOverlay');
    if (settings) settings.style.display = 'none';
    const storage = document.getElementById('storageBinOverlay');
    if (storage) storage.style.display = 'none';
}

function init() {
    resetUIState();

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

    updateMovementNa();
    updateDailyNoteNa();
    _initPlanFields();
    _initPlanLock();
}

function setupEventListeners() {
    console.log('setupEventListeners starting...');
    const foodInput = document.getElementById('foodInput');
    if (foodInput) {
        foodInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                addMeal();
                foodInput.blur();
            }
        });
        console.log('✓ foodInput listener attached');
    } else {
        console.warn('✗ foodInput not found');
    }

    const splitSelect = document.getElementById('splitSelect');
    if (splitSelect) {
        splitSelect.addEventListener('change', (e) => {
            state.splitInput = e.target.value;
            updateWorkoutFolders();
            saveState();
        });
    }

    const movementNotes = document.getElementById('movementNotes');
    if (movementNotes) {
        movementNotes.addEventListener('input', (e) => {
            autoGrow(e.target);
            state.movementNotes = e.target.value;
            state.movementNotesSubmitted = false;
            workoutNotesHistory[getTodayKey()] = e.target.value;
            saveWorkoutNotesHistory();
            saveState();
        });
    }

    const submitMovementBtn = document.getElementById('submitMovementNotes');
    if (submitMovementBtn) {
        submitMovementBtn.addEventListener('click', () => {
            const select = document.getElementById('splitSelect');
            if (select && (!select.value || select.value === 'N/A')) {
                select.focus();
                return;
            }
            const textarea = document.getElementById('movementNotes');
            const content = textarea.value.trim();
            if (!content) return;
            state.movementNotes = content;
            state.movementNotesSubmitted = true;
            workoutNotesHistory[getTodayKey()] = content;
            saveWorkoutNotesHistory();
            saveState();
            renderMovementNotes();
            updateMovementNa();
        });
    }

    const settingsBtn = document.getElementById('openSettingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', openSettings);

    const habitsAddBtn = document.getElementById('habitsAddBtn');
    if (habitsAddBtn) habitsAddBtn.addEventListener('click', addHabit);

    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) addTaskBtn.addEventListener('click', addTask);

    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
        taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                addTask();
                taskInput.blur();
            }
        });
    }

    const submitDailyBtn = document.getElementById('submitDailyNote');
    if (submitDailyBtn) {
        submitDailyBtn.addEventListener('click', () => {
            const textarea = document.getElementById('dailyNoteInput');
            const content = textarea.value.trim();
            if (!content) return;
            const key = getTodayKey();
            if (typeof notes !== 'undefined') {
                notes[key] = { content, submitted: true };
                saveNotes();
                renderNotes();
            }
            updateDailyNoteNa();
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



function renderMovementNotes() {
    const textarea = document.getElementById('movementNotes');
    const display = document.getElementById('movementNotesDisplay');
    const noteText = document.getElementById('movementNotesText');

    if (!textarea || !display || !noteText) return;

    if (state.movementNotesSubmitted && state.movementNotes) {
        noteText.textContent = state.movementNotes;
        display.style.display = '';
        textarea.value = '';
    } else {
        textarea.value = state.movementNotes || '';
        display.style.display = 'none';
    }
    autoGrow(textarea);
}

function render() {
    renderSplitSelect();
    renderTasks();
    renderGoals();
    renderMeals();
    renderMovementNotes();
}


// Cross-tab / mobile-desktop sync via localStorage storage event
window.addEventListener('storage', (e) => {
    const keys = [storageKey, workoutKey, habitsKey, workoutNotesHistoryKey, dailyLogsKey];
    if (!keys.includes(e.key)) return;
    if (e.key === storageKey) state = loadState();
    if (e.key === workoutKey) workoutFolders = loadWorkoutFolders();
    if (e.key === habitsKey) habits = loadHabits();
    if (e.key === workoutNotesHistoryKey) workoutNotesHistory = loadWorkoutNotesHistory();
    if (e.key === dailyLogsKey) dailyLogs = loadDailyLogs();
    render();
    renderHabits();
    renderNotes();
    updateSidebars();
});

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

