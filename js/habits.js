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
    if (streak === 0) return 'rgba(248, 250, 252, 0.25)';
    if (streak <= 2) return 'rgba(255, 200, 60, 0.7)';
    if (streak <= 5) return 'rgba(255, 160, 40, 0.85)';
    if (streak <= 10) return 'rgba(255, 120, 30, 0.9)';
    if (streak <= 21) return 'rgba(255, 80, 50, 1)';
    if (streak <= 45) return 'rgba(200, 60, 255, 1)';
    if (streak <= 90) return 'rgba(80, 180, 255, 1)';
    return 'rgba(255, 240, 100, 1)';
}

function getStreakIcon(streak) {
    if (streak === 0) return '';
    if (streak <= 2) return '·';
    if (streak <= 5) return '⚡';
    if (streak <= 10) return '🔥';
    if (streak <= 21) return '🔥';
    if (streak <= 45) return '💎';
    if (streak <= 90) return '⭐';
    return '👑';
}

function getStreakTier(streak) {
    if (streak === 0) return '';
    if (streak <= 2) return 'streak-warm';
    if (streak <= 10) return 'streak-fire';
    if (streak <= 21) return 'streak-blaze';
    if (streak <= 45) return 'streak-diamond';
    if (streak <= 90) return 'streak-star';
    return 'streak-legend';
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
        container.innerHTML = '<div class="empty-na">n/a</div>';
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

        const todayKey = (new Date(today)).toISOString().split('T')[0];
        const isHandledToday = !!habit.tracking[todayKey];
        const blinkClass = !isHandledToday ? ' blink-red' : '';

        habitEl.innerHTML = `
            <div class="habit-controls">${deleteModeBtns}</div>
            <div class="habit-name-row">
                <div class="habit-name${blinkClass}" onclick="if(isHabitDeleteMode) deleteHabit(${habit.id}); else openHabitDetail(${habit.id})">${habit.name}</div>
                <span class="habit-streak ${getStreakTier(streak)}" style="color:${streakColor}">${getStreakIcon(streak)}${streak > 0 ? streak : ''}</span>
            </div>
            <div class="habit-bottom-row">
                ${trackingHTML}
            </div>
        `;

        container.appendChild(habitEl);

        // Check if streak increased and add animation
        const oldElement = existingElements[habit.id];
        if (oldElement) {
            const oldStreak = parseInt(oldElement.textContent);
            if (streak > oldStreak) {
                const streakEl = habitEl.querySelector('.habit-streak');
                if (streakEl) {
                    streakEl.classList.add('streak-up');
                    setTimeout(() => streakEl.classList.remove('streak-up'), 600);
                }
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

    if (isHabitDeleteMode) {
        setupHabitReorder(container);
    }

    // Remove previous archived section
    const oldArchived = container.parentElement.querySelector('.habits-archived-section');
    if (oldArchived) oldArchived.remove();

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
    renderHabitsUnifiedChart();
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
let habitDraggedEl = null;
let habitDraggedGlobalIndex = null;

function setupHabitReorder(container) {
    container.querySelectorAll('.habit-drag-handle').forEach(handle => {
        handle.addEventListener('mousedown', habitReorderStart);
        handle.addEventListener('touchstart', habitReorderStart, { passive: false });
    });
}

function habitReorderStart(e) {
    e.preventDefault();
    e.stopPropagation();

    const item = this.closest('.habit-item');
    if (!item) return;

    habitDraggedEl = item;
    habitDraggedGlobalIndex = parseInt(this.dataset.habitIndex);
    item.classList.add('dragging');

    const moveHandler = (ev) => {
        ev.preventDefault();
        const y = ev.type.startsWith('touch') ? ev.touches[0].clientY : ev.clientY;
        const container = document.getElementById('habitsList');
        const items = [...container.querySelectorAll('.habit-item:not(.dragging)')];

        let insertBefore = null;
        for (const el of items) {
            const rect = el.getBoundingClientRect();
            if (y < rect.top + rect.height / 2) {
                insertBefore = el;
                break;
            }
        }

        if (insertBefore) {
            container.insertBefore(habitDraggedEl, insertBefore);
        } else if (items.length > 0) {
            container.appendChild(habitDraggedEl);
        }
    };

    const upHandler = () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('touchend', upHandler);

        if (!habitDraggedEl) return;
        habitDraggedEl.classList.remove('dragging');

        const container = document.getElementById('habitsList');
        const newOrder = [...container.querySelectorAll('.habit-item')].map(el => parseInt(el.dataset.habitId));

        const activeHabits = habits.filter(h => !h.archived);
        const archivedHabits = habits.filter(h => h.archived);
        const reordered = newOrder.map(id => activeHabits.find(h => h.id === id)).filter(Boolean);
        habits = [...reordered, ...archivedHabits];

        saveHabits();
        renderHabits();

        habitDraggedEl = null;
        habitDraggedGlobalIndex = null;
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', upHandler);
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
let currentHabit = null; // restore currentHabit
let calendarCurrentMonth = null;

function openHabitDetail(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    currentHabit = habit;
    calendarCurrentMonth = new Date(today);

    document.querySelector('.habits-view').style.display = 'none';
    document.querySelector('.habit-detail-view').classList.add('active');

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
    document.querySelector('.habits-view').style.display = '';
    document.querySelector('.habit-detail-view').classList.remove('active');
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
            // Keep streak alive, matching calculateHabitStreak behavior
        } else {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 0;
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

// Module-level variables for habits charts
let habitsUnifiedChart = null;

function calculateLongestStreak(habit) {
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let longest = 0;
    let current = 0;

    for (let d = new Date(today); d >= sixMonthsAgo; d.setDate(d.getDate() - 1)) {
        const dayKey = d.toISOString().split('T')[0];
        const status = habit.tracking[dayKey];

        if (status === 'completed') {
            current++;
        } else if (status === 'prevented') {
            // rest day — don't break streak
        } else {
            longest = Math.max(longest, current);
            current = 0;
        }
    }
    return Math.max(longest, current);
}

function renderHabitsUnifiedChart() {
    const canvas = document.getElementById('habitsUnifiedChart');
    if (!canvas) return;

    const activeHabits = habits.filter(h => !h.archived);
    if (activeHabits.length === 0) return;

    const container = canvas.parentElement;
    container.style.height = '300px';

    const labels = activeHabits.map(h => h.name);
    const currentStreaks = activeHabits.map(h => calculateHabitStreak(h));
    const longestStreaks = activeHabits.map(h => calculateLongestStreak(h));

    if (habitsUnifiedChart) {
        habitsUnifiedChart.destroy();
    }

    const ctx = canvas.getContext('2d');

    habitsUnifiedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Longest',
                    data: longestStreaks,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    borderRadius: 2,
                    barPercentage: 0.95,
                    categoryPercentage: 0.5
                },
                {
                    label: 'Current',
                    data: currentStreaks,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1,
                    borderRadius: 2,
                    barPercentage: 0.95,
                    categoryPercentage: 0.5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.4)',
                        font: { size: 8, family: 'inherit' },
                        boxWidth: 8,
                        boxHeight: 8,
                        padding: 8
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} days`
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.2)',
                        font: { size: 8 },
                        stepSize: 10
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        font: { size: 7, family: 'inherit' },
                        maxRotation: 45,
                        minRotation: 0
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
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderColor: 'rgba(255, 255, 255, 0.4)',
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
