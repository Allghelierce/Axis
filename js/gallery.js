function handlePhotoUpload(files) {
    if (!state.history.photosHistory) state.history.photosHistory = [];
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const newPhoto = {
                id: Date.now() + Math.random(),
                src: e.target.result,
                date: getTodayKey(),
                timestamp: new Date().getTime(),
                favorite: false
            };
            state.photos.push(newPhoto);
            state.history.photosHistory.push(newPhoto);
            saveState();
            render();
            if (document.getElementById('fullscreenAnalytics').classList.contains('active')) {
                renderVault();
            }
        };
        reader.readAsDataURL(file);
    });
}

function deletePhoto(id) {
    const photo = state.photos.find(p => p.id === id);
    if (photo) undoStack.push({ type: 'photo', data: photo });
    state.photos = state.photos.filter(p => p.id !== id);
    saveState();
    render();
}


function renderGallery() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    gallery.innerHTML = '';

    state.photos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${photo.src}" alt="photo">
            <button class="delete-btn" onclick="deletePhoto(${photo.id})">×</button>
        `;
        gallery.appendChild(item);
    });
}

function renderVault() {
    const vault = document.getElementById('vaultGrid');
    if (!vault) return;
    vault.innerHTML = '';

    const sortedPhotos = [...(state.history.photosHistory || [])].sort((a,b) => b.timestamp - a.timestamp);

    sortedPhotos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'vault-item';
        item.style.position = 'relative';
        item.style.aspectRatio = '1';
        item.style.borderRadius = '4px';
        item.style.overflow = 'hidden';
        item.style.background = 'rgba(255,255,255,0.02)';
        item.style.border = '1px solid var(--border)';

        const d = new Date(photo.timestamp);
        const timeStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        item.innerHTML = `
            <img src="${photo.src}" style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 0.4rem; font-size: 0.5rem; opacity: 0; transition: opacity 0.2s;">
                ${timeStr}
            </div>
            <button onclick="toggleFavorite(${photo.id})" style="position: absolute; top: 5px; right: 5px; background: none; border: none; color: ${photo.favorite ? '#ef4444' : 'rgba(255,255,255,0.5)'}; cursor: pointer; font-size: 0.8rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                ${photo.favorite ? '❤️' : '🤍'}
            </button>
            <button onclick="deleteFromVault(${photo.id})" style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.5); border: none; color: white; border-radius: 2px; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.5rem; opacity: 0; transition: opacity 0.2s;">×</button>
        `;

        item.onmouseenter = () => {
            item.querySelector('div').style.opacity = '1';
            item.querySelectorAll('button')[1].style.opacity = '1';
        };
        item.onmouseleave = () => {
            item.querySelector('div').style.opacity = '0';
            item.querySelectorAll('button')[1].style.opacity = '0';
        };

        vault.appendChild(item);
    });
}

function toggleFavorite(id) {
    const photo = state.history.photosHistory.find(p => p.id === id);
    if (photo) {
        photo.favorite = !photo.favorite;
        // Also update in today's list if present
        const todayPhoto = state.photos.find(p => p.id === id);
        if (todayPhoto) todayPhoto.favorite = photo.favorite;
        
        saveState();
        renderVault();
    }
}

function deleteFromVault(id) {
    if (!confirm('Delete this photo from your history?')) return;
    state.history.photosHistory = state.history.photosHistory.filter(p => p.id !== id);
    state.photos = state.photos.filter(p => p.id !== id);
    saveState();
    renderVault();
    renderGallery();
}
