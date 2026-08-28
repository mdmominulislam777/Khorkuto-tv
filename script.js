// ==========================================
// StreamZX - Script (With Modern Custom Overlay Controls & Auto-Hide PiP Space)
// ==========================================

let channels = [];
let currentCategory = "Sports";
let isInitialLoad = true;
let hls = null;

// Safe LocalStorage Parsing for Favorites
let favorites = [];
try {
    const storedFavs = localStorage.getItem("favChannels");
    favorites = storedFavs ? JSON.parse(storedFavs) : [];
    if (!Array.isArray(favorites)) favorites = [];
} catch (e) {
    favorites = [];
}

// Custom Playlists state
let customPlaylists = JSON.parse(localStorage.getItem("customPlaylists") || "[]");

// ==========================================
// MONETAG ADS CONFIG
// ==========================================
let firstChannelAdShown = false;
let isAdShowing = false;

// ==========================================
// DOM ELEMENTS
// ==========================================
let channelList;
let video;
let search;
let searchArea;
let playerContainer;
let currentChannelName;
let mainSectionTitle;
let categoryPage;
let settingsPage;

// Overlay Player Elements
let playerOverlay;
let lockOverlay;
let isLocked = false;
let overlayTimeout = null;
let currentAspectRatioIndex = 0;
const aspectRatios = ["contain", "cover", "fill"];

// ==========================================
// APP START
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Telegram WebApp Ready Check
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    // Main Elements
    channelList = document.getElementById("channelList");
    video = document.getElementById("video");
    search = document.getElementById("search");
    searchArea = document.getElementById("searchArea");
    playerContainer = document.getElementById("playerContainer");
    currentChannelName = document.getElementById("currentChannelName");
    mainSectionTitle = document.getElementById("mainSectionTitle");
    categoryPage = document.getElementById("categoryPage");
    settingsPage = document.getElementById("settingsPage");

    // Initialize Theme & Player Controls
    initTheme();
    initPlayerControls();

    // Splash Screen Auto-Timeout Safety
    setTimeout(() => {
        hideSplash();
    }, 2000);

    initApp();
});

// ==========================================
// INIT APP
// ==========================================
function initApp() {
    setupEventListeners();
    loadChannels();
}

// ==========================================
// CUSTOM PLAYER CONTROLS & PIP LISTENERS
// ==========================================
function initPlayerControls() {
    playerOverlay = document.getElementById("playerOverlay");
    lockOverlay = document.getElementById("lockOverlay");
    playerContainer = document.getElementById("playerContainer");

    const playPauseBtn = document.getElementById("playPauseBtn");
    const rewindBtn = document.getElementById("rewindBtn");
    const forwardBtn = document.getElementById("forwardBtn");
    const muteBtn = document.getElementById("muteBtn");
    const lockBtn = document.getElementById("lockBtn");
    const unlockBtn = document.getElementById("unlockBtn");
    
    // HTML-এর সাপেক্ষে ফিক্সড ID নামসমূহ:
    const aspectRatioBtn = document.getElementById("aspectBtn");
    const pipBtn = document.getElementById("pipPlayerBtn");
    const fullscreenBtn = document.getElementById("fullScreenBtn");
    const seekBar = document.getElementById("progressBar");
    const currentTimeEl = document.getElementById("currentTime");
    const durationEl = document.getElementById("durationTime");

    // PIP ENTRANCE & EXIT LISTENERS
    if (video) {
        video.addEventListener("enterpictureinpicture", () => {
            if (playerContainer) {
                playerContainer.style.display = "none";
            }
        });

        video.addEventListener("leavepictureinpicture", () => {
            if (playerContainer) {
                playerContainer.style.display = "block";
            }
        });
    }

    // Play / Pause Toggle
    if (playPauseBtn && video) {
        playPauseBtn.addEventListener("click", togglePlayPause);
        video.addEventListener("click", toggleOverlayVisibility);
    }

    // Rewind / Forward 10s
    if (rewindBtn && video) {
        rewindBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            video.currentTime = Math.max(0, video.currentTime - 10);
            resetOverlayTimeout();
        });
    }

    if (forwardBtn && video) {
        forwardBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
            resetOverlayTimeout();
        });
    }

    // Mute / Unmute
    if (muteBtn && video) {
        muteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            video.muted = !video.muted;
            const icon = muteBtn.querySelector("i");
            if (icon) {
                icon.className = video.muted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
            }
            resetOverlayTimeout();
        });
    }

    // Screen Lock Toggle
    if (lockBtn) {
        lockBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            isLocked = true;
            if (playerOverlay) playerOverlay.classList.add("hidden-overlay");
            if (lockOverlay) lockOverlay.classList.remove("hidden");
        });
    }

    if (unlockBtn) {
        unlockBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            isLocked = false;
            if (lockOverlay) lockOverlay.classList.add("hidden");
            if (playerOverlay) playerOverlay.classList.remove("hidden-overlay");
            resetOverlayTimeout();
        });
    }

    // Aspect Ratio Cycle
    if (aspectRatioBtn && video) {
        aspectRatioBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            currentAspectRatioIndex = (currentAspectRatioIndex + 1) % aspectRatios.length;
            video.style.objectFit = aspectRatios[currentAspectRatioIndex];
            resetOverlayTimeout();
        });
    }

    // Floating Picture-in-Picture Button
    if (pipBtn) {
        pipBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleFloatingPlayer();
            resetOverlayTimeout();
        });
    }

    // Fullscreen Toggle
    if (fullscreenBtn && video) {
        fullscreenBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleFullScreen();
            resetOverlayTimeout();
        });
    }

    // Progress Bar & Time Updates
    if (video) {
        video.addEventListener("timeupdate", () => {
            if (!video.duration) return;
            if (seekBar) {
                seekBar.value = (video.currentTime / video.duration) * 100;
            }
            if (currentTimeEl) currentTimeEl.textContent = formatTime(video.currentTime);
            if (durationEl) durationEl.textContent = formatTime(video.duration);
        });

        if (seekBar) {
            seekBar.addEventListener("input", (e) => {
                if (video.duration) {
                    video.currentTime = (e.target.value / 100) * video.duration;
                }
            });
        }

        video.addEventListener("play", updatePlayIcon);
        video.addEventListener("pause", updatePlayIcon);
    }
}

function togglePlayPause(e) {
    if (e) e.stopPropagation();
    if (!video) return;

    if (video.paused) {
        video.play().catch(err => console.log("Play error:", err));
    } else {
        video.pause();
    }
    resetOverlayTimeout();
}

function updatePlayIcon() {
    const playIcon = document.querySelector("#playPauseBtn i");
    if (playIcon) {
        playIcon.className = video.paused ? "fa-solid fa-play" : "fa-solid fa-pause";
    }
}

function toggleOverlayVisibility() {
    if (isLocked || !playerOverlay) return;

    if (playerOverlay.classList.contains("hidden-overlay")) {
        playerOverlay.classList.remove("hidden-overlay");
        resetOverlayTimeout();
    } else {
        playerOverlay.classList.add("hidden-overlay");
    }
}

function resetOverlayTimeout() {
    if (overlayTimeout) clearTimeout(overlayTimeout);
    if (!isLocked && playerOverlay) {
        playerOverlay.classList.remove("hidden-overlay");
        overlayTimeout = setTimeout(() => {
            if (video && !video.paused) {
                playerOverlay.classList.add("hidden-overlay");
            }
        }, 4000);
    }
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function toggleFullScreen() {
    const wrapper = document.querySelector(".video-player-wrapper") || video;
    if (!document.fullscreenElement) {
        if (wrapper.requestFullscreen) wrapper.requestFullscreen();
        else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
        else if (wrapper.msRequestFullscreen) wrapper.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}

// ==========================================
// THEME (DARK / LIGHT MODE) LOGIC
// ==========================================
function initTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        if (themeToggle) themeToggle.checked = false;
    } else {
        document.body.classList.remove("light-mode");
        if (themeToggle) themeToggle.checked = true;
    }

    if (themeToggle) {
        themeToggle.addEventListener("change", () => {
            if (themeToggle.checked) {
                document.body.classList.remove("light-mode");
                localStorage.setItem("theme", "dark");
            } else {
                document.body.classList.add("light-mode");
                localStorage.setItem("theme", "light");
            }
        });
    }
}

// ==========================================
// SPLASH SCREEN CONTROL
// ==========================================
function hideSplash() {
    const splash = document.getElementById("splash");
    if (splash && !splash.classList.contains("hidden")) {
        splash.classList.add("hidden");
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {

    // --- SEARCH BUTTON TOGGLE ---
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
        searchBtn.addEventListener("click", () => {
            if ((categoryPage && !categoryPage.classList.contains("hidden")) || 
                (settingsPage && !settingsPage.classList.contains("hidden"))) {
                return;
            }

            searchArea.classList.toggle("active");

            if (searchArea.classList.contains("active")) {
                search.focus();
            } else {
                search.value = "";
                renderChannels();
            }
        });
    }

    // --- PIP PLAYER BUTTON ---
    const pipPlayerBtn = document.getElementById("pipPlayerBtn");
    if (pipPlayerBtn) {
        pipPlayerBtn.addEventListener("click", toggleFloatingPlayer);
    }

    // --- FAVORITES HEADER BTN ---
    const favHeaderBtn = document.getElementById("favHeaderBtn");
    if (favHeaderBtn) {
        favHeaderBtn.addEventListener("click", () => {
            showNormalContent();
            currentCategory = "Favorites";
            updateSectionTitle();
            renderChannels();
            setActiveBottomNav(null);
        });
    }

    // --- REFRESH BUTTON ---
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadChannels();
        });
    }

    // --- SEARCH INPUT ---
    if (search) {
        search.addEventListener("input", () => {
            renderChannels();
        });
    }

    // --- CLOSE PLAYER BUTTON ---
    const closePlayerBtn = document.getElementById("closePlayerBtn");
    if (closePlayerBtn) {
        closePlayerBtn.addEventListener("click", closePlayer);
    }

    // ==========================================
    // BOTTOM NAVIGATION LISTENERS
    // ==========================================
    const liveEventBtn = document.getElementById("liveEventNav");
    const categoryNavBtn = document.getElementById("categoryNav");
    const sportsNavBtn = document.getElementById("sportsNav");
    const settingsNavBtn = document.getElementById("settingsNav");

    if (liveEventBtn) {
        liveEventBtn.addEventListener("click", () => {
            setActiveBottomNav(liveEventBtn);
            hideCategoryPage();
            hideSettingsPage();
            currentCategory = "Live Event";

            const mainContent = document.querySelector(".main-content");
            if (mainContent) mainContent.style.display = "block";

            if (mainSectionTitle) mainSectionTitle.textContent = "🔴 Live Events";

            renderLiveEventsUI();
            startLiveEventsRefresh();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // ==========================================
    // LIVE EVENTS — Cloudflare Worker থেকে ম্যাচ আনা
    // ==========================================
    const LIVE_EVENTS_API = "https://streamzx.mdmominulislam5600.workers.dev";
    let currentEventsFilter = "all";

    function todayISO(offsetDays = 0) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split("T")[0];
    }

    function buildEventsQuery(sportKey, filter) {
        return `?sport=${sportKey}&filter=${filter}`;
    }

    const TEAM_SPORTS = {
        football: { emoji: "⚽", label: "Football" },
        wwe: { emoji: "🤼", label: "WWE" },
        hockey: { emoji: "🏒", label: "Hockey" },
        basketball: { emoji: "🏀", label: "Basketball" },
        rugby: { emoji: "🏉", label: "Rugby" }
    };

    let currentSport = "all";

    const FILTER_LABELS = {
        all: "☰ All",
        live: "🔴 Live",
        today: "🕐 Today's",
        upcoming: "📅 Upcoming",
        ended: "✅ Ended"
    };
    let sportTabCounts = {};
    let sportBadgeCounts = {};

    function updateSportIconBadges() {
        const tabsWrap = document.getElementById("sportTabs");
        if (!tabsWrap) return;
        tabsWrap.querySelectorAll("button").forEach(btn => {
            const key = btn.dataset.sport;
            const count = sportBadgeCounts[key];
            const circle = btn.querySelector(".sport-icon-circle");
            if (!circle) return;
            let badge = circle.querySelector(".sport-badge");
            if (count == null || count === 0) {
                if (badge) badge.remove();
                return;
            }
            if (!badge) {
                badge = document.createElement("span");
                badge.className = "sport-badge";
                badge.style.cssText = "position:absolute; top:-4px; right:-4px; background:var(--primary, #ff2a4b); color:#fff; font-size:10px; font-weight:bold; border-radius:10px; min-width:16px; height:16px; display:flex; align-items:center; justify-content:center; padding:0 3px; line-height:1;";
                circle.appendChild(badge);
            }
            badge.textContent = count > 99 ? "99+" : String(count);
        });
    }

    function filterLabelWithCount(key) {
        const base = FILTER_LABELS[key];
        return sportTabCounts[key] != null ? `${base} (${sportTabCounts[key]})` : base;
    }

    function renderLiveEventsUI() {
        if (!channelList) return;

        // আইকন সারিটা যাতে ক্লিক করার পর আবার শুরুতে "লাফ" দিয়ে ফিরে না যায়,
        // তার জন্য আগের স্ক্রল পজিশন মনে রাখা হচ্ছে
        const prevSportTabs = document.getElementById("sportTabs");
        const prevScrollLeft = prevSportTabs ? prevSportTabs.scrollLeft : 0;

        const wrap = document.createElement("div");
        wrap.style.cssText = "grid-column:1/-1;";
        wrap.innerHTML = `
            <div id="sportTabs" style="display:flex; gap:16px; padding:8px 4px 16px; overflow-x:auto;">
                ${[
                    ["all", "☰", "All"],
                    ["cricket", "🏏", "Cricket"],
                    ["football", "⚽", "Football"],
                    ["wwe", "🤼", "WWE"],
                    ["hockey", "🏒", "Hockey"],
                    ["basketball", "🏀", "Basketball"],
                    ["rugby", "🏉", "Rugby"]
                ].map(([key, icon, label]) => `
                    <button data-sport="${key}" style="flex-shrink:0; display:flex; flex-direction:column; align-items:center; gap:4px; background:transparent; border:none;">
                        <span class="sport-icon-circle" style="position:relative; width:46px; height:46px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; border:2px solid ${currentSport === key ? "var(--primary, #ff2a4b)" : "rgba(128,128,128,0.3)"}; background:${currentSport === key ? "rgba(255,42,75,0.1)" : "transparent"};">${icon}</span>
                        <span style="font-size:11px; color:${currentSport === key ? "var(--primary, #ff2a4b)" : "var(--text-muted, #888)"}; font-weight:${currentSport === key ? "bold" : "normal"};">${label}</span>
                    </button>
                `).join("")}
            </div>
            <div id="eventsFilterTabs" style="display:flex; gap:8px; overflow-x:auto; padding:4px 2px 14px;">
                ${["all", "live", "today", "upcoming", "ended"].map(key => `
                    <button data-filter="${key}" style="flex-shrink:0; padding:8px 16px; border-radius:20px; border:1px solid var(--primary, #ff2a4b); background:${currentEventsFilter === key ? "var(--primary, #ff2a4b)" : "transparent"}; color:${currentEventsFilter === key ? "#fff" : "var(--primary, #ff2a4b)"}; font-size:13px; white-space:nowrap;">${filterLabelWithCount(key)}</button>
                `).join("")}
            </div>
            <div id="eventsListContainer"></div>
        `;
        channelList.innerHTML = "";
        channelList.appendChild(wrap);

        const newSportTabs = document.getElementById("sportTabs");
        if (newSportTabs && prevScrollLeft) {
            newSportTabs.scrollLeft = prevScrollLeft;
        }
        updateSportIconBadges();

        wrap.querySelectorAll("#sportTabs button").forEach(btn => {
            btn.addEventListener("click", () => {
                currentSport = btn.dataset.sport;
                sportTabCounts = {}; // নতুন স্পোর্টে আগের কাউন্ট যেন না দেখায়
                renderLiveEventsUI();
                startLiveEventsRefresh();
                updateSportTabCounts(currentSport);
            });
        });

        wrap.querySelectorAll("#eventsFilterTabs button").forEach(btn => {
            btn.addEventListener("click", () => {
                currentEventsFilter = btn.dataset.filter;
                renderLiveEventsUI();
                startLiveEventsRefresh();
            });
        });

        loadLiveEvents();
    }

    // নির্দিষ্ট একটা স্পোর্ট বেছে নিলে (যেমন শুধু Cricket, বা শুধু Football),
    // ফিল্টার ট্যাবগুলোতে Sportzfy-এর মতো সংখ্যা দেখানোর জন্য একবার বিস্তৃত ডেটা এনে
    // Live/Today's/Upcoming/All-এর কাউন্ট হিসাব করা হয়। "All" (সব স্পোর্ট একসাথে)
    // মোডে এটা দেখানো হয় না, কারণ প্রতিটা স্পোর্টের জন্য আলাদা কাউন্ট করতে গেলে
    // অনেক বেশি API কল লাগবে।
    async function updateSportTabCounts(sportKey) {
        if (sportKey === "all") return;

        try {
            let rawMatches = [];
            if (sportKey === "cricket") {
                const res = await fetch(LIVE_EVENTS_API + "?sport=cricket");
                const data = await res.json();
                rawMatches = (data && data.data) || [];
            } else {
                const res = await fetch(LIVE_EVENTS_API + buildEventsQuery(sportKey, "all"));
                const data = await res.json();
                rawMatches = (data && data.matches) || [];
            }

            // এর মধ্যে ইউজার অন্য স্পোর্টে চলে গেলে পুরনো কাউন্ট যেন না বসে
            if (currentSport !== sportKey) return;

            const now = new Date();
            const todayStr = todayISO(0);
            let counts;

            if (sportKey === "cricket") {
                counts = {
                    live: rawMatches.filter(isGenuinelyLiveCricketMatch).length,
                    today: rawMatches.filter(m => (m.date || "").startsWith(todayStr)).length,
                    upcoming: rawMatches.filter(m => !m.matchStarted && new Date(m.dateTimeGMT) > now).length,
                    all: rawMatches.filter(m => !m.matchEnded).length
                };
            } else {
                counts = {
                    live: rawMatches.filter(m => m.status === "IN_PLAY").length,
                    today: rawMatches.filter(m => new Date(m.utcDate).toDateString() === now.toDateString()).length,
                    upcoming: rawMatches.filter(m => m.status === "SCHEDULED" && new Date(m.utcDate) > now).length,
                    all: rawMatches.filter(m => m.status !== "FINISHED").length
                };
            }

            sportTabCounts = counts;

            // পুরো UI আবার না বানিয়ে, শুধু ফিল্টার বাটনগুলোর লেখা আপডেট করা হচ্ছে
            const tabsWrap = document.getElementById("eventsFilterTabs");
            if (!tabsWrap) return;
            tabsWrap.querySelectorAll("button").forEach(btn => {
                const key = btn.dataset.filter;
                btn.textContent = filterLabelWithCount(key);
            });
        } catch (err) {
            // কাউন্ট আনতে ব্যর্থ হলে চুপচাপ থাকবে — প্লেইন লেবেলই দেখাবে, অ্যাপ ভাঙবে না
        }
    }

    // ==========================================
    // লিগ → চ্যানেল ম্যাপিং (নির্দিষ্ট লিগের জন্য, সবচেয়ে বেশি অগ্রাধিকার)
    // চাইলে নির্দিষ্ট কোনো লিগ কোন চ্যানেলে দেখাও সেটা এখানে বসাতে পারো —
    // কিন্তু এটা খালি রাখলেও অ্যাপ স্বয়ংক্রিয়ভাবে চ্যানেল বেছে নিবে (নিচে দেখো)
    // ==========================================
    const LEAGUE_TO_CHANNEL_MAP = {
        // "premier league": "T Sports",
        // "la liga": "Bein Sports",
    };

    // ==========================================
    // কোন চ্যানেলে সাধারণত কোন স্পোর্ট দেখানো হয় — এটা তুমি নিজে জানিয়েছ
    // key = channels.json-এর চ্যানেল নামের অংশ (ছোট হাতের অক্ষরে)
    // value = স্পোর্ট কী-গুলোর অ্যারে (football/cricket/basketball/hockey/rugby/wwe)
    // ==========================================
    const CHANNEL_SPORTS_TAGS = {
        "gazi tv": ["cricket"],
        "t sports": ["cricket"],
        "a sports hd": ["cricket"],
        "ptv sports hd": ["cricket"],
        "bein sports direct hd": ["football", "basketball", "tennis", "motorsport", "rugby"],
        "ten cricket": ["cricket"],
        "star sports 1 hd": ["football", "cricket", "kabaddi"],
        "star sports 1 hindi": ["football", "cricket", "kabaddi"],
        "star sports 2": ["football", "cricket", "kabaddi"],
        "willow hd": ["cricket"],
        "eurosport hd": ["tennis", "kabaddi"],
        // নতুন যোগ হওয়া চ্যানেল (PDF থেকে) — শুধু তোমার দেওয়া তালিকায়
        // স্পষ্টভাবে থাকা মিলগুলোই বসানো হয়েছে
        "eurosport 1": ["tennis", "kabaddi"],
        "eurosport 2": ["tennis", "kabaddi"],
        "dazn": ["football", "basketball", "tennis", "motorsport", "hockey", "rugby"],
        "espn": ["football", "cricket", "basketball", "tennis", "motorsport", "wwe", "hockey", "rugby"],
        "sky sports cricket": ["cricket"],
        "sky sports football": ["football"],
        "sky sports mix": ["football"],
        "sky sports tennis": ["tennis"],
        "sky sports f1": ["motorsport"],
        "sky sports epl": ["football"], // চ্যানেলের নাম থেকেই স্পষ্ট (EPL = ফুটবল)
        "football world cup 2026 fast": ["football"], // নাম থেকেই স্পষ্ট
        "dd sports": ["kabaddi"],
        "tnt sports": ["football", "basketball", "tennis", "wwe", "hockey", "rugby"],
        "bein sports 1 hd": ["football", "basketball", "tennis", "motorsport", "rugby"],
        "bein sports 3 hd": ["football", "basketball", "tennis", "motorsport", "rugby"],
        "bein sports 4 hd": ["football", "basketball", "tennis", "motorsport", "rugby"],
        "bein sports 5 hd": ["football", "basketball", "tennis", "motorsport", "rugby"],
        // নিচের চ্যানেলগুলো (Ziggo Sport, Trace Sport, Sky Sports Action/Golf/Racing,
        // GO 3 Sport, Star Sports Khel, Sport 1/2) তোমার দেওয়া কোনো তালিকাতেই
        // ছিল না, তাই অনুমান করে ট্যাগ বসানো হয়নি — এগুলো এখন সাধারণ
        // "Sports" ক্যাটাগরি fallback দিয়ে চলবে
    };

    function getChannelSportTags(channel) {
        const nameLower = String(channel.name || "").toLowerCase();
        const matchedKey = Object.keys(CHANNEL_SPORTS_TAGS).find(key => nameLower.includes(key));
        return matchedKey ? CHANNEL_SPORTS_TAGS[matchedKey] : null;
    }

    function findChannelForLeague(leagueName, sportKey, matchIdentifier) {
        const leagueLower = String(leagueName || "").toLowerCase();
        const matchedLeagueKey = Object.keys(LEAGUE_TO_CHANNEL_MAP).find(key => leagueLower.includes(key));

        if (matchedLeagueKey) {
            const patternLower = LEAGUE_TO_CHANNEL_MAP[matchedLeagueKey].toLowerCase();
            const found = channels.find(c => String(c.name || "").toLowerCase().includes(patternLower));
            if (found) return found;
        }

        // "Sports" ক্যাটাগরির চ্যানেলগুলোর মধ্যে খোঁজা হচ্ছে
        const sportsChannels = channels.filter(c => String(c.category || "").toLowerCase().includes("sport"));
        if (sportsChannels.length === 0) return null;

        const hashSource = String(matchIdentifier || leagueName || "").toLowerCase();
        let hash = 0;
        for (let i = 0; i < hashSource.length; i++) {
            hash = (hash * 31 + hashSource.charCodeAt(i)) >>> 0;
        }

        if (sportKey) {
            // প্রথম অগ্রাধিকার: তুমি নিজে যেসব চ্যানেলে এই স্পোর্ট ট্যাগ করেছ
            const taggedChannels = sportsChannels.filter(c => {
                const tags = getChannelSportTags(c);
                return tags && tags.includes(sportKey);
            });
            if (taggedChannels.length > 0) {
                return taggedChannels[hash % taggedChannels.length];
            }

            // ট্যাগ না থাকলে, চ্যানেলের নামেই স্পোর্টের কিওয়ার্ড আছে কিনা দেখা হচ্ছে
            const keywordMatch = sportsChannels.find(c => String(c.name || "").toLowerCase().includes(String(sportKey).toLowerCase()));
            if (keywordMatch) return keywordMatch;
        }

        // নির্দিষ্ট মিল না পেলে, "Sports" ক্যাটাগরির যেকোনো একটা চ্যানেল
        // স্বয়ংক্রিয়ভাবে যুক্ত করে দেওয়া হয় — একই ম্যাচ সবসময় একই চ্যানেলে থাকে
        return sportsChannels[hash % sportsChannels.length];
    }

    function handleMatchCardClick(leagueName, sportKey, matchIdentifier) {
        const matchedChannel = findChannelForLeague(leagueName, sportKey, matchIdentifier);
        if (matchedChannel) {
            playChannelWithAd(matchedChannel);
        } else {
            alert("এই ম্যাচের জন্য এখনো কোনো চ্যানেল যুক্ত করা হয়নি।");
        }
    }

    // ম্যাচ কার্ডে দেখানোর জন্য চ্যানেল-ব্যাজের HTML — চ্যানেলের আসল নাম
    // দেখানো হয় না (ইচ্ছাকৃতভাবে), শুধু বোঝানো হয় যে দেখার একটা চ্যানেল আছে
    function channelBadgeHtml(leagueName, sportKey, matchIdentifier) {
        const matchedChannel = findChannelForLeague(leagueName, sportKey, matchIdentifier);
        if (!matchedChannel) return "";
        return `<div style="margin-top:6px; font-size:10px; color:var(--primary, #ff2a4b); display:flex; align-items:center; justify-content:center; gap:4px;"><i class="fa-solid fa-tv"></i> Watch Live</div>`;
    }


    let liveEventsRequestId = 0;

    async function loadLiveEvents(silent = false) {
        const listEl = document.getElementById("eventsListContainer");
        if (!listEl) return;

        const requestId = ++liveEventsRequestId;

        if (!silent) {
            listEl.innerHTML = `
                <div style="text-align:center; padding:40px 20px; color:var(--text-muted, #888);">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size:32px; margin-bottom:15px; display:block;"></i>
                    <div>লোড হচ্ছে...</div>
                </div>
            `;
        }

        // নতুন ডেটা আগে একটা অদৃশ্য কন্টেইনারে তৈরি হবে,
        // যাতে রিফ্রেশের সময় স্ক্রিনে খালি/স্পিনার ফ্ল্যাশ না করে
        // এবং পুরনো কার্ডের সাথে ডুপ্লিকেট হয়ে না জমে
        const tempContainer = document.createElement("div");

        if (currentSport === "cricket") {
            await loadCricketEvents(tempContainer, false);
        } else if (currentSport === "all") {
            // সব স্পোর্ট একসাথে (parallel) লোড হবে গতির জন্য,
            // কিন্তু দেখানোর ক্রম (football, cricket, তারপর বাকিগুলো) ঠিক রাখা হয়
            const order = ["football", "cricket", ...Object.keys(TEAM_SPORTS).filter(k => k !== "football")];
            const sections = {};
            await Promise.all(order.map(async key => {
                const sectionContainer = document.createElement("div");
                if (key === "cricket") {
                    await loadCricketEvents(sectionContainer, true);
                } else {
                    await loadTeamSportEvents(sectionContainer, true, key);
                }
                sections[key] = sectionContainer;
            }));
            order.forEach(key => {
                const sec = sections[key];
                while (sec.firstChild) {
                    tempContainer.appendChild(sec.firstChild);
                }
            });

            // যা ডেটা এমনিতেই আনা হলো, তা থেকেই "All" আইকনের ব্যাজ আর
            // বর্তমান ফিল্টার ট্যাবের কাউন্ট বসানো হচ্ছে — কোনো এক্সট্রা কল ছাড়াই
            const totalCount = order.reduce((sum, key) => sum + (sportBadgeCounts[key] || 0), 0);
            sportBadgeCounts.all = totalCount;
            sportTabCounts[currentEventsFilter] = totalCount;
            updateSportIconBadges();
            const filterBtn = document.querySelector(`#eventsFilterTabs button[data-filter="${currentEventsFilter}"]`);
            if (filterBtn) filterBtn.textContent = filterLabelWithCount(currentEventsFilter);
        } else if (TEAM_SPORTS[currentSport]) {
            await loadTeamSportEvents(tempContainer, false, currentSport);
        }

        addNoMatchesMessageIfEmpty(tempContainer);

        // এর মধ্যে ট্যাব/ফিল্টার বদলে নতুন রিকোয়েস্ট শুরু হয়ে থাকলে,
        // এই পুরনো রেসপন্স আর বসানো হবে না
        if (requestId !== liveEventsRequestId) return;

        const activeListEl = document.getElementById("eventsListContainer");
        if (!activeListEl) return;

        activeListEl.innerHTML = "";
        while (tempContainer.firstChild) {
            activeListEl.appendChild(tempContainer.firstChild);
        }
    }

    function addNoMatchesMessageIfEmpty(container) {
        if (container.children.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px 20px; color:var(--text-muted, #888);">
                    <i class="fa-solid fa-tower-broadcast" style="font-size:40px; margin-bottom:15px; display:block; color:var(--primary, #ff2a4b);"></i>
                    <div>এই মুহূর্তে কোনো ম্যাচ নেই</div>
                    <small>ম্যাচ শুরু হলে এখানেই দেখা যাবে।</small>
                </div>
            `;
        }
    }

    async function loadTeamSportEvents(container, showSportLabel, sportKey) {
        const sportInfo = TEAM_SPORTS[sportKey] || { emoji: "🏆", label: sportKey };
        try {
            const res = await fetch(LIVE_EVENTS_API + buildEventsQuery(sportKey, currentEventsFilter));
            const data = await res.json();
            const rawMatches = (data && data.matches) || [];

            // সেফটি-চেক: status ফিল্ড কখনো দেরিতে আপডেট হয়,
            // তাই "Upcoming"-এ শুধু সেই ম্যাচগুলো রাখো যেগুলোর শুরুর সময় এখনো আসেনি।
            // "All"/"Today's"-এ শেষ হওয়া ম্যাচ বাদ দাও — সেটার জন্য আলাদা "Ended" ট্যাব আছে।
            const now = new Date();
            let matches = rawMatches;
            if (currentEventsFilter === "upcoming") {
                matches = rawMatches.filter(m => new Date(m.utcDate) > now);
            } else if (currentEventsFilter === "all" || currentEventsFilter === "today") {
                matches = rawMatches.filter(m => m.status !== "FINISHED");
            }

            sportBadgeCounts[sportKey] = matches.length;
            updateSportIconBadges();

            if (!matches.length) return;

            if (showSportLabel) {
                const sportHeader = document.createElement("div");
                sportHeader.style.cssText = "font-size:14px; font-weight:bold; margin:10px 0 6px; color:var(--text, inherit);";
                sportHeader.textContent = `${sportInfo.emoji} ${sportInfo.label}`;
                container.appendChild(sportHeader);
            }

            // লিগ অনুযায়ী গ্রুপ করা
            const byLeague = {};
            matches.forEach(m => {
                const league = m.competition?.name || sportInfo.label;
                if (!byLeague[league]) byLeague[league] = [];
                byLeague[league].push(m);
            });

            Object.keys(byLeague).forEach(league => {
                const leagueEmblem = byLeague[league][0].competition?.emblem || "";
                const leagueHeader = document.createElement("div");
                leagueHeader.style.cssText = "display:flex; align-items:center; gap:8px; margin:14px 0 8px; font-size:13px; color:var(--text-muted, #aaa); font-weight:bold;";
                leagueHeader.innerHTML = `${leagueEmblem ? `<img src="${escapeHTML(leagueEmblem)}" style="width:16px;height:16px;object-fit:contain;">` : sportInfo.emoji} ${escapeHTML(league)}`;
                container.appendChild(leagueHeader);

                byLeague[league].forEach(m => {
                    const home = escapeHTML(m.homeTeam?.name || "Home");
                    const away = escapeHTML(m.awayTeam?.name || "Away");
                    const homeLogo = escapeHTML(m.homeTeam?.crest || "logo.png");
                    const awayLogo = escapeHTML(m.awayTeam?.crest || "logo.png");

                    const isLive = m.status === "IN_PLAY" || m.status === "PAUSED";
                    const isFinished = m.status === "FINISHED";
                    // কিছু স্পোর্টে স্কোর সরাসরি সংখ্যা না হয়ে জটিল অবজেক্ট হয়ে আসতে পারে —
                    // তখন সরাসরি দেখালে "[object Object]" দেখাবে, তাই সংখ্যা কিনা যাচাই করা হচ্ছে
                    const formatScore = v => (typeof v === "number" && !isNaN(v)) ? v : "-";
                    const homeScore = formatScore(m.score?.fullTime?.home);
                    const awayScore = formatScore(m.score?.fullTime?.away);

                    let centerHtml;
                    if (isLive) {
                        centerHtml = `<div style="color:var(--primary, #ff2a4b); font-size:12px;">🔴 Live</div><div style="font-weight:bold; font-size:16px;">${homeScore} - ${awayScore}</div>`;
                    } else if (isFinished) {
                        centerHtml = `<div style="color:var(--text-muted, #888); font-size:12px;">Ended</div><div style="font-weight:bold; font-size:16px;">${homeScore} - ${awayScore}</div>`;
                    } else {
                        const dt = new Date(m.utcDate);
                        const timeStr = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        const dateStr = dt.toLocaleDateString([], { day: "2-digit", month: "short" });
                        centerHtml = `<div style="color:var(--text-muted, #888); font-size:11px;">${dateStr}</div><div style="font-size:13px;">${timeStr}</div>`;
                    }

                    const row = document.createElement("div");
                    row.style.cssText = "display:flex; flex-direction:column; border:1px solid rgba(128,128,128,0.2); border-radius:10px; padding:12px; margin-bottom:10px; cursor:pointer;";
                    row.addEventListener("click", () => handleMatchCardClick(league, sportKey, `${home} vs ${away}`));
                    row.innerHTML = `
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <div style="flex:1; text-align:center;">
                                <img src="${homeLogo}" alt="${home}" style="width:32px;height:32px;object-fit:contain; display:block; margin:0 auto 4px;">
                                <div style="font-size:11px;">${home}</div>
                            </div>
                            <div style="flex:0 0 70px; text-align:center;">${centerHtml}</div>
                            <div style="flex:1; text-align:center;">
                                <img src="${awayLogo}" alt="${away}" style="width:32px;height:32px;object-fit:contain; display:block; margin:0 auto 4px;">
                                <div style="font-size:11px;">${away}</div>
                            </div>
                        </div>
                        ${channelBadgeHtml(league, sportKey, `${home} vs ${away}`)}
                    `;
                    container.appendChild(row);
                });
            });
        } catch (err) {
            const errDiv = document.createElement("div");
            errDiv.style.cssText = "text-align:center; padding:20px; color:var(--text-muted, #888);";
            errDiv.textContent = `${sportInfo.label}-এর ডেটা লোড করা যায়নি।`;
            container.appendChild(errDiv);
        }
    }

    // ক্রিকেট টিমের লোগো — CricketData.org অনেক সময় আসল লোগোর বদলে
    // একটা জেনেরিক/নিম্নমানের প্লেসহোল্ডার ছবি পাঠায় (icon512.png বা তাদের
    // নিজস্ব ব্র্যান্ডিং শিল্ড)। সেগুলো শনাক্ত করে আসল লোগোর মতোই একটা
    // পরিষ্কার, সামঞ্জস্যপূর্ণ ফলব্যাক আইকন দেখানো হয়।
    // CricAPI-তে মাঝেমধ্যে walkover/বাতিল হওয়া ম্যাচের matchEnded ফ্ল্যাগ
    // ঠিকমতো আপডেট হয় না, ফলে সেটা চিরকাল "Live" দেখাতে থাকে। তাই সময়ও
    // যাচাই করা হচ্ছে — নির্দিষ্ট সময়ের বেশি হলে matchEnded যাই থাকুক,
    // আর "Live" ধরা হবে না।
    function isGenuinelyLiveCricketMatch(m) {
        if (!m.matchStarted || m.matchEnded) return false;
        const matchDate = new Date(m.dateTimeGMT);
        if (isNaN(matchDate.getTime())) return true; // তারিখ না থাকলে যাচাই করা যাবে না, তাই বাদ দেওয়া হচ্ছে না
        const hoursSinceStart = (new Date() - matchDate) / 36e5;
        const isTestMatch = (m.matchType || "").toLowerCase() === "test";
        const maxHours = isTestMatch ? 24 * 6 : 24;
        return hoursSinceStart <= maxHours;
    }

    function renderCricketTeamLogo(teamInfo, teamName) {
        const img = teamInfo && teamInfo.img;
        const isGenericPlaceholder = !img
            || img.includes("icon512.png")
            || img.toLowerCase().includes("cricketdata");

        if (!isGenericPlaceholder) {
            return `<img src="${escapeHTML(img)}" alt="${escapeHTML(teamName)}" style="width:32px;height:32px;object-fit:contain; display:block; margin:0 auto 4px;">`;
        }

        const initial = escapeHTML((teamName || "?").trim().charAt(0).toUpperCase() || "?");
        return `<div style="width:32px;height:32px;border-radius:50%;background:var(--primary, #ff2a4b);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;margin:0 auto 4px;">${initial}</div>`;
    }

    // ==========================================
    // ক্রিকেট — CricAPI (একই Worker দিয়ে, sport=cricket প্যারামিটারে)
    // ==========================================
    async function loadCricketEvents(container, showSportLabel) {
        try {
            const cricEndpoint = currentEventsFilter === "upcoming"
                ? "?sport=cricket&type=matches"
                : "?sport=cricket";
            const res = await fetch(LIVE_EVENTS_API + cricEndpoint);
            const data = await res.json();
            const rawMatches = (data && data.data) || [];

            const now = new Date();
            let matches = rawMatches;
            if (currentEventsFilter === "live") {
                matches = rawMatches.filter(isGenuinelyLiveCricketMatch);
            } else if (currentEventsFilter === "today") {
                const todayStr = todayISO(0);
                matches = rawMatches.filter(m => (m.date || "").startsWith(todayStr));
            } else if (currentEventsFilter === "upcoming") {
                matches = rawMatches.filter(m => !m.matchStarted && new Date(m.dateTimeGMT) > now);
            } else if (currentEventsFilter === "ended") {
                matches = rawMatches.filter(m => m.matchEnded || !isGenuinelyLiveCricketMatch(m) && m.matchStarted);
            } else if (currentEventsFilter === "all") {
                matches = rawMatches.filter(m => m.matchEnded ? false : (m.matchStarted ? isGenuinelyLiveCricketMatch(m) : true));
            }

            sportBadgeCounts.cricket = matches.length;
            updateSportIconBadges();

            if (!matches.length) {
                // combined ("all sport") মোডে খালি হলে কিছু বলার দরকার নেই —
                // overall "কোনো ম্যাচ নেই" মেসেজ addNoMatchesMessageIfEmpty দেখাবে
                if (!showSportLabel) {
                    container.innerHTML = `
                        <div style="text-align:center; padding:40px 20px; color:var(--text-muted, #888);">
                            <i class="fa-solid fa-tower-broadcast" style="font-size:40px; margin-bottom:15px; display:block; color:var(--primary, #ff2a4b);"></i>
                            <div>এই মুহূর্তে কোনো ম্যাচ নেই</div>
                            <small>ম্যাচ শুরু হলে এখানেই দেখা যাবে।</small>
                        </div>
                    `;
                }
                return;
            }

            if (showSportLabel) {
                const sportHeader = document.createElement("div");
                sportHeader.style.cssText = "font-size:14px; font-weight:bold; margin:10px 0 6px; color:var(--text, inherit);";
                sportHeader.textContent = "🏏 Cricket";
                container.appendChild(sportHeader);
            }

            // ম্যাচ টাইপ (T20/ODI/Test) অনুযায়ী গ্রুপ করা
            const byType = {};
            matches.forEach(m => {
                const type = (m.matchType || "cricket").toUpperCase();
                if (!byType[type]) byType[type] = [];
                byType[type].push(m);
            });

            Object.keys(byType).forEach(type => {
                const header = document.createElement("div");
                header.style.cssText = "display:flex; align-items:center; gap:8px; margin:14px 0 8px; font-size:13px; color:var(--text-muted, #aaa); font-weight:bold;";
                header.innerHTML = `🏏 ${escapeHTML(type)}`;
                container.appendChild(header);

                byType[type].forEach(m => {
                    const team1 = escapeHTML((m.teams && m.teams[0]) || "Team 1");
                    const team2 = escapeHTML((m.teams && m.teams[1]) || "Team 2");
                    const team1Info = m.teamInfo && m.teamInfo[0];
                    const team2Info = m.teamInfo && m.teamInfo[1];

                    let centerHtml;
                    if (isGenuinelyLiveCricketMatch(m)) {
                        centerHtml = `<div style="color:var(--primary, #ff2a4b); font-size:12px;">🔴 Live</div><div style="font-size:10px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHTML(m.status || "")}</div>`;
                    } else if (m.matchEnded || m.matchStarted) {
                        centerHtml = `<div style="color:var(--text-muted, #888); font-size:12px;">Ended</div><div style="font-size:10px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHTML(m.status || "")}</div>`;
                    } else {
                        const dt = new Date(m.dateTimeGMT);
                        const timeStr = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        const dateStr = dt.toLocaleDateString([], { day: "2-digit", month: "short" });
                        centerHtml = `<div style="color:var(--text-muted, #888); font-size:11px;">${dateStr}</div><div style="font-size:13px;">${timeStr}</div>`;
                    }

                    const row = document.createElement("div");
                    row.style.cssText = "display:flex; flex-direction:column; border:1px solid rgba(128,128,128,0.2); border-radius:10px; padding:12px; margin-bottom:10px; cursor:pointer;";
                    row.addEventListener("click", () => handleMatchCardClick(m.matchType || "cricket", "cricket", `${team1} vs ${team2}`));
                    row.innerHTML = `
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <div style="flex:1; text-align:center;">
                                ${renderCricketTeamLogo(team1Info, team1)}
                                <div style="font-size:11px;">${team1}</div>
                            </div>
                            <div style="flex:0 0 70px; text-align:center;">${centerHtml}</div>
                            <div style="flex:1; text-align:center;">
                                ${renderCricketTeamLogo(team2Info, team2)}
                                <div style="font-size:11px;">${team2}</div>
                            </div>
                        </div>
                        ${channelBadgeHtml(m.matchType || "cricket", "cricket", `${team1} vs ${team2}`)}
                    `;
                    container.appendChild(row);
                });
            });
        } catch (err) {
            const errDiv = document.createElement("div");
            errDiv.style.cssText = "text-align:center; padding:20px; color:var(--text-muted, #888);";
            errDiv.textContent = "ক্রিকেটের ডেটা লোড করা যায়নি।";
            container.appendChild(errDiv);
        }
    }

    let liveEventsRefreshTimer = null;

    function stopLiveEventsRefresh() {
        if (liveEventsRefreshTimer) {
            clearInterval(liveEventsRefreshTimer);
            liveEventsRefreshTimer = null;
        }
    }

    function startLiveEventsRefresh() {
        stopLiveEventsRefresh();
        // শুধু "Live" ফিল্টারেই বারবার রিফ্রেশ দরকার —
        // Today's/Upcoming/Ended-এর ডেটা মিনিটে মিনিটে বদলায় না,
        // তাই ওখানে বারবার কল করলে শুধু API কোটাই খরচ হবে
        if (currentEventsFilter !== "live") return;
        // "All"-এ একসাথে ১০টা স্পোর্ট লোড হয় — প্রতি ৩০ সেকেন্ডে সবগুলো
        // আবার রিফ্রেশ করা অনেক ভারী, তাই "All"-এ অটো-রিফ্রেশ বন্ধ রাখা হলো
        if (currentSport === "all") return;
        const interval = (typeof CONFIG !== "undefined" && CONFIG.REFRESH_INTERVAL) ? CONFIG.REFRESH_INTERVAL : 30000;
        liveEventsRefreshTimer = setInterval(() => loadLiveEvents(true), interval);
    }

    if (categoryNavBtn) {
        categoryNavBtn.addEventListener("click", () => {
            stopLiveEventsRefresh();
            setActiveBottomNav(categoryNavBtn);
            showCategoryPage();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    if (sportsNavBtn) {
        sportsNavBtn.addEventListener("click", () => {
            stopLiveEventsRefresh();
            setActiveBottomNav(sportsNavBtn);
            hideCategoryPage();
            hideSettingsPage();
            showNormalContent();

            currentCategory = "Sports";
            updateSectionTitle();
            renderChannels();

            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    if (settingsNavBtn) {
        settingsNavBtn.addEventListener("click", () => {
            stopLiveEventsRefresh();
            setActiveBottomNav(settingsNavBtn);
            showSettingsPage();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // --- CATEGORY GRID ITEMS ---
    document.querySelectorAll(".category-item").forEach(item => {
        item.addEventListener("click", () => {
            const selectedCategory = item.dataset.category;
            currentCategory = selectedCategory;

            hideCategoryPage();
            hideSettingsPage();
            showNormalContent();

            updateSectionTitle();
            renderChannels();

            if (selectedCategory === "Sports") {
                setActiveBottomNav(sportsNavBtn);
            } else {
                setActiveBottomNav(categoryNavBtn);
            }

            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    setupSettingsActions();
}

// ==========================================
// PLAYLIST MANAGER & SETTINGS LOGIC
// ==========================================
function setupSettingsActions() {
    const playlistItem = getSettingsItemByText("Playlists");
    const playlistModal = document.getElementById("playlistModal");
    const closePlaylistModal = document.getElementById("closePlaylistModal");
    const openAddPlaylistBtn = document.getElementById("openAddPlaylistBtn");
    const addPlaylistForm = document.getElementById("addPlaylistForm");
    const savePlaylistBtn = document.getElementById("savePlaylistBtn");

    if (playlistItem && playlistModal) {
        playlistItem.addEventListener("click", () => {
            playlistModal.classList.remove("hidden");
            renderPlaylists();
        });
    }

    if (closePlaylistModal) {
        closePlaylistModal.addEventListener("click", () => {
            playlistModal.classList.add("hidden");
        });
    }

    if (openAddPlaylistBtn) {
        openAddPlaylistBtn.addEventListener("click", () => {
            addPlaylistForm.classList.toggle("hidden");
        });
    }

    let uploadedFileContent = "";
    const playlistFileInput = document.getElementById("playlistFileInput");
    if (playlistFileInput) {
        playlistFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedFileContent = event.target.result;
                    alert(`Selected File: ${file.name}`);
                };
                reader.readAsText(file);
            }
        });
    }

    if (savePlaylistBtn) {
        savePlaylistBtn.addEventListener("click", async () => {
            const name = document.getElementById("playlistNameInput").value.trim() || "Custom Playlist";
            const url = document.getElementById("playlistUrlInput").value.trim();

            if (!url && !uploadedFileContent) {
                alert("Please enter a M3U URL or upload an M3U file!");
                return;
            }

            let parsedChannels = [];

            if (uploadedFileContent) {
                parsedChannels = parseM3UContent(uploadedFileContent);
            } else if (url) {
                try {
                    const res = await fetch(url);
                    const text = await res.text();
                    parsedChannels = parseM3UContent(text);
                } catch (err) {
                    parsedChannels = [{ id: Date.now(), name: name, category: "Custom", url: url, logo: "logo.png" }];
                }
            }

            if (parsedChannels.length === 0) {
                alert("No valid channels found in the Playlist!");
                return;
            }

            const newPL = {
                id: Date.now(),
                name: name,
                channels: parsedChannels
            };

            customPlaylists.push(newPL);
            localStorage.setItem("customPlaylists", JSON.stringify(customPlaylists));

            document.getElementById("playlistNameInput").value = "";
            document.getElementById("playlistUrlInput").value = "";
            uploadedFileContent = "";
            addPlaylistForm.classList.add("hidden");
            renderPlaylists();
        });
    }

    const networkStreamBtn = document.getElementById("settingsNetworkStreamBtn");
    if (networkStreamBtn) {
        networkStreamBtn.addEventListener("click", () => {
            const streamUrl = prompt("Enter Video or HLS (.m3u8) Stream URL:");
            if (streamUrl && streamUrl.trim() !== "") {
                playChannel({
                    name: "Network Stream",
                    url: streamUrl.trim(),
                    logo: "logo.png"
                });
            }
        });
    }

    const clearDataBtn = document.getElementById("settingsClearDataBtn");
    if (clearDataBtn) {
        clearDataBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear all data and playlists?")) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    const exitBtn = document.getElementById("settingsExitBtn");
    if (exitBtn) {
        exitBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to exit?")) {
                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.close();
                } else if (window.navigator && window.navigator.app && window.navigator.app.exitApp) {
                    window.navigator.app.exitApp();
                } else {
                    window.close();
                }
            }
        });
    }

    // NOTICE MODAL LOGIC
    const noticeItem = document.getElementById("settingsNoticeBtn") || getSettingsItemByText("Notice");
    const noticeModal = document.getElementById("noticeModal");
    const closeNoticeModal = document.getElementById("closeNoticeModal");

    if (noticeItem && noticeModal) {
        noticeItem.addEventListener("click", () => {
            noticeModal.classList.remove("hidden");
            loadNoticeContent();
        });
    }

    if (closeNoticeModal) {
        closeNoticeModal.addEventListener("click", () => {
            noticeModal.classList.add("hidden");
        });
    }

    if (noticeModal) {
        noticeModal.addEventListener("click", (e) => {
            if (e.target === noticeModal) {
                noticeModal.classList.add("hidden");
            }
        });
    }

    // COPYRIGHT MODAL LOGIC
    const copyrightBtn = document.getElementById("settingsCopyrightBtn") || getSettingsItemByText("Copyright");
    const copyrightModal = document.getElementById("copyrightModal");
    const closeCopyrightModal = document.getElementById("closeCopyrightModal");

    if (copyrightBtn && copyrightModal) {
        copyrightBtn.addEventListener("click", () => {
            copyrightModal.classList.remove("hidden");
        });
    }

    if (closeCopyrightModal && copyrightModal) {
        closeCopyrightModal.addEventListener("click", () => {
            copyrightModal.classList.add("hidden");
        });
    }

    if (copyrightModal) {
        copyrightModal.addEventListener("click", (e) => {
            if (e.target === copyrightModal) copyrightModal.classList.add("hidden");
        });
    }

    // SHARE APP LOGIC
    const shareBtn = document.getElementById("settingsShareBtn") || getSettingsItemByText("Share Our App");
    if (shareBtn) {
        shareBtn.addEventListener("click", async () => {
            const shareData = {
                title: "StreamZX - Live TV & Sports",
                text: "StreamZX অ্যাপ দিয়ে সরাসরি ফ্রিতে দেখুন সকল লাইভ স্পোর্টস ও টিভি চ্যানেল। অ্যাপটি এখনই ডাউনলোড করুন!",
                url: window.location.href
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log("Sharing cancelled", err);
                }
            } else {
                navigator.clipboard.writeText(shareData.url);
                alert("App link copied to clipboard! Share it with your friends.");
            }
        });
    }

    // EMAIL CONTACT LOGIC
    const emailBtn = document.getElementById("settingsEmailBtn") || getSettingsItemByText("Email Us") || getSettingsItemByText("Email");
    if (emailBtn) {
        emailBtn.addEventListener("click", () => {
            const adminEmail = "support@streamzx.com";
            const subject = encodeURIComponent("StreamZX App Support / DMCA Request");
            const body = encodeURIComponent("Hello StreamZX Team,\n\nI want to inform/ask about:\n");

            window.location.href = `mailto:${adminEmail}?subject=${subject}&body=${body}`;
        });
    }
}

// ==========================================
// LOAD NOTICE CONTENT FUNCTION
// ==========================================
function loadNoticeContent() {
    const noticeBody = document.getElementById("noticeBody");
    if (!noticeBody) return;

    const noticeData = {
        title: "📢 StreamZX আপডেট ও ঘোষণা",
        date: new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
        message: "আমাদের StreamZX অ্যাপে স্বাগতম! কোনো চ্যানেল চলতে সমস্যা হলে রিফ্রেশ বাটন ব্যবহার করুন। সর্বাধুনিক স্পোর্টস লিঙ্ক এবং আপডেট পাওয়ার জন্য আমাদের টেলিগ্রাম চ্যানেলে যুক্ত থাকুন।"
    };

    noticeBody.innerHTML = `
        <div class="notice-box" style="text-align: left;">
            <h4 style="margin-bottom: 6px; color: var(--primary, #ff2a4b); font-size: 16px;">${escapeHTML(noticeData.title)}</h4>
            <small style="color: var(--text-muted, #888); display: block; margin-bottom: 12px; font-size: 11px;">📅 তারিখ: ${escapeHTML(noticeData.date)}</small>
            <p style="font-size: 14px; line-height: 1.6; color: var(--text-primary);">${escapeHTML(noticeData.message)}</p>
        </div>
    `;
}

function renderPlaylists() {
    const container = document.getElementById("playlistContainer");
    if (!container) return;

    if (customPlaylists.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;">No custom playlists added yet.</div>`;
        return;
    }

    container.innerHTML = "";
    customPlaylists.forEach((pl, index) => {
        const item = document.createElement("div");
        item.className = "playlist-item-card";
        item.innerHTML = `
            <div class="playlist-item-info">
                <i class="fa-solid fa-folder-play"></i>
                <div>
                    <strong>${escapeHTML(pl.name)}</strong>
                    <div style="font-size:11px; color:var(--text-muted);">${pl.channels.length} Channels</div>
                </div>
            </div>
            <div class="playlist-item-actions">
                <button class="play-pl-btn"><i class="fa-solid fa-play"></i> Load</button>
                <button class="del-pl-btn"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;

        item.querySelector(".play-pl-btn").addEventListener("click", () => {
            channels = pl.channels;
            currentCategory = pl.name;
            showNormalContent();
            if (mainSectionTitle) mainSectionTitle.textContent = "📁 " + pl.name;
            renderChannels();
            document.getElementById("playlistModal").classList.add("hidden");
            hideSettingsPage();
        });

        item.querySelector(".del-pl-btn").addEventListener("click", () => {
            if (confirm("Delete this playlist?")) {
                customPlaylists.splice(index, 1);
                localStorage.setItem("customPlaylists", JSON.stringify(customPlaylists));
                renderPlaylists();
            }
        });

        container.appendChild(item);
    });
}

function parseM3UContent(m3uData) {
    const lines = m3uData.split("\n");
    const parsedList = [];
    let currentChannel = {};

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (line.startsWith("#EXTINF:")) {
            currentChannel = {};
            const nameParts = line.split(",");
            currentChannel.name = nameParts[nameParts.length - 1].trim() || "Channel";

            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            currentChannel.logo = logoMatch ? logoMatch[1] : "logo.png";

            const groupMatch = line.match(/group-title="([^"]+)"/);
            currentChannel.category = groupMatch ? groupMatch[1] : "Custom";
            currentChannel.id = "pl_" + Math.random().toString(36).substr(2, 9);
        } else if (line.length > 0 && !line.startsWith("#")) {
            currentChannel.url = line;
            if (currentChannel.name) {
                parsedList.push(currentChannel);
            }
            currentChannel = {};
        }
    }
    return parsedList;
}

function getSettingsItemByText(text) {
    const items = document.querySelectorAll('.settings-item span');
    for (let span of items) {
        if (span.textContent.trim().toLowerCase() === text.toLowerCase()) {
            return span.closest('.settings-item');
        }
    }
    return null;
}

// ==========================================
// PAGE CONTROLS
// ==========================================
function showCategoryPage() {
    if (categoryPage) categoryPage.classList.remove("hidden");
    hideSettingsPage();

    const mainContent = document.querySelector(".main-content");
    if (mainContent) mainContent.style.display = "none";
    if (searchArea) searchArea.classList.remove("active");
}

function hideCategoryPage() {
    if (categoryPage) categoryPage.classList.add("hidden");
}

function showSettingsPage() {
    if (settingsPage) settingsPage.classList.remove("hidden");
    hideCategoryPage();

    const mainContent = document.querySelector(".main-content");
    if (mainContent) mainContent.style.display = "none";
    if (searchArea) searchArea.classList.remove("active");
}

function hideSettingsPage() {
    if (settingsPage) settingsPage.classList.add("hidden");
}

function showNormalContent() {
    hideCategoryPage();
    hideSettingsPage();

    const mainContent = document.querySelector(".main-content");
    if (mainContent) mainContent.style.display = "block";
}

function setActiveBottomNav(activeButton) {
    document.querySelectorAll(".bottom-nav-btn").forEach(button => {
        button.classList.remove("active");
    });
    if (activeButton) {
        activeButton.classList.add("active");
    }
}

function updateSectionTitle() {
    const titles = {
        Sports: " Sports Channels",
        Entertainment: " Entertainment Channels",
        News: " News Channels",
        Movies: " Movies Channels",
        Islamic: " Islamic Channels",
        Kids: " Kids Channels",
        Music: " Music Channels",
        Favorites: " Favorite Channels"
    };

    if (mainSectionTitle) {
        mainSectionTitle.textContent = titles[currentCategory] || "📺 Channels";
    }
}

// ==========================================
// FETCH CHANNELS DATA
// ==========================================
async function loadChannels() {
    if (!channelList) return;

    channelList.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-muted, #888);">
            ⏳ Loading channels...
        </div>
    `;

    try {
        const response = await fetch("channels.json?t=" + Date.now(), { cache: "no-store" });

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            channels = data;
        } else if (data && Array.isArray(data.channels)) {
            channels = data.channels;
        } else {
            channels = [];
        }

        if (isInitialLoad) {
            isInitialLoad = false;
            const liveEventBtn = document.getElementById("liveEventNav");
            if (liveEventBtn) {
                liveEventBtn.click();
            } else {
                renderChannels();
            }
        } else {
            if (currentCategory === "Live Event") {
                const liveEventBtn = document.getElementById("liveEventNav");
                if (liveEventBtn) liveEventBtn.click();
            } else {
                renderChannels();
            }
        }

    } catch (error) {
        console.error("Channel loading error:", error);

        channelList.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:30px; color:#ef4444;">
                ❌ Could not load channels.json
                <br>
                <small style="color:var(--text-muted, #888); display:block; margin-top:8px;">
                    ${escapeHTML(error.message)}
                </small>
            </div>
        `;
    } finally {
        hideSplash();
    }
}

// ==========================================
// CATEGORY MAPPING
// channels.json-এ থাকা যেকোনো raw category-কে আমাদের
// ৭টা fixed ট্যাবের (Sports/Entertainment/News/Movies/Islamic/Kids/Music)
// একটা বা একাধিকটার সাথে ম্যাপ করে। যেসব category কোনো ট্যাবের
// নামের সাথে মেলে না (Radio, Documentary, Religious ইত্যাদি),
// সেগুলো আগে কোনো ট্যাবেই দেখা যেত না — এখন সবচেয়ে কাছাকাছি
// ট্যাবে দেখাবে।
// ==========================================
const CATEGORY_MAP = {
    "Entertainment": ["Entertainment"],
    "Music": ["Music"],
    "Entertainment & Sports": ["Entertainment", "Sports"],
    "Sports": ["Sports"],
    "News": ["News"],
    "Kids": ["Kids"],
    "Music & Entertainment": ["Music", "Entertainment"],
    "International": ["News"],
    "Radio": ["Music"],
    "Islamic": ["Islamic"],
    "Documentary & Travel": ["Entertainment"],
    "Fashion & Lifestyle": ["Entertainment"],
    "Religious": ["Islamic"],
    "Movies": ["Movies"],
    "VOD Movies": ["Movies"],
    "Lifestyle & Food": ["Entertainment"],
    "Entertainment & News": ["Entertainment", "News"],
    "Documentary": ["Entertainment"],
    "News & International": ["News"]
};
const KNOWN_TABS = ["Sports", "Entertainment", "News", "Movies", "Islamic", "Kids", "Music"];

function getDisplayCategories(rawCategory) {
    if (CATEGORY_MAP[rawCategory]) return CATEGORY_MAP[rawCategory];

    // channels.json-এ নতুন কোনো category যোগ হলে (আমাদের ম্যাপে নেই),
    // প্রথমে substring মিল খোঁজে, নাহলে Entertainment-এ ফেলে দেয়
    // যাতে কোনো চ্যানেল আর অদৃশ্য হয়ে না থাকে।
    const lower = String(rawCategory || "").toLowerCase();
    const matches = KNOWN_TABS.filter(tab => lower.includes(tab.toLowerCase()));
    return matches.length ? matches : ["Entertainment"];
}

const CATEGORY_LOGO_FILES = {
    Sports: "categorylogos/sports.png",
    Entertainment: "categorylogos/entertainment.png",
    News: "categorylogos/news.png",
    Movies: "categorylogos/movies.png",
    Islamic: "categorylogos/islamic.png",
    Kids: "categorylogos/kids.png",
    Music: "categorylogos/music.png"
};

function getFallbackLogo(channel) {
    const displayCats = getDisplayCategories(channel.category);
    return CATEGORY_LOGO_FILES[displayCats[0]] || "logo.png";
}

// ==========================================
// RENDER MAIN CHANNELS
// ==========================================
function renderChannels() {
    if (!channelList) return;

    channelList.innerHTML = "";
    const keyword = search ? search.value.toLowerCase().trim() : "";

    const filtered = channels.filter(channel => {
        const name = String(channel.name || "").toLowerCase();
        const nameMatch = name.includes(keyword);

        let categoryMatch = false;
        if (currentCategory === "Favorites") {
            categoryMatch = favorites.includes(channel.id);
        } else {
            categoryMatch = getDisplayCategories(channel.category).includes(currentCategory);
        }

        return nameMatch && categoryMatch;
    });

    if (!filtered.length) {
        channelList.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-muted, #888);">
                🔍 No channels found.
            </div>
        `;
        return;
    }

    filtered.forEach(channel => {
        const isFav = favorites.includes(channel.id);
        const card = document.createElement("div");
        card.className = "channel-card";

        const fallbackLogo = getFallbackLogo(channel);

        card.innerHTML = `
            <button class="fav-btn ${isFav ? "active" : ""}" title="Favorite">
                <i class="${isFav ? "fa-solid" : "fa-regular"} fa-star"></i>
            </button>
            <img src="${escapeHTML(channel.logo || fallbackLogo)}" alt="${escapeHTML(channel.name || "TV")}" onerror="this.onerror=null;this.src='${escapeHTML(fallbackLogo)}';">
            <h4>${escapeHTML(channel.name || "Unknown")}</h4>
        `;

        const favBtn = card.querySelector(".fav-btn");
        favBtn.addEventListener("click", event => {
            toggleFavorite(channel.id, event);
        });

        card.addEventListener("click", () => {
            playChannelWithAd(channel);
        });

        channelList.appendChild(card);
    });
}

// ==========================================
// TOGGLE FAVORITE
// ==========================================
function toggleFavorite(channelId, event) {
    if (event) event.stopPropagation();

    const index = favorites.indexOf(channelId);
    if (index === -1) {
        favorites.push(channelId);
    } else {
        favorites.splice(index, 1);
    }

    localStorage.setItem("favChannels", JSON.stringify(favorites));
    renderChannels();
}

// ==========================================
// ESCAPE HTML UTILITY
// ==========================================
function escapeHTML(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// MONETAG AD HANDLER
// ==========================================
function playChannelWithAd(channel) {
    if (!channel || !channel.url) return;

    if (firstChannelAdShown) {
        playChannel(channel);
        return;
    }

    if (typeof show_11580289 !== "function") {
        firstChannelAdShown = true;
        playChannel(channel);
        return;
    }

    if (isAdShowing) return;
    isAdShowing = true;

    try {
        const ad = show_11580289("pop");

        if (ad && typeof ad.then === "function") {
            ad.then(() => {
                firstChannelAdShown = true;
                isAdShowing = false;
                playChannel(channel);
            }).catch(() => {
                firstChannelAdShown = true;
                isAdShowing = false;
                playChannel(channel);
            });
        } else {
            firstChannelAdShown = true;
            isAdShowing = false;
            playChannel(channel);
        }
    } catch (error) {
        console.error("Monetag error:", error);
        firstChannelAdShown = true;
        isAdShowing = false;
        playChannel(channel);
    }
}

// ==========================================
// PLAY CHANNEL / STREAM
// ==========================================
// ==========================================
// একটা চ্যানেলের সার্ভার লিস্ট বের করা
// channels.json-এ "servers": [{name,url}, ...] থাকলে সেটাই ব্যবহার হবে,
// না থাকলে পুরনো "url" ফিল্ড দিয়ে একটামাত্র সার্ভার ধরে নেওয়া হয়
// ==========================================
function getChannelServers(channel) {
    if (channel && Array.isArray(channel.servers) && channel.servers.length > 0) {
        return channel.servers;
    }
    return [{ name: "Server 1", url: channel ? channel.url : "" }];
}

function renderServerSelector(channel, activeIndex) {
    const selectorEl = document.getElementById("serverSelector");
    if (!selectorEl) return;

    const servers = getChannelServers(channel);

    if (servers.length <= 1) {
        selectorEl.classList.add("hidden");
        selectorEl.innerHTML = "";
        return;
    }

    selectorEl.classList.remove("hidden");
    selectorEl.innerHTML = "";

    servers.forEach((server, idx) => {
        const btn = document.createElement("button");
        const isActive = idx === activeIndex;
        btn.textContent = server.name || `Server ${idx + 1}`;
        btn.style.cssText = `flex-shrink:0; padding:8px 16px; border-radius:8px; border:1px solid ${isActive ? "var(--primary, #ff2a4b)" : "rgba(255,255,255,0.2)"}; background:${isActive ? "var(--primary, #ff2a4b)" : "transparent"}; color:#fff; font-size:13px;`;
        btn.addEventListener("click", () => playChannel(channel, idx));
        selectorEl.appendChild(btn);
    });
}

function playChannel(channel, serverIndex = 0) {
    if (!channel) return;

    const servers = getChannelServers(channel);
    const selectedServer = servers[serverIndex] || servers[0];
    if (!selectedServer || !selectedServer.url) return;

    if (currentChannelName) currentChannelName.textContent = channel.name || "Live TV";
    if (playerContainer) playerContainer.classList.remove("hidden");

    renderServerSelector(channel, serverIndex);

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (hls) {
        hls.destroy();
        hls = null;
    }

    if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
    }

    const url = String(selectedServer.url).trim();

    if (typeof Hls !== "undefined" && Hls.isSupported() && (url.includes(".m3u8") || url.includes("m3u8"))) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (video) {
                video.play().catch(error => console.log("Autoplay blocked:", error));
            }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error("HLS error:", data);
        });
    } else if (video && video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.play().catch(error => console.log("Autoplay blocked:", error));
    } else if (video) {
        video.src = url;
        video.play().catch(error => console.log("Autoplay blocked:", error));
    }

    resetOverlayTimeout();

    try {
        localStorage.setItem("lastChannel", JSON.stringify(channel));
    } catch (e) {
        console.warn("Unable to save lastChannel", e);
    }
}

// ==========================================
// CLOSE PLAYER
// ==========================================
function closePlayer() {
    if (hls) {
        hls.destroy();
        hls = null;
    }

    if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
    }

    if (playerContainer) {
        playerContainer.classList.add("hidden");
    }

    const selectorEl = document.getElementById("serverSelector");
    if (selectorEl) {
        selectorEl.classList.add("hidden");
        selectorEl.innerHTML = "";
    }
}

// ==========================================
// FLOATING PLAYER (PICTURE-IN-PICTURE) LOGIC
// ==========================================
async function toggleFloatingPlayer() {
    const videoElement = document.getElementById("video");

    if (!videoElement) {
        alert("Video player not found!");
        return;
    }

    if (videoElement.paused || (!videoElement.src && !videoElement.srcObject)) {
        alert("Please play a channel first to use Floating Player!");
        return;
    }

    try {
        if (document.pictureInPictureEnabled) {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await videoElement.requestPictureInPicture();
            }
        } else {
            alert("Picture-in-Picture mode is not supported in this browser.");
        }
    } catch (error) {
        console.error("Floating Player Error:", error);
    }
}
