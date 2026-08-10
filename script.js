// Sample Matches Data
const matchesData = [
    {
        id: "ban_ind_01",
        sport: "cricket",
        tournament: "Cricket || Asia Cup Live",
        time: "LIVE NOW",
        status: "live",
        teamA: { name: "BAN", flag: "https://flagcdn.com/w80/bd.png" },
        teamB: { name: "IND", flag: "https://flagcdn.com/w80/in.png" },
        streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    },
    {
        id: "ire_afg_01",
        sport: "cricket",
        tournament: "Cricket || One Day International",
        time: "03:23:22 Live",
        status: "live",
        teamA: { name: "IRE", flag: "https://flagcdn.com/w80/ie.png" },
        teamB: { name: "AFG", flag: "https://flagcdn.com/w80/af.png" },
        streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    },
    {
        id: "trt_sob_02",
        sport: "cricket",
        tournament: "Cricket || The Hundred Women",
        time: "08:00 PM 10/08/2026",
        status: "upcoming",
        teamA: { name: "TRT-W", flag: "https://via.placeholder.com/40/1e293b/ffffff?text=TRT" },
        teamB: { name: "SOB-W", flag: "https://via.placeholder.com/40/00b87c/ffffff?text=SOB" },
        streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    },
    {
        id: "bra_mar_03",
        sport: "football",
        tournament: "Football || FIFA World Cup",
        time: "13/08/2026",
        status: "upcoming",
        teamA: { name: "Brazil", flag: "https://flagcdn.com/w80/br.png" },
        teamB: { name: "Morocco", flag: "https://flagcdn.com/w80/ma.png" },
        streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    }
];

// Sample Categories List (Matching image 58725)
const categoriesData = [
    { title: "Live Events - HD", thumb: "https://via.placeholder.com/60/38bdf8/0f172a?text=HD" },
    { title: "Live Events - SD", thumb: "https://via.placeholder.com/60/00b87c/0f172a?text=SD" },
    { title: "Sports Channels", thumb: "https://via.placeholder.com/60/ef4444/ffffff?text=Sports" },
    { title: "FIFA + Live", thumb: "https://via.placeholder.com/60/0284c7/ffffff?text=FIFA" },
    { title: "Tapmad LIVE", thumb: "https://via.placeholder.com/60/10b981/ffffff?text=Tapmad" },
    { title: "Willow - Live", thumb: "https://via.placeholder.com/60/f59e0b/ffffff?text=Willow" },
    { title: "Sportzfy Special", thumb: "https://via.placeholder.com/60/8b5cf6/ffffff?text=Special" },
    { title: "KIDS", thumb: "https://via.placeholder.com/60/ec4899/ffffff?text=Kids" },
    { title: "Information", thumb: "https://via.placeholder.com/60/6366f1/ffffff?text=Info" },
    { title: "News Channels", thumb: "https://via.placeholder.com/60/ef4444/ffffff?text=News" },
    { title: "Bangladesh", thumb: "https://flagcdn.com/w80/bd.png" },
    { title: "JagoBD", thumb: "https://via.placeholder.com/60/00b87c/ffffff?text=JagoBD" },
    { title: "Pakistan", thumb: "https://flagcdn.com/w80/pk.png" },
    { title: "Nepal", thumb: "https://flagcdn.com/w80/np.png" },
    { title: "DAZN", thumb: "https://via.placeholder.com/60/111827/ffffff?text=DAZN" },
    { title: "Canais do Brasil", thumb: "https://flagcdn.com/w80/br.png" },
    { title: "TSN", thumb: "https://via.placeholder.com/60/ef4444/ffffff?text=TSN" },
    { title: "Fox Sports AU", thumb: "https://via.placeholder.com/60/f59e0b/ffffff?text=FOX" },
    { title: "Sport TV", thumb: "https://via.placeholder.com/60/0284c7/ffffff?text=SportTV" },
    { title: "Arabic Sports", thumb: "https://via.placeholder.com/60/10b981/ffffff?text=Arabic" },
    { title: "Indian Sports", thumb: "https://flagcdn.com/w80/in.png" },
    { title: "France Sports", thumb: "https://flagcdn.com/w80/fr.png" },
    { title: "Africans Sports", thumb: "https://via.placeholder.com/60/8b5cf6/ffffff?text=Africa" },
    { title: "Islamic Channels", thumb: "https://via.placeholder.com/60/00b87c/ffffff?text=Islamic" }
];

let hlsPlayer = null;
let currentSportFilter = 'all';
let currentStatusFilter = 'live';
let authMode = 'login';

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    renderMatches();
    renderCategories();
    checkAuthStatus();
});

// Render Matches Card
function renderMatches() {
    const container = document.getElementById("matchesList");
    container.innerHTML = "";

    const filtered = matchesData.filter(m => {
        const matchSport = currentSportFilter === 'all' || m.sport === currentSportFilter;
        const matchStatus = currentStatusFilter === 'all' || m.status === currentStatusFilter;
        return matchSport && matchStatus;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:30px; color:#64748b;">No matches available for this filter.</p>`;
        return;
    }

    filtered.forEach(m => {
        const card = document.createElement("div");
        card.className = "match-card";
        card.onclick = () => playMatchStream(m.tournament + " (" + m.teamA.name + " VS " + m.teamB.name + ")", m.streamUrl);
        card.innerHTML = `
            <div class="match-header">
                <span class="tournament-name"><i class="fa-solid fa-trophy"></i> ${m.tournament}</span>
                <span class="${m.status === 'live' ? 'live-badge' : ''}">${m.time}</span>
            </div>
            <div class="teams-container">
                <div class="team">
                    <img src="${m.teamA.flag}" class="team-flag" alt="${m.teamA.name}">
                    <span class="team-name">${m.teamA.name}</span>
                </div>
                <span class="vs-badge">VS</span>
                <div class="team team-right">
                    <span class="team-name">${m.teamB.name}</span>
                    <img src="${m.teamB.flag}" class="team-flag" alt="${m.teamB.name}">
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Render Categories Grid
function renderCategories() {
    const grid = document.getElementById("categoryGrid");
    grid.innerHTML = "";

    categoriesData.forEach(cat => {
        const card = document.createElement("div");
        card.className = "category-card";
        card.onclick = () => showChannels(cat.title);
        card.innerHTML = `
            <img src="${cat.thumb}" class="category-thumb" alt="${cat.title}">
            <h3>${cat.title}</h3>
        `;
        grid.appendChild(card);
    });
}

function showChannels(title) {
    document.getElementById("categoryGrid").style.display = "none";
    document.getElementById("channelGrid").style.display = "block";
    document.getElementById("selectedCategoryTitle").innerText = title;

    const list = document.getElementById("channelsListContainer");
    list.innerHTML = `
        <div class="channel-btn" onclick="playMatchStream('${title} - Server 1', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')"><i class="fa-solid fa-tv"></i> Stream Server 1</div>
        <div class="channel-btn" onclick="playMatchStream('${title} - Server 2', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')"><i class="fa-solid fa-tv"></i> Stream Server 2 (FHD)</div>
        <div class="channel-btn" onclick="playMatchStream('${title} - Backup', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')"><i class="fa-solid fa-tv"></i> Backup Stream</div>
    `;
}

function hideChannels() {
    document.getElementById("categoryGrid").style.display = "grid";
    document.getElementById("channelGrid").style.display = "none";
}

// Filtering
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

// Tab Switching
function switchTab(tabId, btn) {
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

    document.getElementById(tabId).classList.add("active");
    btn.classList.add("active");
}

// Navigation & Sidebar
function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebarOverlay").classList.add("active");
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("active");
}

// Play Stream
function playMatchStream(title, url) {
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
    video.pause();
    if (hlsPlayer) {
        hlsPlayer.destroy();
        hlsPlayer = null;
    }
    document.getElementById("playerModal").classList.remove("active");
}

// Drawer Features
function openNetworkStream() {
    closeSidebar();
    const url = prompt("Enter Custom M3U8 Stream URL:");
    if (url) playMatchStream("Custom Stream", url);
}

function toggleFloatingPlayer() {
    closeSidebar();
    const video = document.getElementById("videoPlayer");
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
    } else if (video) {
        video.requestPictureInPicture().catch(() => showNotice("Floating Player", "Please start a stream video first to use Picture-in-Picture."));
    }
}

function openQualitySettings() {
    closeSidebar();
    showNotice("Video Quality", "Quality Auto-selected based on your Internet speed (Auto / 1080p / 720p / 480p).");
}

function toggleCrashLog(checkbox) {
    showNotice("Crash Log Dialog", checkbox.checked ? "Crash log reporting activated." : "Crash log reporting disabled.");
}

function shareApp() {
    closeSidebar();
    if (navigator.share) {
        navigator.share({ title: 'Sportzfy TV', text: 'Download Sportzfy App for Live Sports Streaming!', url: window.location.href });
    } else {
        showNotice("Share App", "App Link copied to clipboard!");
    }
}

function checkAppUpdate() {
    closeSidebar();
    showNotice("Update Check", "You are using the latest version of Sportzfy TV (v2.0).");
}

function exitApp() {
    closeSidebar();
    if (confirm("Are you sure you want to exit?")) {
        window.close();
    }
}

function toggleFavorite() {
    const star = document.getElementById("starIcon");
    star.style.color = star.style.color === 'gold' ? '#94a3b8' : 'gold';
}

function openSearchModal() {
    const q = prompt("Search Channels or Matches:");
    if (q) showNotice("Search Results", `No live events found matching "${q}".`);
}

function openMoreOptions() {
    showNotice("Options", "Sportzfy v2.0 - High Definition Live Sports Streaming.");
}

function showNotice(title, msg) {
    document.getElementById("dialogTitle").innerText = title;
    document.getElementById("dialogBody").innerText = msg;
    document.getElementById("dialogModal").classList.add("active");
}

function closeDialog() {
    document.getElementById("dialogModal").classList.remove("active");
}

// Profile & Auth Logic
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
