// Settings Modal Management

function openSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function closeSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Close settings when clicking outside the panel
document.addEventListener('click', (e) => {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay && overlay.classList.contains('active')) {
        if (e.target === overlay) {
            closeSettings();
        }
    }
});
