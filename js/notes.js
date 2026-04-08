// ── NOTES MANAGEMENT ──────────────────────────────
const notesKey = 'axisDailyNotes';
let notes = loadNotes();

function loadNotes() {
    const saved = localStorage.getItem(notesKey);
    return saved ? JSON.parse(saved) : {};
}

function saveNotes() {
    localStorage.setItem(notesKey, JSON.stringify(notes));
}

function getTodayNoteKey() {
    return today.toISOString().split('T')[0];
}

function renderNotes() {
    // Load today's note into the input
    const dailyInput = document.getElementById('dailyNoteInput');
    if (dailyInput) {
        dailyInput.value = notes[getTodayNoteKey()]?.content || '';
    }
}

function initNotesEventListeners() {
    // Auto-save daily note on input
    const dailyInput = document.getElementById('dailyNoteInput');
    if (dailyInput) {
        dailyInput.addEventListener('change', () => {
            const content = dailyInput.value;
            notes[getTodayNoteKey()] = { content };
            saveNotes();
        });
    }
}
