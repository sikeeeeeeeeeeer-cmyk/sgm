// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Загружаем сохранённый плейлист из localStorage
let playlist = loadPlaylist();
let currentTrackIndex = 0;
let audio = new Audio();
let isPlaying = false;

// DOM элементы
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const playlistEl = document.getElementById('playlist');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const closeBtn = document.getElementById('closeBtn');

// Элементы формы добавления
const trackUrl = document.getElementById('trackUrl');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const addTrackBtn = document.getElementById('addTrackBtn');
const addStatus = document.getElementById('addStatus');

// --- Функции для работы с плейлистом ---

function loadPlaylist() {
    const saved = localStorage.getItem('music_playlist');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch(e) {
            return getDefaultPlaylist();
        }
    }
    return getDefaultPlaylist();
}

function getDefaultPlaylist() {
    return [
        {
            id: Date.now(),
            title: "Sample Song 1",
            artist: "Demo Artist",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            duration: 211
        },
        {
            id: Date.now() + 1,
            title: "Sample Song 2",
            artist: "Demo Artist",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            duration: 198
        }
    ];
}

function savePlaylist() {
    localStorage.setItem('music_playlist', JSON.stringify(playlist));
}

function addTrackToPlaylist(url, title, artist) {
    if (!url || url.trim() === '') {
        showStatus('❌ Введите URL трека', 'error');
        return false;
    }
    
    const newTrack = {
        id: Date.now(),
        url: url.trim(),
        title: title.trim() || 'Без названия',
        artist: artist.trim() || 'Неизвестный исполнитель',
        duration: 0
    };
    
    playlist.push(newTrack);
    savePlaylist();
    renderPlaylist();
    
    showStatus('✅ Трек добавлен!', 'success');
    
    trackUrl.value = '';
    trackTitle.value = '';
    trackArtist.value = '';
    
    return true;
}

function showStatus(message, type) {
    addStatus.textContent = message;
    addStatus.className = `status-message ${type}`;
    setTimeout(() => {
        addStatus.textContent = '';
        addStatus.className = 'status-message';
    }, 3000);
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateProgress() {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${percent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
    }
}

function setProgressBar(e) {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audio.duration) {
        audio.currentTime = percent * audio.duration;
    }
}

function playPause() {
    if (playlist.length === 0) {
        showStatus('Плейлист пуст. Добавьте треки!', 'error');
        return;
    }
    
    if (isPlaying) {
        audio.pause();
        playPauseBtn.textContent = '▶';
    } else {
        audio.play().catch(e => {
            console.error('Ошибка воспроизведения:', e);
            showStatus('❌ Не удалось воспроизвести трек. Проверьте URL.', 'error');
        });
        playPauseBtn.textContent = '⏸';
    }
    isPlaying = !isPlaying;
}

function nextTrack() {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) {
        audio.play();
    }
}

function prevTrack() {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) {
        audio.play();
    }
}

function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;
    
    songTitle.textContent = track.title;
    songArtist.textContent = track.artist;
    audio.src = track.url;
    audio.load();
    
    // Обновляем активный трек в плейлисте
    document.querySelectorAll('.playlist li').forEach((li, i) => {
        if (i === index) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
}

function renderPlaylist() {
    playlistEl.innerHTML = '';
    if (playlist.length === 0) {
        playlistEl.innerHTML = '<li style="text-align:center; opacity:0.7;">Плейлист пуст. Добавьте треки!</li>';
        return;
    }
    
    playlist.forEach((track, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="track-name" title="${escapeHtml(track.title)}">${escapeHtml(track.title)}</span>
            <span class="track-artist" title="${escapeHtml(track.artist)}">${escapeHtml(track.artist)}</span>
            <span class="track-duration">${track.duration ? formatTime(track.duration) : '?'}</span>
            <button class="delete-track" data-id="${track.id}">🗑</button>
        `;
        li.onclick = (e) => {
            if (!e.target.classList.contains('delete-track')) {
                currentTrackIndex = index;
                loadTrack(currentTrackIndex);
                if (isPlaying) {
                    audio.play();
                }
            }
        };
        playlistEl.appendChild(li);
    });
    
    document.querySelectorAll('.delete-track').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteTrack(id);
        };
    });
}

function deleteTrack(id) {
    const index = playlist.findIndex(t => t.id === id);
    if (index !== -1) {
        playlist.splice(index, 1);
        savePlaylist();
        renderPlaylist();
        
        if (playlist.length === 0) {
            currentTrackIndex = -1;
            songTitle.textContent = 'Нет треков';
            songArtist.textContent = 'Добавьте музыку';
            audio.src = '';
            playPauseBtn.textContent = '▶';
            isPlaying = false;
        } else if (currentTrackIndex >= playlist.length) {
            currentTrackIndex = playlist.length - 1;
            loadTrack(currentTrackIndex);
        } else if (currentTrackIndex === index) {
            if (currentTrackIndex >= playlist.length) {
                currentTrackIndex = playlist.length - 1;
            }
            if (currentTrackIndex >= 0) {
                loadTrack(currentTrackIndex);
            }
        }
        
        showStatus('🗑 Трек удалён', 'success');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// --- Обработчики событий ---
audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
    if (playlist[currentTrackIndex] && audio.duration) {
        playlist[currentTrackIndex].duration = Math.floor(audio.duration);
        savePlaylist();
        renderPlaylist();
    }
});

audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', () => {
    nextTrack();
});
audio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    showStatus('❌ Ошибка загрузки аудио. Проверьте ссылку.', 'error');
});

progressBar.addEventListener('click', setProgressBar);
playPauseBtn.addEventListener('click', playPause);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);
closeBtn.addEventListener('click', () => tg.close());

addTrackBtn.addEventListener('click', () => {
    const url = trackUrl.value.trim();
    const title = trackTitle.value.trim();
    const artist = trackArtist.value.trim();
    
    if (!url) {
        showStatus('❌ Введите URL трека', 'error');
        return;
    }
    
    const exists = playlist.some(t => t.url === url);
    if (exists) {
        showStatus('⚠️ Этот трек уже есть в плейлисте', 'error');
        return;
    }
    
    addTrackToPlaylist(url, title, artist);
});

// --- Инициализация ---
renderPlaylist();
if (playlist.length > 0) {
    loadTrack(0);
} else {
    songTitle.textContent = 'Плейлист пуст';
    songArtist.textContent = 'Добавьте треки';
}
