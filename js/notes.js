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

function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function renderNotes() {
    const key = getTodayNoteKey();
    const note = notes[key];
    const dailyInput = document.getElementById('dailyNoteInput');
    const display = document.getElementById('dailyNoteDisplay');
    const noteText = document.getElementById('dailyNoteText');
    const dateEl = document.getElementById('dailyNoteDate');

    if (dateEl) {
        dateEl.textContent = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }

    if (!dailyInput || !display || !noteText) return;

    if (note?.submitted && note?.content) {
        noteText.textContent = note.content;
        display.style.display = '';
        dailyInput.value = '';
        dailyInput.placeholder = 'Add another daily note...';
    } else {
        dailyInput.value = note?.content || '';
        dailyInput.placeholder = 'Write your daily note...';
        display.style.display = 'none';
    }
    autoGrow(dailyInput);
}

function initNotesEventListeners() {
    const dailyInput = document.getElementById('dailyNoteInput');
    if (dailyInput) {
        dailyInput.addEventListener('input', () => {
            autoGrow(dailyInput);
            const key = getTodayNoteKey();
            notes[key] = { ...(notes[key] || {}), content: dailyInput.value, submitted: false };
            saveNotes();
        });
    }

    const submitBtn = document.getElementById('submitDailyNote');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const key = getTodayNoteKey();
            const content = dailyInput.value.trim();
            if (!content) return;
            notes[key] = { content, submitted: true };
            saveNotes();
            renderNotes();
        });
    }

    const editBtn = document.getElementById('editDailyNote');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const key = getTodayNoteKey();
            const content = notes[key]?.content || '';
            if (notes[key]) notes[key].submitted = false;
            saveNotes();
            const dailyInput = document.getElementById('dailyNoteInput');
            if (dailyInput) {
                dailyInput.value = content;
                autoGrow(dailyInput);
            }
            document.getElementById('dailyNoteDisplay').style.display = 'none';
        });
    }
}
