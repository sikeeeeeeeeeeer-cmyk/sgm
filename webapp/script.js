// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Загружаем сохранённый плейлист из localStorage (или создаём новый)
let playlist = loadPlaylist();
let currentTrackIndex = 0;
let audio = new Audio();
let isPlaying = false;

// DOM элементы
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const albumImage = document.getElementById('albumImage');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const playlistEl = document.getElementById('playlist');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const closeBtn = document.getElementById('closeBtn');

// НОВЫЕ элементы
const trackUrl = document.getElementById('trackUrl');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const addTrackBtn = document.getElementById('addTrackBtn');
const addStatus = document.getElementById('addStatus');

// --- Функции для работы с плейлистом ---

function loadPlaylist() {
    const saved = localStorage.getItem('music_playlist');
    if (saved) {
        return JSON.parse(saved);
    }
    // Плейлист по умолчанию (примеры)
    return [
        {
            id: Date.now(),
            title: "Example Song 1",
            artist: "Artist Name",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            duration: 211,
            addedBy: "system"
        },
        {
            id: Date.now() + 1,
            title: "Example Song 2",
            artist: "Another Artist",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            duration: 198,
            addedBy: "system"
        }
    ];
}

function savePlaylist() {
    localStorage.setItem('music_playlist', JSON.stringify(playlist));
}

function addTrackToPlaylist(url, title, artist) {
    // Валидация URL
    if (!url || url.trim() === '') {
        showStatus('❌ Введите URL трека', 'error');
        return false;
    }
    
    // Создаём новый трек
    const newTrack = {
        id: Date.now(),
        url: url.trim(),
        title: title.trim() || 'Без названия',
        artist: artist.trim() || 'Неизвестный исполнитель',
        duration: 0, // Будет определено при загрузке
        addedBy: 'user',
        addedAt: new Date().toISOString()
    };
    
    playlist.push(newTrack);
    savePlaylist();
    renderPlaylist();
    
    showStatus('✅ Трек добавлен! Он появится в плейлисте.', 'success');
    
    // Очищаем поля
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

// --- Функции плеера (остаются те же) ---
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateProgress() {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${percent}%`;
    currentTimeEl.textContent = formatTime(audio.currentTime);
}

function setProgressBar(e) {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
}

function playPause() {
    if (isPlaying) {
        audio.pause();
        playPauseBtn.textContent = '▶';
    } else {
        audio.play();
        playPauseBtn.textContent = '⏸';
    }
    isPlaying = !isPlaying;
}

function nextTrack() {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) audio.play();
}

function prevTrack() {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) audio.play();
}

function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;
    
    songTitle.textContent = track.title;
    songArtist.textContent = track.artist;
    
    // Если у нас есть file_id от Telegram, используем его (быстрее)
    if (track.file_id) {
        audio.src = `telegram-file://${track.file_id}`; // Это не работает напрямую, нужен бот
        // На самом деле file_id нужно использовать через бота
    }
    
    audio.src = track.url;
    
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
            <span class="track-name">${escapeHtml(track.title)}</span>
            <span class="track-artist">${escapeHtml(track.artist)}</span>
            <span class="track-duration">${formatTime(track.duration)}</span>
            <button class="delete-track" data-id="${track.id}">🗑</button>
        `;
        li.onclick = (e) => {
            // Если кликнули не на кнопку удаления
            if (!e.target.classList.contains('delete-track')) {
                currentTrackIndex = index;
                loadTrack(currentTrackIndex);
                if (isPlaying) audio.play();
            }
        };
        playlistEl.appendChild(li);
    });
    
    // Добавляем обработчики удаления
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
        
        // Корректируем текущий индекс
        if (playlist.length === 0) {
            currentTrackIndex = -1;
            songTitle.textContent = 'Нет треков';
            songArtist.textContent = 'Добавьте музыку';
            audio.src = '';
        } else if (currentTrackIndex >= playlist.length) {
            currentTrackIndex = playlist.length - 1;
            loadTrack(currentTrackIndex);
        } else if (currentTrackIndex === index) {
            loadTrack(currentTrackIndex);
        }
        
        showStatus('🗑 Трек удалён из плейлиста', 'success');
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
    // Обновляем длительность в плейлисте
    if (playlist[currentTrackIndex]) {
        playlist[currentTrackIndex].duration = Math.floor(audio.duration);
        savePlaylist();
        renderPlaylist();
    }
});

audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', nextTrack);

progressBar.addEventListener('click', setProgressBar);
playPauseBtn.addEventListener('click', playPause);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);
closeBtn.addEventListener('click', () => tg.close());

// НОВОЕ: Обработчик добавления трека
addTrackBtn.addEventListener('click', () => {
    const url = trackUrl.value.trim();
    const title = trackTitle.value.trim();
    const artist = trackArtist.value.trim();
    
    if (!url) {
        showStatus('❌ Введите URL трека', 'error');
        return;
    }
    
    // Проверяем, не добавлен ли уже такой трек
    const exists = playlist.some(t => t.url === url);
    if (exists) {
        showStatus('⚠️ Этот трек уже есть в плейлисте', 'error');
        return;
    }
    
    // Отправляем URL боту для получения информации
    showStatus('⏳ Обработка трека...', 'loading');
    
    // Отправляем данные боту
    tg.sendData(JSON.stringify({
        action: 'add_track',
        url: url,
        title: title,
        artist: artist
    }));
});

// Обработка ответа от бота (через WebApp)
// Данные от бота приходят через событие message
tg.onEvent('mainButtonClicked', () => {});
tg.onEvent('backButtonClicked', () => {});

// --- Инициализация ---
renderPlaylist();
if (playlist.length > 0) {
    loadTrack(0);
} else {
    songTitle.textContent = 'Плейлист пуст';
    songArtist.textContent = 'Добавьте треки через форму выше';
}
