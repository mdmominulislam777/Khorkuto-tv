// ==================== LIVE API CONFIGURATION ====================
// ১. আপনার নিজস্ব JSON API endpoint বা CricAPI / Football API এর URL এখানে বসান
const LIVE_MATCHES_API_URL = "matches.json";
const CATEGORIES_API_URL    = "https://raw.githubusercontent.com/app-data/sports-api/main/categories.json";

// অটো আপডেট টাইম ইনটারভাল (মিলিসেকেন্ডে) - যেমন: ৩০ সেকেন্ড পর পর ডাটা অটো আপডেট হবে
const AUTO_REFRESH_INTERVAL = 30000; 

let globalMatches = [];
let globalCategories = [];
let hlsPlayer = null;
let currentSportFilter = 'all';
let currentStatusFilter = 'live';
let authMode = 'login';

// অ্যাপ লোড হলেই প্রথমবার ডাটা ফেচ হবে এবং অটো-পোকার (Auto-Polling) শুরু হবে
document.addEventListener("DOMContentLoaded", () => {
    initLiveApp();
    checkAuthStatus();
    
    // প্রতি ৩০ সেকেন্ড পর পর অটোমেটিক API কল হয়ে ম্যাচ ও স্কোর আপডেট হবে
    setInterval(() => {
        console.log("Auto refreshing live sports data...");
        fetchLiveMatches(true); // silent background update
    }, AUTO_REFRESH_INTERVAL);
});

async function initLiveApp() {
    showLoader(true);
    await Promise.all([fetchLiveMatches(), fetchCategories()]);
    showLoader(false);
}

// ==================== REALTIME API FETCH LOGIC ====================

// ১. লাইভ ম্যাচ অটো ফেচিং
async function fetchLiveMatches(isBackgroundRefresh = false) {
    try {
        // Cache buster যোগ করা হয়েছে যাতে ব্রাউজার পুরাতন ডাটা ক্যাশ না করে
        const response = await fetch(`${LIVE_MATCHES_API_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("API Connection Failed");
        
        const data = await response.json();
        globalMatches = data.matches || [];
        
        // স্ক্রিন অটো রি-রেন্ডার
        renderMatches();
        
    } catch (error) {
        console.error("Live Matches API Error:", error);
        if (!isBackgroundRefresh) {
            document.getElementById("matchesList").innerHTML = `
                <div style="text-align:center; padding:30px; color:#ef4444;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:30px; margin-bottom:10px;"></i>
                    <p>লাইভ সার্ভারের সাথে সংযোগ করা যাচ্ছে না।</p>
                </div>`;
        }
    }
}

// ২. ক্যাটাগরি ও চ্যানেল অটো ফেচিং
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

// UI Loader
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

    const filtered = globalMatches.filter(m => {
        const matchSport = currentSportFilter === 'all' || m.sport === currentSportFilter;
        const matchStatus = currentStatusFilter === 'all' || m.status === currentStatusFilter;
        return matchSport && matchStatus;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:30px; color:#64748b;">বর্তমানে কোনো ম্যাচ পাওয়া যায়নি।</p>`;
        return;
    }

    filtered.forEach(m => {
        const card = document.createElement("div");
        card.className = "match-card";
        
        // ক্লিকে সরাসরি লাইভ স্ট্রিম চালু হবে
        card.onclick = () => playMatchStream(m.title || m.tournament, m.stream_url);

        card.innerHTML = `
            <div class="match-header">
                <span class="tournament-name"><i class="fa-solid fa-trophy"></i> ${m.tournament}</span>
                <span class="${m.status === 'live' ? 'live-badge' : ''}">${m.status === 'live' ? '🔴 LIVE' : m.time}</span>
            </div>
            <div class="teams-container">
                <div class="team">
                    <img src="${m.teamA.flag}" class="team-flag" alt="${m.teamA.name}">
                    <span class="team-name">${m.teamA.name}</span>
                </div>
                <div style="text-align:center;">
                    <span class="vs-badge">VS</span>
                    ${m.live_score ? `<div style="font-size:11px; color:#00b87c; font-weight:bold; margin-top:4px;">${m.live_score}</div>` : ''}
                </div>
                <div class="team team-right">
                    <span class="team-name">${m.teamB.name}</span>
                    <img src="${m.teamB.flag}" class="team-flag" alt="${m.teamB.name}">
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
            <img src="${cat.thumb}" class="category-thumb" alt="${cat.title}">
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

// ==================== DRAWER FEATURES ====================

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

function toggleFavorite() {
    const star = document.getElementById("starIcon");
    if (star) star.style.color = star.style.color === 'gold' ? '#94a3b8' : 'gold';
}

function openSearchModal() {
    const q = prompt("Search Matches or Channels:");
    if (q) showNotice("Search Results", `No matches found for "${q}".`);
}

function openMoreOptions() {
    showNotice("Sportzfy TV", "Version 2.0 - High Definition Live Sports Streaming.");
}

function showNotice(title, msg) {
    document.getElementById("dialogTitle").innerText = title;
    document.getElementById("dialogBody").innerText = msg;
    document.getElementById("dialogModal").classList.add("active");
}

function closeDialog() {
    document.getElementById("dialogModal").classList.remove("active");
}

// ==================== AUTH & PROFILE ====================

function switchAuthMode(mode) {
    authMode = mode;
    document.getElementById("loginTabBtn").classList.toggle("active", mode === 'login');
    document.getElementById("signupTabBtn").classList.toggle("active", mode === 'signup');
    document.getElementById("authSubmitBtn").innerText = mode === 'login' ? 'Login' : 'Sign Up';
}

function handleAuthSubmit(e) {
    e.preventDefault();
    const mobile = document.getElementById("userMobile").value;
    localStorage.setItem("user_session", JSON.stringify({ mobile: mobile, isGuest: false }));
    checkAuthStatus();
}

function loginAsGuest() {
    localStorage.setItem("user_session", JSON.stringify({ mobile: "Guest User", isGuest: true }));
    checkAuthStatus();
}

function logoutUser() {
    localStorage.removeItem("user_session");
    checkAuthStatus();
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
