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

    // Store existing streak elements for comparison
    container.querySelectorAll('[data-habit-id]').forEach(el => {
        existingElements[el.dataset.habitId] = el.querySelector('.habit-streak');
    });

    if (habits.length === 0) {
        container.innerHTML = '<div class="empty-state">No habits yet. Click + to add one!</div>';
        return;
    }

    container.innerHTML = '';

    habits.forEach(habit => {
        const habitEl = document.createElement('div');
        habitEl.className = 'habit-item';
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

        habitEl.innerHTML = `
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

    for (let d = new Date(today); d >= sixMonthsAgo; d.setDate(d.getDate() - 1)) {
        const dayKey = d.toISOString().split('T')[0];
        const status = habit.tracking[dayKey];

        if (status === 'completed') {
            completedDays++;
            currentStreak++;
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
        trackedDays
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
            const dayEl = document.createElement('div');
            dayEl.className = `calendar-day ${status || ''}`;
            dayEl.textContent = d.getDate();
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
