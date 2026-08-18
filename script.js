// ==========================================
// StreamZX - Script (Without Sidebar)
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
let video;
let search;
let searchArea;
let playerContainer;
let currentChannelName;
let mainSectionTitle;
let categoryPage;
let settingsPage;

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

    // Initialize Theme (Dark / Light Mode)
    initTheme();

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
// THEME (DARK / LIGHT MODE) LOGIC
// ==========================================
function initTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const savedTheme = localStorage.getItem("theme");

    // Check if user set Light mode previously
    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        if (themeToggle) themeToggle.checked = false;
    } else {
        document.body.classList.remove("light-mode");
        if (themeToggle) themeToggle.checked = true;
    }

    // Toggle switch listener
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

    // LIVE EVENT NAV
    if (liveEventBtn) {
        liveEventBtn.addEventListener("click", () => {
            setActiveBottomNav(liveEventBtn);
            hideCategoryPage();
            hideSettingsPage();
            currentCategory = "Live Event";

            const mainContent = document.querySelector(".main-content");
            if (mainContent) mainContent.style.display = "block";

            if (mainSectionTitle) mainSectionTitle.textContent = "🔴 Live Events";

            if (channelList) {
                channelList.innerHTML = `
                    <div style="grid-column:1/-1; text-align:center; padding:40px 20px; color:var(--text-muted, #888);">
                        <i class="fa-solid fa-tower-broadcast" style="font-size:40px; margin-bottom:15px; display:block; color:var(--primary, #ff2a4b);"></i>
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
            hideSettingsPage();
            showNormalContent();

            currentCategory = "Sports";
            updateSectionTitle();
            renderChannels();

            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // SETTINGS NAV
    if (settingsNavBtn) {
        settingsNavBtn.addEventListener("click", () => {
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
// PLAYLIST MANAGER & M3U PARSER LOGIC
// ==========================================
let customPlaylists = JSON.parse(localStorage.getItem("customPlaylists") || "[]");

function setupSettingsActions() {

    // 1. PLAYLISTS MODAL TRIGGER
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

    // M3U FILE UPLOAD READ LOGIC
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

    // SAVE PLAYLIST
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
                    // Fallback to single stream entry if CORS/fetch fails
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

            // Reset inputs & refresh list
            document.getElementById("playlistNameInput").value = "";
            document.getElementById("playlistUrlInput").value = "";
            uploadedFileContent = "";
            addPlaylistForm.classList.add("hidden");
            renderPlaylists();
        });
    }

    // 2. Network Stream
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

    // 3. Clear App Data
    const clearDataBtn = document.getElementById("settingsClearDataBtn");
    if (clearDataBtn) {
        clearDataBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear all data and playlists?")) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    // 4. Exit Application
    const exitBtn = document.getElementById("settingsExitBtn");
    if (exitBtn) {
        exitBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to exit?")) {
                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.close();
                } else {
                    window.close();
                }
            }
        });
    }
}

// RENDER SAVED PLAYLISTS IN MODAL
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

// M3U PARSER ENGINE
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

// Helper utility
function getSettingsItemByText(text) {
    const items = document.querySelectorAll('.settings-item span');
    for (let span of items) {
        if (span.textContent.trim().toLowerCase() === text.toLowerCase()) {
            return span.closest('.settings-item');
        }
    }
    return null;
}
// Crash Log Dialog Toggle / Action
const crashLogItem = getSettingsItemByText("Crash Log Dialog");
if (crashLogItem) {
    crashLogItem.addEventListener("click", () => {
        let isEnabled = localStorage.getItem("crashLogEnabled") !== "false";
        let confirmAction = confirm(`Crash Log Dialog is currently ${isEnabled ? 'ENABLED' : 'DISABLED'}.\n\nDo you want to ${isEnabled ? 'disable' : 'enable'} error reporting?`);
        
        if (confirmAction) {
            localStorage.setItem("crashLogEnabled", (!isEnabled).toString());
            alert(`Crash Log Dialog has been ${!isEnabled ? 'Enabled' : 'Disabled'}.`);
        }
    });
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
