// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // Растягиваем на весь экран
tg.ready();

// --- Плейлист (можно будет добавлять через бота) ---
let playlist = [
    {
        id: 1,
        title: "Example Song 1",
        artist: "Artist Name",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        duration: 211
    },
    {
        id: 2,
        title: "Example Song 2",
        artist: "Another Artist",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        duration: 198
    },
    {
        id: 3,
        title: "Example Song 3",
        artist: "The Band",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        duration: 245
    }
];

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

// --- Функции ---
function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;
    
    songTitle.textContent = track.title;
    songArtist.textContent = track.artist;
    audio.src = track.url;
    
    // Обновляем активный трек в плейлисте
    document.querySelectorAll('.playlist li').forEach((li, i) => {
        if (i === index) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
    
    if (isPlaying) {
        audio.play();
    }
}

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
        const playIcon = document.querySelector('#playIcon');
        playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    } else {
        audio.play();
        const playIcon = document.querySelector('#playIcon');
        playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    }
    isPlaying = !isPlaying;
}

function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) audio.play();
}

function prevTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    if (isPlaying) audio.play();
}

function renderPlaylist() {
    playlistEl.innerHTML = '';
    playlist.forEach((track, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="track-name">${track.title}</span>
            <span class="track-duration">${formatTime(track.duration)}</span>
        `;
        li.onclick = () => {
            currentTrackIndex = index;
            loadTrack(currentTrackIndex);
            if (isPlaying) audio.play();
        };
        playlistEl.appendChild(li);
    });
}

// --- Обработчики событий ---
audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', nextTrack);

progressBar.addEventListener('click', setProgressBar);
playPauseBtn.addEventListener('click', playPause);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);
closeBtn.addEventListener('click', () => tg.close());

// --- Отправка данных боту (опционально) ---
// Можно отправить информацию о том, что пользователь слушает
function notifyBot(action, data) {
    tg.sendData(JSON.stringify({ action, data }));
}

// --- Инициализация ---
renderPlaylist();
loadTrack(0);
