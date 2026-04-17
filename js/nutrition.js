function parseMacros(text) {
    let calories = null;
    let protein = null;
    let name = text;

    const calMatch = name.match(/(\d+)\s*(?:kcal|cal|c)\b/i);
    if (calMatch) {
        calories = parseInt(calMatch[1]);
        name = name.replace(calMatch[0], '');
    }

    const protMatch = name.match(/(\d+)\s*p\b/i);
    if (protMatch) {
        protein = parseInt(protMatch[1]);
        name = name.replace(protMatch[0], '');
    }

    name = name.replace(/\s+/g, ' ').trim();
    return { name, calories, protein };
}

function addMeal() {
    const raw = document.getElementById('foodInput').value;
    if (!raw.trim()) return;

    const { name, calories, protein } = parseMacros(raw);

    state.meals.push({
        id: Date.now(),
        name: name || raw.trim(),
        calories,
        protein,
        date: getTodayKey()
    });

    if (calories) {
        state.history.caloriesHistory.push({
            date: getTodayKey(),
            calories
        });
    }

    if (protein) {
        if (!state.history.proteinHistory) state.history.proteinHistory = [];
        state.history.proteinHistory.push({
            date: getTodayKey(),
            protein
        });
    }

    state.history.mealsHistory.push(name || raw.trim());
    saveState();
    document.getElementById('foodInput').value = '';
    render();
    updateSidebars();
}


function deleteMeal(id) {
    const meal = state.meals.find(m => m.id === id);
    if (meal) undoStack.push({ type: 'meal', data: meal });
    state.meals = state.meals.filter(m => m.id !== id);
    saveState();
    render();
    updateSidebars();
}



function renderMeals() {
    const container = document.getElementById('mealsList');

    // Calculate totals
    let totalCals = 0;
    let totalProt = 0;
    state.meals.forEach(m => {
        totalCals += m.calories || 0;
        totalProt += m.protein || 0;
    });

    const calsEl = document.getElementById('inlineTotalCals');
    const protEl = document.getElementById('inlineTotalProt');
    if (calsEl) calsEl.textContent = totalCals;
    if (protEl) protEl.textContent = totalProt;

    container.innerHTML = '';

    if (state.meals.length === 0) {
        container.innerHTML = '<div class="empty-na">n/a</div>';
        return;
    }

    state.meals.forEach((meal, index) => {
        const item = document.createElement('div');
        item.className = 'meal-item';

        item.dataset.index = index;
        item.dataset.type = 'meal';
        const calText = meal.calories ? `${meal.calories} cal` : 'N/A';
        const protText = meal.protein ? ` • ${meal.protein}g` : '';
        item.innerHTML = `
            <div class="meal-info">
                <span class="meal-name">${escapeHtml(meal.name)}</span>
            </div>
            <span class="meal-cal">${calText}${protText}</span>
            <button class="meal-delete" onclick="deleteMeal(${meal.id})">×</button>
        `;
        container.appendChild(item);
    });
}

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedItem === this || !draggedItem) return false;

    const draggedType = draggedItem.dataset.type;
    const dropType = this.dataset.type;

    if (draggedType !== dropType) return false;

    const draggedIndex = parseInt(draggedItem.dataset.index);
    const dropIndex = parseInt(this.dataset.index);

    if (draggedType === 'meal') {
        const temp = state.meals[draggedIndex];
        state.meals[draggedIndex] = state.meals[dropIndex];
        state.meals[dropIndex] = temp;
        saveState();
        renderMeals();
    }

    return false;
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
}
