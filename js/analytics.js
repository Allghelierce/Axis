let nutritionChart = null;
let habitChart = null;

function openFullscreenAnalytics() {
    const overlay = document.getElementById('fullscreenAnalytics');
    overlay.classList.add('active');
    updateFullscreenAnalytics();
    renderAnalyticsCharts();
    renderWorkoutFolders(); // Refresh folders in analytics view
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

    updateFullscreenAnalytics();
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
