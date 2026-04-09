let nutritionChart = null;
let habitChart = null;
let goalChart = null;
let scatterChart = null;

function openFullscreenAnalytics() {
    const overlay = document.getElementById('fullscreenAnalytics');
    overlay.classList.add('active');
    updateFullscreenAnalytics();
    renderAnalyticsCharts();
    renderWorkoutFolders(); // Refresh folders in analytics view
    renderVault(); // Refresh photo vault
}

function closeFullscreenAnalytics() {
    const overlay = document.getElementById('fullscreenAnalytics');
    overlay.classList.remove('active');
}

function updateFullscreenAnalytics() {
    document.getElementById('fullscreenStreak').textContent = document.getElementById('sidebarStreak').textContent;
    document.getElementById('fullscreenAllTime').textContent = document.getElementById('sidebarAllTime').textContent;
    document.getElementById('fullscreenWeekAvg').textContent = document.getElementById('sidebarWeekAvg').textContent;
    document.getElementById('fullscreenAvgCal').textContent = document.getElementById('sidebarAvgCal').textContent;
}

function renderAnalyticsCharts() {
    const ctxNutrition = document.getElementById('nutritionChart').getContext('2d');
    const ctxHabit = document.getElementById('habitChart').getContext('2d');
    const ctxGoal = document.getElementById('goalChart').getContext('2d');
    const ctxScatter = document.getElementById('nutritionScatterChart').getContext('2d');

    renderWorkoutHeatmap();

    // NUTRITION DATA (Last 7 Days)
    const nutritionLabels = [];
    const calorieData = [];
    const proteinData = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        nutritionLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const dayCals = (state.history.caloriesHistory || [])
            .filter(item => item.date === key)
            .reduce((sum, item) => sum + item.calories, 0);
        calorieData.push(dayCals);

        const dayProt = (state.history.proteinHistory || [])
            .filter(item => item.date === key)
            .reduce((sum, item) => sum + item.protein, 0);
        proteinData.push(dayProt);
    }

    if (nutritionChart) nutritionChart.destroy();
    nutritionChart = new Chart(ctxNutrition, {
        type: 'line',
        data: {
            labels: nutritionLabels,
            datasets: [
                {
                    label: 'Calories',
                    data: calorieData,
                    borderColor: '#fafaf9',
                    borderWidth: 1.5,
                    pointRadius: 2,
                    backgroundColor: 'rgba(250, 250, 249, 0.05)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Protein',
                    data: proteinData,
                    borderColor: '#4ade80',
                    borderWidth: 1.5,
                    pointRadius: 2,
                    backgroundColor: 'rgba(74, 222, 128, 0.05)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { display: false } },
                y: { type: 'linear', display: true, position: 'left', ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y1: { type: 'linear', display: true, position: 'right', ticks: { color: '#4ade80', font: { size: 9 } }, grid: { drawOnChartArea: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // HABIT DATA (Last 14 Days)
    const habitLabels = [];
    const completionData = [];

    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        habitLabels.push(d.getDate());

        let completedCount = 0;
        habits.forEach(h => {
            if (h.tracking[key] === 'completed') completedCount++;
        });
        completionData.push(completedCount);
    }

    if (habitChart) habitChart.destroy();
    habitChart = new Chart(ctxHabit, {
        type: 'bar',
        data: {
            labels: habitLabels,
            datasets: [{
                label: 'Habits Done',
                data: completionData,
                backgroundColor: 'rgba(74, 222, 128, 0.3)',
                borderColor: '#4ade80',
                borderWidth: 1,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // GOAL DATA (Last 30 Days)
    const goalLabels = [];
    const goalProgressData = [];
    
    // Ensure history exists
    if (!state.history.goalsHistory) state.history.goalsHistory = [];
    
    // Fill with mock data if empty to show "Over Time" immediately
    if (state.history.goalsHistory.length === 0) {
        for (let i = 30; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            state.history.goalsHistory.push({
                date: dateStr,
                total: 5,
                done: Math.floor(Math.random() * 6)
            });
        }
        saveState();
    }

    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        goalLabels.push(i % 5 === 0 ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');
        
        const entry = state.history.goalsHistory.find(h => h.date === key);
        if (entry) {
            const percent = entry.total > 0 ? (entry.done / entry.total) * 100 : 0;
            goalProgressData.push(percent);
        } else {
            goalProgressData.push(0);
        }
    }

    if (goalChart) goalChart.destroy();
    goalChart = new Chart(ctxGoal, {
        type: 'line',
        data: {
            labels: goalLabels,
            datasets: [{
                label: 'Goal Completion %',
                data: goalProgressData,
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 8 } }, grid: { display: false } },
                y: { min: 0, max: 100, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 }, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // NUTRITION SCATTER (All meals in history)
    const scatterData = (state.history.caloriesHistory || []).map((h, i) => {
        const p = state.history.proteinHistory[i];
        return { x: h.calories, y: p ? p.protein : 0 };
    }).filter(d => d.x > 0 || d.y > 0);

    if (scatterChart) scatterChart.destroy();
    scatterChart = new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Correlation',
                data: scatterData,
                backgroundColor: '#4ade80',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'kcal', color: 'rgba(255,255,255,0.4)', font: { size: 10 } }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { title: { display: true, text: 'Protein (g)', color: 'rgba(255,255,255,0.4)', font: { size: 10 } }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}



function updateSidebars() {
    const totalCals = state.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalProt = state.meals.reduce((sum, m) => sum + (m.protein || 0), 0);

    document.getElementById('sidebarProt').textContent = totalProt;
    document.getElementById('sidebarCals').textContent = totalCals;

    const totalTasks = state.tasks.length;
    const doneTasks = state.tasks.filter(t => t.done).length;
    document.getElementById('sidebarTasks').textContent = totalTasks;
    document.getElementById('sidebarComplete').textContent = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) + '%' : '0%';

    const avgMealCal = state.history.caloriesHistory.length > 0
        ? Math.round(state.history.caloriesHistory.reduce((sum, h) => sum + h.calories, 0) / state.history.caloriesHistory.length)
        : 0;

    document.getElementById('sidebarAvgCal').textContent = avgMealCal;
    document.getElementById('sidebarAllTime').textContent = state.history.mealsHistory.length;

    const weekAvg = calculateWeekAverage();
    document.getElementById('sidebarWeekAvg').textContent = weekAvg;

    const habitStreak = habits.length > 0 ? Math.max(...habits.map(h => calculateHabitStreak(h))) : 0;
    document.getElementById('sidebarStreak').textContent = habitStreak;

    snapshotGoals();
    updateFullscreenAnalytics();
}

function renderWorkoutHeatmap() {
    const container = document.getElementById('workoutHeatmap');
    if (!container) return;
    container.innerHTML = '';

    const weeks = 12;
    const days = 7;
    const totalDays = weeks * days;

    // Aggregate data
    const workoutData = {};
    Object.entries(workoutFolders).forEach(([folderName, dates]) => {
        dates.forEach(d => {
            if (!workoutData[d]) workoutData[d] = [];
            workoutData[d].push(folderName);
        });
    });

    const now = new Date();
    // Move to next Saturday to align the grid
    const end = new Date(now);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const daySquares = [];

    for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date(end);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const folderList = workoutData[key] || [];
        
        const square = document.createElement('div');
        square.className = 'heatmap-square';
        square.style.width = '12px';
        square.style.height = '12px';
        square.style.borderRadius = '2px';
        
        const count = folderList.length;
        if (count === 0) {
            square.style.background = 'rgba(255, 255, 255, 0.05)';
        } else if (count === 1) {
            square.style.background = 'rgba(74, 180, 100, 0.4)'; // Subdued green
        } else if (count === 2) {
            square.style.background = 'rgba(74, 222, 128, 0.7)'; // Bright green
        } else {
            square.style.background = '#4ade80'; // Neon green for 3+
            square.style.boxShadow = '0 0 8px rgba(74, 222, 128, 0.4)';
        }

        square.style.cursor = 'pointer';
        square.onclick = () => {
            if (count > 0) openDailyWorkoutLogs(key);
        };

        const dStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const tooltip = count > 0 ? `${dStr}: ${folderList.join(', ')}` : `${dStr}: No workouts`;
        square.title = tooltip;
        square.dataset.date = tooltip;

        daySquares.push(square);
    }

    // Wrap into columns (weeks)
    for (let w = 0; w < weeks; w++) {
        const weekCol = document.createElement('div');
        weekCol.style.display = 'flex';
        weekCol.style.flexDirection = 'column';
        weekCol.style.gap = '4px';
        
        for (let d = 0; d < days; d++) {
            const idx = w * days + d;
            if (daySquares[idx]) {
                weekCol.appendChild(daySquares[idx]);
            }
        }
        container.appendChild(weekCol);
    }
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
