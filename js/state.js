const today = new Date();
const storageKey = 'dashboardData';
const workoutKey = 'workoutFolders';
const habitsKey = 'habits';
const workoutNotesHistoryKey = 'workoutNotesHistory';

let state = loadState();
let workoutFolders = loadWorkoutFolders();
let habits = loadHabits();
let undoStack = [];
let isHabitDeleteMode = false;

function getTodayKey() {
    return today.toISOString().split('T')[0];
}

function loadState() {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        const data = JSON.parse(saved);
        if (data.lastDate !== getTodayKey()) {
            // Snapshot task completion before wiping
            if (!data.history.tasksHistory) data.history.tasksHistory = [];
            const exists = data.history.tasksHistory.find(e => e.date === data.lastDate);
            if (!exists && data.tasks?.length > 0) {
                data.history.tasksHistory.push({
                    date: data.lastDate,
                    total: data.tasks.length,
                    done: data.tasks.filter(t => t.done).length
                });
            }

            data.meals = [];
            data.photos = [];
            data.movementNotes = '';
            data.splitInput = '';
            data.tasks = [];
            data.goals = [];
            data.lastDate = getTodayKey();
        }
        if (!data.tasks) data.tasks = [];
        if (!data.goals) data.goals = [];
        if (!data.history.tasksHistory) data.history.tasksHistory = [];
        if (!data.nutritionGoals) data.nutritionGoals = { calories: null, protein: null };
        if (!data.viewState) data.viewState = { analyticsActive: false };
        return data;
    }
    return {
        lastDate: getTodayKey(),
        meals: [],
        photos: [],
        movementNotes: '',
        splitInput: '',
        tasks: [],
        goals: [],
        history: {
            mealsHistory: [],
            caloriesHistory: [],
            proteinHistory: [],
            goalsHistory: [],
            tasksHistory: [],
            photosHistory: []
        },
        nutritionGoals: {
            calories: null,
            protein: null
        },
        viewState: {
            analyticsActive: false
        }
    };
}

function loadWorkoutFolders() {
    const saved = localStorage.getItem(workoutKey);
    const defaults = { 'Push': [], 'Pull': [], 'Legs': [], 'Upper': [], 'Lower': [], 'Misc': [], 'Cardio': [], 'Other': [] };
    if (!saved) return defaults;
    return JSON.parse(saved);
}

function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
}

function saveWorkoutFolders() {
    localStorage.setItem(workoutKey, JSON.stringify(workoutFolders));
}

function loadHabits() {
    const saved = localStorage.getItem(habitsKey);
    if (saved) return JSON.parse(saved);
    return [];
}

function saveHabits() {
    localStorage.setItem(habitsKey, JSON.stringify(habits));
}

let workoutNotesHistory = loadWorkoutNotesHistory();

function loadWorkoutNotesHistory() {
    const saved = localStorage.getItem(workoutNotesHistoryKey);
    return saved ? JSON.parse(saved) : {};
}

function saveWorkoutNotesHistory() {
    localStorage.setItem(workoutNotesHistoryKey, JSON.stringify(workoutNotesHistory));
}
