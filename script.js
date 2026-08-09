// ১. চ্যানেল ডেটাসেট (Sample TV Stream Database)
const channels = [
    {
        id: 1,
        name: "Somoy TV",
        category: "news",
        logo: "https://upload.wikimedia.org/wikipedia/commons/1/14/Somoy_TV_logo.svg",
        type: "iframe",
        url: "https://www.youtube.com/embed/live_stream?channel=UCv9Eypq5yU-fT0d3sA"
    },
    {
        id: 2,
        name: "Jamuna TV",
        category: "news",
        logo: "https://upload.wikimedia.org/wikipedia/en/e/e0/Jamuna_TV_Logo.png",
        type: "iframe",
        url: "https://www.youtube.com/embed/live_stream?channel=UC5Gk-v80TlyjU9Y6aEAnmNg"
    },
    {
        id: 3,
        name: "Ekattor TV",
        category: "news",
        logo: "https://upload.wikimedia.org/wikipedia/en/a/a2/Ekattor_TV_Logo.png",
        type: "iframe",
        url: "https://www.youtube.com/embed/live_stream?channel=UC9A4A7x_jO_IExw5TBy9Tzw"
    },
    {
        id: 4,
        name: "T Sports Live",
        category: "sports",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/TSports.svg/200px-TSports.svg.png",
        type: "hls",
        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    },
    {
        id: 5,
        name: "Zee Bangla",
        category: "entertainment",
        logo: "https://upload.wikimedia.org/wikipedia/en/b/b3/Zee_Bangla_Logo.png",
        type: "hls",
        url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    }
];

// ২. স্টেট ম্যানেজমেন্ট (State Variables)
let favorites = JSON.parse(localStorage.getItem('khorkuto_favs')) || [];
let historyList = JSON.parse(localStorage.getItem('khorkuto_history')) || [];
let currentCategory = 'all';
let currentChannel = null;
let hlsInstance = null;

// ৩. টেলিগ্রাম মিনি অ্যাপ ইনিশিয়ালাইজেশন
document.addEventListener("DOMContentLoaded", () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    renderChannels();
});

// ৪. চ্যানেল গ্রিড রেন্ডারিং
function renderChannels() {
    const grid = document.getElementById('channelGrid');
    const searchVal = document.getElementById('searchInput').value.toLowerCase();
    grid.innerHTML = '';

    let listToRender = channels;

    // ক্যাটাগরি ফিল্টার
    if (currentCategory === 'favorites') {
        listToRender = channels.filter(c => favorites.includes(c.id));
    } else if (currentCategory === 'history') {
        listToRender = historyList.map(id => channels.find(c => c.id === id)).filter(Boolean);
    } else if (currentCategory !== 'all') {
        listToRender = channels.filter(c => c.category === currentCategory);
    }

    // সার্চ সার্চ ফিল্টার
    if (searchVal.trim() !== '') {
        listToRender = listToRender.filter(c => c.name.toLowerCase().includes(searchVal));
    }

    if (listToRender.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px 0;">কোনো চ্যানেল পাওয়া যায়নি!</div>`;
        return;
    }

    listToRender.forEach(ch => {
        const isFav = favorites.includes(ch.id);
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart card-fav-icon ${isFav ? 'active' : ''}" 
               onclick="event.stopPropagation(); toggleFavorite(${ch.id})"></i>
            <img src="${ch.logo}" alt="${ch.name}" onerror="this.src='https://via.placeholder.com/80?text=TV'">
            <h4>${ch.name}</h4>
            <span>${ch.category}</span>
        `;
        card.onclick = () => openPlayer(ch);
        grid.appendChild(card);
    });
}

// ৫. ফুল-স্ক্রিন প্লেয়ার সেশন চালুকরণ
function openPlayer(channel) {
    currentChannel = channel;
    
    // ওয়াচ হিস্ট্রি আপডেট
    addToHistory(channel.id);

    // UI আপডেট
    document.getElementById('playerLogo').src = channel.logo;
    document.getElementById('playerChannelName').innerText = channel.name;
    updatePlayerFavIcon();

    const videoEl = document.getElementById('videoPlayer');
    const iframeEl = document.getElementById('iframePlayer');

    // প্লেয়ার স্টেট রিসেট
    destroyHls();
    videoEl.pause();
    videoEl.src = "";
    iframeEl.src = "";

    if (channel.type === 'hls' || channel.url.includes('.m3u8')) {
        iframeEl.classList.add('hidden');
        videoEl.classList.remove('hidden');

        if (Hls.isSupported()) {
            hlsInstance = new Hls();
            hlsInstance.loadSource(channel.url);
            hlsInstance.attachMedia(videoEl);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                videoEl.play().catch(e => console.log("Autoplay blocked:", e));
            });
        } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            videoEl.src = channel.url;
            videoEl.play();
        }
    } else {
        // Iframe / YouTube Live Embed Support
        videoEl.classList.add('hidden');
        iframeEl.classList.remove('hidden');
        iframeEl.src = channel.url + (channel.url.includes('?') ? '&' : '?') + 'autoplay=1';
    }

    // প্লেয়ার ওভারলে দৃশ্যমান করা
    document.getElementById('playerModal').classList.remove('hidden');
}

// ৬. প্লেয়ার বন্ধ ও রিসেট করা
function closePlayer() {
    const videoEl = document.getElementById('videoPlayer');
    const iframeEl = document.getElementById('iframePlayer');

    destroyHls();
    videoEl.pause();
    videoEl.src = "";
    iframeEl.src = "";

    document.getElementById('playerModal').classList.add('hidden');
    currentChannel = null;

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(e => console.log(e));
    }
}

// HLS মেমোরি ফ্রী করা
function destroyHls() {
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }
}

// ৭. ফুলস্ক্রিন টগল ফাংশন
function toggleFullscreen() {
    const playerContainer = document.getElementById('playerModal');
    if (!document.fullscreenElement) {
        if (playerContainer.requestFullscreen) {
            playerContainer.requestFullscreen();
        } else if (playerContainer.webkitRequestFullscreen) {
            playerContainer.webkitRequestFullscreen(); // Safari / iOS support
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// ৮. ফেভারিট লজিক
function toggleFavorite(id) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(fId => fId !== id);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('khorkuto_favs', JSON.stringify(favorites));
    renderChannels();
    if (currentChannel && currentChannel.id === id) {
        updatePlayerFavIcon();
    }
}

function toggleFavoriteCurrent() {
    if (currentChannel) {
        toggleFavorite(currentChannel.id);
    }
}

function updatePlayerFavIcon() {
    if (!currentChannel) return;
    const isFav = favorites.includes(currentChannel.id);
    const favBtnIcon = document.querySelector('#playerFavBtn i');
    favBtnIcon.className = isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    favBtnIcon.style.color = isFav ? 'var(--accent)' : '#ffffff';
}

// ৯. ওয়াচ হিস্ট্রি লজিক
function addToHistory(id) {
    historyList = historyList.filter(hId => hId !== id);
    historyList.unshift(id); // সাম্প্রতিক চ্যানেল আগে আসবে
    if (historyList.length > 20) historyList.pop(); // সর্ব্বোচ্চ ২০টি সেভ হবে
    localStorage.setItem('khorkuto_history', JSON.stringify(historyList));
}

// ১০. ফিল্টার ও সার্চ হ্যান্ডলার
function filterCategory(cat, btnElement) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    renderChannels();
}

function handleSearch() {
    renderChannels();
}

// ১১. ইউটিলিটি ও সেটিংস
function refreshApp() {
    document.getElementById('searchInput').value = '';
    renderChannels();
}

function closeBanner() {
    document.getElementById('noticeBanner').style.display = 'none';
}

function toggleSettingsModal(show) {
    const modal = document.getElementById('settingsModal');
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

function clearHistory() {
    historyList = [];
    localStorage.removeItem('khorkuto_history');
    renderChannels();
    alert('হিস্ট্রি সফলভাবে মুছে ফেলা হয়েছে!');
    toggleSettingsModal(false);
}

function clearFavorites() {
    favorites = [];
    localStorage.removeItem('khorkuto_favs');
    renderChannels();
    alert('ফেভারিট তালিকা মুছে ফেলা হয়েছে!');
    toggleSettingsModal(false);
}
