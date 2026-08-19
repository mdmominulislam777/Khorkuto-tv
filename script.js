// ==========================================
// StreamZX - Script
// PART 1
// App + Player + Theme + Navigation
// ==========================================

let channels = [];
let currentCategory = "Sports";
let isInitialLoad = true;
let hls = null;

// ==========================================
// FAVORITES
// ==========================================

let favorites = [];

try {
    const storedFavs = localStorage.getItem("favChannels");
    favorites = storedFavs ? JSON.parse(storedFavs) : [];

    if (!Array.isArray(favorites)) {
        favorites = [];
    }
} catch (error) {
    favorites = [];
}


// ==========================================
// CUSTOM PLAYLISTS
// ==========================================

let customPlaylists = [];

try {
    const storedPlaylists =
        localStorage.getItem("customPlaylists");

    customPlaylists =
        storedPlaylists
            ? JSON.parse(storedPlaylists)
            : [];

    if (!Array.isArray(customPlaylists)) {
        customPlaylists = [];
    }

} catch (error) {
    customPlaylists = [];
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

// Player Overlay

let playerOverlay;
let lockOverlay;

let isLocked = false;
let overlayTimeout = null;

let currentAspectRatioIndex = 0;

const aspectRatios = [
    "contain",
    "cover",
    "fill"
];


// ==========================================
// APP START
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------
    // Telegram WebApp
    // --------------------------------------

    if (
        window.Telegram &&
        window.Telegram.WebApp
    ) {
        try {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        } catch (error) {
            console.log(
                "Telegram WebApp error:",
                error
            );
        }
    }


    // --------------------------------------
    // Main DOM
    // --------------------------------------

    channelList =
        document.getElementById("channelList");

    video =
        document.getElementById("video");

    search =
        document.getElementById("search");

    searchArea =
        document.getElementById("searchArea");

    playerContainer =
        document.getElementById("playerContainer");

    currentChannelName =
        document.getElementById(
            "currentChannelName"
        );

    mainSectionTitle =
        document.getElementById(
            "mainSectionTitle"
        );

    categoryPage =
        document.getElementById(
            "categoryPage"
        );

    settingsPage =
        document.getElementById(
            "settingsPage"
        );


    // --------------------------------------
    // Initialize
    // --------------------------------------

    initTheme();

    initPlayerControls();

    setupEventListeners();


    // --------------------------------------
    // Splash Safety
    // --------------------------------------

    setTimeout(() => {
        hideSplash();
    }, 2000);


    // --------------------------------------
    // Load App
    // --------------------------------------

    loadChannels();

});


// ==========================================
// PLAYER CONTROLS
// ==========================================

function initPlayerControls() {

    playerOverlay =
        document.getElementById(
            "playerOverlay"
        );

    lockOverlay =
        document.getElementById(
            "lockOverlay"
        );


    playerContainer =
        document.getElementById(
            "playerContainer"
        );


    // --------------------------------------
    // Buttons
    // --------------------------------------

    const playPauseBtn =
        document.getElementById(
            "playPauseBtn"
        );

    const rewindBtn =
        document.getElementById(
            "rewindBtn"
        );

    const forwardBtn =
        document.getElementById(
            "forwardBtn"
        );

    const muteBtn =
        document.getElementById(
            "muteBtn"
        );

    const lockBtn =
        document.getElementById(
            "lockBtn"
        );

    const unlockBtn =
        document.getElementById(
            "unlockBtn"
        );

    const aspectRatioBtn =
        document.getElementById(
            "aspectBtn"
        );

    const pipBtn =
        document.getElementById(
            "pipPlayerBtn"
        );

    const fullscreenBtn =
        document.getElementById(
            "fullScreenBtn"
        );

    const seekBar =
        document.getElementById(
            "progressBar"
        );

    const currentTimeEl =
        document.getElementById(
            "currentTime"
        );

    const durationEl =
        document.getElementById(
            "durationTime"
        );


    // ======================================
    // PICTURE IN PICTURE
    // ======================================

    if (video) {

        video.addEventListener(
            "enterpictureinpicture",
            () => {

                if (playerContainer) {
                    playerContainer.style.display =
                        "none";
                }

            }
        );


        video.addEventListener(
            "leavepictureinpicture",
            () => {

                if (playerContainer) {
                    playerContainer.style.display =
                        "block";
                }

            }
        );

    }


    // ======================================
    // PLAY / PAUSE
    // ======================================

    if (
        playPauseBtn &&
        video
    ) {

        playPauseBtn.addEventListener(
            "click",
            togglePlayPause
        );


        video.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                toggleOverlayVisibility();

            }
        );

    }


    // ======================================
    // REWIND 10 SEC
    // ======================================

    if (
        rewindBtn &&
        video
    ) {

        rewindBtn.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                video.currentTime =
                    Math.max(
                        0,
                        video.currentTime - 10
                    );

                resetOverlayTimeout();

            }
        );

    }


    // ======================================
    // FORWARD 10 SEC
    // ======================================

    if (
        forwardBtn &&
        video
    ) {

        forwardBtn.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                const duration =
                    Number.isFinite(
                        video.duration
                    )
                        ? video.duration
                        : video.currentTime + 10;


                video.currentTime =
                    Math.min(
                        duration,
                        video.currentTime + 10
                    );

                resetOverlayTimeout();

            }
        );

    }


    // ======================================
    // MUTE
    // ======================================

    if (
        muteBtn &&
        video
    ) {

        muteBtn.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                video.muted =
                    !video.muted;


                const icon =
                    muteBtn.querySelector("i");


                if (icon) {

                    icon.className =
                        video.muted
                            ? "fa-solid fa-volume-xmark"
                            : "fa-solid fa-volume-high";

                }


                resetOverlayTimeout();

            }
        );

    }


    // ======================================
    // LOCK SCREEN
    // ======================================

    if (lockBtn) {

        lockBtn.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                isLocked = true;


                if (playerOverlay) {

                    playerOverlay.classList.add(
                        "hidden-overlay"
                    );

                }


                if (lockOverlay) {

                    lockOverlay.classList.remove(
                        "hidden"
                    );

                }

            }
        );

    }


    // ======================================
    // UNLOCK SCREEN
    // ======================================

    if (unlockBtn) {

        unlockBtn.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                isLocked = false;


                if (lockOverlay) {

                    lockOverlay.classList.add(
                        "hidden"
                    );

                }


                if (playerOverlay) {

                    playerOverlay.classList.remove(
                        "hidden-overlay"
                    );

                }


                resetOverlayTimeout();

            }
        );

    }


    // ======================================
    // ASPECT RATIO
    // ======================================

    if (
        aspectRatioBtn &&
        video
    ) {

        aspectRatioBtn.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();


                currentAspectRatioIndex =
                    (
                        currentAspectRatioIndex + 1
                    ) %
                    aspectRatios.length;


                video.style.objectFit =
                    aspectRatios[
                        currentAspectRatioIndex
                    ];


                resetOverlayTimeout();

            }
        );

    }


    // ======================================
    // FLOATING PIP
    // ======================================

    if (pipBtn) {

        pipBtn.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                toggleFloatingPlayer();

                resetOverlayTimeout();

            }
        );

    }


    // ======================================
    // FULLSCREEN
    // ======================================

    if (
        fullscreenBtn &&
        video
    ) {

        fullscreenBtn.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                toggleFullScreen();

                resetOverlayTimeout();

            }
        );

    }


    // ======================================
    // VIDEO TIME UPDATE
    // ======================================

    if (video) {

        video.addEventListener(
            "timeupdate",
            () => {

                if (
                    !Number.isFinite(
                        video.duration
                    ) ||
                    video.duration <= 0
                ) {
                    return;
                }


                if (seekBar) {

                    seekBar.value =
                        (
                            video.currentTime /
                            video.duration
                        ) * 100;

                }


                if (currentTimeEl) {

                    currentTimeEl.textContent =
                        formatTime(
                            video.currentTime
                        );

                }


                if (durationEl) {

                    durationEl.textContent =
                        formatTime(
                            video.duration
                        );

                }

            }
        );


        // ----------------------------------
        // Progress Bar
        // ----------------------------------

        if (seekBar) {

            seekBar.addEventListener(
                "input",
                (event) => {

                    if (
                        Number.isFinite(
                            video.duration
                        ) &&
                        video.duration > 0
                    ) {

                        video.currentTime =
                            (
                                Number(
                                    event.target.value
                                ) / 100
                            ) *
                            video.duration;

                    }

                }
            );

        }


        // ----------------------------------
        // Play / Pause Icon
        // ----------------------------------

        video.addEventListener(
            "play",
            updatePlayIcon
        );

        video.addEventListener(
            "pause",
            updatePlayIcon
        );

    }

}


// ==========================================
// PLAY / PAUSE FUNCTION
// ==========================================

function togglePlayPause(event) {

    if (event) {
        event.stopPropagation();
    }


    if (!video) {
        return;
    }


    if (video.paused) {

        video
            .play()
            .catch(error => {

                console.log(
                    "Play error:",
                    error
                );

            });

    } else {

        video.pause();

    }


    resetOverlayTimeout();

}


// ==========================================
// UPDATE PLAY ICON
// ==========================================

function updatePlayIcon() {

    if (!video) {
        return;
    }


    const playIcon =
        document.querySelector(
            "#playPauseBtn i"
        );


    if (!playIcon) {
        return;
    }


    playIcon.className =
        video.paused
            ? "fa-solid fa-play"
            : "fa-solid fa-pause";

}


// ==========================================
// TOGGLE OVERLAY
// ==========================================

function toggleOverlayVisibility() {

    if (
        isLocked ||
        !playerOverlay
    ) {
        return;
    }


    if (
        playerOverlay.classList.contains(
            "hidden-overlay"
        )
    ) {

        playerOverlay.classList.remove(
            "hidden-overlay"
        );

        resetOverlayTimeout();

    } else {

        playerOverlay.classList.add(
            "hidden-overlay"
        );

    }

}


// ==========================================
// OVERLAY AUTO HIDE
// ==========================================

function resetOverlayTimeout() {

    if (overlayTimeout) {

        clearTimeout(
            overlayTimeout
        );

        overlayTimeout = null;

    }


    if (
        !isLocked &&
        playerOverlay
    ) {

        playerOverlay.classList.remove(
            "hidden-overlay"
        );


        overlayTimeout =
            setTimeout(
                () => {

                    if (
                        video &&
                        !video.paused
                    ) {

                        playerOverlay.classList.add(
                            "hidden-overlay"
                        );

                    }

                },
                4000
            );

    }

}


// ==========================================
// FORMAT TIME
// ==========================================

function formatTime(seconds) {

    if (
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {
        return "00:00";
    }


    const mins =
        Math.floor(
            seconds / 60
        );


    const secs =
        Math.floor(
            seconds % 60
        );


    return (
        (mins < 10 ? "0" : "") +
        mins +
        ":" +
        (secs < 10 ? "0" : "") +
        secs
    );

}


// ==========================================
// FULLSCREEN
// ==========================================

function toggleFullScreen() {

    const wrapper =
        document.querySelector(
            ".video-player-wrapper"
        ) || video;


    if (!wrapper) {
        return;
    }


    if (!document.fullscreenElement) {

        if (
            wrapper.requestFullscreen
        ) {

            wrapper.requestFullscreen();

        } else if (
            wrapper.webkitRequestFullscreen
        ) {

            wrapper.webkitRequestFullscreen();

        } else if (
            wrapper.msRequestFullscreen
        ) {

            wrapper.msRequestFullscreen();

        }

    } else {

        if (
            document.exitFullscreen
        ) {

            document.exitFullscreen();

        } else if (
            document.webkitExitFullscreen
        ) {

            document.webkitExitFullscreen();

        }

    }

}


// ==========================================
// THEME
// ==========================================

function initTheme() {

    const themeToggle =
        document.getElementById(
            "themeToggle"
        );


    const savedTheme =
        localStorage.getItem(
            "theme"
        );


    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );


        if (themeToggle) {
            themeToggle.checked = false;
        }

    } else {

        document.body.classList.remove(
            "light-mode"
        );


        if (themeToggle) {
            themeToggle.checked = true;
        }

    }


    if (themeToggle) {

        themeToggle.addEventListener(
            "change",
            () => {

                if (
                    themeToggle.checked
                ) {

                    document.body.classList.remove(
                        "light-mode"
                    );

                    localStorage.setItem(
                        "theme",
                        "dark"
                    );

                } else {

                    document.body.classList.add(
                        "light-mode"
                    );

                    localStorage.setItem(
                        "theme",
                        "light"
                    );

                }

            }
        );

    }

}


// ==========================================
// SPLASH SCREEN
// ==========================================

function hideSplash() {

    const splash =
        document.getElementById(
            "splash"
        );


    if (
        splash &&
        !splash.classList.contains(
            "hidden"
        )
    ) {

        splash.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {

    // ======================================
    // SEARCH BUTTON
    // ======================================

    const searchBtn =
        document.getElementById(
            "searchBtn"
        );


    if (searchBtn) {

        searchBtn.addEventListener(
            "click",
            () => {

                if (
                    categoryPage &&
                    !categoryPage.classList.contains(
                        "hidden"
                    )
                ) {
                    return;
                }


                if (
                    settingsPage &&
                    !settingsPage.classList.contains(
                        "hidden"
                    )
                ) {
                    return;
                }


                if (!searchArea) {
                    return;
                }


                searchArea.classList.toggle(
                    "active"
                );


                if (
                    searchArea.classList.contains(
                        "active"
                    )
                ) {

                    if (search) {
                        search.focus();
                    }

                } else {

                    if (search) {
                        search.value = "";
                    }

                    renderChannels();

                }

            }
        );

    }


    // ======================================
    // HEADER PIP BUTTON
    // ======================================

    const pipPlayerBtn =
        document.getElementById(
            "pipPlayerBtn"
        );


    if (
        pipPlayerBtn &&
        !pipPlayerBtn.dataset.listenerAdded
    ) {

        pipPlayerBtn.dataset.listenerAdded =
            "true";


        pipPlayerBtn.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                toggleFloatingPlayer();

            }
        );

    }


    // ======================================
    // FAVORITES HEADER
    // ======================================

    const favHeaderBtn =
        document.getElementById(
            "favHeaderBtn"
        );


    if (favHeaderBtn) {

        favHeaderBtn.addEventListener(
            "click",
            () => {

                showNormalContent();

                currentCategory =
                    "Favorites";


                updateSectionTitle();

                renderChannels();

                setActiveBottomNav(
                    null
                );

            }
        );

    }


    // ======================================
    // REFRESH
    // ======================================

    const refreshBtn =
        document.getElementById(
            "refreshBtn"
        );


    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            () => {

                loadChannels();

            }
        );

    }


    // ======================================
    // SEARCH INPUT
    // ======================================

    if (search) {

        search.addEventListener(
            "input",
            () => {

                renderChannels();

            }
        );

    }


    // ======================================
    // CLOSE PLAYER
    // ======================================

    const closePlayerBtn =
        document.getElementById(
            "closePlayerBtn"
        );


    if (closePlayerBtn) {

        closePlayerBtn.addEventListener(
            "click",
            closePlayer
        );

    }


    // ======================================
    // BOTTOM NAV
    // ======================================

    const liveEventBtn =
        document.getElementById(
            "liveEventNav"
        );


    const categoryNavBtn =
        document.getElementById(
            "categoryNav"
        );


    const sportsNavBtn =
        document.getElementById(
            "sportsNav"
        );


    const settingsNavBtn =
        document.getElementById(
            "settingsNav"
        );


    // --------------------------------------
    // LIVE EVENTS
    // --------------------------------------

    if (liveEventBtn) {

        liveEventBtn.addEventListener(
            "click",
            () => {

                setActiveBottomNav(
                    liveEventBtn
                );


                hideCategoryPage();

                hideSettingsPage();

                showNormalContent();


                currentCategory =
                    "Live Event";


                if (mainSectionTitle) {

                    mainSectionTitle.textContent =
                        "🔴 Live Events";

                }


                if (
                    typeof loadLiveEvents ===
                    "function"
                ) {

                    loadLiveEvents();

                }


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    // --------------------------------------
    // CATEGORY
    // --------------------------------------

    if (categoryNavBtn) {

        categoryNavBtn.addEventListener(
            "click",
            () => {

                setActiveBottomNav(
                    categoryNavBtn
                );


                showCategoryPage();


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    // --------------------------------------
    // SPORTS
    // --------------------------------------

    if (sportsNavBtn) {

        sportsNavBtn.addEventListener(
            "click",
            () => {

                setActiveBottomNav(
                    sportsNavBtn
                );


                if (
                    typeof openSportsEvents ===
                    "function"
                ) {

                    openSportsEvents();

                } else {

                    currentCategory =
                        "Sports";

                    hideCategoryPage();

                    hideSettingsPage();

                    showNormalContent();

                    updateSectionTitle();

                    renderChannels();

                }


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    // --------------------------------------
    // SETTINGS
    // --------------------------------------

    if (settingsNavBtn) {

        settingsNavBtn.addEventListener(
            "click",
            () => {

                setActiveBottomNav(
                    settingsNavBtn
                );


                showSettingsPage();


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    // ======================================
    // CATEGORY ITEMS
    // ======================================

    document
        .querySelectorAll(
            ".category-item"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const selectedCategory =
                        item.dataset.category;


                    if (!selectedCategory) {
                        return;
                    }


                    currentCategory =
                        selectedCategory;


                    hideCategoryPage();

                    hideSettingsPage();

                    showNormalContent();


                    updateSectionTitle();

                    renderChannels();


                    if (
                        selectedCategory ===
                        "Sports"
                    ) {

                        setActiveBottomNav(
                            sportsNavBtn
                        );

                    } else {

                        setActiveBottomNav(
                            categoryNavBtn
                        );

                    }


                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }
            );

        });


    // ======================================
    // SETTINGS ACTIONS
    // ======================================

    if (
        typeof setupSettingsActions ===
        "function"
    ) {

        setupSettingsActions();

    }

}


// ==========================================
// PAGE CONTROLS
// ==========================================

function showCategoryPage() {

    if (categoryPage) {

        categoryPage.classList.remove(
            "hidden"
        );

    }


    hideSettingsPage();


    const mainContent =
        document.querySelector(
            ".main-content"
        );


    if (mainContent) {

        mainContent.style.display =
            "none";

    }


    if (searchArea) {

        searchArea.classList.remove(
            "active"
        );

    }

}


// ==========================================
// HIDE CATEGORY
// ==========================================

function hideCategoryPage() {

    if (categoryPage) {

        categoryPage.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// SHOW SETTINGS
// ==========================================

function showSettingsPage() {

    if (settingsPage) {

        settingsPage.classList.remove(
            "hidden"
        );

    }


    hideCategoryPage();


    const mainContent =
        document.querySelector(
            ".main-content"
        );


    if (mainContent) {

        mainContent.style.display =
            "none";

    }


    if (searchArea) {

        searchArea.classList.remove(
            "active"
        );

    }

}


// ==========================================
// HIDE SETTINGS
// ==========================================

function hideSettingsPage() {

    if (settingsPage) {

        settingsPage.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// SHOW NORMAL CONTENT
// ==========================================

function showNormalContent() {

    hideCategoryPage();

    hideSettingsPage();


    const mainContent =
        document.querySelector(
            ".main-content"
        );


    if (mainContent) {

        mainContent.style.display =
            "block";

    }

}


// ==========================================
// BOTTOM NAV ACTIVE
// ==========================================

function setActiveBottomNav(
    activeButton
) {

    document
        .querySelectorAll(
            ".bottom-nav-btn"
        )
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });


    if (activeButton) {

        activeButton.classList.add(
            "active"
        );

    }

}


// ==========================================
// SECTION TITLE
// ==========================================

function updateSectionTitle() {

    const titles = {

        Sports:
            "🏆 Sports Channels",

        Entertainment:
            "🎬 Entertainment Channels",

        News:
            "📰 News Channels",

        Movies:
            "🎥 Movies Channels",

        Islamic:
            "🕌 Islamic Channels",

        Kids:
            "🧒 Kids Channels",

        Music:
            "🎵 Music Channels",

        Favorites:
            "⭐ Favorite Channels"

    };


    if (mainSectionTitle) {

        mainSectionTitle.textContent =
            titles[currentCategory] ||
            "📺 Channels";

    }

}


// ==========================================
// CLOSE PLAYER
// ==========================================

function closePlayer() {

    // --------------------------------------
    // Destroy HLS
    // --------------------------------------

    if (hls) {

        try {
            hls.destroy();
        } catch (error) {
            console.log(
                "HLS destroy error:",
                error
            );
        }

        hls = null;

    }


    // --------------------------------------
    // Stop Video
    // --------------------------------------

    if (video) {

        video.pause();

        video.removeAttribute(
            "src"
        );

        video.load();

    }


    // --------------------------------------
    // Exit PiP
    // --------------------------------------

    if (
        document.pictureInPictureElement
    ) {

        document
            .exitPictureInPicture()
            .catch(() => {});

    }


    // --------------------------------------
    // Hide Player
    // --------------------------------------

    if (playerContainer) {

        playerContainer.classList.add(
            "hidden"
        );

        playerContainer.style.display =
            "";

    }


    // --------------------------------------
    // Unlock Screen
    // --------------------------------------

    isLocked = false;


    if (lockOverlay) {

        lockOverlay.classList.add(
            "hidden"
        );

    }


    if (playerOverlay) {

        playerOverlay.classList.remove(
            "hidden-overlay"
        );

    }

}


// ==========================================
// FLOATING PLAYER / PIP
// ==========================================

async function toggleFloatingPlayer() {

    const videoElement =
        document.getElementById(
            "video"
        );


    if (!videoElement) {

        alert(
            "Video player not found!"
        );

        return;

    }


    // --------------------------------------
    // Check Video
    // --------------------------------------

    if (
        videoElement.paused
    ) {

        alert(
            "Please play a channel first to use Floating Player!"
        );

        return;

    }


    // --------------------------------------
    // Browser PiP
    // --------------------------------------

    try {

        if (
            document.pictureInPictureEnabled
        ) {

            if (
                document.pictureInPictureElement
            ) {

                await document.exitPictureInPicture();

            } else {

                await videoElement.requestPictureInPicture();

            }

        } else {

            alert(
                "Picture-in-Picture mode is not supported in this browser."
            );

        }

    } catch (error) {

        console.error(
            "Floating Player Error:",
            error
        );

    }

}
// ==========================================
// StreamZX - Script
// PART 2
// Channels + Favorites + Monetag + Live Events
// ==========================================


// ==========================================
// LIVE EVENTS DATA
// ==========================================

let liveEvents = [];


// ==========================================
// LOAD CHANNELS
// ==========================================

async function loadChannels() {

    if (!channelList) {
        return;
    }


    channelList.innerHTML = `
        <div style="
            grid-column:1/-1;
            text-align:center;
            padding:30px;
            color:var(--text-muted,#888);
        ">
            <i class="fa-solid fa-circle-notch fa-spin"
               style="
                    font-size:28px;
                    margin-bottom:10px;
                    color:var(--primary,#ff2a4b);
               ">
            </i>

            <div>Loading channels...</div>
        </div>
    `;


    try {

        const response = await fetch(
            "channels.json?t=" + Date.now(),
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );

        }


        const data =
            await response.json();


        // --------------------------------------
        // Support both JSON formats
        // --------------------------------------

        if (Array.isArray(data)) {

            channels = data;

        } else if (
            data &&
            Array.isArray(data.channels)
        ) {

            channels = data.channels;

        } else {

            channels = [];

        }


        // --------------------------------------
        // Initial App Load
        // --------------------------------------

        if (isInitialLoad) {

            isInitialLoad = false;


            const liveEventBtn =
                document.getElementById(
                    "liveEventNav"
                );


            if (liveEventBtn) {

                liveEventBtn.click();

            } else {

                currentCategory =
                    "Sports";

                updateSectionTitle();

                renderChannels();

            }

        } else {

            // ----------------------------------
            // Refresh while Live Event page
            // ----------------------------------

            if (
                currentCategory ===
                "Live Event"
            ) {

                if (
                    typeof loadLiveEvents ===
                    "function"
                ) {

                    loadLiveEvents();

                }

            } else {

                renderChannels();

            }

        }

    } catch (error) {

        console.error(
            "Channel loading error:",
            error
        );


        channelList.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:30px;
                color:#ef4444;
            ">

                <i class="fa-solid fa-triangle-exclamation"
                   style="
                        font-size:32px;
                        margin-bottom:10px;
                    ">
                </i>

                <div>
                    Could not load channels.json
                </div>

                <small style="
                    display:block;
                    margin-top:8px;
                    color:var(--text-muted,#888);
                ">
                    ${escapeHTML(error.message)}
                </small>

                <button
                    onclick="loadChannels()"
                    style="
                        margin-top:15px;
                        padding:9px 16px;
                        border:0;
                        border-radius:8px;
                        background:var(--primary,#ff2a4b);
                        color:#fff;
                        cursor:pointer;
                    "
                >
                    🔄 Retry
                </button>

            </div>
        `;

    } finally {

        hideSplash();

    }

}


// ==========================================
// RENDER CHANNELS
// ==========================================

function renderChannels() {

    if (!channelList) {
        return;
    }


    channelList.innerHTML = "";


    const keyword =
        search
            ? search.value
                .toLowerCase()
                .trim()
            : "";


    // --------------------------------------
    // Filter Channels
    // --------------------------------------

    const filtered =
        channels.filter(channel => {

            const name =
                String(
                    channel.name || ""
                ).toLowerCase();


            const nameMatch =
                name.includes(keyword);


            let categoryMatch = false;


            // Favorites
            if (
                currentCategory ===
                "Favorites"
            ) {

                categoryMatch =
                    favorites.some(
                        id =>
                            String(id) ===
                            String(channel.id)
                    );

            } else {

                const channelCategory =
                    String(
                        channel.category || ""
                    ).toLowerCase();


                categoryMatch =
                    channelCategory.includes(
                        String(
                            currentCategory
                        ).toLowerCase()
                    );

            }


            return (
                nameMatch &&
                categoryMatch
            );

        });


    // --------------------------------------
    // Empty Result
    // --------------------------------------

    if (!filtered.length) {

        channelList.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:35px 20px;
                color:var(--text-muted,#888);
            ">

                <i class="fa-solid fa-tv"
                   style="
                        font-size:35px;
                        margin-bottom:12px;
                        color:var(--primary,#ff2a4b);
                    ">
                </i>

                <div style="
                    font-size:15px;
                    font-weight:600;
                ">
                    No channels found
                </div>

                <small style="
                    display:block;
                    margin-top:7px;
                ">
                    Try another category or search.
                </small>

            </div>
        `;

        return;

    }


    // --------------------------------------
    // Create Channel Cards
    // --------------------------------------

    filtered.forEach(channel => {

        const isFav =
            favorites.some(
                id =>
                    String(id) ===
                    String(channel.id)
            );


        const card =
            document.createElement("div");


        card.className =
            "channel-card";


        card.innerHTML = `
            <button
                class="fav-btn ${isFav ? "active" : ""}"
                title="Favorite"
                type="button"
            >
                <i class="${
                    isFav
                        ? "fa-solid"
                        : "fa-regular"
                } fa-star"></i>
            </button>

            <img
                src="${escapeHTML(
                    channel.logo ||
                    "logo.png"
                )}"
                alt="${escapeHTML(
                    channel.name ||
                    "TV"
                )}"
                loading="lazy"
                onerror="
                    this.onerror=null;
                    this.src='logo.png';
                "
            >

            <h4>
                ${escapeHTML(
                    channel.name ||
                    "Unknown"
                )}
            </h4>
        `;


        // ----------------------------------
        // Favorite Button
        // ----------------------------------

        const favBtn =
            card.querySelector(
                ".fav-btn"
            );


        if (favBtn) {

            favBtn.addEventListener(
                "click",
                event => {

                    toggleFavorite(
                        channel.id,
                        event
                    );

                }
            );

        }


        // ----------------------------------
        // Open Channel
        // ----------------------------------

        card.addEventListener(
            "click",
            () => {

                playChannelWithAd(
                    channel
                );

            }
        );


        channelList.appendChild(
            card
        );

    });

}


// ==========================================
// TOGGLE FAVORITE
// ==========================================

function toggleFavorite(
    channelId,
    event
) {

    if (event) {

        event.stopPropagation();

    }


    const existingIndex =
        favorites.findIndex(
            id =>
                String(id) ===
                String(channelId)
        );


    if (existingIndex === -1) {

        favorites.push(
            channelId
        );

    } else {

        favorites.splice(
            existingIndex,
            1
        );

    }


    try {

        localStorage.setItem(
            "favChannels",
            JSON.stringify(
                favorites
            )
        );

    } catch (error) {

        console.warn(
            "Favorite save error:",
            error
        );

    }


    renderChannels();

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ==========================================
// MONETAG AD HANDLER
// ==========================================

function playChannelWithAd(
    channel
) {

    if (
        !channel ||
        !channel.url
    ) {
        return;
    }


    // --------------------------------------
    // First ad already shown
    // --------------------------------------

    if (firstChannelAdShown) {

        playChannel(
            channel
        );

        return;

    }


    // --------------------------------------
    // Monetag not loaded
    // --------------------------------------

    if (
        typeof show_11580289 !==
        "function"
    ) {

        firstChannelAdShown =
            true;

        playChannel(
            channel
        );

        return;

    }


    // --------------------------------------
    // Prevent double ad
    // --------------------------------------

    if (isAdShowing) {
        return;
    }


    isAdShowing = true;


    try {

        const ad =
            show_11580289(
                "pop"
            );


        // ----------------------------------
        // Promise Ad
        // ----------------------------------

        if (
            ad &&
            typeof ad.then ===
            "function"
        ) {

            ad.then(() => {

                firstChannelAdShown =
                    true;

                isAdShowing =
                    false;


                playChannel(
                    channel
                );

            }).catch(error => {

                console.log(
                    "Monetag rejected:",
                    error
                );


                firstChannelAdShown =
                    true;

                isAdShowing =
                    false;


                playChannel(
                    channel
                );

            });

        } else {

            // --------------------------------
            // Non-Promise Ad
            // --------------------------------

            firstChannelAdShown =
                true;

            isAdShowing =
                false;


            playChannel(
                channel
            );

        }

    } catch (error) {

        console.error(
            "Monetag error:",
            error
        );


        firstChannelAdShown =
            true;

        isAdShowing =
            false;


        playChannel(
            channel
        );

    }

}


// ==========================================
// PLAY CHANNEL
// ==========================================

function playChannel(
    channel
) {

    if (
        !channel ||
        !channel.url
    ) {
        return;
    }


    // --------------------------------------
    // Channel Name
    // --------------------------------------

    if (currentChannelName) {

        currentChannelName.textContent =
            channel.name ||
            "Live TV";

    }


    // --------------------------------------
    // Show Player
    // --------------------------------------

    if (playerContainer) {

        playerContainer.classList.remove(
            "hidden"
        );

        playerContainer.style.display =
            "block";

    }


    // --------------------------------------
    // Scroll Top
    // --------------------------------------

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    // --------------------------------------
    // Destroy Previous HLS
    // --------------------------------------

    if (hls) {

        try {

            hls.destroy();

        } catch (error) {

            console.log(
                "HLS destroy error:",
                error
            );

        }

        hls = null;

    }


    // --------------------------------------
    // Stop Existing Video
    // --------------------------------------

    if (video) {

        video.pause();

        video.removeAttribute(
            "src"
        );

        video.removeAttribute(
            "srcObject"
        );

        video.load();

    }


    const url =
        String(
            channel.url
        ).trim();


    if (!url) {
        return;
    }


    // ======================================
    // M3U8 / HLS
    // ======================================

    const isHLS =
        /\.m3u8(\?|$)/i.test(
            url
        ) ||
        url
            .toLowerCase()
            .includes(
                "m3u8"
            );


    if (
        isHLS &&
        typeof Hls !==
        "undefined" &&
        Hls.isSupported()
    ) {

        hls =
            new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });


        hls.loadSource(
            url
        );


        hls.attachMedia(
            video
        );


        hls.on(
            Hls.Events.MANIFEST_PARSED,
            () => {

                if (!video) {
                    return;
                }


                video
                    .play()
                    .catch(error => {

                        console.log(
                            "Autoplay blocked:",
                            error
                        );

                    });

            }
        );


        hls.on(
            Hls.Events.ERROR,
            (
                event,
                data
            ) => {

                console.error(
                    "HLS error:",
                    data
                );


                // --------------------------------
                // Fatal Error Recovery
                // --------------------------------

                if (
                    data &&
                    data.fatal
                ) {

                    switch (
                        data.type
                    ) {

                        case Hls.ErrorTypes.NETWORK_ERROR:

                            console.log(
                                "Recovering HLS network error..."
                            );

                            try {

                                hls.startLoad();

                            } catch (error) {

                                console.error(
                                    error
                                );

                            }

                            break;


                        case Hls.ErrorTypes.MEDIA_ERROR:

                            console.log(
                                "Recovering HLS media error..."
                            );

                            try {

                                hls.recoverMediaError();

                            } catch (error) {

                                console.error(
                                    error
                                );

                            }

                            break;


                        default:

                            try {

                                hls.destroy();

                            } catch (error) {}

                            hls = null;

                            break;

                        }

                }

            }
        );


    } else if (
        video &&
        video.canPlayType(
            "application/vnd.apple.mpegurl"
        )
    ) {

        // ==================================
        // Native HLS
        // ==================================

        video.src =
            url;


        video
            .play()
            .catch(error => {

                console.log(
                    "Autoplay blocked:",
                    error
                );

            });


    } else if (video) {

        // ==================================
        // MP4 / Other Video
        // ==================================

        video.src =
            url;


        video
            .play()
            .catch(error => {

                console.log(
                    "Autoplay blocked:",
                    error
                );

            });

    }


    // --------------------------------------
    // Reset Player Overlay
    // --------------------------------------

    if (typeof resetOverlayTimeout ===
        "function") {

        resetOverlayTimeout();

    }


    // --------------------------------------
    // Save Last Channel
    // --------------------------------------

    try {

        localStorage.setItem(
            "lastChannel",
            JSON.stringify(
                channel
            )
        );

    } catch (error) {

        console.warn(
            "Unable to save lastChannel:",
            error
        );

    }

}


// ==========================================
// LOAD LIVE EVENTS
// ==========================================

async function loadLiveEvents() {

    if (!channelList) {
        return;
    }


    channelList.innerHTML = `
        <div style="
            grid-column:1/-1;
            text-align:center;
            padding:35px 20px;
            color:var(--text-muted,#888);
        ">

            <i class="fa-solid fa-circle-notch fa-spin"
               style="
                    font-size:32px;
                    margin-bottom:12px;
                    color:var(--primary,#ff2a4b);
               ">
            </i>

            <div>
                Loading Live Events...
            </div>

        </div>
    `;


    try {

        const response =
            await fetch(
                "events.json?t=" +
                Date.now(),
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        if (Array.isArray(data)) {

            liveEvents =
                data;

        } else if (
            data &&
            Array.isArray(
                data.events
            )
        ) {

            liveEvents =
                data.events;

        } else {

            liveEvents =
                [];

        }


        renderLiveEvents();


    } catch (error) {

        console.error(
            "Live Event loading error:",
            error
        );


        channelList.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:35px 20px;
                color:#ef4444;
            ">

                <i class="fa-solid fa-triangle-exclamation"
                   style="
                        font-size:35px;
                        margin-bottom:12px;
                    ">
                </i>

                <div>
                    Could not load events.json
                </div>

                <small style="
                    display:block;
                    margin-top:8px;
                    color:var(--text-muted,#888);
                ">
                    ${escapeHTML(
                        error.message
                    )}
                </small>

                <button
                    onclick="loadLiveEvents()"
                    style="
                        margin-top:14px;
                        padding:9px 16px;
                        border:0;
                        border-radius:8px;
                        background:var(--primary,#ff2a4b);
                        color:#fff;
                    "
                >
                    🔄 Retry
                </button>

            </div>
        `;

    }

}


// ==========================================
// RENDER LIVE EVENTS
// ==========================================

function renderLiveEvents() {

    if (!channelList) {
        return;
    }


    channelList.innerHTML = "";


    // --------------------------------------
    // No Events
    // --------------------------------------

    if (!liveEvents.length) {

        channelList.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:45px 20px;
                color:var(--text-muted,#888);
            ">

                <i class="fa-solid fa-calendar-xmark"
                   style="
                        font-size:42px;
                        margin-bottom:15px;
                        color:var(--primary,#ff2a4b);
                    ">
                </i>

                <div style="
                    font-size:16px;
                    font-weight:600;
                    color:var(--text-primary);
                ">
                    No Live Events
                </div>

                <small style="
                    display:block;
                    margin-top:7px;
                ">
                    There are no events available right now.
                </small>

            </div>
        `;

        return;

    }


    // --------------------------------------
    // Separate LIVE / UPCOMING
    // --------------------------------------

    const live =
        liveEvents.filter(
            event =>
                String(
                    event.status || ""
                ).toUpperCase() ===
                "LIVE"
        );


    const upcoming =
        liveEvents.filter(
            event =>
                String(
                    event.status || ""
                ).toUpperCase() !==
                "LIVE"
        );


    // ======================================
    // LIVE NOW
    // ======================================

    if (live.length) {

        const liveTitle =
            document.createElement(
                "div"
            );


        liveTitle.style.cssText = `
            grid-column:1/-1;
            font-size:16px;
            font-weight:700;
            margin:5px 0 2px;
            display:flex;
            align-items:center;
            gap:8px;
        `;


        liveTitle.innerHTML = `
            <span style="
                width:9px;
                height:9px;
                border-radius:50%;
                background:#ef4444;
                display:inline-block;
                box-shadow:0 0 10px #ef4444;
            "></span>

            LIVE NOW
        `;


        channelList.appendChild(
            liveTitle
        );


        live.forEach(
            event => {

                createLiveEventCard(
                    event
                );

            }
        );

    }


    // ======================================
    // UPCOMING
    // ======================================

    if (upcoming.length) {

        const upcomingTitle =
            document.createElement(
                "div"
            );


        upcomingTitle.style.cssText = `
            grid-column:1/-1;
            font-size:16px;
            font-weight:700;
            margin:15px 0 2px;
            display:flex;
            align-items:center;
            gap:8px;
        `;


        upcomingTitle.innerHTML = `
            <i class="fa-regular fa-clock"
               style="
                    color:var(--primary,#ff2a4b);
               ">
            </i>

            UPCOMING
        `;


        channelList.appendChild(
            upcomingTitle
        );


        upcoming.forEach(
            event => {

                createLiveEventCard(
                    event
                );

            }
        );

    }

}


// ==========================================
// CREATE LIVE EVENT CARD
// ==========================================

function createLiveEventCard(
    event
) {

    if (!channelList) {
        return;
    }


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "live-event-card";


    const status =
        String(
            event.status ||
            "UPCOMING"
        ).toUpperCase();


    const isLive =
        status === "LIVE";


    card.innerHTML = `

        <div class="live-event-logo">

            <img
                src="${escapeHTML(
                    event.logo ||
                    "logo.png"
                )}"
                alt="${escapeHTML(
                    event.title ||
                    "Event"
                )}"
                loading="lazy"
                onerror="
                    this.onerror=null;
                    this.src='logo.png';
                "
            >

            ${
                isLive
                    ? `
                        <span class="live-badge">
                            ● LIVE
                        </span>
                    `
                    : `
                        <span class="upcoming-badge">
                            UPCOMING
                        </span>
                    `
            }

        </div>


        <div class="live-event-info">

            <h4>
                ${escapeHTML(
                    event.title ||
                    "Live Event"
                )}
            </h4>

            <p>
                ${escapeHTML(
                    event.subtitle ||
                    "Sports Event"
                )}
            </p>

            <div class="live-event-time">

                <i class="fa-regular fa-clock"></i>

                ${escapeHTML(
                    event.time ||
                    "Time TBA"
                )}

            </div>

        </div>


        <button
            class="watch-live-btn"
            type="button"
            ${isLive ? "" : "disabled"}
        >

            ${
                isLive
                    ? `
                        <i class="fa-solid fa-play"></i>
                        WATCH LIVE
                    `
                    : `
                        <i class="fa-regular fa-clock"></i>
                        UPCOMING
                    `
            }

        </button>

    `;


    // --------------------------------------
    // Watch Button
    // --------------------------------------

    const watchBtn =
        card.querySelector(
            ".watch-live-btn"
        );


    if (
        watchBtn &&
        isLive
    ) {

        watchBtn.addEventListener(
            "click",
            eventClick => {

                eventClick.stopPropagation();


                const channelId =
                    event.channelId;


                const channel =
                    channels.find(
                        ch =>
                            String(ch.id) ===
                            String(channelId)
                    );


                if (!channel) {

                    alert(
                        "Channel not found in channels.json!"
                    );

                    return;

                }


                playChannelWithAd(
                    channel
                );

            }
        );

    }


    // --------------------------------------
    // Card Click for Live
    // --------------------------------------

    if (isLive) {

        card.addEventListener(
            "click",
            eventClick => {

                if (
                    eventClick.target.closest(
                        ".watch-live-btn"
                    )
                ) {
                    return;
                }


                if (
                    typeof event.channelId !==
                    "undefined"
                ) {

                    const channel =
                        channels.find(
                            ch =>
                                String(ch.id) ===
                                String(
                                    event.channelId
                                )
                        );


                    if (channel) {

                        playChannelWithAd(
                            channel
                        );

                    }

                }

            }
        );

    }


    channelList.appendChild(
        card
    );

            }
// ==========================================
// STREAMZX - PART 3
// LIVE EVENTS + SPORTS EVENTS + PLAYER
// ==========================================

// ==========================================
// LIVE EVENTS SYSTEM
// ==========================================

let liveEvents = [];

async function loadLiveEvents() {
    if (!channelList) return;

    channelList.innerHTML = `
        <div style="
            grid-column:1/-1;
            text-align:center;
            padding:35px 20px;
            color:var(--text-muted,#888);
        ">
            <i class="fa-solid fa-circle-notch fa-spin"
               style="font-size:32px;margin-bottom:12px;color:var(--primary,#ff2a4b);">
            </i>
            <div>Loading Live Events...</div>
        </div>
    `;

    try {
        const response = await fetch(
            "events.json?t=" + Date.now(),
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        liveEvents = Array.isArray(data)
            ? data
            : Array.isArray(data.events)
                ? data.events
                : [];

        renderLiveEvents();

    } catch (error) {
        console.error("Live Event loading error:", error);

        channelList.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:35px 20px;
                color:#ef4444;
            ">
                <i class="fa-solid fa-triangle-exclamation"
                   style="font-size:35px;margin-bottom:12px;">
                </i>

                <div>Could not load events.json</div>

                <small style="
                    display:block;
                    margin-top:8px;
                    color:var(--text-muted,#888);
                ">
                    ${escapeHTML(error.message)}
                </small>

                <button
                    onclick="loadLiveEvents()"
                    style="
                        margin-top:15px;
                        padding:9px 16px;
                        border:0;
                        border-radius:8px;
                        background:var(--primary,#ff2a4b);
                        color:#fff;
                        cursor:pointer;
                    ">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}


// ==========================================
// RENDER LIVE EVENTS
// ==========================================

function renderLiveEvents() {
    if (!channelList) return;

    channelList.innerHTML = "";

    if (!liveEvents.length) {
        channelList.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:45px 20px;
                color:var(--text-muted,#888);
            ">
                <i class="fa-solid fa-calendar-xmark"
                   style="
                       font-size:42px;
                       margin-bottom:15px;
                       color:var(--primary,#ff2a4b);
                   ">
                </i>

                <div style="
                    font-size:16px;
                    font-weight:600;
                    color:var(--text-primary);
                ">
                    No Live Events
                </div>

                <small style="
                    display:block;
                    margin-top:7px;
                ">
                    There are no events available right now.
                </small>
            </div>
        `;

        return;
    }

    const live = liveEvents.filter(event =>
        String(event.status || "").toUpperCase() === "LIVE"
    );

    const upcoming = liveEvents.filter(event =>
        String(event.status || "").toUpperCase() !== "LIVE"
    );

    // LIVE NOW
    if (live.length) {
        const title = document.createElement("div");

        title.style.cssText = `
            grid-column:1/-1;
            font-size:16px;
            font-weight:700;
            margin:5px 0 2px;
            display:flex;
            align-items:center;
            gap:8px;
        `;

        title.innerHTML = `
            <span style="
                width:9px;
                height:9px;
                border-radius:50%;
                background:#ef4444;
                display:inline-block;
                box-shadow:0 0 10px #ef4444;
            "></span>
            LIVE NOW
        `;

        channelList.appendChild(title);

        live.forEach(event => {
            createLiveEventCard(event);
        });
    }

    // UPCOMING
    if (upcoming.length) {
        const title = document.createElement("div");

        title.style.cssText = `
            grid-column:1/-1;
            font-size:16px;
            font-weight:700;
            margin:15px 0 2px;
            display:flex;
            align-items:center;
            gap:8px;
        `;

        title.innerHTML = `
            <i class="fa-regular fa-clock"
               style="color:var(--primary,#ff2a4b);">
            </i>
            UPCOMING
        `;

        channelList.appendChild(title);

        upcoming.forEach(event => {
            createLiveEventCard(event);
        });
    }
}


// ==========================================
// CREATE LIVE EVENT CARD
// ==========================================

function createLiveEventCard(event) {
    if (!channelList) return;

    const card = document.createElement("div");
    card.className = "live-event-card";

    const status =
        String(event.status || "UPCOMING").toUpperCase();

    const isLive = status === "LIVE";

    card.innerHTML = `
        <div class="live-event-logo">

            <img
                src="${escapeHTML(event.logo || "logo.png")}"
                alt="${escapeHTML(event.title || "Event")}"
                onerror="
                    this.onerror=null;
                    this.src='logo.png';
                "
            >

            ${
                isLive
                    ? `<span class="live-badge">● LIVE</span>`
                    : `<span class="upcoming-badge">UPCOMING</span>`
            }

        </div>

        <div class="live-event-info">

            <h4>
                ${escapeHTML(event.title || "Live Event")}
            </h4>

            <p>
                ${escapeHTML(event.subtitle || "Sports Event")}
            </p>

            <div class="live-event-time">
                <i class="fa-regular fa-clock"></i>
                ${escapeHTML(event.time || "Time TBA")}
            </div>

        </div>

        <button
            class="watch-live-btn"
            ${isLive ? "" : "disabled"}
        >
            ${
                isLive
                    ? `
                        <i class="fa-solid fa-play"></i>
                        WATCH LIVE
                      `
                    : `
                        <i class="fa-regular fa-clock"></i>
                        UPCOMING
                      `
            }
        </button>
    `;

    const watchBtn =
        card.querySelector(".watch-live-btn");

    if (watchBtn && isLive) {
        watchBtn.addEventListener("click", e => {
            e.stopPropagation();

            const channelId = event.channelId;

            const channel = channels.find(
                ch => String(ch.id) === String(channelId)
            );

            if (!channel) {
                alert("Channel not found in channels.json!");
                return;
            }

            playChannelWithAd(channel);
        });
    }

    channelList.appendChild(card);
}


// ==========================================
// CHANNEL LOADING
// ==========================================

async function loadChannels() {
    if (!channelList) return;

    channelList.innerHTML = `
        <div style="
            grid-column:1/-1;
            text-align:center;
            padding:30px;
            color:var(--text-muted,#888);
        ">
            ⏳ Loading channels...
        </div>
    `;

    try {
        const response = await fetch(
            "channels.json?t=" + Date.now(),
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            channels = data;
        } else if (
            data &&
            Array.isArray(data.channels)
        ) {
            channels = data.channels;
        } else {
            channels = [];
        }

        if (isInitialLoad) {
            isInitialLoad = false;

            const liveBtn =
                document.getElementById("liveEventNav");

            if (liveBtn) {
                liveBtn.click();
            } else {
                renderChannels();
            }

        } else {

            if (currentCategory === "Live Event") {
                loadLiveEvents();
            } else if (currentCategory === "Sports") {
                renderChannels();
            } else {
                renderChannels();
            }
        }

    } catch (error) {

        console.error(
            "Channel loading error:",
            error
        );

        channelList.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:30px;
                color:#ef4444;
            ">
                ❌ Could not load channels.json

                <br>

                <small style="
                    color:var(--text-muted,#888);
                    display:block;
                    margin-top:8px;
                ">
                    ${escapeHTML(error.message)}
                </small>

                <button
                    onclick="loadChannels()"
                    style="
                        margin-top:15px;
                        padding:9px 16px;
                        border:0;
                        border-radius:8px;
                        background:var(--primary,#ff2a4b);
                        color:#fff;
                    ">
                    🔄 Retry
                </button>
            </div>
        `;

    } finally {
        hideSplash();
    }
}


// ==========================================
// RENDER CHANNELS
// ==========================================

function renderChannels() {
    if (!channelList) return;

    channelList.innerHTML = "";

    const keyword =
        search
            ? search.value.toLowerCase().trim()
            : "";

    const filtered = channels.filter(channel => {

        const name =
            String(channel.name || "")
                .toLowerCase();

        const nameMatch =
            name.includes(keyword);

        let categoryMatch = false;

        if (currentCategory === "Favorites") {

            categoryMatch =
                favorites.some(
                    id =>
                        String(id) ===
                        String(channel.id)
                );

        } else {

            categoryMatch =
                String(channel.category || "")
                    .toLowerCase()
                    .includes(
                        String(currentCategory)
                            .toLowerCase()
                    );
        }

        return nameMatch && categoryMatch;
    });


    if (!filtered.length) {

        channelList.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:30px;
                color:var(--text-muted,#888);
            ">
                🔍 No channels found.
            </div>
        `;

        return;
    }


    filtered.forEach(channel => {

        const isFav =
            favorites.some(
                id =>
                    String(id) ===
                    String(channel.id)
            );

        const card =
            document.createElement("div");

        card.className =
            "channel-card";

        card.innerHTML = `
            <button
                class="fav-btn ${isFav ? "active" : ""}"
                title="Favorite">

                <i class="${
                    isFav
                        ? "fa-solid"
                        : "fa-regular"
                } fa-star"></i>

            </button>

            <img
                src="${escapeHTML(
                    channel.logo || "logo.png"
                )}"
                alt="${escapeHTML(
                    channel.name || "TV"
                )}"
                onerror="
                    this.onerror=null;
                    this.src='logo.png';
                "
            >

            <h4>
                ${escapeHTML(
                    channel.name || "Unknown"
                )}
            </h4>
        `;


        const favBtn =
            card.querySelector(".fav-btn");

        if (favBtn) {
            favBtn.addEventListener(
                "click",
                event => {
                    toggleFavorite(
                        channel.id,
                        event
                    );
                }
            );
        }


        card.addEventListener(
            "click",
            () => {
                playChannelWithAd(channel);
            }
        );


        channelList.appendChild(card);

    });
}


// ==========================================
// FAVORITES
// ==========================================

function toggleFavorite(channelId, event) {

    if (event) {
        event.stopPropagation();
    }

    const index =
        favorites.findIndex(
            id =>
                String(id) ===
                String(channelId)
        );


    if (index === -1) {
        favorites.push(channelId);
    } else {
        favorites.splice(index, 1);
    }


    localStorage.setItem(
        "favChannels",
        JSON.stringify(favorites)
    );


    renderChannels();
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")
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

    if (!channel || !channel.url) {
        return;
    }


    if (firstChannelAdShown) {
        playChannel(channel);
        return;
    }


    if (
        typeof show_11580289 !==
        "function"
    ) {

        firstChannelAdShown = true;

        playChannel(channel);

        return;
    }


    if (isAdShowing) {
        return;
    }


    isAdShowing = true;


    try {

        const ad =
            show_11580289("pop");


        if (
            ad &&
            typeof ad.then === "function"
        ) {

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

        console.error(
            "Monetag error:",
            error
        );

        firstChannelAdShown = true;
        isAdShowing = false;

        playChannel(channel);
    }
}


// ==========================================
// PLAY CHANNEL
// ==========================================

function playChannel(channel) {

    if (!channel || !channel.url) {
        return;
    }


    if (currentChannelName) {

        currentChannelName.textContent =
            channel.name || "Live TV";
    }


    if (playerContainer) {

        playerContainer.classList.remove(
            "hidden"
        );
    }


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });


    // Destroy old HLS

    if (hls) {

        try {
            hls.destroy();
        } catch (e) {}

        hls = null;
    }


    // Reset video

    if (video) {

        video.pause();

        video.removeAttribute("src");

        video.load();
    }


    const url =
        String(channel.url).trim();


    // ======================================
    // HLS.JS
    // ======================================

    if (
        video &&
        typeof Hls !== "undefined" &&
        Hls.isSupported() &&
        (
            url.includes(".m3u8") ||
            url.includes("m3u8")
        )
    ) {

        hls =
            new Hls({
                enableWorker:true
            });


        hls.loadSource(url);

        hls.attachMedia(video);


        hls.on(
            Hls.Events.MANIFEST_PARSED,
            () => {

                video
                    .play()
                    .catch(
                        error =>
                            console.log(
                                "Autoplay blocked:",
                                error
                            )
                    );

            }
        );


        hls.on(
            Hls.Events.ERROR,
            (event, data) => {

                console.error(
                    "HLS error:",
                    data
                );

            }
        );


    // ======================================
    // NATIVE HLS
    // ======================================

    } else if (
        video &&
        video.canPlayType(
            "application/vnd.apple.mpegurl"
        )
    ) {

        video.src = url;

        video
            .play()
            .catch(
                error =>
                    console.log(
                        "Autoplay blocked:",
                        error
                    )
            );


    // ======================================
    // MP4 / OTHER
    // ======================================

    } else if (video) {

        video.src = url;

        video
            .play()
            .catch(
                error =>
                    console.log(
                        "Autoplay blocked:",
                        error
                    )
            );
    }


    resetOverlayTimeout();


    try {

        localStorage.setItem(
            "lastChannel",
            JSON.stringify(channel)
        );

    } catch (e) {

        console.warn(
            "Unable to save lastChannel",
            e
        );

    }
}


// ==========================================
// CLOSE PLAYER
// ==========================================

function closePlayer() {

    if (hls) {

        try {
            hls.destroy();
        } catch (e) {}

        hls = null;
    }


    if (video) {

        video.pause();

        video.removeAttribute(
            "src"
        );

        video.load();
    }


    if (playerContainer) {

        playerContainer.classList.add(
            "hidden"
        );
    }


    if (playerOverlay) {

        playerOverlay.classList.remove(
            "hidden-overlay"
        );
    }


    isLocked = false;


    if (lockOverlay) {

        lockOverlay.classList.add(
            "hidden"
        );
    }
}


// ==========================================
// FLOATING PLAYER / PIP
// ==========================================

async function toggleFloatingPlayer() {

    const videoElement =
        document.getElementById("video");


    if (!videoElement) {

        alert(
            "Video player not found!"
        );

        return;
    }


    if (
        videoElement.paused ||
        (
            !videoElement.src &&
            !videoElement.srcObject &&
            !hls
        )
    ) {

        alert(
            "Please play a channel first to use Floating Player!"
        );

        return;
    }


    try {

        if (
            document.pictureInPictureEnabled &&
            typeof videoElement.requestPictureInPicture ===
            "function"
        ) {

            if (
                document.pictureInPictureElement
            ) {

                await document.exitPictureInPicture();

            } else {

                await videoElement
                    .requestPictureInPicture();

            }

        } else {

            alert(
                "Picture-in-Picture is not supported in this browser."
            );
        }

    } catch (error) {

        console.error(
            "Floating Player Error:",
            error
        );

    }
}


// ==========================================
// SPORTS EVENTS SYSTEM
// ==========================================

const SPORTS_API =
    "https://www.thesportsdb.com/api/v1/json/123";

let sportsEvents = [];

let selectedSport = "All";

let selectedEventStatus =
    "Upcoming";


// ==========================================
// OPEN SPORTS
// ==========================================

function openSportsEvents() {

    hideCategoryPage();

    hideSettingsPage();

    showNormalContent();


    currentCategory =
        "Sports";


    if (mainSectionTitle) {

        mainSectionTitle.textContent =
            "🏆 Sports Events";
    }


    if (searchArea) {

        searchArea.classList.remove(
            "active"
        );
    }


    renderSportsPage();


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
}


// ==========================================
// SPORTS PAGE
// ==========================================

function renderSportsPage() {

    if (!channelList) {
        return;
    }


    channelList.innerHTML = `

        <div class="sports-page">

            <div class="sports-sport-tabs">

                <button
                    class="sports-sport-tab active"
                    data-sport="All">
                    🏆 All
                </button>

                <button
                    class="sports-sport-tab"
                    data-sport="Soccer">
                    ⚽ Football
                </button>

                <button
                    class="sports-sport-tab"
                    data-sport="Cricket">
                    🏏 Cricket
                </button>

                <button
                    class="sports-sport-tab"
                    data-sport="Wrestling">
                    🤼 WWE
                </button>

            </div>


            <div class="sports-status-tabs">

                <button
                    class="sports-status-tab active"
                    data-status="Upcoming">
                    🕐 Upcoming
                </button>

                <button
                    class="sports-status-tab"
                    data-status="Live">
                    🔴 Live
                </button>

                <button
                    class="sports-status-tab"
                    data-status="Finished">
                    ✅ Finished
                </button>

            </div>


            <div id="sportsEventsContainer">

                <div class="sports-loading">

                    <div class="sports-spinner"></div>

                    <span>
                        Loading sports events...
                    </span>

                </div>

            </div>

        </div>
    `;


    document
        .querySelectorAll(
            ".sports-sport-tab"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".sports-sport-tab"
                        )
                        .forEach(btn =>
                            btn.classList.remove(
                                "active"
                            )
                        );


                    button.classList.add(
                        "active"
                    );


                    selectedSport =
                        button.dataset.sport;


                    loadSportsEvents();
                }
            );
        });


    document
        .querySelectorAll(
            ".sports-status-tab"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".sports-status-tab"
                        )
                        .forEach(btn =>
                            btn.classList.remove(
                                "active"
                            )
                        );


                    button.classList.add(
                        "active"
                    );


                    selectedEventStatus =
                        button.dataset.status;


                    loadSportsEvents();
                }
            );
        });


    loadSportsEvents();
}


// ==========================================
// LOAD SPORTS EVENTS
// ==========================================

async function loadSportsEvents() {

    const container =
        document.getElementById(
            "sportsEventsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="sports-loading">

            <div class="sports-spinner"></div>

            <span>
                Loading ${escapeHTML(
                    selectedSport
                )} events...
            </span>

        </div>
    `;


    try {

        let events = [];


        // FOOTBALL

        if (
            selectedSport === "All" ||
            selectedSport === "Soccer"
        ) {

            try {

                const football =
                    await fetchSportsAPI(
                        `${SPORTS_API}/eventsnextleague.php?id=4328`
                    );


                if (
                    football &&
                    Array.isArray(
                        football.events
                    )
                ) {

                    events =
                        events.concat(
                            football.events.map(
                                event => ({
                                    ...event,
                                    apiSport:"Soccer"
                                })
                            )
                        );
                }

            } catch (error) {

                console.log(
                    "Football API error:",
                    error
                );
            }
        }


        // CRICKET

        if (
            selectedSport === "All" ||
            selectedSport === "Cricket"
        ) {

            const cricketLeagues = [
                4468,
                4480
            ];


            for (
                const leagueId
                of cricketLeagues
            ) {

                try {

                    const cricket =
                        await fetchSportsAPI(
                            `${SPORTS_API}/eventsnextleague.php?id=${leagueId}`
                        );


                    if (
                        cricket &&
                        Array.isArray(
                            cricket.events
                        )
                    ) {

                        events =
                            events.concat(
                                cricket.events.map(
                                    event => ({
                                        ...event,
                                        apiSport:"Cricket"
                                    })
                                )
                            );
                    }

                } catch (error) {

                    console.log(
                        "Cricket error:",
                        leagueId
                    );
                }
            }
        }


        // WRESTLING

        if (
            selectedSport === "All" ||
            selectedSport === "Wrestling"
        ) {

            try {

                const wrestling =
                    await fetchSportsAPI(
                        `${SPORTS_API}/eventsnextleague.php?id=4443`
                    );


                if (
                    wrestling &&
                    Array.isArray(
                        wrestling.events
                    )
                ) {

                    events =
                        events.concat(
                            wrestling.events.map(
                                event => ({
                                    ...event,
                                    apiSport:"Wrestling"
                                })
                            )
                        );
                }

            } catch (error) {

                console.log(
                    "Wrestling API error:",
                    error
                );
            }
        }


        sportsEvents =
            removeDuplicateEvents(
                events
            );


        renderSportsEvents();


    } catch (error) {

        console.error(
            "Sports API Error:",
            error
        );


        container.innerHTML = `

            <div class="sports-empty">

                <div class="sports-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Sports data unavailable
                </h3>

                <p>
                    Please try again later.
                </p>

                <button
                    class="sports-retry-btn"
                    onclick="loadSportsEvents()">
                    🔄 Retry
                </button>

            </div>
        `;
    }
}


// ==========================================
// SPORTS API
// ==========================================

async function fetchSportsAPI(url) {

    const response =
        await fetch(
            url,
            {
                cache:"no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status}`
        );
    }


    return await response.json();
}


// ==========================================
// REMOVE DUPLICATE EVENTS
// ==========================================

function removeDuplicateEvents(events) {

    const seen =
        new Set();


    return events.filter(event => {

        const id =
            event.idEvent ||
            `${event.strEvent || ""}-${event.dateEvent || ""}`;


        if (seen.has(id)) {
            return false;
        }


        seen.add(id);

        return true;
    });
}


// ==========================================
// RENDER SPORTS EVENTS
// ==========================================

function renderSportsEvents() {

    const container =
        document.getElementById(
            "sportsEventsContainer"
        );


    if (!container) {
        return;
    }


    let filteredEvents =
        [...sportsEvents];


    if (selectedSport !== "All") {

        filteredEvents =
            filteredEvents.filter(
                event =>
                    event.apiSport ===
                    selectedSport
            );
    }


    filteredEvents =
        filteredEvents.filter(
            event =>
                getEventStatus(event) ===
                selectedEventStatus
        );


    filteredEvents.sort(
        (a,b) => {

            const dateA =
                new Date(
                    `${a.dateEvent || ""}T${a.strTime || "00:00:00"}`
                );


            const dateB =
                new Date(
                    `${b.dateEvent || ""}T${b.strTime || "00:00:00"}`
                );


            return dateA - dateB;
        }
    );


    if (!filteredEvents.length) {

        container.innerHTML = `

            <div class="sports-empty">

                <div class="sports-empty-icon">
                    🏟️
                </div>

                <h3>
                    No ${
                        selectedEventStatus
                            .toLowerCase()
                    } events
                </h3>

                <p>
                    No ${
                        selectedSport === "All"
                            ? "sports"
                            : escapeHTML(
                                selectedSport
                            )
                    }
                    events are available right now.
                </p>

                <button
                    class="sports-retry-btn"
                    onclick="loadSportsEvents()">
                    🔄 Refresh
                </button>

            </div>
        `;

        return;
    }


    container.innerHTML = "";


    filteredEvents.forEach(event => {

        container.appendChild(
            createSportsEventCard(event)
        );

    });
}


// ==========================================
// EVENT STATUS
// ==========================================

function getEventStatus(event) {

    if (!event) {
        return "Upcoming";
    }


    const now =
        new Date();


    const date =
        event.dateEvent || "";


    const time =
        event.strTime || "00:00:00";


    const eventDateTime =
        new Date(
            `${date}T${time}`
        );


    if (
        Number.isNaN(
            eventDateTime.getTime()
        )
    ) {

        return "Upcoming";
    }


    // Some API responses contain an explicit
    // live status.

    const explicitStatus =
        String(
            event.strStatus ||
            event.strProgress ||
            ""
        ).toLowerCase();


    if (
        explicitStatus.includes("live") ||
        explicitStatus.includes("in progress")
    ) {

        return "Live";
    }


    if (
        eventDateTime < now
    ) {

        return "Finished";
    }


    return "Upcoming";
}


// ==========================================
// CREATE SPORTS EVENT CARD
// ==========================================

function createSportsEventCard(event) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "sport-event-card";


    const sport =
        event.apiSport ||
        event.strSport ||
        "Sports";


    let icon =
        "🏆";


    if (sport === "Soccer") {
        icon = "⚽";
    }

    if (sport === "Cricket") {
        icon = "🏏";
    }

    if (sport === "Wrestling") {
        icon = "🤼";
    }


    const homeTeam =
        event.strHomeTeam ||
        "Home Team";


    const awayTeam =
        event.strAwayTeam ||
        "Away Team";


    const homeLogo =
        event.strHomeTeamBadge ||
        event.strThumb ||
        "logo.png";


    const awayLogo =
        event.strAwayTeamBadge ||
        event.strThumb ||
        "logo.png";


    const status =
        getEventStatus(
            event
        );


    let statusHTML =
        "";


    if (
        status === "Upcoming"
    ) {

        statusHTML = `
            <span class="sports-upcoming-badge">
                🕐 UPCOMING
            </span>
        `;

    } else if (
        status === "Live"
    ) {

        statusHTML = `
            <span class="sports-live-badge">
                🔴 LIVE
            </span>
        `;

    } else {

        statusHTML = `
            <span class="sports-finished-badge">
                ✓ FINISHED
            </span>
        `;
    }


    const scoreAvailable =
        event.intHomeScore !== null &&
        event.intHomeScore !== undefined &&
        event.intAwayScore !== null &&
        event.intAwayScore !== undefined;


    const scoreHTML =
        scoreAvailable
            ? `${escapeHTML(
                event.intHomeScore
            )} - ${escapeHTML(
                event.intAwayScore
            )}`
            : "VS";


    card.innerHTML = `

        <div class="sport-event-top">

            <div class="sport-event-league">
                ${icon}
                ${escapeHTML(
                    event.strLeague ||
                    sport
                )}
            </div>

            ${statusHTML}

        </div>


        <div class="sport-event-body">

            <div class="sport-team">

                <img
                    src="${escapeHTML(
                        homeLogo
                    )}"
                    alt="${escapeHTML(
                        homeTeam
                    )}"
                    onerror="
                        this.onerror=null;
                        this.src='logo.png';
                    "
                >

                <span>
                    ${escapeHTML(
                        homeTeam
                    )}
                </span>

            </div>


            <div class="sport-score">

                <strong>
                    ${scoreHTML}
                </strong>

                <small>
                    ${formatSportsDate(
                        event
                    )}
                </small>

            </div>


            <div class="sport-team">

                <img
                    src="${escapeHTML(
                        awayLogo
                    )}"
                    alt="${escapeHTML(
                        awayTeam
                    )}"
                    onerror="
                        this.onerror=null;
                        this.src='logo.png';
                    "
                >

                <span>
                    ${escapeHTML(
                        awayTeam
                    )}
                </span>

            </div>

        </div>


        <div class="sport-event-footer">

            <span>
                📍
                ${escapeHTML(
                    event.strVenue ||
                    "Venue not available"
                )}
            </span>

        </div>
    `;


    return card;
}


// ==========================================
// SPORTS DATE FORMAT
// ==========================================

function formatSportsDate(event) {

    if (!event || !event.dateEvent) {
        return "Date unavailable";
    }


    try {

        const date =
            new Date(
                `${event.dateEvent}T${
                    event.strTime ||
                    "00:00:00"
                }`
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return event.dateEvent;
        }


        return date.toLocaleString(
            "en-BD",
            {
                day:"2-digit",
                month:"short",
                hour:"2-digit",
                minute:"2-digit"
            }
        );

    } catch (error) {

        return event.dateEvent;
    }
}


// ==========================================
// SPORTS NAVIGATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const sportsBtn =
            document.getElementById(
                "sportsNav"
            );


        if (!sportsBtn) {
            return;
        }


        sportsBtn.addEventListener(
            "click",
            () => {

                setActiveBottomNav(
                    sportsBtn
                );


                openSportsEvents();

            }
        );
    }
);


// ==========================================
// PREVENT DUPLICATE SPORTS CLICK
// ==========================================

if (
    window.Telegram &&
    window.Telegram.WebApp
) {

    try {

        window.Telegram.WebApp
            .enableClosingConfirmation();

    } catch (e) {}

}


// ==========================================
// PLAYER VISIBILITY SAFETY
// ==========================================

document.addEventListener(
    "fullscreenchange",
    () => {

        if (
            playerOverlay &&
            !isLocked
        ) {

            resetOverlayTimeout();
        }
    }
);


// ==========================================
// VIDEO ERROR HANDLER
// ==========================================

if (video) {

    video.addEventListener(
        "error",
        () => {

            console.warn(
                "Video playback error:",
                video.error
            );

        }
    );
}


// ==========================================
// INITIAL PLAYER STATE
// ==========================================

if (playerContainer) {
    playerContainer.classList.add(
        "hidden"
    );
}


console.log(
    "StreamZX Part 3 loaded successfully."
);
