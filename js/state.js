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
            photosHistory: []
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
