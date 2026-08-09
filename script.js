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
    hideSplash();
}

// ------------------------------------------
// 1. Load Channels & Auto Restore
// ------------------------------------------
async function loadChannels() {
    if (!channelList) return;

    channelList.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-muted);">
            ⏳ চ্যানেল লোড হচ্ছে...
        </div>`;

    try {
        // Cache breaking timestamp query appended
        const response = await fetch("channels.json?t=" + Date.now());

        if (!response.ok) throw new Error("Failed to load channels");

        const data = await response.json();
        channels = Array.isArray(data) ? data : (data.channels || []);

        renderFeaturedChannels();
        renderChannels();

        // Auto load last played channel
        loadLastChannel();

    } catch (err) {
        console.error(err);
        channelList.innerHTML = `
            <div style="text-align:center; padding:30px; color:#ef4444;">
                ❌ channels.json ফাইল লোড করা সম্ভব হয়নি।
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
            <h4>${channel.name || 'Unknown'}</h4>
            <p>${channel.category || 'General'}</p>
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
        const nameMatch = (channel.name || "").toLowerCase().includes(keyword);
        const categoryStr = (channel.category || "").toLowerCase();

        const catMatch = isSpecialView || currentCategory === "All" ||
            categoryStr.includes(currentCategory.toLowerCase());

        return nameMatch && catMatch;
    });

    if (filtered.length === 0) {
        channelList.innerHTML = "<p style='text-align:center; padding:30px; color:var(--text-muted);'>কোনো চ্যানেল পাওয়া যায়নি</p>";
        return;
    }

    filtered.forEach(channel => {
        const isFav = localStorage.getItem("fav_" + channel.name) === "true";
        const card = document.createElement("div");
        card.className = "channel";

        card.innerHTML = `
            <img src="${channel.logo || 'logo.png'}" onerror="this.onerror=null; this.src='logo.png';">
            <div class="info">
                <h3>${channel.name || 'Unknown'}</h3>
                <p>${channel.category || 'General'} ${channel.country ? '• ' + channel.country : ''}</p>
                <span class="live-badge">🔴 LIVE</span>
            </div>
            <button class="fav-btn">
                ${isFav ? "❤️" : "🤍"}
            </button>
        `;

        // Safe check for clicks inside the favorite button
        card.onclick = (e) => {
            if (e.target.closest(".fav-btn")) return;
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

// =========================
// KHORKUTO TV - FULL SCREEN PLAYER
// =========================

function playChannel(channel) {

    if (!channel || !channel.url) {
        alert("এই চ্যানেলের Stream পাওয়া যায়নি।");
        return;
    }

    // Open Player
    tvPlayer.classList.add("show");

    // Channel Name
    playerTitle.textContent =
        channel.name || "Khorkuto TV";

    // Stop Previous Player
    if (hls) {
        hls.destroy();
        hls = null;
    }

    // Play HLS
    if (Hls.isSupported()) {

        hls = new Hls();

        hls.loadSource(channel.url);

        hls.attachMedia(video);

        hls.on(
            Hls.Events.MANIFEST_PARSED,
            function () {
                video.play().catch(() => {});
            }
        );

    } else {

        video.src = channel.url;

        video.play().catch(() => {});

    }

    // Save Last Channel
    localStorage.setItem(
        "lastChannel",
        JSON.stringify(channel)
    );

    // Save History
    let history = JSON.parse(
        localStorage.getItem("history") || "[]"
    );

    history = history.filter(
        item => item.url !== channel.url
    );

    history.unshift(channel);

    history = history.slice(0, 20);

    localStorage.setItem(
        "history",
        JSON.stringify(history)
    );
}

function toggleFavorite(channelName) {
    if (!channelName) return;
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

    // Settings Sheet Toggle
    const settingsBtn = document.getElementById("settingsBtn");
    const settingsSheet = document.getElementById("settingsSheet");
    const settingsOverlay = document.getElementById("settingsOverlay");
    const closeSettings = document.getElementById("closeSettings");

    const openSheet = () => {
        if (settingsSheet) settingsSheet.classList.add("show");
        if (settingsOverlay) settingsOverlay.classList.add("show");
    };

    const closeSheet = () => {
        if (settingsSheet) settingsSheet.classList.remove("show");
        if (settingsOverlay) settingsOverlay.classList.remove("show");
    };

    if (settingsBtn) settingsBtn.onclick = openSheet;
    if (closeSettings) closeSettings.onclick = closeSheet;
    if (settingsOverlay) settingsOverlay.onclick = closeSheet;

    // Category Buttons
    document.querySelectorAll(".cat").forEach(btn => {
        btn.onclick = () => {
            setActiveCategory(btn.dataset.category || "All", btn);
        };
    });

    // Bottom Navigation Handlers
    const homeNav = document.getElementById("homeNav");
    const sportsNav = document.getElementById("sportsNav");
    const favoriteNav = document.getElementById("favoriteNav");
    const historyNav = document.getElementById("historyNav");
    const searchNav = document.getElementById("searchNav");

    const setNavActive = (activeNav) => {
        document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
        if (activeNav) activeNav.classList.add("active");
    };

    if (homeNav) homeNav.onclick = () => { setNavActive(homeNav); setActiveCategory("All"); };
    if (sportsNav) sportsNav.onclick = () => { setNavActive(sportsNav); setActiveCategory("Sports"); };

    if (favoriteNav) {
        favoriteNav.onclick = () => {
            setNavActive(favoriteNav);
            isSpecialView = true;
            if (featuredSection) featuredSection.style.display = "none";
            const favList = channels.filter(c => localStorage.getItem("fav_" + c.name));
            renderChannels(favList);
        };
    }

    if (historyNav) {
        historyNav.onclick = () => {
            setNavActive(historyNav);
            isSpecialView = true;
            if (featuredSection) featuredSection.style.display = "none";
            const history = JSON.parse(localStorage.getItem("history") || "[]");
            renderChannels(history);
        };
    }

    if (searchNav && search) {
        searchNav.onclick = () => {
            setNavActive(searchNav);
            search.focus();
        };
    }

    // Fullscreen Button
    const fullscreenBtn = document.getElementById("fullscreenBtn");
    if (fullscreenBtn && video) {
        fullscreenBtn.onclick = () => {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
                video.webkitRequestFullscreen();
            } else if (video.msRequestFullscreen) {
                video.msRequestFullscreen();
            }
        };
    }

    // Settings Menu Actions
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");
    if (clearHistoryBtn) {
        clearHistoryBtn.onclick = () => {
            localStorage.removeItem("history");
            alert("হিস্ট্রি ক্লিয়ার করা হয়েছে!");
            closeSheet();
            renderChannels();
        };
    }

    const clearFavBtn = document.getElementById("clearFavBtn");
    if (clearFavBtn) {
        clearFavBtn.onclick = () => {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith("fav_")) localStorage.removeItem(key);
            });
            alert("ফেভারিট ক্লিয়ার করা হয়েছে!");
            closeSheet();
            renderChannels();
        };
    }

    const aboutBtn = document.getElementById("aboutBtn");
    if (aboutBtn) {
        aboutBtn.onclick = () => {
            alert("Khorkuto TV v10.0\nDeveloped by Khorkuto Media Network");
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
                alert("লিঙ্ক কপি করা হয়েছে!");
            }
        };
    }

    const watchBtn = document.querySelector(".watch-btn");
    if (watchBtn) {
        watchBtn.onclick = () => {
            if (channels.length > 0) playChannel(channels[0], true);
        };
    }
}

// Safe Splash Screen Hide
function hideSplash() {
    const splash = document.getElementById("splash");
    if (!splash) return;
    setTimeout(() => {
        splash.style.opacity = "0";
        setTimeout(() => { splash.style.display = "none"; }, 400);
    }, 1000);
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
