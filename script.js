// ==========================================
// StreamZX - Consolidated Script
// ==========================================

let channels = [];
let currentCategory = "Sports";
let favorites = JSON.parse(localStorage.getItem("favChannels")) || [];
let hls = null;

// ==========================================
// Monetag Ad Settings
// ==========================================

// প্রথম Channel click-এর জন্য শুধুমাত্র ১টি Ad
let firstChannelAdShown = false;
let isAdShowing = false;


// ==========================================
// DOM Elements
// ==========================================

let channelList, featuredList, featuredSection, video, search, searchArea;
let playerContainer, currentChannelName, mainSectionTitle;


// ==========================================
// App Start
// ==========================================

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


// ==========================================
// Initialize App
// ==========================================

function initApp() {
    setupEventListeners();
    loadChannels();
}


// ==========================================
// Hide Splash
// ==========================================

function hideSplash() {

    const splash = document.getElementById("splash");

    if (splash) {

        setTimeout(() => {
            splash.classList.add("hidden");
        }, 500);

    }
}


// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners() {

    // Search toggle
    const searchBtn = document.getElementById("searchBtn");

    if (searchBtn) {

        searchBtn.addEventListener("click", () => {

            searchArea.classList.toggle("active");

            if (searchArea.classList.contains("active")) {
                search.focus();
            }

        });

    }


    // Favorites Header Button
    const favHeaderBtn = document.getElementById("favHeaderBtn");

    if (favHeaderBtn) {

        favHeaderBtn.addEventListener("click", () => {

            document.querySelectorAll(".cat").forEach(c => {
                c.classList.remove("active");
            });

            currentCategory = "Favorites";

            mainSectionTitle.textContent =
                "⭐ Favorite Channels";

            renderChannels();

        });

    }


    // Refresh
    const refreshBtn = document.getElementById("refreshBtn");

    if (refreshBtn) {

        refreshBtn.addEventListener("click", () => {
            loadChannels();
        });

    }


    // Search
    if (search) {

        search.addEventListener("input", () => {
            renderChannels();
        });

    }


    // Categories
    document.querySelectorAll(".cat").forEach(cat => {

        cat.addEventListener("click", (e) => {

            document.querySelectorAll(".cat").forEach(c => {
                c.classList.remove("active");
            });

            const target = e.currentTarget;

            target.classList.add("active");

            currentCategory =
                target.getAttribute("data-category");

            if (currentCategory === "Sports") {

                mainSectionTitle.textContent =
                    "⚽ Sports Channels";

            } else {

                mainSectionTitle.textContent =
                    `📺 ${currentCategory} Channels`;

            }

            renderChannels();

        });

    });


    // Close Player
    const closePlayerBtn =
        document.getElementById("closePlayerBtn");

    if (closePlayerBtn) {

        closePlayerBtn.addEventListener("click", () => {

            if (video) {
                video.pause();
            }

            if (hls) {

                hls.destroy();
                hls = null;

            }

            playerContainer.classList.add("hidden");

        });

    }

}


// ==========================================
// Favorites Management
// ==========================================

function toggleFavorite(channelId, event) {

    if (event) {
        event.stopPropagation();
    }

    const index = favorites.indexOf(channelId);

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
    renderFeaturedChannels();

}


// ==========================================
// Load Channels
// ==========================================

async function loadChannels() {

    if (!channelList) return;

    channelList.innerHTML = `
        <div style="
            grid-column:1/-1;
            text-align:center;
            padding:30px;
            color:var(--text-muted);
        ">
            ⏳ Loading channels...
        </div>
    `;

    try {

        const response =
            await fetch("channels.json?t=" + Date.now());

        if (!response.ok) {
            throw new Error("Failed to load channels");
        }

        const data = await response.json();

        channels = Array.isArray(data)
            ? data
            : (data.channels || []);

        renderFeaturedChannels();
        renderChannels();

        hideSplash();

    } catch (err) {

        console.error(
            "Channel loading error:",
            err
        );

        channelList.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:30px;
                color:#ef4444;
            ">
                ❌ Could not load channels.json file.
            </div>
        `;

        hideSplash();

    }

}


// ==========================================
// Render Featured Channels
// ==========================================

function renderFeaturedChannels() {

    if (!featuredList || !featuredSection) return;

    const featured =
        channels.filter(c => c.featured === true);

    if (featured.length === 0) {

        featuredSection.style.display = "none";

        return;

    }

    featuredSection.style.display = "block";

    featuredList.innerHTML = "";

    featured.forEach(channel => {

        const isFav =
            favorites.includes(channel.id);

        const card =
            document.createElement("div");

        card.className = "featured-card";

        card.innerHTML = `
            <button
                class="fav-btn ${isFav ? "active" : ""}"
                onclick="toggleFavorite(${channel.id}, event)"
                title="Favorite"
            >
                <i class="${isFav ? "fa-solid" : "fa-regular"} fa-star"></i>
            </button>

            <img
                src="${channel.logo || "logo.png"}"
                onerror="
                    this.onerror=null;
                    this.src='https://via.placeholder.com/60?text=TV';
                "
            >

            <h4>${channel.name || "Unknown"}</h4>

            <p>${channel.category || "General"}</p>
        `;

        // প্রথম Channel click → Ad → তারপর Play
        card.onclick = () => {
            playChannelWithAd(channel);
        };

        featuredList.appendChild(card);

    });

}


// ==========================================
// Render Main Channels
// ==========================================

function renderChannels() {

    if (!channelList) return;

    channelList.innerHTML = "";

    const keyword =
        search
            ? search.value.toLowerCase().trim()
            : "";

    const filtered =
        channels.filter(channel => {

            const nameMatch =
                (channel.name || "")
                    .toLowerCase()
                    .includes(keyword);

            let categoryMatch = false;

            if (currentCategory === "Favorites") {

                categoryMatch =
                    favorites.includes(channel.id);

            } else if (channel.category) {

                categoryMatch =
                    channel.category
                        .toLowerCase()
                        .includes(
                            currentCategory.toLowerCase()
                        );

            }

            return nameMatch && categoryMatch;

        });


    if (filtered.length === 0) {

        channelList.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:30px;
                color:var(--text-muted);
            ">
                🔍 No channels found.
            </div>
        `;

        return;

    }


    filtered.forEach(channel => {

        const isFav =
            favorites.includes(channel.id);

        const card =
            document.createElement("div");

        card.className = "channel-card";

        card.innerHTML = `
            <button
                class="fav-btn ${isFav ? "active" : ""}"
                onclick="toggleFavorite(${channel.id}, event)"
                title="Favorite"
            >
                <i class="${isFav ? "fa-solid" : "fa-regular"} fa-star"></i>
            </button>

            <img
                src="${channel.logo || "logo.png"}"
                onerror="
                    this.onerror=null;
                    this.src='https://via.placeholder.com/50?text=TV';
                "
            >

            <h4>${channel.name || "Unknown"}</h4>
        `;

        // প্রথম Channel click → Ad → তারপর Play
        card.onclick = () => {
            playChannelWithAd(channel);
        };

        channelList.appendChild(card);

    });

}


// ==========================================
// Monetag - FIRST CHANNEL CLICK ONLY
// ==========================================

function playChannelWithAd(channel) {

    if (!channel || !channel.url) return;


    // ======================================
    // প্রথম Ad ইতিমধ্যে দেখানো হয়ে থাকলে
    // সরাসরি Channel Play
    // ======================================

    if (firstChannelAdShown) {

        playChannel(channel);

        return;

    }


    // ======================================
    // Monetag SDK না থাকলে
    // Ad দেখানোর চেষ্টা না করে Play
    // ======================================

    if (typeof show_11580289 !== "function") {

        console.log(
            "Monetag SDK not loaded. Playing channel."
        );

        firstChannelAdShown = true;

        playChannel(channel);

        return;

    }


    // ======================================
    // Ad already showing
    // ======================================

    if (isAdShowing) {
        return;
    }


    isAdShowing = true;

    console.log(
        "Showing FIRST Channel Ad..."
    );


    // ======================================
    // Show Monetag Popup
    // ======================================

    show_11580289("pop")

        .then(() => {

            console.log(
                "First Channel Ad completed."
            );

            // আর কখনো এই page session-এ Ad দেখাবে না
            firstChannelAdShown = true;

            isAdShowing = false;

            // Ad শেষ/Close → Channel Play
            playChannel(channel);

        })

        .catch((e) => {

            console.error(
                "Monetag popup error:",
                e
            );

            // Error হলেও পরের Channel-এ আর Ad নয়
            firstChannelAdShown = true;

            isAdShowing = false;

            // Ad fail হলেও Channel Play
            playChannel(channel);

        });

}


// ==========================================
// Play Channel
// ==========================================

function playChannel(channel) {

    if (!channel || !channel.url) return;


    currentChannelName.textContent =
        channel.name;


    playerContainer.classList.remove(
        "hidden"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    // আগের HLS বন্ধ
    if (hls) {

        hls.destroy();
        hls = null;

    }


    // ======================================
    // HLS.js M3U8
    // ======================================

    if (
        Hls.isSupported() &&
        channel.url.includes(".m3u8")
    ) {

        hls = new Hls();

        hls.loadSource(channel.url);

        hls.attachMedia(video);

        hls.on(
            Hls.Events.MANIFEST_PARSED,
            () => {

                video.play().catch(e => {

                    console.log(
                        "Autoplay blocked:",
                        e
                    );

                });

            }
        );


    // ======================================
    // Native HLS
    // ======================================

    } else if (
        video.canPlayType(
            "application/vnd.apple.mpegurl"
        )
    ) {

        video.src = channel.url;

        video.play().catch(e => {

            console.log(
                "Autoplay blocked:",
                e
            );

        });


    // ======================================
    // Normal Video
    // ======================================

    } else {

        video.src = channel.url;

        video.play().catch(e => {

            console.log(
                "Autoplay blocked:",
                e
            );

        });

    }


    // Last Channel Save
    localStorage.setItem(
        "lastChannel",
        JSON.stringify(channel)
    );

}


// ==========================================
// END
// ==========================================
