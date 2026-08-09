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
// Sports API Fetch
// ------------------------------------------
async function fetchLiveSportsMatches() {
    if (!sportsMatchesList) return;
    const t = i18n[currentLang];

    try {
        const response = await fetch("https://site.api.espn.com/apis/site/v2/sports/cricket/13876/scoreboard");
        if (!response.ok) throw new Error("Sports API offline");
        
        const data = await response.json();
        const events = data.events || [];

        sportsMatchesList.innerHTML = "";

        if (events.length === 0) {
            sportsMatchesList.innerHTML = `
                <div class="match-card">
                    <span class="match-status" style="background:#64748b;">ℹ️ INFO</span>
                    <div class="match-title">${t.noMatches}</div>
                    <div class="match-sub">${t.matchSubDefault}</div>
                </div>`;
            return;
        }

        events.forEach(event => {
            const matchTitle = event.name || "Live Match";
            const statusDetail = event.status?.type?.detail || "🔴 LIVE";
            const competitionName = event.season?.slug || "Cricket Match";

            const card = document.createElement("div");
            card.className = "match-card";
            card.innerHTML = `
                <span class="match-status">${statusDetail.includes("Final") ? "🏁 FINISHED" : "🔴 LIVE"}</span>
                <div class="match-title">${matchTitle}</div>
                <div class="match-sub">${competitionName}</div>
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
