let calorieChart = null;
let proteinChart = null;
let taskCompletionChart = null;
let goalCompletionChart = null;
let habitChart = null;
let streakChart = null;
let folderSessionsChart = null;
let workoutFrequencyChart = null;

let prevCalorieChart = null;
let prevProteinChart = null;
let prevTaskCompletionChart = null;
let prevGoalCompletionChart = null;
let prevHabitChart = null;
let prevStreakChart = null;

function openFullscreenAnalytics() {
    const overlay = document.getElementById('fullscreenAnalytics');
    overlay.classList.add('active');
    state.viewState.analyticsActive = true;
    saveState();
    updateFullscreenAnalytics();
    wireUpGoalInputs();
    renderAnalyticsCharts();
    renderWorkoutFolders(); // Refresh folders in analytics view
    renderVault(); // Refresh photo vault
    renderFolderSidebar();
    renderWorkoutFrequencyChart();
}

function closeFullscreenAnalytics() {
    const overlay = document.getElementById('fullscreenAnalytics');
    overlay.classList.remove('active');
    state.viewState.analyticsActive = false;
    saveState();
}

function wireUpGoalInputs() {
    const calInput = document.getElementById('calGoalInput');
    const protInput = document.getElementById('protGoalInput');

    if (calInput) {
        calInput.value = state.nutritionGoals?.calories ?? '';
        calInput.onchange = () => {
            const val = calInput.value ? parseInt(calInput.value) : null;
            if (!state.nutritionGoals) state.nutritionGoals = { calories: null, protein: null };
            state.nutritionGoals.calories = val;
            saveState();
            renderAnalyticsCharts();
        };
    }

    if (protInput) {
        protInput.value = state.nutritionGoals?.protein ?? '';
        protInput.onchange = () => {
            const val = protInput.value ? parseInt(protInput.value) : null;
            if (!state.nutritionGoals) state.nutritionGoals = { calories: null, protein: null };
            state.nutritionGoals.protein = val;
            saveState();
            renderAnalyticsCharts();
        };
    }
}


function updateFullscreenAnalytics() {
    document.getElementById('fullscreenStreak').textContent = document.getElementById('sidebarStreak').textContent;
    document.getElementById('fullscreenAllTime').textContent = document.getElementById('sidebarAllTime').textContent;
    document.getElementById('fullscreenWeekAvg').textContent = document.getElementById('sidebarWeekAvg').textContent;
    document.getElementById('fullscreenAvgCal').textContent = document.getElementById('sidebarAvgCal').textContent;
}

function renderAnalyticsCharts() {
    renderWorkoutHeatmap();

    const ctxCalorie = document.getElementById('calorieChart').getContext('2d');
    const ctxProtein = document.getElementById('proteinChart').getContext('2d');
    const ctxHabit = document.getElementById('habitChart').getContext('2d');
    const ctxStreak = document.getElementById('streakChart').getContext('2d');

    // CALORIE CHART (Last 14 Days)
    const calorieLabels = [];
    const calorieData = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        calorieLabels.push(d.getDate());

        const dayCals = (state.history.caloriesHistory || [])
            .filter(item => item.date === key)
            .reduce((sum, item) => sum + item.calories, 0);
        calorieData.push(dayCals);
    }

    if (calorieChart) calorieChart.destroy();
    calorieChart = new Chart(ctxCalorie, {
        type: 'bar',
        data: {
            labels: calorieLabels,
            datasets: [{
                label: 'Calories',
                data: calorieData,
                backgroundColor: '#d1d5db',
                borderColor: '#d1d5db',
                borderWidth: 1,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: {
                legend: { display: false },
                annotation: {
                    annotations: {}
                }
            }
        }
    });

    // Add goal line if set
    if (state.nutritionGoals?.calories) {
        setTimeout(() => {
            const yScale = calorieChart.scales.y;
            const xScale = calorieChart.scales.x;
            const goalPx = yScale.getPixelForValue(state.nutritionGoals.calories);
            ctxCalorie.strokeStyle = '#f59e0b';
            ctxCalorie.setLineDash([5, 5]);
            ctxCalorie.beginPath();
            ctxCalorie.moveTo(xScale.left, goalPx);
            ctxCalorie.lineTo(xScale.right, goalPx);
            ctxCalorie.stroke();
            ctxCalorie.setLineDash([]);
        }, 50);
    }

    // PROTEIN CHART (Last 14 Days)
    const proteinLabels = [];
    const proteinData = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        proteinLabels.push(d.getDate());

        const dayProt = (state.history.proteinHistory || [])
            .filter(item => item.date === key)
            .reduce((sum, item) => sum + item.protein, 0);
        proteinData.push(dayProt);
    }

    if (proteinChart) proteinChart.destroy();
    proteinChart = new Chart(ctxProtein, {
        type: 'bar',
        data: {
            labels: proteinLabels,
            datasets: [{
                label: 'Protein',
                data: proteinData,
                backgroundColor: '#d1d5db',
                borderColor: '#d1d5db',
                borderWidth: 1,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Add goal line if set
    if (state.nutritionGoals?.protein) {
        setTimeout(() => {
            const yScale = proteinChart.scales.y;
            const xScale = proteinChart.scales.x;
            const goalPx = yScale.getPixelForValue(state.nutritionGoals.protein);
            ctxProtein.strokeStyle = '#f59e0b';
            ctxProtein.setLineDash([5, 5]);
            ctxProtein.beginPath();
            ctxProtein.moveTo(xScale.left, goalPx);
            ctxProtein.lineTo(xScale.right, goalPx);
            ctxProtein.stroke();
            ctxProtein.setLineDash([]);
        }, 50);
    }

    // EXECUTION PRECISION CHART (Goals vs Tasks - 14 Days)
    const executionLabels = [];
    const executionGoalsData = [];
    const executionTasksData = [];
    
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        executionLabels.push(d.getDate());

        // Tasks
        const taskEntry = (state.history.tasksHistory || []).find(h => h.date === key);
        executionTasksData.push(taskEntry?.done ?? 0);

        // Goals
        const goalEntry = (state.history.goalsHistory || []).find(h => h.date === key);
        if (goalEntry) {
            const percent = goalEntry.total > 0 ? (goalEntry.done / goalEntry.total) * 100 : 0;
            executionGoalsData.push(percent);
        } else {
            executionGoalsData.push(0);
        }
    }

    const ctxExec = document.getElementById('executionChart').getContext('2d');
    if (window.executionChartInstance) window.executionChartInstance.destroy();
    window.executionChartInstance = new Chart(ctxExec, {
        type: 'line',
        data: {
            labels: executionLabels,
            datasets: [
                {
                    label: 'Goals %',
                    data: executionGoalsData,
                    borderColor: '#d1d5db',
                    backgroundColor: 'rgba(209, 213, 219, 0.05)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Tasks Count',
                    data: executionTasksData,
                    borderColor: '#ef4444',
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#0f0f0f',
                    pointBorderWidth: 2,
                    borderWidth: 2,
                    yAxisID: 'yTasks'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { display: false } },
                y: { 
                    min: 0, 
                    max: 100, 
                    position: 'left',
                    ticks: { color: 'rgba(209, 213, 219, 0.6)', font: { size: 9 }, callback: v => v + '%' }, 
                    grid: { color: 'rgba(255,255,255,0.05)' } 
                },
                yTasks: {
                    min: 0,
                    suggestedMax: 5,
                    position: 'right',
                    ticks: { color: 'rgba(239, 68, 68, 0.6)', font: { size: 9 } },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { 
                    display: true, 
                    position: 'top', 
                    align: 'end',
                    labels: { color: 'rgba(255,255,255,0.4)', boxWidth: 10, font: { size: 9 } } 
                },
                tooltip: {
                    backgroundColor: '#111',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 4
                }
            }
        }
    });

    // HABIT DATA (Last 14 Days)
    const habitLabels = [];
    const dateKeys = [];
    const dailyCounts = [];
    window._habitDayTotals = {}; // Stash for tooltip

    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        habitLabels.push(d.getDate());
        dateKeys.push(key);

        let completedCount = 0;
        let availableCount = 0;
        habits.forEach(h => {
            if (h.tracking[key] === 'completed') completedCount++;
            if (h.tracking[key] !== 'skipped') availableCount++;
        });
        
        dailyCounts.push(completedCount);
        window._habitDayTotals[key] = { completed: completedCount, available: availableCount };
    }

    if (habitChart) habitChart.destroy();
    habitChart = new Chart(ctxHabit, {
        type: 'bar',
        data: {
            labels: habitLabels,
            datasets: [{
                label: 'Habits Completed',
                data: dailyCounts,
                backgroundColor: '#d1d5db',
                borderColor: '#d1d5db',
                borderWidth: 1,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { display: false } },
                y: { 
                    beginAtZero: true, 
                    ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 }, stepSize: 1 }, 
                    grid: { color: 'rgba(255,255,255,0.05)' } 
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 4,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const date = dateKeys[context.dataIndex];
                            const totals = window._habitDayTotals[date] || { completed: 0, available: 0 };
                            return [`Completed: ${totals.completed}`, `Available: ${totals.available}`];
                        }
                    }
                }
            }
        }
    });


    // STREAK DATA (Current Streaks)
    const streakLabels = habits.map(h => h.name);
    const currentStreaks = habits.map(h => calculateHabitStreak(h));

    function getStreakColor(streak) {
        if (streak === 0) return 'rgba(248, 250, 252, 0.4)';
        if (streak <= 2) return 'rgba(234, 179, 8, 0.8)';
        if (streak <= 5) return 'rgba(34, 197, 94, 0.8)';
        if (streak <= 10) return 'rgba(34, 197, 94, 0.9)';
        return 'rgba(34, 197, 94, 1)';
    }

    if (streakChart) streakChart.destroy();
    streakChart = new Chart(ctxStreak, {
        type: 'bar',
        data: {
            labels: streakLabels,
            datasets: [
                {
                    label: 'Streak',
                    data: currentStreaks,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    borderWidth: 0
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: 'rgba(255,255,255,0.8)', font: { size: 10 } }, grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 4,
                    displayColors: false
                }
            }
        },
        plugins: [{
            id: 'streakLabels',
            afterDraw(chart) {
                const { ctx, scales: { x, y } } = chart;
                ctx.font = 'bold 11px Space Grotesk';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';

                currentStreaks.forEach((streak, index) => {
                    const yPos = y.getPixelForValue(index);
                    const xPos = x.getPixelForValue(streak) + 8;
                    ctx.fillStyle = getStreakColor(streak);
                    ctx.fillText(streak, xPos, yPos);
                });
            }
        }]
    });

    // PREVIOUS PERIOD DATA
    renderPreviousPeriodCharts();
}

function renderPreviousPeriodCharts() {
    // Previous period is 14-28 days ago (for 14D charts) and 6-12 months ago (for 6M charts)

    const ctxPrevCalorie = document.getElementById('prevCalorieChart')?.getContext('2d');
    const ctxPrevProtein = document.getElementById('prevProteinChart')?.getContext('2d');
    const ctxPrevTaskCompletion = document.getElementById('prevTaskCompletionChart')?.getContext('2d');
    const ctxPrevGoalCompletion = document.getElementById('prevGoalCompletionChart')?.getContext('2d');
    const ctxPrevHabit = document.getElementById('prevHabitChart')?.getContext('2d');
    const ctxPrevStreak = document.getElementById('prevStreakChart')?.getContext('2d');

    if (!ctxPrevCalorie) return; // Elements don't exist, skip rendering

    // PREVIOUS CALORIE CHART (28-14 days ago)
    const prevCalLabels = [];
    const prevCalData = [];
    for (let i = 27; i >= 14; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        prevCalLabels.push(d.getDate());

        const dayCals = (state.history.caloriesHistory || [])
            .filter(item => item.date === key)
            .reduce((sum, item) => sum + item.calories, 0);
        prevCalData.push(dayCals);
    }

    if (prevCalorieChart) prevCalorieChart.destroy();
    prevCalorieChart = new Chart(ctxPrevCalorie, {
        type: 'bar',
        data: {
            labels: prevCalLabels,
            datasets: [{
                label: 'Calories',
                data: prevCalData,
                backgroundColor: '#fafaf9',
                borderColor: '#fafaf9',
                borderWidth: 1,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // PREVIOUS PROTEIN CHART (28-14 days ago)
    const prevProtLabels = [];
    const prevProtData = [];
    for (let i = 27; i >= 14; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        prevProtLabels.push(d.getDate());

        const dayProt = (state.history.proteinHistory || [])
            .filter(item => item.date === key)
            .reduce((sum, item) => sum + item.protein, 0);
        prevProtData.push(dayProt);
    }

    if (prevProteinChart) prevProteinChart.destroy();
    prevProteinChart = new Chart(ctxPrevProtein, {
        type: 'bar',
        data: {
            labels: prevProtLabels,
            datasets: [{
                label: 'Protein',
                data: prevProtData,
                backgroundColor: '#4ade80',
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
                y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // PREVIOUS TASK COMPLETION CHART (28-14 days ago)
    const prevTaskLabels = [];
    const prevTaskData = [];
    for (let i = 27; i >= 14; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        prevTaskLabels.push(d.getDate());

        const entry = (state.history.tasksHistory || []).find(h => h.date === key);
        prevTaskData.push(entry?.done ?? 0);
    }

    if (prevTaskCompletionChart) prevTaskCompletionChart.destroy();
    prevTaskCompletionChart = new Chart(ctxPrevTaskCompletion, {
        type: 'bar',
        data: {
            labels: prevTaskLabels,
            datasets: [{
                label: 'Tasks Done',
                data: prevTaskData,
                backgroundColor: '#60a5fa',
                borderColor: '#60a5fa',
                borderWidth: 1,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, stepSize: 1, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // PREVIOUS HABIT CONSISTENCY CHART (28-14 days ago)
    const prevHabitLabels = [];
    const prevHabitDateKeys = [];
    const prevHabitData = [];
    let prevRunningTotal = 0;

    for (let i = 27; i >= 14; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        prevHabitLabels.push(d.getDate());
        prevHabitDateKeys.push(key);

        let completedCount = 0;
        habits.forEach(h => {
            if (h.tracking[key] === 'completed') completedCount++;
        });
        prevRunningTotal += completedCount;
        prevHabitData.push(prevRunningTotal);
    }

    if (prevHabitChart) prevHabitChart.destroy();
    prevHabitChart = new Chart(ctxPrevHabit, {
        type: 'bar',
        data: {
            labels: prevHabitLabels,
            datasets: [{
                label: 'Cumulative Habits',
                data: prevHabitData,
                backgroundColor: '#d1d5db',
                borderColor: '#d1d5db',
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

    // PREVIOUS GOAL COMPLETION CHART (6-12 months ago)
    const prevMonthlyGoals = {};
    const now = new Date();
    for (let m = 11; m >= 6; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const monthKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        prevMonthlyGoals[monthKey] = { total: 0, done: 0 };
    }

    (state.history.goalsHistory || []).forEach(entry => {
        const monthKey = entry.date.substring(0, 7);
        if (prevMonthlyGoals[monthKey]) {
            prevMonthlyGoals[monthKey].total += entry.total;
            prevMonthlyGoals[monthKey].done += entry.done;
        }
    });

    const prevGoalLabels = [];
    const prevGoalData = [];
    Object.keys(prevMonthlyGoals).forEach(k => {
        const [year, month] = k.split('-');
        const d = new Date(year, parseInt(month) - 1);
        prevGoalLabels.push(d.toLocaleDateString('en-US', { month: 'short' }));
        const m = prevMonthlyGoals[k];
        prevGoalData.push(m.total > 0 ? Math.round((m.done / m.total) * 100) : 0);
    });

    if (prevGoalCompletionChart) prevGoalCompletionChart.destroy();
    prevGoalCompletionChart = new Chart(ctxPrevGoalCompletion, {
        type: 'bar',
        data: {
            labels: prevGoalLabels,
            datasets: [{
                label: 'Goals Completed %',
                data: prevGoalData,
                backgroundColor: '#a78bfa',
                borderColor: '#a78bfa',
                borderWidth: 1,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { display: false } },
                y: { min: 0, max: 100, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 }, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // PREVIOUS HABIT STREAKS CHART
    const prevStreakLabels = habits.map(h => h.name);
    const prevCurrentStreaks = habits.map(h => calculateHabitStreakAt(h, 28));

    function getStreakColor(streak) {
        if (streak === 0) return 'rgba(248, 250, 252, 0.4)';
        if (streak <= 2) return 'rgba(234, 179, 8, 0.8)';
        if (streak <= 5) return 'rgba(34, 197, 94, 0.8)';
        if (streak <= 10) return 'rgba(34, 197, 94, 0.9)';
        return 'rgba(34, 197, 94, 1)';
    }

    if (prevStreakChart) prevStreakChart.destroy();
    prevStreakChart = new Chart(ctxPrevStreak, {
        type: 'bar',
        data: {
            labels: prevStreakLabels,
            datasets: [
                {
                    label: 'Streak',
                    data: prevCurrentStreaks,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    borderWidth: 0
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: 'rgba(255,255,255,0.8)', font: { size: 10 } }, grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 4,
                    displayColors: false
                }
            }
        },
        plugins: [{
            id: 'prevStreakLabels',
            afterDraw(chart) {
                const { ctx, scales: { x, y } } = chart;
                ctx.font = 'bold 11px Space Grotesk';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';

                prevCurrentStreaks.forEach((streak, index) => {
                    const yPos = y.getPixelForValue(index);
                    const xPos = x.getPixelForValue(streak) + 8;
                    ctx.fillStyle = getStreakColor(streak);
                    ctx.fillText(streak, xPos, yPos);
                });
            }
        }]
    });
}

function calculateHabitStreakAt(habit, daysAgo) {
    // Calculate streak as of 'daysAgo' days in the past
    let streak = 0;
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - daysAgo);

    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(baseDate);
        checkDate.setDate(checkDate.getDate() - i);
        const dateKey = checkDate.toISOString().split('T')[0];
        const status = habit.tracking[dateKey];

        if (status === 'completed') {
            streak++;
        } else if (status === 'prevented') {
            // Keep streak alive
        } else {
            break;
        }
    }
    return streak;
}

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

    document.getElementById('sidebarProt').textContent = totalProt;
    document.getElementById('sidebarCals').textContent = totalCals;

    const totalTasks = state.tasks.length;
    const doneTasks = state.tasks.filter(t => t.done).length;
    const elTasks = document.getElementById('sidebarTasks');
    const elComplete = document.getElementById('sidebarComplete');
    if (elTasks) elTasks.textContent = totalTasks;
    if (elComplete) elComplete.textContent = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) + '%' : '0%';

    renderSidebarChecklist('sidebarTaskChecklist', state.tasks.map(t => ({ text: t.text, done: t.done })));
    renderSidebarChecklist('sidebarGoalChecklist', state.goals.map(g => ({ text: g.text, done: g.done })));

    const todayDone = state.tasks.filter(t => t.done).length + state.goals.filter(g => g.done).length;
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekKey = weekAgo.toISOString().split('T')[0];
    const weeklyDone =
        (state.history.tasksHistory || []).filter(h => h.date >= weekKey).reduce((s, h) => s + (h.done || 0), 0) +
        (state.history.goalsHistory || []).filter(h => h.date >= weekKey).reduce((s, h) => s + (h.done || 0), 0);
    const taskCountEl = document.getElementById('taskCircleCount');
    const goalCountEl = document.getElementById('goalCircleCount');
    if (taskCountEl) taskCountEl.textContent = todayDone;
    if (goalCountEl) goalCountEl.textContent = weeklyDone;

    const avgMealCal = state.history.caloriesHistory.length > 0
        ? Math.round(state.history.caloriesHistory.reduce((sum, h) => sum + h.calories, 0) / state.history.caloriesHistory.length)
        : 0;

    document.getElementById('sidebarAvgCal').textContent = avgMealCal;
    document.getElementById('sidebarAllTime').textContent = state.history.mealsHistory.length;

    const weekAvg = calculateWeekAverage();
    document.getElementById('sidebarWeekAvg').textContent = weekAvg;

    const habitStreak = habits.length > 0 ? Math.max(...habits.map(h => calculateHabitStreak(h))) : 0;
    document.getElementById('sidebarStreak').textContent = habitStreak;

    snapshotTasks();
    snapshotGoals();
    updateFullscreenAnalytics();
}

function renderWorkoutHeatmap() {
    const container = document.getElementById('workoutHeatmap');
    const monthsContainer = document.getElementById('heatmapMonths');
    if (!container || !monthsContainer) return;
    
    container.innerHTML = '';
    monthsContainer.innerHTML = '';

    const weeks = 12;
    const days = 7;
    const totalDays = weeks * days;

    const workoutData = {};
    Object.entries(workoutFolders).forEach(([folderName, dates]) => {
        dates.forEach(d => {
            if (!workoutData[d]) workoutData[d] = [];
            workoutData[d].push(folderName);
        });
    });

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const daySquares = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let lastMonth = -1;

    for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date(end);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const folderList = workoutData[key] || [];
        
        const square = document.createElement('div');
        square.className = 'heatmap-square';
        square.style.width = '11px';
        square.style.height = '11px';
        square.style.borderRadius = '2px';
        
        const count = folderList.length;
        if (count === 0) {
            square.style.border = '1px solid rgba(255,255,255,0.03)';
            square.style.background = 'rgba(255, 255, 255, 0.02)';
        } else if (count === 1) {
            square.style.background = 'rgba(209, 213, 219, 0.2)';
        } else if (count === 2) {
            square.style.background = 'rgba(209, 213, 219, 0.5)';
        } else {
            square.style.background = '#d1d5db';
            square.style.boxShadow = '0 0 8px rgba(209, 213, 219, 0.3)';
        }

        square.style.cursor = 'pointer';
        square.onclick = () => { if (count > 0) openDailyWorkoutLogs(key); };

        const dStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        square.title = count > 0 ? `${dStr}: ${folderList.join(', ')}` : `${dStr}: No workouts`;
        
        daySquares.push({ el: square, month: d.getMonth() });
    }

    // Wrap into columns (weeks)
    for (let w = 0; w < weeks; w++) {
        const weekCol = document.createElement('div');
        weekCol.style.display = 'flex';
        weekCol.style.flexDirection = 'column';
        weekCol.style.gap = '4px';
        
        let monthToLabel = -1;
        for (let d = 0; d < days; d++) {
            const idx = w * days + d;
            if (daySquares[idx]) {
                weekCol.appendChild(daySquares[idx].el);
                if (d === 0) monthToLabel = daySquares[idx].month;
            }
        }
        
        // Month Label
        const monthLabel = document.createElement('div');
        monthLabel.style.width = '11px';
        monthLabel.style.textAlign = 'left';
        if (monthToLabel !== lastMonth) {
            monthLabel.textContent = monthNames[monthToLabel];
            lastMonth = monthToLabel;
        }
        monthsContainer.appendChild(monthLabel);
        container.appendChild(weekCol);
    }
}

function calculateMaxStreak(habit) {
    let max = 0;
    let current = 0;
    const sortedDates = Object.keys(habit.tracking).sort();
    if (sortedDates.length === 0) return 0;
    
    // We need to iterate chronologically through all days in history
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

function renderFolderSidebar() {
    const statsContainer = document.getElementById('folderSidebarStats');
    const chartCanvas = document.getElementById('folderSessionsChart');
    if (!statsContainer || !chartCanvas) return;

    const folders = Object.entries(workoutFolders);
    const todayKey = new Date().toISOString().split('T')[0];

    statsContainer.innerHTML = '';

    if (folders.length === 0) {
        statsContainer.innerHTML = '<div style="font-size:0.55rem; opacity:0.4;">No folders yet</div>';
        return;
    }

    const folderNames = [];
    const sessionCounts = [];

    folders.forEach(([name, dates]) => {
        folderNames.push(name);
        sessionCounts.push(dates.length);

        const lastDateStr = dates.length > 0 ? dates[0] : null;
        let lastLabel = 'Never';
        if (lastDateStr) {
            const diffDays = Math.floor((new Date(todayKey) - new Date(lastDateStr)) / 86400000);
            lastLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
        }

        const row = document.createElement('div');
        row.className = 'folder-sidebar-row';
        row.innerHTML = `
            <div class="folder-sidebar-name">${escapeHtml(name)}</div>
            <div class="folder-sidebar-meta">
                <span class="folder-sidebar-count">${dates.length}</span>
                <span class="folder-sidebar-last">${lastLabel}</span>
            </div>
        `;
        statsContainer.appendChild(row);
    });

    if (folderSessionsChart) folderSessionsChart.destroy();
    folderSessionsChart = new Chart(chartCanvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: folderNames,
            datasets: [{
                data: sessionCounts,
                backgroundColor: 'rgba(209, 213, 219, 0.15)',
                borderColor: 'rgba(209, 213, 219, 0.6)',
                borderWidth: 1,
                borderRadius: 2
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 }, stepSize: 1 },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 9 } },
                    grid: { display: false }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderWorkoutFrequencyChart() {
    const canvas = document.getElementById('workoutFrequencyChart');
    if (!canvas) return;

    const weeks = 12;
    const labels = [];
    const data = [];

    const end = new Date();
    end.setDate(end.getDate() + (6 - end.getDay()));

    for (let w = weeks - 1; w >= 0; w--) {
        const weekEnd = new Date(end);
        weekEnd.setDate(weekEnd.getDate() - w * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);

        const weekEndKey = weekEnd.toISOString().split('T')[0];
        const weekStartKey = weekStart.toISOString().split('T')[0];

        labels.push(weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

        const workoutDays = new Set();
        Object.values(workoutFolders).forEach(dates => {
            dates.forEach(d => {
                if (d >= weekStartKey && d <= weekEndKey) workoutDays.add(d);
            });
        });
        data.push(workoutDays.size);
    }

    if (workoutFrequencyChart) workoutFrequencyChart.destroy();
    workoutFrequencyChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Active Days',
                data,
                backgroundColor: data.map(v => v >= 4 ? 'rgba(34, 197, 94, 0.7)' : v >= 2 ? 'rgba(209, 213, 219, 0.5)' : 'rgba(209, 213, 219, 0.2)'),
                borderColor: data.map(v => v >= 4 ? 'rgba(34, 197, 94, 0.9)' : 'rgba(209, 213, 219, 0.4)'),
                borderWidth: 1,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { display: false } },
                y: {
                    beginAtZero: true,
                    max: 7,
                    ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 }, stepSize: 1 },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 4,
                    displayColors: false,
                    callbacks: { label: ctx => `${ctx.raw} active day${ctx.raw !== 1 ? 's' : ''}` }
                }
            }
        }
    });
}
