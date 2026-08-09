// ==========================================
// Khorkuto TV - Final Script with Multi-Language (v10.4)
// ==========================================

let channels = [];
let currentCategory = "All";
let currentLang = localStorage.getItem("app_lang") || "bn"; // ডিফল্ট ভাষা বাংলা
let hls = null;

let categorizedContainer, video, search, playerModal, playingChannelTitle, sportsMatchesList;

// ------------------------------------------
// Multi-Language Translation Data
// ------------------------------------------
const i18n = {
    bn: {
        langBtn: "EN",
        subTitle: "লাইভ টিভি নেটওয়ার্ক",
        searchPlaceholder: "চ্যানেল নাম দিয়ে খুঁজুন...",
        all: "সব চ্যানেল",
        news: "সংবাদ",
        sports: "খেলাধুলা",
        entertainment: "বিনোদন",
        music: "গান",
        sportsTitle: "🔥 লাইভ ম্যাচ ও খেলাধুলার আপডেট",
        noMatches: "বর্তমানে কোনো লাইভ ম্যাচ নেই",
        fetchingMatches: "⏳ লাইভ ম্যাচের তথ্য আপডেট হচ্ছে...",
        matchSubDefault: "পরবর্তী আপডেট শীঘ্রই আসবে",
        navHome: "হোম",
        navSports: "স্পোর্টস",
        navFav: "ফেভারিট",
        navHistory: "হিস্ট্রি",
        navSearch: "সার্চ",
        closePlayer: "বন্ধ করুন",
        fullscreen: "ফুলস্ক্রিন করুন",
        settingsTitle: "সেটিংস",
        clearFav: "ফেভারিট ক্লিয়ার করুন",
        clearHistory: "হিস্ট্রি ক্লিয়ার করুন",
        shareApp: "অ্যাপ শেয়ার করুন",
        about: "আমাদের সম্পর্কে (About)",
        favHeader: "❤️ ফেভারিট চ্যানেলসমূহ",
        historyHeader: "🕒 সাম্প্রতিক দেখা চ্যানেল",
        noChannels: "কোনো চ্যানেল পাওয়া যায়নি",
        channelsCount: "টি চ্যানেল"
    },
    en: {
        langBtn: "BN",
        subTitle: "Live TV Network",
        searchPlaceholder: "Search channel by name...",
        all: "All",
        news: "News",
        sports: "Sports",
        entertainment: "Entertainment",
        music: "Music",
        sportsTitle: "🔥 Live Matches & Sports Updates",
        noMatches: "No live matches available right now",
        fetchingMatches: "⏳ Fetching live matches...",
        matchSubDefault: "Next match update coming soon",
        navHome: "Home",
        navSports: "Sports",
        navFav: "Favorites",
        navHistory: "History",
        navSearch: "Search",
        closePlayer: "Close",
        fullscreen: "Fullscreen",
        settingsTitle: "Settings",
        clearFav: "Clear Favorites",
        clearHistory: "Clear History",
        shareApp: "Share App",
        about: "About Us",
        favHeader: "❤️ Favorite Channels",
        historyHeader: "🕒 Recently Watched",
        noChannels: "No channels found",
        channelsCount: "Channels"
    }
};

document.addEventListener("DOMContentLoaded", () => {
    categorizedContainer = document.getElementById("categorizedChannels");
    sportsMatchesList = document.getElementById("sportsMatchesList");
    video = document.getElementById("video");
    search = document.getElementById("search");
    playerModal = document.getElementById("playerModal");
    playingChannelTitle = document.getElementById("playingChannelTitle");

    initApp();
});

function initApp() {
    setupEventListeners();
    applyLanguageUI();
    loadChannels();
    fetchLiveSportsMatches();
    
    // প্রতি ২ মিনিট পর পর লাইভ ম্যাচ রিফ্রেশ
    setInterval(fetchLiveSportsMatches, 120000);

    setupTelegram();
    hideSplash();
}

function hideSplash() {
    const splash = document.getElementById("splash");
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = "0";
            setTimeout(() => splash.style.display = "none", 400);
        }, 1200);
    }
}

// ------------------------------------------
// Language Switcher Function
// ------------------------------------------
function toggleLanguage() {
    currentLang = currentLang === "bn" ? "en" : "bn";
    localStorage.setItem("app_lang", currentLang);
    applyLanguageUI();
    renderCategorizedChannels();
    fetchLiveSportsMatches();
}

function applyLanguageUI() {
    const t = i18n[currentLang];

    // Header & Search
    const langBtn = document.getElementById("langBtn");
    if (langBtn) langBtn.innerText = t.langBtn;

    const appSubTitle = document.getElementById("appSubTitle");
    if (appSubTitle) appSubTitle.innerText = t.subTitle;

    if (search) search.placeholder = t.searchPlaceholder;

    // Categories Text
    document.querySelectorAll(".cat").forEach(cat => {
        const catKey = cat.dataset.category;
        const span = cat.querySelector("span");
        if (span) {
            if (catKey === "All") span.innerText = t.all;
            else if (catKey === "News") span.innerText = t.news;
            else if (catKey === "Sports") span.innerText = t.sports;
            else if (catKey === "Entertainment") span.innerText = t.entertainment;
            else if (catKey === "Music") span.innerText = t.music;
        }
    });

    // Sports Section Title
    const sportsTitle = document.querySelector(".sports-section-title span");
    if (sportsTitle) sportsTitle.innerText = t.sportsTitle;

    // Bottom Nav Text
    const homeNav = document.querySelector("#homeNav small");
    if (homeNav) homeNav.innerText = t.navHome;

    const sportsNav = document.querySelector("#sportsNav small");
    if (sportsNav) sportsNav.innerText = t.navSports;

    const favoriteNav = document.querySelector("#favoriteNav small");
    if (favoriteNav) favoriteNav.innerText = t.navFav;

    const historyNav = document.querySelector("#historyNav small");
    if (historyNav) historyNav.innerText = t.navHistory;

    const searchNav = document.querySelector("#searchNav small");
    if (searchNav) searchNav.innerText = t.navSearch;

    // Modal & Controls
    const closeBtn = document.getElementById("closePlayerBtn");
    if (closeBtn) closeBtn.innerHTML = `<i class="fa-solid fa-xmark"></i> ${t.closePlayer}`;

    const fullBtn = document.getElementById("fullscreenBtn");
    if (fullBtn) fullBtn.innerHTML = `<i class="fa-solid fa-expand"></i> ${t.fullscreen}`;

    // Settings Text
    const settingsHeader = document.querySelector(".sheet-header h3");
    if (settingsHeader) settingsHeader.innerText = t.settingsTitle;

    const clearFavBtn = document.getElementById("clearFavBtn");
    if (clearFavBtn) clearFavBtn.innerHTML = `<i class="fa-solid fa-heart-crack"></i> ${t.clearFav}`;

    const clearHistoryBtn = document.getElementById("clearHistoryBtn");
    if (clearHistoryBtn) clearHistoryBtn.innerHTML = `<i class="fa-solid fa-trash"></i> ${t.clearHistory}`;

    const shareApp = document.getElementById("shareApp");
    if (shareApp) shareApp.innerHTML = `<i class="fa-solid fa-share-nodes"></i> ${t.shareApp}`;

    const aboutBtn = document.getElementById("aboutBtn");
    if (aboutBtn) aboutBtn.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${t.about}`;
}

// ------------------------------------------
// Fixed & Smart Live Sports API Fetch
// ------------------------------------------
async function fetchLiveSportsMatches() {
    if (!sportsMatchesList) return;
    const t = i18n[currentLang];

    sportsMatchesList.innerHTML = `
        <div style="font-size:12px; color:var(--text-muted); padding:10px;">
            ${t.fetchingMatches}
        </div>`;

    try {
        // ১. আন্তর্জাতিক ক্রিকেট এবং ফুটবল লাইভ স্কোরের ডাটা ফেচ করা
        const [cricketRes, soccerRes] = await Promise.allSettled([
            fetch("https://site.api.espn.com/apis/site/v2/sports/cricket/8880/scoreboard"),
            fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard")
        ]);

        let allEvents = [];

        if (cricketRes.status === "fulfilled" && cricketRes.value.ok) {
            const cData = await cricketRes.value.json();
            if (cData.events) allEvents.push(...cData.events);
        }

        if (soccerRes.status === "fulfilled" && soccerRes.value.ok) {
            const sData = await soccerRes.value.json();
            if (sData.events) allEvents.push(...sData.events);
        }

        // ২. ফিল্টার: শুধুমাত্র এখন LIVE চলছে এমন ম্যাচ (state === 'in')
        const liveEvents = allEvents.filter(event => {
            const state = event.status?.type?.state;
            return state === "in"; // 'in' মানে বর্তমানে লাইভ ম্যাচ চলছে
        });

        sportsMatchesList.innerHTML = "";

        // ৩. যদি এই মুহূর্তে কোনো লাইভ ম্যাচ না থাকে
        if (liveEvents.length === 0) {
            sportsMatchesList.innerHTML = `
                <div class="match-card">
                    <span class="match-status" style="background:#64748b;">ℹ️ INFO</span>
                    <div class="match-title">${t.noMatches}</div>
                    <div class="match-sub">${t.matchSubDefault}</div>
                </div>`;
            return;
        }

        // ৪. শুধুমাত্র লাইভ ম্যাচগুলো লাইভ স্কোরসহ কার্ড আকারে দেখানো
        liveEvents.forEach(event => {
            const matchTitle = event.name || "Live Match";
            const competitionName = event.season?.slug || event.league?.name || "Live Sports";
            
            // লাইভ স্কোর আপডেট (যদি পাওয়া যায়)
            const scoreText = event.competitions?.[0]?.competitors
                ?.map(c => `${c.team?.shortDisplayName || c.team?.displayName}: ${c.score || '0'}`)
                .join(" vs ") || "";

            const card = document.createElement("div");
            card.className = "match-card";
            card.innerHTML = `
                <span class="match-status">🔴 LIVE</span>
                <div class="match-title">${matchTitle}</div>
                <div class="match-sub">${scoreText ? scoreText : competitionName}</div>
            `;

            card.onclick = () => {
                const sportsChannel = channels.find(c => 
                    (c.category && c.category.toLowerCase() === "sports") || 
                    c.name.toLowerCase().includes("sports")
                );

                if (sportsChannel) {
                    playChannel(sportsChannel);
                } else {
                    alert(currentLang === "bn" ? "স্ট্রিমিং দেখতে স্পোর্টস চ্যানেলটি বেছে নিন।" : "Select a sports channel to watch streaming.");
                }
            };

            sportsMatchesList.appendChild(card);
        });

    } catch (error) {
        console.warn("Sports API fallback:", error);
        sportsMatchesList.innerHTML = `
            <div class="match-card">
                <span class="match-status">🔴 LIVE</span>
                <div class="match-title">${currentLang === "bn" ? "লাইভ স্পোর্টস টি ভি" : "Live Sports TV"}</div>
                <div class="match-sub">${currentLang === "bn" ? "খেলার লাইভ সম্প্রচার দেখতে ক্লিক করুন" : "Click to watch live stream"}</div>
            </div>`;
    }
}


// ------------------------------------------
// Load Channels & Render UI
// ------------------------------------------
async function loadChannels() {
    if (!categorizedContainer) return;

    try {
        const response = await fetch("channels.json?t=" + Date.now());
        if (!response.ok) throw new Error("Failed to load channels");

        const data = await response.json();
        channels = Array.isArray(data) ? data : (data.channels || []);

        renderCategorizedChannels();

    } catch (err) {
        categorizedContainer.innerHTML = `
            <div style="text-align:center; padding:30px; color:#ef4444;">
                ❌ channels.json error!
            </div>`;
    }
}

function renderCategorizedChannels() {
    if (!categorizedContainer) return;

    categorizedContainer.innerHTML = "";
    const keyword = search ? search.value.toLowerCase().trim() : "";
    const t = i18n[currentLang];

    const filtered = channels.filter(c => 
        (c.name || "").toLowerCase().includes(keyword)
    );

    if (filtered.length === 0) {
        categorizedContainer.innerHTML = `<p style='text-align:center; padding:30px; color:var(--text-muted);'>${t.noChannels}</p>`;
        return;
    }

    let categories = [];
    if (currentCategory === "All") {
        categories = [...new Set(filtered.map(c => c.category || "General"))];
    } else {
        categories = [currentCategory];
    }

    categories.forEach(catName => {
        const catChannels = filtered.filter(c => (c.category || "General").toLowerCase().includes(catName.toLowerCase()));

        if (catChannels.length > 0) {
            renderCustomList("📍 " + catName, catChannels);
        }
    });
}

function renderCustomList(title, list) {
    if (!categorizedContainer) return;
    const t = i18n[currentLang];

    if (list.length === 0) {
        categorizedContainer.innerHTML = `<p style='text-align:center; padding:30px; color:var(--text-muted);'>${t.noChannels}</p>`;
        return;
    }

    const rowBlock = document.createElement("div");
    rowBlock.className = "category-row-block";

    rowBlock.innerHTML = `
        <div class="category-title">
            ${title}
            <span>${list.length} ${t.channelsCount}</span>
        </div>
        <div class="horizontal-channel-slider"></div>
    `;

    const slider = rowBlock.querySelector(".horizontal-channel-slider");

    list.forEach(channel => {
        const isFav = localStorage.getItem("fav_" + channel.name) === "true";
        const card = document.createElement("div");
        card.className = "ott-card";

        card.innerHTML = `
            <span class="fav-icon">${isFav ? "❤️" : "🤍"}</span>
            <img src="${channel.logo || 'logo.png'}" onerror="this.onerror=null; this.src='https://via.placeholder.com/80?text=TV';">
            <h4>${channel.name || 'Unknown'}</h4>
        `;

        const favBtn = card.querySelector(".fav-icon");
        favBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(channel, favBtn);
        };

        card.onclick = () => playChannel(channel);

        slider.appendChild(card);
    });

    categorizedContainer.appendChild(rowBlock);
}

// ------------------------------------------
// Stream Player
// ------------------------------------------
function playChannel(channel) {
    if (!video || !channel.url) return;

    if (playingChannelTitle) {
        playingChannelTitle.innerText = "🔴 " + (channel.name || "Live TV");
    }

    if (playerModal) {
        playerModal.classList.add("active");
    }

    addToHistory(channel);

    if (hls) {
        hls.destroy();
        hls = null;
    }

    if (Hls.isSupported() && channel.url.includes(".m3u8")) {
        hls = new Hls();
        hls.loadSource(channel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(e => console.log("Autoplay blocked:", e));
        });
    } else {
        video.src = channel.url;
        video.play().catch(e => console.log("Autoplay blocked:", e));
    }
}

function closePlayer() {
    if (playerModal) playerModal.classList.remove("active");
    if (video) video.pause();
    if (hls) {
        hls.destroy();
        hls = null;
    }
}

// ------------------------------------------
// Favorites & History
// ------------------------------------------
function toggleFavorite(channel, btnElement) {
    const key = "fav_" + channel.name;
    const isFav = localStorage.getItem(key) === "true";

    if (isFav) {
        localStorage.removeItem(key);
        btnElement.innerText = "🤍";
    } else {
        localStorage.setItem(key, "true");
        btnElement.innerText = "❤️";
    }
}

function renderFavorites() {
    if (!categorizedContainer) return;
    categorizedContainer.innerHTML = "";
    const favChannels = channels.filter(c => localStorage.getItem("fav_" + c.name) === "true");
    renderCustomList(i18n[currentLang].favHeader, favChannels);
}

function addToHistory(channel) {
    let history = JSON.parse(localStorage.getItem("watch_history") || "[]");
    history = history.filter(item => item.name !== channel.name);
    history.unshift(channel);
    if (history.length > 20) history.pop();
    localStorage.setItem("watch_history", JSON.stringify(history));
}

function renderHistory() {
    if (!categorizedContainer) return;
    categorizedContainer.innerHTML = "";
    const historyChannels = JSON.parse(localStorage.getItem("watch_history") || "[]");
    renderCustomList(i18n[currentLang].historyHeader, historyChannels);
}

// ------------------------------------------
// Event Listeners
// ------------------------------------------
function setupEventListeners() {
    document.getElementById("langBtn")?.addEventListener("click", toggleLanguage);

    if (search) {
        search.addEventListener("input", () => renderCategorizedChannels());
    }

    document.querySelectorAll(".cat").forEach(pill => {
        pill.addEventListener("click", () => {
            document.querySelectorAll(".cat").forEach(c => c.classList.remove("active"));
            pill.classList.add("active");
            
            currentCategory = pill.dataset.category || "All";
            renderCategorizedChannels();
        });
    });

    const setActiveNav = (id) => {
        document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
        document.getElementById(id)?.classList.add("active");
    };

    document.getElementById("homeNav")?.addEventListener("click", () => {
        setActiveNav("homeNav");
        currentCategory = "All";
        renderCategorizedChannels();
    });

    document.getElementById("sportsNav")?.addEventListener("click", () => {
        setActiveNav("sportsNav");
        currentCategory = "Sports";
        renderCategorizedChannels();
    });

    document.getElementById("favoriteNav")?.addEventListener("click", () => {
        setActiveNav("favoriteNav");
        renderFavorites();
    });

    document.getElementById("historyNav")?.addEventListener("click", () => {
        setActiveNav("historyNav");
        renderHistory();
    });

    document.getElementById("searchNav")?.addEventListener("click", () => {
        setActiveNav("searchNav");
        search?.scrollIntoView({ behavior: "smooth" });
        search?.focus();
    });

    document.getElementById("closePlayerBtn")?.addEventListener("click", closePlayer);
    document.getElementById("refreshBtn")?.addEventListener("click", () => location.reload());

    document.getElementById("fullscreenBtn")?.addEventListener("click", () => {
        if (!video) return;
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    });

    // Settings
    const settingsSheet = document.getElementById("settingsSheet");
    const settingsOverlay = document.getElementById("settingsOverlay");

    document.getElementById("settingsBtn")?.addEventListener("click", () => {
        settingsOverlay?.classList.add("show");
        settingsSheet?.classList.add("show");
    });

    document.getElementById("closeSettings")?.addEventListener("click", () => {
        settingsOverlay?.classList.remove("show");
        settingsSheet?.classList.remove("show");
    });

    document.getElementById("clearFavBtn")?.addEventListener("click", () => {
        channels.forEach(c => localStorage.removeItem("fav_" + c.name));
        alert(currentLang === "bn" ? "সব ফেভারিট চ্যানেল মুছে ফেলা হয়েছে!" : "All favorites cleared!");
        settingsOverlay?.classList.remove("show");
        settingsSheet?.classList.remove("show");
        renderCategorizedChannels();
    });

    document.getElementById("clearHistoryBtn")?.addEventListener("click", () => {
        localStorage.removeItem("watch_history");
        alert(currentLang === "bn" ? "হিস্ট্রি ক্লিয়ার করা হয়েছে!" : "History cleared!");
        settingsOverlay?.classList.remove("show");
        settingsSheet?.classList.remove("show");
        renderCategorizedChannels();
    });
}

function setupTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
}
// ==========================================
// Multi-Sport Cricfy Style Live/Upcoming API
// ==========================================

let activeStatusFilter = "all"; // 'all', 'live', 'recent', 'upcoming'
let fetchedSportsEvents = [];

async function fetchLiveSportsMatches() {
    const sportsMatchesList = document.getElementById("sportsMatchesList") || document.getElementById("channelList");
    if (!sportsMatchesList) return;

    sportsMatchesList.innerHTML = `
        <div style="font-size:14px; color:var(--text-muted); padding:20px; text-align:center;">
            ⏳ সকল খেলার ডাটা লোড করা হচ্ছে...
        </div>`;

    // ESPN Public API Endpoints (Cricket, Soccer, Baseball, Tennis, Motorsport, MMA/Boxing)
    const endpoints = {
        cricket: "https://site.api.espn.com/apis/site/v2/sports/cricket/8880/scoreboard",
        soccer: "https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard",
        baseball: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
        tennis: "https://site.api.espn.com/apis/site/v2/sports/tennis/all/scoreboard",
        racing: "https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard",
        mma: "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard"
    };

    try {
        // সকল খেলা একসাথে Fetch করা
        const fetchPromises = Object.entries(endpoints).map(async ([type, url]) => {
            try {
                const res = await fetch(url);
                if (!res.ok) return [];
                const data = await res.json();
                return (data.events || []).map(evt => ({ ...evt, sportType: type }));
            } catch (e) {
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);
        fetchedSportsEvents = results.flat();

        renderSportsContainer(sportsMatchesList);

    } catch (error) {
        console.error("Sports API Error:", error);
        sportsMatchesList.innerHTML = `
            <div style="text-align:center; padding:20px; color:#ef4444;">
                ❌ খেলার ডাটা লোড করতে সমস্যা হয়েছে।
            </div>`;
    }
}

// Cricfy Style Card rendering logic
function renderSportsContainer(container) {
    if (!container) return;

    // Filter by Status State (in = Live, pre = Upcoming, post = Finished/Recent)
    const filteredEvents = fetchedSportsEvents.filter(evt => {
        const state = evt.status?.type?.state;
        if (activeStatusFilter === "live" && state !== "in") return false;
        if (activeStatusFilter === "recent" && state !== "post") return false;
        if (activeStatusFilter === "upcoming" && state !== "pre") return false;
        return true;
    });

    // Counts for Filter Tabs
    const liveCount = fetchedSportsEvents.filter(e => e.status?.type?.state === "in").length;
    const recentCount = fetchedSportsEvents.filter(e => e.status?.type?.state === "post").length;
    const upcomingCount = fetchedSportsEvents.filter(e => e.status?.type?.state === "pre").length;
    const totalCount = fetchedSportsEvents.length;

    let html = `
        <div class="sports-status-tabs" style="display:flex; gap:8px; overflow-x:auto; padding-bottom:12px; margin-bottom:12px; scrollbar-width:none;">
            <button class="status-tab ${activeStatusFilter==='all'?'active':''}" onclick="setStatusFilter('all')">
                ✅ All (${totalCount})
            </button>
            <button class="status-tab ${activeStatusFilter==='live'?'active':''}" onclick="setStatusFilter('live')">
                🔴 Live (${liveCount})
            </button>
            <button class="status-tab ${activeStatusFilter==='recent'?'active':''}" onclick="setStatusFilter('recent')">
                ✔ Recent (${recentCount})
            </button>
            <button class="status-tab ${activeStatusFilter==='upcoming'?'active':''}" onclick="setStatusFilter('upcoming')">
                ⏳ Upcoming (${upcomingCount})
            </button>
        </div>
    `;

    if (filteredEvents.length === 0) {
        html += `
            <div style="text-align:center; padding:30px; color:var(--text-muted);">
                😃 বর্তমানে এই ট্যাবে কোনো ম্যাচ নেই।
            </div>`;
        container.innerHTML = html;
        return;
    }

    html += `<div class="sports-cards-container" style="display:grid; gap:12px;">`;

    filteredEvents.forEach(evt => {
        const state = evt.status?.type?.state;
        const statusDetail = evt.status?.type?.shortDetail || evt.status?.type?.detail || "";
        const competition = evt.competitions?.[0];
        const competitors = competition?.competitors || [];

        const team1 = competitors[0] || {};
        const team2 = competitors[1] || {};

        const team1Name = team1.team?.shortDisplayName || team1.team?.displayName || "TBA";
        const team2Name = team2.team?.shortDisplayName || team2.team?.displayName || "TBA";
        const team1Logo = team1.team?.logo || "logo.png";
        const team2Logo = team2.team?.logo || "logo.png";
        const team1Score = team1.score !== undefined ? team1.score : "";
        const team2Score = team2.score !== undefined ? team2.score : "";

        // Status Badge Style
        let statusBadge = "";
        if (state === "in") {
            statusBadge = `<span style="background:#e50914; color:#fff; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:bold; animation: pulse 1.5s infinite;">🔴 LIVE</span>`;
        } else if (state === "pre") {
            statusBadge = `<span style="background:#2563eb; color:#fff; padding:3px 10px; border-radius:12px; font-size:11px;">⏳ ${statusDetail}</span>`;
        } else {
            statusBadge = `<span style="background:#64748b; color:#fff; padding:3px 10px; border-radius:12px; font-size:11px;">FINISHED</span>`;
        }

        const leagueName = evt.season?.slug || evt.league?.name || evt.sportType.toUpperCase();

        html += `
            <div class="cricfy-match-card" style="background:var(--bg-card); border-radius:14px; padding:12px 16px; border:1px solid var(--border-color); cursor:pointer;" onclick="playSportsStream()">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:12px; color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px;">
                    <span style="text-transform:uppercase; font-weight:bold;">🏆 ${leagueName}</span>
                    ${statusBadge}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                    <div style="display:flex; align-items:center; gap:8px; flex:1;">
                        <img src="${team1Logo}" onerror="this.src='logo.png'" style="width:28px; height:28px; object-fit:contain;">
                        <span style="font-weight:bold; font-size:14px; color:#fff;">${team1Name}</span>
                        ${team1Score !== "" ? `<span style="margin-left:auto; font-weight:bold; color:var(--primary); font-size:15px;">${team1Score}</span>` : ''}
                    </div>

                    <div style="padding:0 5px; font-size:11px; color:var(--text-muted); font-weight:bold;">VS</div>

                    <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:flex-end;">
                        ${team2Score !== "" ? `<span style="margin-right:auto; font-weight:bold; color:var(--primary); font-size:15px;">${team2Score}</span>` : ''}
                        <span style="font-weight:bold; font-size:14px; color:#fff;">${team2Name}</span>
                        <img src="${team2Logo}" onerror="this.src='logo.png'" style="width:28px; height:28px; object-fit:contain;">
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

// Tab Click Handler
function setStatusFilter(status) {
    activeStatusFilter = status;
    const container = document.getElementById("sportsMatchesList") || document.getElementById("channelList");
    renderSportsContainer(container);
}

// Play Channel on click
function playSportsStream() {
    if (typeof channels !== "undefined" && channels.length > 0) {
        const sportsChannel = channels.find(c => 
            (c.category && c.category.toLowerCase().includes("sports")) || 
            c.name.toLowerCase().includes("sports")
        ) || channels[0];

        if (typeof playChannel === "function") {
            playChannel(sportsChannel, true);
        }
    }
}
