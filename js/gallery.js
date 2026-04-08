function handlePhotoUpload(files) {
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.photos.push({
                id: Date.now() + Math.random(),
                src: e.target.result,
                date: getTodayKey()
            });
            saveState();
            render();
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
