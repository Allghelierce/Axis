function renderSidebarChecklist(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'sidebar-check-row' + (item.done ? ' sidebar-check-done' : '');
        row.innerHTML = `<span class="sidebar-check-box">${item.done ? '✓' : ''}</span><span class="sidebar-check-text">${escapeHtml(item.text)}</span>`;
        el.appendChild(row);
    });
}

function updateSidebars() {
    const totalCals = state.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalProt = state.meals.reduce((sum, m) => sum + (m.protein || 0), 0);

    const elProt = document.getElementById('sidebarProt');
    const elCals = document.getElementById('sidebarCals');
    if (elProt) elProt.textContent = totalProt;
    if (elCals) elCals.textContent = totalCals;

    const totalTasks = state.tasks.length;
    const doneTasks = state.tasks.filter(t => t.done).length;
    const elTasks = document.getElementById('sidebarTasks');
    const elComplete = document.getElementById('sidebarComplete');
    if (elTasks) elTasks.textContent = totalTasks;
    if (elComplete) elComplete.textContent = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) + '%' : '0%';

    renderSidebarChecklist('sidebarTaskChecklist', state.tasks.map(t => ({ text: t.text, done: t.done })));
    renderSidebarChecklist('sidebarGoalChecklist', state.goals.map(g => ({ text: g.text, done: g.done })));

    const todayStr = new Date().toISOString().split('T')[0];
    const todayDone = state.tasks.filter(t => t.done).length + state.goals.filter(g => g.done).length;
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
    const weekKey = weekAgo.toISOString().split('T')[0];
    const pastDone =
        (state.history.tasksHistory || []).filter(h => h.date >= weekKey && h.date < todayStr).reduce((s, h) => s + (h.done || 0), 0) +
        (state.history.goalsHistory || []).filter(h => h.date >= weekKey && h.date < todayStr).reduce((s, h) => s + (h.done || 0), 0);
    const weeklyDone = pastDone + todayDone;

    const taskCountEl = document.getElementById('taskCircleCount');
    const goalCountEl = document.getElementById('goalCircleCount');
    if (taskCountEl) taskCountEl.textContent = todayDone;
    if (goalCountEl) goalCountEl.textContent = weeklyDone;

    const mobileCounter = document.getElementById('mobileTaskCounter');
    if (mobileCounter) mobileCounter.textContent = doneTasks;

    const avgMealCalEl = document.getElementById('sidebarAvgCal');
    if (avgMealCalEl) {
        const avgMealCal = state.history.caloriesHistory.length > 0
            ? Math.round(state.history.caloriesHistory.reduce((sum, h) => sum + h.calories, 0) / state.history.caloriesHistory.length)
            : 0;
        avgMealCalEl.textContent = avgMealCal;
    }

    const allTimeEl = document.getElementById('sidebarAllTime');
    if (allTimeEl) allTimeEl.textContent = state.history.mealsHistory.length;

    const weekAvgEl = document.getElementById('sidebarWeekAvg');
    if (weekAvgEl) weekAvgEl.textContent = calculateWeekAverage();

    const streakEl = document.getElementById('sidebarStreak');
    if (streakEl) {
        const habitStreak = habits.length > 0 ? Math.max(...habits.map(h => calculateHabitStreak(h))) : 0;
        streakEl.textContent = habitStreak;
    }

    snapshotTasks();
    snapshotGoals();
}

function calculateMaxStreak(habit) {
    let max = 0;
    let current = 0;
    const sortedDates = Object.keys(habit.tracking).sort();
    if (sortedDates.length === 0) return 0;

    const start = new Date(sortedDates[0]);
    const end = new Date(today);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        const status = habit.tracking[key];

        if (status === 'completed') {
            current++;
            max = Math.max(max, current);
        } else if (status === 'prevented') {
            // Keep streak alive
        } else {
            current = 0;
        }
    }
    return max;
}

function snapshotTasks() {
    if (!state.history.tasksHistory) state.history.tasksHistory = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const total = state.tasks.length;
    const done = state.tasks.filter(t => t.done).length;

    const existing = state.history.tasksHistory.find(h => h.date === todayStr);
    if (existing) {
        existing.total = total;
        existing.done = done;
    } else {
        state.history.tasksHistory.push({ date: todayStr, total, done });
    }
    saveState();
}

function snapshotGoals() {
    if (!state.history.goalsHistory) state.history.goalsHistory = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const total = state.goals.length;
    const done = state.goals.filter(g => g.done).length;

    const existing = state.history.goalsHistory.find(h => h.date === todayStr);
    if (existing) {
        existing.total = total;
        existing.done = done;
    } else {
        state.history.goalsHistory.push({ date: todayStr, total, done });
    }
    saveState();
}

function calculateWeekAverage() {
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekMeals = state.history.mealsHistory.filter(meal => new Date(meal) >= weekAgo).length;
    return Math.round(weekMeals / 7);
}

function calculateGlobalStreak() {
    let streak = 0;
    const now = new Date();

    for (let i = 1; i < 365; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() - i);
        const dateKey = checkDate.toISOString().split('T')[0];

        const hasActivity = state.history.mealsHistory.some(meal => {
            const mealDate = new Date(meal);
            return mealDate.toISOString().split('T')[0] === dateKey;
        });

        if (hasActivity) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
