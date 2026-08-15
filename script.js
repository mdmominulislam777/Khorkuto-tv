// ==========================================
// StreamZX - Consolidated Script
// ==========================================

let channels = [];
let currentCategory = "Sports"; // Default category
let favorites = JSON.parse(localStorage.getItem("favChannels")) || [];
let hls = null;

// DOM Elements
let channelList, featuredList, featuredSection, video, search, searchArea, playerContainer, currentChannelName, mainSectionTitle;

document.addEventListener("DOMContentLoaded", () => {
    channelList = document.getElementById("channelList");
    featuredList = document.getElementById("featuredList");
    featuredSection = document.getElementById("featuredSection");
    video = document.getElementById("video");
    search = document.getElementById("search");
    searchArea = document.getElementById("searchArea");
    playerContainer = document.getElementById("playerContainer");
    currentChannelName = document.getElementById("currentChannelName");
    mainSectionTitle = document.getElementById("mainSectionTitle");

    initApp();
});

function initApp() {
    setupEventListeners();
    loadChannels();
}

function hideSplash() {
    const splash = document.getElementById("splash");
    if (splash) {
        setTimeout(() => splash.classList.add("hidden"), 500);
    }
}

function setupEventListeners() {
    // Search toggle
    document.getElementById("searchBtn").addEventListener("click", () => {
        searchArea.classList.toggle("active");
        if (searchArea.classList.contains("active")) search.focus();
    });

    // Favorites Header Button click
    document.getElementById("favHeaderBtn").addEventListener("click", () => {
        document.querySelectorAll(".cat").forEach(c => c.classList.remove("active"));
        currentCategory = "Favorites";
        mainSectionTitle.textContent = "❤️ Favorite Channels";
        renderChannels();
    });

    // Refresh
    document.getElementById("refreshBtn").addEventListener("click", () => {
        loadChannels();
    });

    // Search filter input
    search.addEventListener("input", () => {
        renderChannels();
    });

    // Category click
    document.querySelectorAll(".cat").forEach(cat => {
        cat.addEventListener("click", (e) => {
            document.querySelectorAll(".cat").forEach(c => c.classList.remove("active"));
            const target = e.currentTarget;
            target.classList.add("active");
            currentCategory = target.getAttribute("data-category");

            if (currentCategory === "Sports") mainSectionTitle.textContent = "⚽ Sports Channels";
            else mainSectionTitle.textContent = `📺 ${currentCategory} Channels`;

            renderChannels();
        });
    });

    // Close Player
    document.getElementById("closePlayerBtn").addEventListener("click", () => {
        if (video) video.pause();
        if (hls) hls.destroy();
        playerContainer.classList.add("hidden");
    });
}

// ------------------------------------------
// Favorites Management
// ------------------------------------------
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
    renderFeaturedChannels();
}

// ------------------------------------------
// Load Channels
// ------------------------------------------
async function loadChannels() {
    if (!channelList) return;

    channelList.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-muted);">
            ⏳ Loading channels...
        </div>`;

    try {
        const response = await fetch("channels.json?t=" + Date.now());
        if (!response.ok) throw new Error("Failed to load channels");

        const data = await response.json();
        channels = Array.isArray(data) ? data : (data.channels || []);

        renderFeaturedChannels();
        renderChannels();
        hideSplash();

    } catch (err) {
        console.error(err);
        channelList.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:30px; color:#ef4444;">
                ❌ Could not load channels.json file.
            </div>`;
        hideSplash();
    }
}

// ------------------------------------------
// Render Featured Channels
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
        const isFav = favorites.includes(channel.id);
        const card = document.createElement("div");
        card.className = "featured-card";
        card.innerHTML = `
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${channel.id}, event)">
                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <img src="${channel.logo || 'logo.png'}" onerror="this.onerror=null; this.src='https://via.placeholder.com/60?text=TV';">
            <h4>${channel.name || 'Unknown'}</h4>
            <p>${channel.category || 'General'}</p>
        `;
        card.onclick = () => playChannel(channel);
        featuredList.appendChild(card);
    });
}

// ------------------------------------------
// Render Main Channel List
// ------------------------------------------
function renderChannels() {
    if (!channelList) return;

    channelList.innerHTML = "";
    const keyword = search ? search.value.toLowerCase().trim() : "";

    const filtered = channels.filter(channel => {
        const nameMatch = (channel.name || "").toLowerCase().includes(keyword);

        let categoryMatch = false;
        if (currentCategory === "Favorites") {
            categoryMatch = favorites.includes(channel.id);
        } else if (channel.category) {
            categoryMatch = channel.category.toLowerCase().includes(currentCategory.toLowerCase());
        }

        return nameMatch && categoryMatch;
    });

    if (filtered.length === 0) {
        channelList.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-muted);">
                🔍 No channels found.
            </div>`;
        return;
    }

    filtered.forEach(channel => {
        const isFav = favorites.includes(channel.id);
        const card = document.createElement("div");
        card.className = "channel-card";
        card.innerHTML = `
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${channel.id}, event)" title="Favorite">
                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
            <img src="${channel.logo || 'logo.png'}" onerror="this.onerror=null; this.src='https://via.placeholder.com/50?text=TV';">
            <h4>${channel.name}</h4>
        `;
        card.onclick = () => playChannel(channel);
        channelList.appendChild(card);
    });
}

// ------------------------------------------
// Play Channel with HLS.js
// ------------------------------------------
function playChannel(channel) {
    if (!channel || !channel.url) return;

    currentChannelName.textContent = channel.name;
    playerContainer.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (hls) {
        hls.destroy();
    }

    if (Hls.isSupported() && channel.url.includes(".m3u8")) {
        hls = new Hls();
        hls.loadSource(channel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(e => console.log("Autoplay blocked:", e));
        });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = channel.url;
        video.play().catch(e => console.log("Autoplay blocked:", e));
    } else {
        video.src = channel.url;
        video.play().catch(e => console.log("Autoplay blocked:", e));
    }

    localStorage.setItem("lastChannel", JSON.stringify(channel));
}
// ==========================================
// Monetag Ads
// ==========================================

// In-App Interstitial
show_11580289({
    type: 'inApp',
    inAppSettings: {
        frequency: 2,
        capping: 0.1,
        interval: 30,
        timeout: 5,
        everyPage: false
    }
});

// Rewarded Popup
function showRewardedAd() {
    show_11580289('pop')
        .then(() => {
            console.log('Rewarded ad completed');
        })
        .catch((e) => {
            console.log('Rewarded ad error:', e);
        });
}
console.log("Monetag test started");

setTimeout(() => {
    console.log("show_11580289 =", typeof show_11580289);

    if (typeof show_11580289 === "function") {
        show_11580289("pop")
            .then(() => {
                console.log("Monetag popup completed");
            })
            .catch((e) => {
                console.error("Monetag popup error:", e);
            });
    } else {
        console.error("Monetag SDK NOT loaded");
    }
}, 5000);
