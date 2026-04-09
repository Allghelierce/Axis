// Settings Modal Management

function openSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) {
        overlay.classList.add('active');
        // Re-initialize auth UI when opening settings
        if (typeof initAuth === 'function') {
            initAuth();
        }
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
