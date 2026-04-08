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
}

function setupEventListeners() {
    const addFoodBtn = document.getElementById('addFoodBtn');
    if (addFoodBtn) addFoodBtn.addEventListener('click', addMeal);

    const foodInput = document.getElementById('foodInput');
    if (foodInput) {
        foodInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addMeal();
        });
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

    const habitsAddBtn = document.getElementById('habitsAddBtn');
    if (habitsAddBtn) habitsAddBtn.addEventListener('click', addHabit);

    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) addTaskBtn.addEventListener('click', addTask);

    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
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

// Time Arc Moon Animation
(function() {
    const moonEl = document.querySelector('.moon');
    if (!moonEl) return;

    function updateMoonPosition() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        // Convert current time to a value between 0 and 1 (0 = 00:00, 1 = 24:00)
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        const progress = totalSeconds / 86400; // 86400 seconds in 24 hours
        
        // Arc path: starts at left (x=5), goes up and across to right (x=95)
        // Height follows a semicircle arc
        const x = 5 + progress * 90; // From 5 to 95
        const arcProgress = progress * Math.PI; // 0 to π for semicircle
        const y = 50 - Math.sin(arcProgress) * 45; // Semicircle from 50 down to 5 and back to 50
        
        moonEl.setAttribute('cx', x);
        moonEl.setAttribute('cy', y);
    }
    
    // Update moon position immediately and then every second
    updateMoonPosition();
    setInterval(updateMoonPosition, 1000);
    
    // Smoother animation with requestAnimationFrame
    function animateMoon() {
        updateMoonPosition();
        requestAnimationFrame(animateMoon);
    }
    animateMoon();
})();
