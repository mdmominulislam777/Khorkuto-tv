// ==========================================
// Khorkuto TV - Final Consolidated Script
// ==========================================

// --- Global State ---
let channels = [];
let currentCategory = "All";
let isSpecialView = false;
let hls = null;

// --- DOM References ---
let channelList, featuredList, featuredSection, video, search;

document.addEventListener("DOMContentLoaded", () => {
    channelList = document.getElementById("channelList");
    featuredList = document.getElementById("featuredList");
    featuredSection = document.getElementById("featuredSection");
    video = document.getElementById("video");
    search = document.getElementById("search");

    initApp();
});

function initApp() {
    setupEventListeners();
    loadChannels();
    setupBannerSlider();
    setupTelegram();
}

// ------------------------------------------
// 1. Load Channels & Auto Restore
// ------------------------------------------
async function loadChannels() {
    if (!channelList) return;

    channelList.innerHTML = `
        <div style="text-align:center;padding:30px">
            ⏳ Loading Channels...
        </div>`;

    try {
        // FIX: এখন লোকাল channels.json থেকে লোড হয় (আগে external GitHub URL
        // থেকে লোড হতো, যেটা Telegram WebView-তে fetch fail/hang করত)
        const response = await fetch("channels.json?t=" + Date.now());

        if (!response.ok) throw new Error("Failed to load channels");

        const data = await response.json();

        // JSON Array অথবা Object উভয় ক্ষেত্রের জন্য সেফ পার্সিং
        channels = Array.isArray(data) ? data : (data.channels || []);

        renderFeaturedChannels();
        renderChannels();

        // Auto load last played channel
        loadLastChannel();

    } catch (err) {
        console.error(err);
        channelList.innerHTML = `
            <div style="text-align:center;padding:30px;color:red;">
                ❌ Unable to load channels.
            </div>`;
    }
}

function loadLastChannel() {
    const lastChannelData = localStorage.getItem("lastChannel");
    if (!lastChannelData || !video) return;

    try {
        const channel = JSON.parse(lastChannelData);
        if (channel && channel.url) {
            playChannel(channel, false);
        }
    } catch (err) {
        console.warn("Could not load last channel:", err);
    }
}

// ------------------------------------------
// 2. Render Featured Channels
// ------------------------------------------
function renderFeaturedChannels() {
    if (!featuredList || !featuredSection) return;

    const featured = channels.filter(c => c.featured === true);

    if (featured.length === 0) {
        featuredSection.style.display = "none";
        return;
    }

    featuredSection.style.display = "block";
    featuredList.innerHTML = "";

    featured.forEach(channel => {
        const card = document.createElement("div");
        card.className = "featured-card";
        card.innerHTML = `
            <img src="${channel.logo || 'logo.png'}" onerror="this.onerror=null; this.src='logo.png';">
            <h4>${channel.name}</h4>
            <p>${channel.category}</p>
        `;

        card.onclick = () => playChannel(channel, true);
        featuredList.appendChild(card);
    });
}

// ------------------------------------------
// 3. Render Main Channel List
// ------------------------------------------
function renderChannels(list = channels) {
    if (!channelList) return;

    channelList.innerHTML = "";
    const keyword = search ? search.value.toLowerCase().trim() : "";

    const filtered = list.filter(channel => {
        const nameMatch = channel.name.toLowerCase().includes(keyword);

        // ফ্লেক্সিবল ক্যাটাগরি ম্যাচিং (যেমন 'Movie' এবং 'Movies' বা 'Entertainment & Sports')
        const catMatch = isSpecialView || currentCategory === "All" ||
            channel.category.toLowerCase().includes(currentCategory.toLowerCase());

        return nameMatch && catMatch;
    });

    if (filtered.length === 0) {
        channelList.innerHTML = "<p style='text-align:center;padding:20px;'>No Channel Found</p>";
        return;
    }

    filtered.forEach(channel => {
        const isFav = localStorage.getItem("fav_" + channel.name) === "true";
        const card = document.createElement("div");
        card.className = "channel";

        card.innerHTML = `
            <img src="${channel.logo || 'logo.png'}" onerror="this.onerror=null; this.src='logo.png';">
            <div class="info">
                <h3>${channel.name}</h3>
                <p>${channel.category} ${channel.country ? '• ' + channel.country : ''}</p>
                <span class="live-badge">🔴 LIVE</span>
            </div>
            <button class="fav-btn">
                ${isFav ? "❤️" : "🤍"}
            </button>
        `;

        card.onclick = (e) => {
            if (e.target.classList.contains("fav-btn")) return;
            playChannel(channel, true);
        };

        const favBtn = card.querySelector(".fav-btn");
        if (favBtn) {
            favBtn.onclick = (e) => {
                e.stopPropagation();
                toggleFavorite(channel.name);
            };
        }

        channelList.appendChild(card);
    });
}

// ------------------------------------------
// 4. Player & Local Storage
// ------------------------------------------
function playChannel(channel, autoPlay = true) {
    if (!video) return;

    if (hls) {
        hls.destroy();
    }

    if (typeof Hls !== "undefined" && Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(channel.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            if (autoPlay) {
                video.play().catch(e => console.warn("Autoplay prevented:", e));
            }
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // iOS / Safari
        video.src = channel.url;
        if (autoPlay) {
            video.play().catch(e => console.warn("Autoplay prevented:", e));
        }
    } else {
        video.src = channel.url;
    }

    if (autoPlay) {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    localStorage.setItem("lastChannel", JSON.stringify(channel));

    if (autoPlay) {
        let history = JSON.parse(localStorage.getItem("history") || "[]");
        history = history.filter(item => item.url !== channel.url);
        history.unshift(channel);
        history = history.slice(0, 20);
        localStorage.setItem("history", JSON.stringify(history));
    }
}

function toggleFavorite(channelName) {
    const key = "fav_" + channelName;
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
    } else {
        localStorage.setItem(key, "true");
    }
    renderChannels();
}

// ------------------------------------------
// 5. Events & Controls
// ------------------------------------------
function setupEventListeners() {
    if (search) {
        search.addEventListener("input", () => renderChannels());
    }

    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn && search) {
        searchBtn.onclick = () => search.focus();
    }

    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.onclick = () => loadChannels();
    }

    // Settings Toggle
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsSheet = document.getElementById("settingsSheet");
    const closeSettings = document.getElementById("closeSettings");

    if (settingsBtn && settingsSheet) {
        settingsBtn.onclick = () => settingsSheet.classList.add("show");
    }

    if (settingsSheet && closeSettings) {
        closeSettings.onclick = () => settingsSheet.classList.remove("show");
    }

    document.querySelectorAll(".cat").forEach(btn => {
        btn.onclick = () => {
            setActiveCategory(btn.dataset.category || "All", btn);
        };
    });

    const homeNav = document.getElementById("homeNav");
    const sportsNav = document.getElementById("sportsNav");
    const favoriteNav = document.getElementById("favoriteNav");
    const historyNav = document.getElementById("historyNav");
    const searchNav = document.getElementById("searchNav");

    if (homeNav) homeNav.onclick = () => setActiveCategory("All");
    if (sportsNav) sportsNav.onclick = () => setActiveCategory("Sports");

    if (favoriteNav) {
        favoriteNav.onclick = () => {
            isSpecialView = true;
            if (featuredSection) featuredSection.style.display = "none";
            const favList = channels.filter(c => localStorage.getItem("fav_" + c.name));
            renderChannels(favList);
        };
    }

    if (historyNav) {
        historyNav.onclick = () => {
            isSpecialView = true;
            if (featuredSection) featuredSection.style.display = "none";
            const history = JSON.parse(localStorage.getItem("history") || "[]");
            renderChannels(history);
        };
    }

    if (searchNav && search) {
        searchNav.onclick = () => search.focus();
    }

    const fullscreenBtn = document.getElementById("fullscreenBtn");
    if (fullscreenBtn && video) {
        fullscreenBtn.onclick = () => {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
                video.webkitRequestFullscreen();
            }
        };
    }

    const clearHistoryBtn = document.getElementById("clearHistoryBtn");
    if (clearHistoryBtn) {
        clearHistoryBtn.onclick = () => {
            localStorage.removeItem("history");
            alert("History Cleared!");
            if (settingsSheet) settingsSheet.classList.remove("show");
            renderChannels();
        };
    }

    const clearFavBtn = document.getElementById("clearFavBtn");
    if (clearFavBtn) {
        clearFavBtn.onclick = () => {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith("fav_")) localStorage.removeItem(key);
            });
            alert("Favorites Cleared!");
            if (settingsSheet) settingsSheet.classList.remove("show");
            renderChannels();
        };
    }

    const aboutBtn = document.getElementById("aboutBtn");
    if (aboutBtn) {
        aboutBtn.onclick = () => {
            alert("Khorkuto TV v7.0\nDeveloped by Khorkuto Media Network");
        };
    }

    const shareApp = document.getElementById("shareApp");
    if (shareApp) {
        shareApp.onclick = async () => {
            const data = {
                title: "Khorkuto TV",
                text: "Watch Live TV Online",
                url: window.location.href
            };
            if (navigator.share) {
                try { await navigator.share(data); } catch (e) {}
            } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard.");
            }
        };
    }

    const watchBtn = document.querySelector(".watch-btn");
    if (watchBtn) {
        watchBtn.onclick = () => {
            if (channels.length > 0) playChannel(channels[0], true);
        };
    }

    window.addEventListener("load", () => {
        const splash = document.getElementById("splash");
        if (splash) {
            setTimeout(() => { splash.style.display = "none"; }, 1200);
        }
    });
}

function setActiveCategory(category, targetBtn = null) {
    currentCategory = category;
    isSpecialView = false;

    renderFeaturedChannels();

    document.querySelectorAll(".cat").forEach(x => {
        const matches = targetBtn ? x === targetBtn : x.dataset.category === category;
        x.classList.toggle("active", matches);
    });

    renderChannels();
}

function setupBannerSlider() {
    const bannerImg = document.querySelector(".banner img");
    if (!bannerImg) return;

    const banners = ["banner1.jpg", "banner2.jpg", "banner3.jpg"];
    let i = 0;

    setInterval(() => {
        i = (i + 1) % banners.length;
        bannerImg.src = banners[i];
    }, 4000);
}

function setupTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
}
