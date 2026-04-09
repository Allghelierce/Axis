function toggleHabitDeleteMode() {
    isHabitDeleteMode = !isHabitDeleteMode;
    const btn = document.getElementById('habitDeleteToggle');
    const container = document.getElementById('habitsList');
    if (isHabitDeleteMode) {
        btn.classList.add('active');
        container.classList.add('delete-mode');
    } else {
        btn.classList.remove('active');
        container.classList.remove('delete-mode');
    }
}

function deleteHabit(id) {
    if (!confirm('Delete this habit?')) return;
    habits = habits.filter(h => h.id !== id);
    saveHabits();
    renderHabits();
    updateSidebars();
}



function calculateHabitStreak(habit) {
    let streak = 0;
    let currentDate = new Date(today);

    for (let i = 0; i < 365; i++) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const status = habit.tracking[dateKey];

        if (status === 'completed') {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (status === 'prevented') {
            // Rest day: don't increment, but don't break the streak
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (i === 0 && !status) {
            // Today is empty but doesn't break the streak yet
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

function getStreakColor(streak) {
    if (streak === 0) return 'rgba(248, 250, 252, 0.4)';
    if (streak <= 2) return 'rgba(234, 179, 8, 0.6)';
    if (streak <= 5) return 'rgba(34, 197, 94, 0.7)';
    if (streak <= 10) return 'rgba(34, 197, 94, 0.85)';
    return 'rgba(34, 197, 94, 1)';
}

function renderHabits() {
    const container = document.getElementById('habitsList');
    const existingElements = {};

    // Normalize new fields for backward-compatibility
    habits.forEach(habit => {
        habit.archived ??= false;
        habit.weeklyTarget ??= null;
        habit.notes ??= {};
    });

    // Store existing streak elements for comparison
    container.querySelectorAll('[data-habit-id]').forEach(el => {
        existingElements[el.dataset.habitId] = el.querySelector('.habit-streak');
    });

    // Filter out archived habits
    const activeHabits = habits.filter(h => !h.archived);
    const archivedHabits = habits.filter(h => h.archived);

    if (activeHabits.length === 0) {
        container.innerHTML = '<div class="empty-state">No habits yet. Click + to add one!</div>';
        return;
    }

    container.innerHTML = '';

    activeHabits.forEach((habit, habitIndex) => {
        const habitEl = document.createElement('div');
        habitEl.className = 'habit-item' + (isHabitDeleteMode ? ' delete-mode' : '');
        habitEl.dataset.habitId = habit.id;

        let streak = 0;
        try {
            streak = calculateHabitStreak(habit);
        } catch (e) {
            console.error('Error calculating streak:', e);
        }

        const streakColor = getStreakColor(streak);

        let trackingHTML = '<div class="habit-tracking">';
        for (let i = 0; i < 18; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayKey = date.toISOString().split('T')[0];
            const status = habit.tracking[dayKey];
            const isToday = i === 0;
            const isPastWeek = i >= 8;

            const statusClass = status || '';
            const colorClass = status === 'completed' ? (habit.color || '') : '';
            const specialClass = isToday ? 'today-habit' : isPastWeek ? 'past-week' : '';
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const character = status === 'prevented' ? '◎' : '✓';

            trackingHTML += `<div class="habit-day ${statusClass} ${colorClass} ${specialClass}" data-habit-id="${habit.id}" data-day-key="${dayKey}" title="${dateStr}">${character}</div>`;
        }
        trackingHTML += '</div>';

        const deleteModeBtns = isHabitDeleteMode ? `
            <div class="habit-drag-handle" data-habit-index="${habits.indexOf(habit)}">⠿</div>
            <button class="habit-archive-btn" onclick="archiveHabit(${habit.id}); event.stopPropagation();" title="Archive">⊟</button>
        ` : '';

        habitEl.innerHTML = `
            <div class="habit-controls">${deleteModeBtns}</div>
            <div class="habit-name" onclick="if(isHabitDeleteMode) deleteHabit(${habit.id}); else openHabitDetail(${habit.id})">${habit.name}</div>
            <div class="habit-bottom-row">
                ${trackingHTML}
                <div class="habit-streak" style="color: ${streakColor}">${streak}</div>
            </div>
        `;

        container.appendChild(habitEl);

        // Check if streak increased and add animation
        const oldElement = existingElements[habit.id];
        if (oldElement) {
            const oldStreak = parseInt(oldElement.textContent);
            if (streak > oldStreak) {
                const streakEl = habitEl.querySelector('.habit-streak');
                streakEl.classList.add('streak-up');
                setTimeout(() => streakEl.classList.remove('streak-up'), 600);
            }
        }
    });

    // Add event listeners to habit day boxes
    container.querySelectorAll('.habit-day').forEach(el => {
        el.addEventListener('click', (event) => {
            const habitId = parseInt(el.dataset.habitId);
            const dayKey = el.dataset.dayKey;
            toggleHabitDay(habitId, dayKey, el, event);
        });
    });

    // Setup drag-to-reorder in delete mode
    if (isHabitDeleteMode) {
        container.querySelectorAll('.habit-item').forEach(el => {
            el.draggable = true;
            el.addEventListener('dragstart', habitDragStart);
            el.addEventListener('dragover', habitDragOver);
            el.addEventListener('drop', habitDrop);
            el.addEventListener('dragend', habitDragEnd);
        });
    }

    // Append archived habits section if any
    if (archivedHabits.length > 0) {
        const archivedSection = document.createElement('div');
        archivedSection.className = 'habits-archived-section';
        archivedSection.innerHTML = `
            <div class="habits-archived-toggle" onclick="toggleArchivedHabits()">
                <span class="habits-archived-toggle-text">Archived (${archivedHabits.length}) ▸</span>
            </div>
            <div class="habits-archived-list" style="display: none;">
                ${archivedHabits.map(habit => `
                    <div class="habit-item habit-archived">
                        <button class="habit-restore-btn" onclick="unarchiveHabit(${habit.id}); event.stopPropagation();" title="Restore">⊞</button>
                        <div class="habit-name">${habit.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
        container.parentElement.appendChild(archivedSection);
    }

    // Render weekly chart
    renderHabitsWeeklyChart();
}

function toggleHabitDay(habitId, dayKey, element, event, skipRender = false) {
    if (isHabitDeleteMode) return;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const previousStatus = habit.tracking[dayKey];
    undoStack.push({ type: 'habit', data: { habitId, dayKey, previousStatus } });

    const isShiftClick = event && event.shiftKey;

    if (!previousStatus) {
        habit.tracking[dayKey] = 'completed';
        if (element) {
            element.classList.add('completed');
            if (habit.color) element.classList.add(habit.color);
            element.classList.add('animate-pop');
            element.addEventListener('animationend', () => {
                element.classList.remove('animate-pop');
            }, { once: true });
        }
    } else if (previousStatus === 'completed') {
        if (isShiftClick) {
            delete habit.tracking[dayKey];
            if (element) {
                element.classList.remove('completed');
                if (habit.color) element.classList.remove(habit.color);
            }
        } else {
            habit.tracking[dayKey] = 'prevented';
            if (element) {
                element.classList.remove('completed');
                if (habit.color) element.classList.remove(habit.color);
                element.classList.add('prevented');
            }
        }
    } else {
        delete habit.tracking[dayKey];
        if (element) element.classList.remove('prevented');
    }

    saveHabits();
    if (!skipRender) {
        renderHabits();
    }
    updateSidebars();
}

// Drag-to-reorder functionality
let habitDraggedIndex = null;

function habitDragStart(e) {
    habitDraggedIndex = parseInt(this.querySelector('.habit-drag-handle')?.dataset.habitIndex) ?? null;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function habitDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function habitDrop(e) {
    e.stopPropagation();
    if (habitDraggedIndex === null) return;

    const dropIndex = parseInt(this.querySelector('.habit-drag-handle')?.dataset.habitIndex) ?? null;
    if (dropIndex === null || dropIndex === habitDraggedIndex) return;

    // Splice-move the habit to the new position
    const moved = habits.splice(habitDraggedIndex, 1)[0];
    habits.splice(dropIndex, 0, moved);

    saveHabits();
    renderHabits();
}

function habitDragEnd(e) {
    this.classList.remove('dragging');
    habitDraggedIndex = null;
}

// Archive and restore functionality
function archiveHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        habit.archived = true;
        saveHabits();
        renderHabits();
    }
}

function unarchiveHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        habit.archived = false;
        saveHabits();
        renderHabits();
    }
}

function toggleArchivedHabits() {
    const list = document.querySelector('.habits-archived-list');
    if (list) {
        list.style.display = list.style.display === 'none' ? 'block' : 'none';
        const toggle = document.querySelector('.habits-archived-toggle-text');
        if (toggle) {
            toggle.textContent = list.style.display === 'none' ? 'Archived ▸' : 'Archived ▾';
        }
    }
}

function setHabitTarget(habitId, target) {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
        habit.weeklyTarget = target;
        saveHabits();
    }
}

function saveHabitNote(habitId, dayKey, noteText) {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
        if (!habit.notes) habit.notes = {};
        if (noteText.trim()) {
            habit.notes[dayKey] = noteText.trim();
        } else {
            delete habit.notes[dayKey];
        }
        saveHabits();
        renderHabitCalendarMonth(habit, calendarCurrentMonth);
    }
}

function showNoteEditor(habitId, dayKey, currentNote) {
    const input = prompt('Add note (max 60 chars):', currentNote);
    if (input !== null) {
        saveHabitNote(habitId, dayKey, input.substring(0, 60));
    }
}

function addHabit() {
    const habitName = prompt('Habit name:');
    if (!habitName || !habitName.trim()) return;

    const colors = ['shade1', 'shade2', 'shade3', 'shade4'];
    const newHabit = {
        id: Math.max(...habits.map(h => h.id), 0) + 1,
        name: habitName.trim(),
        color: colors[Math.floor(Math.random() * colors.length)],
        tracking: {}
    };

    habits.push(newHabit);
    saveHabits();
    renderHabits();
    updateSidebars();
}

// Habit Detail View
let habitDetailChart = null;
let currentHabit = null;
let calendarCurrentMonth = null;

function openHabitDetail(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    currentHabit = habit;
    calendarCurrentMonth = new Date(today);

    // Show detail view
    document.querySelector('.habits-view').style.display = 'none';
    document.querySelector('.habit-detail-view').style.display = 'flex';

    // Update header
    document.getElementById('habitDetailName').textContent = habit.name;

    // Calculate statistics
    const stats = calculateHabitStats(habit);
    document.getElementById('detailCurrentStreak').textContent = stats.currentStreak;
    document.getElementById('detailLongestStreak').textContent = stats.longestStreak;
    document.getElementById('detailCompletion').textContent = stats.completionRate + '%';
    document.getElementById('detailTotalDays').textContent = stats.completedDays;

    // Update this week stat and target selector
    const target = habit.weeklyTarget || 0;
    const thisWeekDisplay = target > 0 ? `${stats.thisWeekCount} / ${target}` : stats.thisWeekCount;
    document.getElementById('detailThisWeek').textContent = thisWeekDisplay;
    document.getElementById('detailTargetSelect').value = target;

    // Show/hide target selector (only show if there's a target or user clicks to set one)
    // For now, we'll show it always for easy access

    // Render calendar
    renderHabitCalendarMonth(habit, calendarCurrentMonth);

    // Render chart
    renderHabitChart(habit);

    // Setup calendar navigation
    setupCalendarNavigation();
}

function closeHabitDetail() {
    document.querySelector('.habits-view').style.display = 'block';
    document.querySelector('.habit-detail-view').style.display = 'none';
    if (habitDetailChart) {
        habitDetailChart.destroy();
        habitDetailChart = null;
    }
}

function calculateHabitStats(habit) {
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let longestStreak = 0;
    let currentStreak = 0;
    let completedDays = 0;
    let trackedDays = 0;
    let thisWeekCount = 0;

    // Calculate this week (starting from Sunday)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    for (let d = new Date(today); d >= sixMonthsAgo; d.setDate(d.getDate() - 1)) {
        const dayKey = d.toISOString().split('T')[0];
        const status = habit.tracking[dayKey];

        if (status === 'completed') {
            completedDays++;
            currentStreak++;
            if (d >= weekStart) thisWeekCount++;
        } else if (status === 'prevented') {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 0;
        } else {
            if (new Date(dayKey) >= sixMonthsAgo) {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 0;
            }
        }

        if (status) trackedDays++;
    }

    longestStreak = Math.max(longestStreak, currentStreak);
    const totalDays = Math.floor((today - sixMonthsAgo) / 86400000);
    const completionRate = Math.round((completedDays / totalDays) * 100);

    return {
        currentStreak,
        longestStreak,
        completionRate: Math.max(0, completionRate),
        totalDays,
        completedDays,
        trackedDays,
        thisWeekCount
    };
}

function renderHabitCalendarMonth(habit, monthDate) {
    const container = document.getElementById('detailCalendarContainer');
    container.innerHTML = '';

    // Render 2 months starting from monthDate
    for (let m = 0; m < 2; m++) {
        const currentMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + m, 1);
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const monthDiv = document.createElement('div');
        monthDiv.className = 'calendar-month';
        monthDiv.innerHTML = `<div class="calendar-month-header">${currentMonth.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</div><div class="calendar-days"></div>`;

        const daysContainer = monthDiv.querySelector('.calendar-days');

        // Add empty cells for days before month start
        const startDay = monthStart.getDay();
        for (let i = 0; i < startDay; i++) {
            daysContainer.innerHTML += '<div class="calendar-day" style="opacity: 0;"></div>';
        }

        // Add day cells
        for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
            const dayKey = d.toISOString().split('T')[0];
            const status = habit.tracking[dayKey];
            const hasNote = habit.notes && habit.notes[dayKey];
            const dayEl = document.createElement('div');
            dayEl.className = `calendar-day ${status || ''}`;
            dayEl.dataset.dayKey = dayKey;
            dayEl.style.cursor = 'pointer';
            dayEl.title = hasNote ? `${d.getDate()} - ${habit.notes[dayKey]}` : d.getDate();
            dayEl.innerHTML = `${d.getDate()}${hasNote ? '<span class="note-dot">●</span>' : ''}`;
            dayEl.addEventListener('click', () => showNoteEditor(habit.id, dayKey, habit.notes[dayKey] || ''));
            daysContainer.appendChild(dayEl);
        }

        container.appendChild(monthDiv);
    }

    // Update month name to show the pair
    const month1 = monthDate.toLocaleDateString('en-US', { month: 'short' });
    const month2 = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    document.getElementById('calendarMonthName').textContent = `${month1} - ${month2}`;
}

function setupCalendarNavigation() {
    const prevBtn = document.getElementById('calendarPrevBtn');
    const nextBtn = document.getElementById('calendarNextBtn');

    prevBtn.onclick = () => {
        if (currentHabit) {
            calendarCurrentMonth.setMonth(calendarCurrentMonth.getMonth() - 2);
            renderHabitCalendarMonth(currentHabit, calendarCurrentMonth);
        }
    };

    nextBtn.onclick = () => {
        if (currentHabit) {
            calendarCurrentMonth.setMonth(calendarCurrentMonth.getMonth() + 2);
            renderHabitCalendarMonth(currentHabit, calendarCurrentMonth);
        }
    };
}

// Module-level variable for habits weekly chart
let habitsWeeklyChart = null;

function renderHabitsWeeklyChart() {
    const canvas = document.getElementById('habitsWeeklyChart');
    if (!canvas) return;

    const activeHabits = habits.filter(h => !h.archived);
    if (activeHabits.length === 0) return;

    const ctx = canvas.getContext('2d');
    const weeks = 7;
    const weekLabels = [];
    const completionData = [];

    const now = new Date(today);
    for (let w = weeks - 1; w >= 0; w--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - w * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Label each week
        const weekNum = weeks - w;
        weekLabels.push(`W${weekNum}`);

        // Calculate overall completion % across all active habits for this week
        let totalExpected = activeHabits.length * 7; // Each habit for 7 days
        let totalCompleted = 0;

        activeHabits.forEach(habit => {
            for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
                const dayKey = d.toISOString().split('T')[0];
                if (habit.tracking[dayKey] === 'completed') totalCompleted++;
            }
        });

        const percentage = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;
        completionData.push(percentage);
    }

    // Destroy existing chart if any
    if (habitsWeeklyChart) {
        habitsWeeklyChart.destroy();
    }

    // Create new chart
    habitsWeeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekLabels,
            datasets: [{
                label: 'Weekly Completion %',
                data: completionData,
                backgroundColor: 'rgba(74, 222, 128, 0.3)',
                borderColor: 'rgba(74, 222, 128, 0.8)',
                borderWidth: 1,
                borderRadius: 2,
                barThickness: 'flex',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'x',
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        font: { size: 9 },
                        color: 'rgba(255, 255, 255, 0.3)',
                        stepSize: 25
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: { size: 9 },
                        color: 'rgba(255, 255, 255, 0.4)'
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderHabitChart(habit) {
    const canvas = document.getElementById('habitDetailChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const weeks = 12;
    const weekLabels = [];
    const completionData = [];

    const now = new Date(today);
    for (let w = weeks - 1; w >= 0; w--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - w * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Show every other week label for cleaner look
        const weekNum = weeks - w;
        weekLabels.push(weekNum % 2 === 1 ? `W${weekNum}` : '');

        let completed = 0;
        for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
            const dayKey = d.toISOString().split('T')[0];
            if (habit.tracking[dayKey] === 'completed') completed++;
        }
        completionData.push(completed);
    }

    if (habitDetailChart) {
        habitDetailChart.destroy();
    }

    habitDetailChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekLabels,
            datasets: [{
                label: 'Days Completed',
                data: completionData,
                backgroundColor: 'rgba(74, 222, 128, 0.3)',
                borderColor: 'rgba(74, 222, 128, 0.8)',
                borderWidth: 1,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    max: 7,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        font: { size: 6 }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        font: { size: 6 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
