function openDataSummary(period) {
    const overlay = document.getElementById('summaryOverlay');
    const title = document.getElementById('summaryTitle');
    const content = document.getElementById('summaryContent');
    
    overlay.style.display = 'flex';
    
    if (period === 'today') {
        title.textContent = 'Data Snapshot: Today';
        renderTodaySummary(content);
    } else {
        title.textContent = 'Data Snapshot: This Week';
        renderWeeklySummary(content);
    }
}

function closeDataSummary() {
    document.getElementById('summaryOverlay').style.display = 'none';
}

function renderTodaySummary(container) {
    const todayStr = getTodayKey();
    const tasks = state.tasks.filter(t => t.date === todayStr);
    const meals = state.meals.filter(m => m.date === todayStr);
    const notes = state.dailyNotes?.[todayStr] || '';
    
    let cals = 0, prot = 0;
    meals.forEach(m => { cals += (m.calories || 0); prot += (m.protein || 0); });

    let html = `
        <div class="summary-section">
            <div class="summary-section-title">Performance Metrics</div>
            <div class="summary-item">
                <span class="summary-item-label">Execution Score</span>
                <span>${tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%</span>
            </div>
            <div class="summary-item">
                <span class="summary-item-label">Nutrition Intake</span>
                <span>${cals} kcal / ${prot}g P</span>
            </div>
        </div>
    `;

    if (tasks.length > 0) {
        html += `
            <div class="summary-section">
                <div class="summary-section-title">Daily Operations</div>
                ${tasks.map(t => `<div class="summary-list-item" style="${t.completed ? '' : 'opacity: 0.4'}">${t.completed ? '✓' : '○'} ${t.name}</div>`).join('')}
            </div>
        `;
    }

    if (meals.length > 0) {
        html += `
            <div class="summary-section">
                <div class="summary-section-title">Nutrition Logs</div>
                ${meals.map(m => `<div class="summary-list-item">${m.name} (${m.calories || 0} kcal)</div>`).join('')}
            </div>
        `;
    }

    if (notes) {
        html += `
            <div class="summary-section">
                <div class="summary-section-title">Notes & Reflections</div>
                <div style="font-style: italic; opacity: 0.7; padding-left: 1rem; border-left: 1px solid rgba(255,255,255,0.1);">${notes}</div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderWeeklySummary(container) {
    const now = new Date(today);
    let html = '';

    // Aggregate summary for last 7 days
    let totalCals = 0, totalProt = 0, totalTasks = 0, completedTasks = 0;
    const activeHabits = habits.filter(h => !h.archived);
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        
        state.tasks.filter(t => t.date === dayKey).forEach(t => {
            totalTasks++;
            if (t.completed) completedTasks++;
        });
        
        state.meals.filter(m => m.date === dayKey).forEach(m => {
            totalCals += (m.calories || 0);
            totalProt += (m.protein || 0);
        });
    }

    const avgCals = Math.round(totalCals / 7);
    const avgProt = Math.round(totalProt / 7);
    const execution = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    html += `
        <div class="summary-section">
            <div class="summary-section-title">Weekly Aggregate</div>
            <div class="summary-item">
                <span class="summary-item-label">Avg Daily Calories</span>
                <span>${avgCals} kcal</span>
            </div>
            <div class="summary-item">
                <span class="summary-item-label">Avg Daily Protein</span>
                <span>${avgProt} g</span>
            </div>
            <div class="summary-item">
                <span class="summary-item-label">Execution Precision</span>
                <span>${execution}%</span>
            </div>
        </div>
    `;

    if (activeHabits.length > 0) {
        html += `
            <div class="summary-section">
                <div class="summary-section-title">Habit Consistency</div>
                ${activeHabits.map(h => {
                    let completed = 0;
                    for (let i = 0; i < 7; i++) {
                        const d = new Date(now); d.setDate(d.getDate() - i);
                        const dayKey = d.toISOString().split('T')[0];
                        if (h.tracking[dayKey] === 'completed') completed++;
                    }
                    return `<div class="summary-item"><span class="summary-item-label">${h.name}</span><span>${completed}/7</span></div>`;
                }).join('')}
            </div>
        `;
    }

    container.innerHTML = html;
}
