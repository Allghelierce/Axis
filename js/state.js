const today = new Date();
const storageKey = 'dashboardData';
const workoutKey = 'workoutFolders';
const habitsKey = 'habits';
const workoutNotesHistoryKey = 'workoutNotesHistory';
const dailyLogsKey = 'axisDailyLogs';

let state = loadState();
let workoutFolders = loadWorkoutFolders();
let habits = loadHabits();
let dailyLogs = loadDailyLogs();
let undoStack = [];
let isHabitDeleteMode = false;

function getTodayKey() {
    return today.toISOString().split('T')[0];
}

function loadState() {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        const data = JSON.parse(saved);
        if (!data.history) data.history = { mealsHistory: [], caloriesHistory: [], proteinHistory: [], goalsHistory: [], tasksHistory: [], photosHistory: [] };
        if (data.lastDate !== getTodayKey()) {
            try { archiveDailyLog(data); } catch (e) { console.error('archiveDailyLog failed:', e); }

            data.meals = [];
            data.photos = [];
            data.movementNotes = '';
            data.movementNotesSubmitted = false;
            data.splitInput = '';
            data.tasks = [];
            data.lastDate = getTodayKey();
        }
        if (!data.tasks) data.tasks = [];
        if (!data.goals) data.goals = [];
        if (!data.history.tasksHistory) data.history.tasksHistory = [];
        if (!data.history.caloriesHistory) data.history.caloriesHistory = [];
        if (!data.history.proteinHistory) data.history.proteinHistory = [];
        if (!data.history.goalsHistory) data.history.goalsHistory = [];
        if (!data.history.mealsHistory) data.history.mealsHistory = [];
        if (!data.history.photosHistory) data.history.photosHistory = [];
        if (!data.nutritionGoals) data.nutritionGoals = { calories: null, protein: null };
        if (!data.viewState) data.viewState = {};
        if (data.movementNotesSubmitted === undefined) data.movementNotesSubmitted = false;
        return data;
    }
    return {
        lastDate: getTodayKey(),
        meals: [],
        photos: [],
        movementNotes: '',
        movementNotesSubmitted: false,
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
        viewState: {}
    };
}

function loadWorkoutFolders() {
    const saved = localStorage.getItem(workoutKey);
    const defaults = { 'N/A': [], 'Push': [], 'Pull': [], 'Legs': [], 'Upper': [], 'Lower': [], 'Misc': [], 'Cardio': [], 'Other': [] };
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

function loadDailyLogs() {
    const saved = localStorage.getItem(dailyLogsKey);
    return saved ? JSON.parse(saved) : [];
}

function saveDailyLogs() {
    localStorage.setItem(dailyLogsKey, JSON.stringify(dailyLogs));
}

function archiveDailyLog(data) {
    const logs = loadDailyLogs();
    const date = data.lastDate;
    if (!date || logs.some(l => l.date === date)) return;

    const savedNotes = localStorage.getItem('axisDailyNotes');
    const allNotes = savedNotes ? JSON.parse(savedNotes) : {};
    const savedHabits = localStorage.getItem(habitsKey);
    const habitSnap = savedHabits ? JSON.parse(savedHabits) : [];

    logs.push({
        date,
        tasks: (data.tasks || []).map(t => ({ text: t.text, done: t.done })),
        goals: (data.goals || []).map(g => ({ text: g.text, done: g.done, dueDate: g.dueDate })),
        meals: (data.meals || []).map(m => ({ name: m.name, calories: m.calories, protein: m.protein })),
        movementNotes: data.movementNotes || '',
        dailyNote: allNotes[date]?.content || '',
        habits: habitSnap.map(h => ({ name: h.name, status: h.tracking[date] || null })),
        workoutNotes: (loadWorkoutNotesHistory())[date] || ''
    });

    logs.sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(dailyLogsKey, JSON.stringify(logs));
    dailyLogs = logs;
}
