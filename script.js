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
// CONFIGURATIONS & API KEYS
// ==========================================
const CONFIG = {
    SPORTMONKS_API_TOKEN: 'YOUR_SPORTMONKS_API_TOKEN', // এখানে আপনার আসল API Token বসাবেন
    REFRESH_INTERVAL: 30000 // ৩০ সেকেন্ড (মিলিসেকেন্ডে)
};

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
let activeSport = 'football';

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

    // Sportmonks Auto Refresh Setup
    if (document.getElementById('sportsMatchGrid')) {
        loadSportsData('football');
        setInterval(() => loadSportsData(activeSport), CONFIG.REFRESH_INTERVAL);
    }
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

    if (categoryNavBtn) {
        categoryNavBtn.addEventListener("click", () => {
            setActiveBottomNav(categoryNavBtn);
            showCategoryPage();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

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

// ==========================================
// SPORTMONKS API INTEGRATION (FOOTBALL & CRICKET)
// ==========================================
const ENDPOINTS = {
    football: `https://api.sportmonks.com/v3/football/livescores/inplay?api_token=${CONFIG.SPORTMONKS_API_TOKEN}&include=participants;scores`,
    cricket: `https://api.sportmonks.com/v3/cricket/livescores/inplay?api_token=${CONFIG.SPORTMONKS_API_TOKEN}&include=participants;runs`
};

async function loadSportsData(sportType = activeSport) {
    activeSport = sportType;
    const gridContainer = document.getElementById('sportsMatchGrid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '<p style="color:var(--text-muted); grid-column: 1/-1; text-align:center;">Loading matches...</p>';

    try {
        const response = await fetch(ENDPOINTS[sportType]);
        const result = await response.json();

        if (result.data && result.data.length > 0) {
            renderMatches(result.data, sportType);
        } else {
            gridContainer.innerHTML = `<p style="color:var(--text-muted); grid-column: 1/-1; text-align:center;">No live ${sportType} matches right now.</p>`;
        }
    } catch (error) {
        console.error(`Error loading ${sportType} data:`, error);
        gridContainer.innerHTML = `<p style="color:#ef4444; grid-column: 1/-1; text-align:center;">Failed to load live scores.</p>`;
    }
}

function renderMatches(matches, type) {
    const gridContainer = document.getElementById('sportsMatchGrid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    matches.forEach(match => {
        let homeTeam = 'Team A';
        let awayTeam = 'Team B';
        let scoreText = '0 - 0';

        if (type === 'football') {
            homeTeam = match.participants?.find(p => p.meta?.location === 'home')?.name || 'Home';
            awayTeam = match.participants?.find(p => p.meta?.location === 'away')?.name || 'Away';
            
            const homeScore = match.scores?.find(s => s.description === 'CURRENT' && s.score?.participant === 'home')?.score?.goals ?? 0;
            const awayScore = match.scores?.find(s => s.description === 'CURRENT' && s.score?.participant === 'away')?.score?.goals ?? 0;
            scoreText = `${homeScore} - ${awayScore}`;

        } else if (type === 'cricket') {
            homeTeam = match.participants?.find(p => p.meta?.position === 'home')?.name || 'Team A';
            awayTeam = match.participants?.find(p => p.meta?.position === 'away')?.name || 'Team B';

            const runs = match.runs || [];
            const homeRun = runs[0] ? `${runs[0].score}/${runs[0].wickets}` : '0/0';
            const awayRun = runs[1] ? `${runs[1].score}/${runs[1].wickets}` : '0/0';
            scoreText = `${homeRun} vs ${awayRun}`;
        }

        const matchCard = `
            <div class="channel-card">
                <span class="badge-new" style="position: absolute; top: 6px; left: 6px; background:#ef4444;">LIVE</span>
                <h4 style="margin-top: 15px;">${escapeHTML(homeTeam)}</h4>
                <p style="font-weight: 800; color: var(--primary); margin: 6px 0; font-size: 14px;">${escapeHTML(scoreText)}</p>
                <h4>${escapeHTML(awayTeam)}</h4>
            </div>
        `;
        gridContainer.insertAdjacentHTML('beforeend', matchCard);
    });
}
