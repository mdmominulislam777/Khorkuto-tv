// ==========================================
// StreamZX - Complete Script
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

// ==========================================
// MONETAG ADS CONFIG
// ==========================================
let firstChannelAdShown = false;
let isAdShowing = false;

// ==========================================
// DOM ELEMENTS
// ==========================================
let channelList;
let featuredList;
let featuredSection;
let video;
let search;
let searchArea;
let playerContainer;
let currentChannelName;
let mainSectionTitle;
let categoryPage;
let menuToggleBtn;
let closeSidebarBtn;
let sidebar;
let sidebarOverlay;

// ==========================================
// APP START
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Telegram WebApp Ready Check
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    channelList = document.getElementById("channelList");
    featuredList = document.getElementById("featuredList");
    featuredSection = document.getElementById("featuredSection");

    video = document.getElementById("video");
    search = document.getElementById("search");
    searchArea = document.getElementById("searchArea");

    playerContainer = document.getElementById("playerContainer");
    currentChannelName = document.getElementById("currentChannelName");

    mainSectionTitle = document.getElementById("mainSectionTitle");
    categoryPage = document.getElementById("categoryPage");

    menuToggleBtn = document.getElementById("menuToggleBtn");
    closeSidebarBtn = document.getElementById("closeSidebarBtn");
    sidebar = document.getElementById("sidebar");
    sidebarOverlay = document.getElementById("sidebarOverlay");

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
// SPLASH SCREEN
// ==========================================
function hideSplash() {
    const splash = document.getElementById("splash");
    if (splash) {
        splash.classList.add("hidden");
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {

    // --- SIDEBAR TOGGLE ---
    if (menuToggleBtn) menuToggleBtn.addEventListener("click", openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

    // Auto close sidebar on menu link click
    document.querySelectorAll(".sidebar-menu a").forEach(link => {
        link.addEventListener("click", () => {
            if (link.getAttribute("target") !== "_blank") {
                closeSidebar();
            }
        });
    });

    // --- SIDEBAR NETWORK STREAM ---
    const sidebarNetworkStreamBtn = document.getElementById("sidebarNetworkStreamBtn");
    if (sidebarNetworkStreamBtn) {
        sidebarNetworkStreamBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeSidebar();

            const streamUrl = prompt("Enter Video or HLS (.m3u8) Stream URL:");
            if (streamUrl && streamUrl.trim() !== "") {
                const customChannel = {
                    name: "Network Stream",
                    url: streamUrl.trim(),
                    logo: "https://via.placeholder.com/80?text=Stream"
                };
                playChannel(customChannel);
            }
        });
    }

    // --- SIDEBAR FAVORITES ---
    const sidebarFavBtn = document.getElementById("sidebarFavBtn");
    if (sidebarFavBtn) {
        sidebarFavBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeSidebar();

            showNormalContent();
            currentCategory = "Favorites";
            updateSectionTitle();
            renderChannels();
            setActiveBottomNav(null);
        });
    }

    // --- SIDEBAR EXIT ---
    const sidebarExitBtn = document.getElementById("sidebarExitBtn");
    if (sidebarExitBtn) {
        sidebarExitBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeSidebar();

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

    // --- SEARCH BUTTON TOGGLE ---
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
        searchBtn.addEventListener("click", () => {
            if (categoryPage && !categoryPage.classList.contains("hidden")) {
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

    // --- BOTTOM NAVIGATION ---
    const liveEventBtn = document.getElementById("liveEventNav");
    const categoryNavBtn = document.getElementById("categoryNav");
    const sportsNavBtn = document.getElementById("sportsNav");

    // LIVE EVENT NAV
    if (liveEventBtn) {
        liveEventBtn.addEventListener("click", () => {
            setActiveBottomNav(liveEventBtn);
            hideCategoryPage();
            currentCategory = "Live Event";

            if (featuredSection) featuredSection.style.display = "none";
            const mainContent = document.querySelector(".main-content");
            if (mainContent) mainContent.style.display = "block";

            if (mainSectionTitle) mainSectionTitle.textContent = "🔴 Live Events";

            if (channelList) {
                channelList.innerHTML = `
                    <div style="grid-column:1/-1; text-align:center; padding:40px 20px; color:var(--text-muted);">
                        <i class="fa-solid fa-tower-broadcast" style="font-size:40px; margin-bottom:15px; display:block;"></i>
                        <div>Live Events</div>
                        <small>Live event schedule and channels will appear here.</small>
                    </div>
                `;
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // CATEGORY NAV
    if (categoryNavBtn) {
        categoryNavBtn.addEventListener("click", () => {
            setActiveBottomNav(categoryNavBtn);
            showCategoryPage();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // SPORTS NAV
    if (sportsNavBtn) {
        sportsNavBtn.addEventListener("click", () => {
            setActiveBottomNav(sportsNavBtn);
            hideCategoryPage();
            showNormalContent();

            currentCategory = "Sports";
            updateSectionTitle();
            renderFeaturedChannels();
            renderChannels();

            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // --- CATEGORY GRID ITEMS ---
    document.querySelectorAll(".category-item").forEach(item => {
        item.addEventListener("click", () => {
            const selectedCategory = item.dataset.category;
            currentCategory = selectedCategory;

            hideCategoryPage();
            showNormalContent();

            updateSectionTitle();
            renderFeaturedChannels();
            renderChannels();

            setActiveBottomNav(document.getElementById("sportsNav"));
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });
}

// ==========================================
// SIDEBAR ACTIONS
// ==========================================
function openSidebar() {
    if (sidebar && sidebarOverlay) {
        sidebar.classList.add("active");
        sidebarOverlay.classList.add("active");
    }
}

function closeSidebar() {
    if (sidebar && sidebarOverlay) {
        sidebar.classList.remove("active");
        sidebarOverlay.classList.remove("active");
    }
}

// ==========================================
// PAGE CONTROLS
// ==========================================
function showCategoryPage() {
    if (categoryPage) categoryPage.classList.remove("hidden");
    if (featuredSection) featuredSection.style.display = "none";

    const mainContent = document.querySelector(".main-content");
    if (mainContent) mainContent.style.display = "none";
    if (searchArea) searchArea.classList.remove("active");
}

function hideCategoryPage() {
    if (categoryPage) categoryPage.classList.add("hidden");
}

function showNormalContent() {
    hideCategoryPage();
    if (featuredSection) featuredSection.style.display = "block";

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
        Sports: "⚽ Sports Channels",
        Entertainment: "🎬 Entertainment Channels",
        News: "📰 News Channels",
        Movies: "🎬 Movies Channels",
        Islamic: "🕌 Islamic Channels",
        Kids: "🧒 Kids Channels",
        Music: "🎵 Music Channels",
        Favorites: "⭐ Favorite Channels"
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
        <div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-muted);">
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
                renderFeaturedChannels();
                renderChannels();
            }
        } else {
            if (currentCategory === "Live Event") {
                const liveEventBtn = document.getElementById("liveEventNav");
                if (liveEventBtn) liveEventBtn.click();
            } else {
                renderFeaturedChannels();
                renderChannels();
            }
        }

    } catch (error) {
        console.error("Channel loading error:", error);

        channelList.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:30px; color:#ef4444;">
                ❌ Could not load channels.json
                <br>
                <small style="color:var(--text-muted); display:block; margin-top:8px;">
                    ${escapeHTML(error.message)}
                </small>
            </div>
        `;
    } finally {
        hideSplash();
    }
}

// ==========================================
// RENDER FEATURED CHANNELS
// ==========================================
function renderFeaturedChannels() {
    if (!featuredList || !featuredSection) return;

    const featured = channels.filter(channel => channel.featured === true);

    if (!featured.length) {
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
            <button class="fav-btn ${isFav ? "active" : ""}" title="Favorite">
                <i class="${isFav ? "fa-solid" : "fa-regular"} fa-star"></i>
            </button>
            <img src="${escapeHTML(channel.logo || "logo.png")}" alt="${escapeHTML(channel.name || "TV")}" onerror="this.onerror=null;this.src='https://via.placeholder.com/80?text=TV';">
            <h4>${escapeHTML(channel.name || "Unknown")}</h4>
            <p>${escapeHTML(channel.category || "General")}</p>
        `;

        const favBtn = card.querySelector(".fav-btn");
        favBtn.addEventListener("click", event => {
            toggleFavorite(channel.id, event);
        });

        card.addEventListener("click", () => {
            playChannelWithAd(channel);
        });

        featuredList.appendChild(card);
    });
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
            categoryMatch = String(channel.category || "").toLowerCase().includes(currentCategory.toLowerCase());
        }

        return nameMatch && categoryMatch;
    });

    if (!filtered.length) {
        channelList.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-muted);">
                🔍 No channels found.
            </div>
        `;
        return;
    }

    filtered.forEach(channel => {
        const isFav = favorites.includes(channel.id);
        const card = document.createElement("div");
        card.className = "channel-card";

        card.innerHTML = `
            <button class="fav-btn ${isFav ? "active" : ""}" title="Favorite">
                <i class="${isFav ? "fa-solid" : "fa-regular"} fa-star"></i>
            </button>
            <img src="${escapeHTML(channel.logo || "logo.png")}" alt="${escapeHTML(channel.name || "TV")}" onerror="this.onerror=null;this.src='https://via.placeholder.com/80?text=TV';">
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
    renderFeaturedChannels();
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
function playChannel(channel) {
    if (!channel || !channel.url) return;

    if (currentChannelName) currentChannelName.textContent = channel.name || "Live TV";
    if (playerContainer) playerContainer.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });

    // Clean up previous HLS instance
    if (hls) {
        hls.destroy();
        hls = null;
    }

    if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
    }

    const url = String(channel.url).trim();

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
}
