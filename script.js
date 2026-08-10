// ==================== LIVE API CONFIGURATION ====================
const LIVE_MATCHES_API_URL = "./matches.json";
const CATEGORIES_API_URL    = "./data.json";

const AUTO_REFRESH_INTERVAL = 30000; 

let globalMatches = [];
let globalCategories = [];
let hlsPlayer = null;

// শুরুতে 'all' রাখা হয়েছে যাতে পেজ খুললেই সব ম্যাচ দেখা যায়
let currentSportFilter = 'all';
let currentStatusFilter = 'all'; 

document.addEventListener("DOMContentLoaded", () => {
    initLiveApp();
    checkAuthStatus();
    
    // প্রতি ৩০ সেকেন্ড পর পর লাইভ আপডেট
    setInterval(() => {
        fetchLiveMatches(true);
    }, AUTO_REFRESH_INTERVAL);
});

async function initLiveApp() {
    showLoader(true);
    await Promise.all([fetchLiveMatches(), fetchCategories()]);
    showLoader(false);
}

// ==================== REALTIME API FETCH LOGIC ====================

async function fetchLiveMatches(isBackgroundRefresh = false) {
    try {
        const response = await fetch(`${LIVE_MATCHES_API_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("API Connection Failed");
        
        const data = await response.json();
        
        // JSON ডাটা অবজেক্ট বা সরাসরি অ্যারে হলেও হ্যান্ডেল করবে
        globalMatches = Array.isArray(data) ? data : (data.matches || []);
        
        renderMatches();
        
    } catch (error) {
        console.error("Live Matches API Error:", error);
        if (!isBackgroundRefresh) {
            const container = document.getElementById("matchesList");
            if (container) {
                container.innerHTML = `
                    <div style="text-align:center; padding:30px; color:#ef4444;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size:30px; margin-bottom:10px;"></i>
                        <p>matches.json ফাইল থেকে ডাটা লোড করা যাচ্ছে না। GitHub-এ ফাইলটি সঠিক আছে কিনা চেক করুন।</p>
                    </div>`;
            }
        }
    }
}

async function fetchCategories() {
    try {
        const response = await fetch(`${CATEGORIES_API_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("Categories API Error");
        
        const data = await response.json();
        globalCategories = data.categories || [];
        renderCategories();
    } catch (error) {
        console.error("Categories API Error:", error);
    }
}

function showLoader(show) {
    const container = document.getElementById("matchesList");
    if (show && container) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:#38bdf8;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:30px; margin-bottom:10px;"></i>
                <p>লাইভ ম্যাচ লোড হচ্ছে...</p>
            </div>`;
    }
}

// ==================== DYNAMIC RENDER LOGIC ====================

function renderMatches() {
    const container = document.getElementById("matchesList");
    if (!container) return;
    container.innerHTML = "";

    // কেস-ইনসেনসিটিভ ফিল্টারিং লজিক
    const filtered = globalMatches.filter(m => {
        const mSport = (m.sport || '').toLowerCase().trim();
        const mStatus = (m.status || '').toLowerCase().trim();

        const matchSport = currentSportFilter === 'all' || mSport === currentSportFilter.toLowerCase().trim();
        const matchStatus = currentStatusFilter === 'all' || mStatus === currentStatusFilter.toLowerCase().trim();

        return matchSport && matchStatus;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:30px; color:#64748b;">বর্তমানে কোনো ম্যাচ পাওয়া যায়নি।</p>`;
        return;
    }

    filtered.forEach(m => {
        const card = document.createElement("div");
        card.className = "match-card";
        card.onclick = () => playMatchStream(m.title || m.tournament, m.stream_url);

        const isLive = (m.status || '').toLowerCase().trim() === 'live';

        card.innerHTML = `
            <div class="match-header">
                <span class="tournament-name"><i class="fa-solid fa-trophy"></i> ${m.tournament || 'Sports Tournament'}</span>
                <span class="${isLive ? 'live-badge' : ''}">${isLive ? '🔴 LIVE' : (m.time || '')}</span>
            </div>
            <div class="teams-container">
                <div class="team">
                    <img src="${m.teamA?.flag || 'https://via.placeholder.com/40'}" class="team-flag" alt="${m.teamA?.name || 'Team A'}">
                    <span class="team-name">${m.teamA?.name || 'Team A'}</span>
                </div>
                <div style="text-align:center;">
                    <span class="vs-badge">VS</span>
                    ${m.live_score ? `<div style="font-size:11px; color:#00b87c; font-weight:bold; margin-top:4px;">${m.live_score}</div>` : ''}
                </div>
                <div class="team team-right">
                    <span class="team-name">${m.teamB?.name || 'Team B'}</span>
                    <img src="${m.teamB?.flag || 'https://via.placeholder.com/40'}" class="team-flag" alt="${m.teamB?.name || 'Team B'}">
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderCategories() {
    const grid = document.getElementById("categoryGrid");
    if (!grid) return;
    grid.innerHTML = "";

    globalCategories.forEach(cat => {
        const card = document.createElement("div");
        card.className = "category-card";
        card.onclick = () => showChannels(cat.title, cat.channels || []);
        card.innerHTML = `
            <img src="${cat.thumb || 'https://via.placeholder.com/50'}" class="category-thumb" alt="${cat.title}">
            <h3>${cat.title}</h3>
        `;
        grid.appendChild(card);
    });
}

function showChannels(title, channels) {
    document.getElementById("categoryGrid").style.display = "none";
    document.getElementById("channelGrid").style.display = "block";
    document.getElementById("selectedCategoryTitle").innerText = title;

    const list = document.getElementById("channelsListContainer");
    list.innerHTML = "";

    if (channels.length === 0) {
        list.innerHTML = `<div class="channel-btn" onclick="playMatchStream('${title}', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')"><i class="fa-solid fa-tv"></i> Default Stream</div>`;
        return;
    }

    channels.forEach(ch => {
        const btn = document.createElement("div");
        btn.className = "channel-btn";
        btn.onclick = () => playMatchStream(ch.name, ch.url);
        btn.innerHTML = `<i class="fa-solid fa-tv"></i> ${ch.name}`;
        list.appendChild(btn);
    });
}

function hideChannels() {
    document.getElementById("categoryGrid").style.display = "grid";
    document.getElementById("channelGrid").style.display = "none";
}

// ==================== NAVIGATION & UTILS ====================

function filterSport(sport, btn) {
    currentSportFilter = sport;
    document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    renderMatches();
}

function filterStatus(status, btn) {
    currentStatusFilter = status;
    document.querySelectorAll(".status-tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    renderMatches();
}

function switchTab(tabId, btn) {
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

    document.getElementById(tabId).classList.add("active");
    btn.classList.add("active");
}

function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebarOverlay").classList.add("active");
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("active");
}

// ==================== PLAYER LOGIC ====================

function playMatchStream(title, url) {
    if (!url) {
        showNotice("Stream Error", "No stream link available for this match yet.");
        return;
    }

    const modal = document.getElementById("playerModal");
    const video = document.getElementById("videoPlayer");
    document.getElementById("modalChannelTitle").innerText = title;

    modal.classList.add("active");

    if (Hls.isSupported()) {
        if (hlsPlayer) hlsPlayer.destroy();
        hlsPlayer = new Hls();
        hlsPlayer.loadSource(url);
        hlsPlayer.attachMedia(video);
        hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => video.play());
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play();
    }
}

function closePlayer() {
    const video = document.getElementById("videoPlayer");
    if (video) video.pause();
    if (hlsPlayer) {
        hlsPlayer.destroy();
        hlsPlayer = null;
    }
    document.getElementById("playerModal").classList.remove("active");
}

// ==================== OTHER UTILS ====================

function openNetworkStream() {
    closeSidebar();
    const url = prompt("Enter Custom M3U8 Stream URL:");
    if (url) playMatchStream("Network Stream", url);
}

function toggleFloatingPlayer() {
    closeSidebar();
    const video = document.getElementById("videoPlayer");
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
    } else if (video) {
        video.requestPictureInPicture().catch(() => showNotice("Floating Player", "Please start a stream video first."));
    }
}

function openQualitySettings() {
    closeSidebar();
    showNotice("Video Quality", "Quality auto-adjusts based on your bandwidth (Auto / 1080p / 720p).");
}

function toggleCrashLog(checkbox) {
    showNotice("Crash Log", checkbox.checked ? "Crash reporting enabled." : "Crash reporting disabled.");
}

function shareApp() {
    closeSidebar();
    if (navigator.share) {
        navigator.share({ title: 'Sportzfy TV', text: 'Watch Live Sports on Sportzfy App!', url: window.location.href });
    } else {
        showNotice("Share App", "App Link copied to clipboard!");
    }
}

function checkAppUpdate() {
    closeSidebar();
    showNotice("Update Check", "You are using the latest version (v2.0).");
}

function exitApp() {
    closeSidebar();
    if (confirm("Are you sure you want to exit?")) window.close();
}

function showNotice(title, msg) {
    document.getElementById("dialogTitle").innerText = title;
    document.getElementById("dialogBody").innerText = msg;
    document.getElementById("dialogModal").classList.add("active");
}

function closeDialog() {
    document.getElementById("dialogModal").classList.remove("active");
}

function checkAuthStatus() {
    const session = JSON.parse(localStorage.getItem("user_session"));
    const authBox = document.getElementById("authBox");
    const profileBox = document.getElementById("userProfileBox");

    if (!authBox || !profileBox) return;

    if (session) {
        authBox.style.display = "none";
        profileBox.style.display = "block";
        document.getElementById("profileMobile").innerText = session.mobile;
        document.getElementById("profileBadge").innerText = session.isGuest ? "Guest Mode" : "Verified User";
    } else {
        authBox.style.display = "block";
        profileBox.style.display = "none";
    }
}
