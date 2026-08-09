// ==========================================
// Cricfy Engine - Complete UI & Live Score Logic
// ==========================================

let fetchedMatchesData = [];
let activeSportCategory = "all";
let activeMatchStatus = "all";

// Category Icons list
const categoryConfig = {
    all: { icon: "fa-solid fa-border-all", label: "All" },
    cricket: { icon: "fa-solid fa-baseball-bat-ball", label: "Cricket" },
    soccer: { icon: "fa-solid fa-futbol", label: "Soccer" },
    tennis: { icon: "fa-solid fa-table-tennis-paddle-ball", label: "Tennis" },
    racing: { icon: "fa-solid fa-flag-checkered", label: "Racing" },
    baseball: { icon: "fa-solid fa-baseball", label: "Baseball" },
    mma: { icon: "fa-solid fa-hand-fist", label: "Boxing" }
};

// ১. ESPN Public Scoreboard APIs
async function fetchLiveSports() {
    const container = document.getElementById("matchesList");
    if (container) {
        container.innerHTML = `
            <div style="text-align:center; padding:30px; color:#94a3b8;">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size:24px; margin-bottom:8px;"></i>
                <p>ডাটা লোড হচ্ছে...</p>
            </div>`;
    }

    const endpoints = {
        cricket: "https://site.api.espn.com/apis/site/v2/sports/cricket/8880/scoreboard",
        soccer: "https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard",
        tennis: "https://site.api.espn.com/apis/site/v2/sports/tennis/all/scoreboard",
        baseball: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
        racing: "https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard",
        mma: "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard"
    };

    try {
        const promises = Object.entries(endpoints).map(async ([type, url]) => {
            try {
                const res = await fetch(url);
                if (!res.ok) return [];
                const data = await res.json();
                return (data.events || []).map(evt => ({ ...evt, sportType: type }));
            } catch (e) { return []; }
        });

        const results = await Promise.all(promises);
        fetchedMatchesData = results.flat();

        renderSportsCategoryIcons();
        renderStatusFilterPills();
        renderMatchCards();

    } catch (err) {
        if (container) {
            container.innerHTML = `<div style="text-align:center; padding:20px; color:#ef4444;">❌ ডাটা লোড করতে সমস্যা হয়েছে!</div>`;
        }
    }
}

// ২. Top Category Icons with Badge Counter
function renderSportsCategoryIcons() {
    const bar = document.getElementById("sportsCatBar");
    if (!bar) return;

    const counts = { all: fetchedMatchesData.length };
    fetchedMatchesData.forEach(m => {
        counts[m.sportType] = (counts[m.sportType] || 0) + 1;
    });

    let html = "";
    Object.keys(categoryConfig).forEach(sport => {
        const count = counts[sport] || 0;
        const iconClass = categoryConfig[sport].icon;
        const isActive = activeSportCategory === sport ? "active" : "";

        html += `
            <div class="cat-circle-btn ${isActive}" onclick="selectSportCategory('${sport}')">
                <i class="${iconClass}"></i>
                ${count > 0 ? `<span class="cat-badge-counter">${count}</span>` : ''}
            </div>`;
    });

    bar.innerHTML = html;
}

// ৩. Status Filter Pills (All, Live, Recent, Upcoming)
function renderStatusFilterPills() {
    const bar = document.getElementById("statusPillsBar");
    if (!bar) return;

    let filtered = fetchedMatchesData;
    if (activeSportCategory !== "all") {
        filtered = filtered.filter(m => m.sportType === activeSportCategory);
    }

    const liveCount = filtered.filter(m => m.status?.type?.state === "in").length;
    const recentCount = filtered.filter(m => m.status?.type?.state === "post").length;
    const upcomingCount = filtered.filter(m => m.status?.type?.state === "pre").length;
    const totalCount = filtered.length;

    bar.innerHTML = `
        <button class="status-pill-btn ${activeMatchStatus==='all'?'active':''}" onclick="selectMatchStatus('all')">
            ${activeMatchStatus==='all'?'✔ ':''} All (${totalCount})
        </button>
        <button class="status-pill-btn ${activeMatchStatus==='live'?'active':''}" onclick="selectMatchStatus('live')">
            ${activeMatchStatus==='live'?'✔ ':''} Live (${liveCount})
        </button>
        <button class="status-pill-btn ${activeMatchStatus==='recent'?'active':''}" onclick="selectMatchStatus('recent')">
            ${activeMatchStatus==='recent'?'✔ ':''} Recent (${recentCount})
        </button>
        <button class="status-pill-btn ${activeMatchStatus==='upcoming'?'active':''}" onclick="selectMatchStatus('upcoming')">
            ${activeMatchStatus==='upcoming'?'✔ ':''} Upcoming (${upcomingCount})
        </button>
    `;
}

// ৪. Match Cards Rendering Logic
function renderMatchCards() {
    const container = document.getElementById("matchesList");
    if (!container) return;

    let matches = fetchedMatchesData;

    // Filter by Sport
    if (activeSportCategory !== "all") {
        matches = matches.filter(m => m.sportType === activeSportCategory);
    }

    // Filter by Status State
    if (activeMatchStatus === "live") matches = matches.filter(m => m.status?.type?.state === "in");
    else if (activeMatchStatus === "recent") matches = matches.filter(m => m.status?.type?.state === "post");
    else if (activeMatchStatus === "upcoming") matches = matches.filter(m => m.status?.type?.state === "pre");

    // Empty Recent / No Match State (Video 00:16 Exact Match)
    if (matches.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-face-smile"></i>
                <p>No ${activeMatchStatus.toUpperCase()} Available</p>
            </div>`;
        return;
    }

    let html = "";
    matches.forEach(evt => {
        const state = evt.status?.type?.state;
        const statusDetail = evt.status?.type?.shortDetail || evt.status?.type?.detail || "";
        const competitors = evt.competitions?.[0]?.competitors || [];

        const team1 = competitors[0] || {};
        const team2 = competitors[1] || {};

        const team1Name = team1.team?.shortDisplayName || team1.team?.displayName || "TBA";
        const team2Name = team2.team?.shortDisplayName || team2.team?.displayName || "TBA";
        const team1Logo = team1.team?.logo || "logo.png";
        const team2Logo = team2.team?.logo || "logo.png";

        const leagueName = evt.season?.slug || evt.league?.name || evt.sportType;

        // Middle status logic
        let centerStatusHTML = "";
        if (state === "in") {
            centerStatusHTML = `<span class="live-badge-text">((•)) Live</span><div class="timer-text">${statusDetail}</div>`;
        } else if (state === "pre") {
            centerStatusHTML = `<div class="timer-text" style="color:#00b87c;">Starts in</div><div style="font-size:10px; color:#94a3b8;">${statusDetail}</div>`;
        } else {
            centerStatusHTML = `<div style="font-size:11px; color:#64748b; font-weight:bold;">FINISHED</div>`;
        }

        html += `
            <div class="cricfy-match-card">
                <div class="card-top-header">
                    <span>${evt.sportType.toUpperCase()} || ${leagueName}</span>
                </div>
                <div class="card-teams-body">
                    <div class="team-info">
                        <img src="${team1Logo}" class="team-flag-icon" onerror="this.src='logo.png'">
                        <span class="team-code-name">${team1Name}</span>
                    </div>

                    <div class="match-status-center">
                        ${centerStatusHTML}
                    </div>

                    <div class="team-info right">
                        <span class="team-code-name">${team2Name}</span>
                        <img src="${team2Logo}" class="team-flag-icon" onerror="this.src='logo.png'">
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Handlers
function selectSportCategory(sport) {
    activeSportCategory = sport;
    renderSportsCategoryIcons();
    renderStatusFilterPills();
    renderMatchCards();
}

function selectMatchStatus(status) {
    activeMatchStatus = status;
    renderStatusFilterPills();
    renderMatchCards();
}

function toggleDrawer() {
    document.getElementById("sideDrawer").classList.toggle("open");
    document.getElementById("drawerOverlay").classList.toggle("open");
}

function switchMainTab(viewId, btnElement) {
    document.querySelectorAll(".tab-view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    
    document.getElementById(viewId).classList.add("active");
    btnElement.classList.add("active");
}

// Initialize on Load
document.addEventListener("DOMContentLoaded", () => {
    fetchLiveSports();
});
