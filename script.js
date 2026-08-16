// ==========================================
// StreamZX - Fixed & Consolidated Script
// ==========================================

let channels = [];
let currentCategory = "Sports";

let favorites =
    JSON.parse(localStorage.getItem("favChannels") || "[]");

let hls = null;

// ==========================================
// Monetag
// ==========================================

let firstChannelAdShown = false;
let isAdShowing = false;

// ==========================================
// DOM
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

// ==========================================
// APP START
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    channelList = document.getElementById("channelList");
    featuredList = document.getElementById("featuredList");
    featuredSection = document.getElementById("featuredSection");

    video = document.getElementById("video");
    search = document.getElementById("search");
    searchArea = document.getElementById("searchArea");

    playerContainer =
        document.getElementById("playerContainer");

    currentChannelName =
        document.getElementById("currentChannelName");

    mainSectionTitle =
        document.getElementById("mainSectionTitle");

    setupEventListeners();

    // Safety: কোনো কারণে loadChannels আটকে গেলেও
    // 8 সেকেন্ড পর Splash বন্ধ হবে
    setTimeout(() => {
        hideSplash();
    }, 8000);

    loadChannels();
});


// ==========================================
// HIDE SPLASH
// ==========================================

function hideSplash() {

    const splash = document.getElementById("splash");

    if (!splash) return;

    splash.classList.add("hidden");
}


// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {

    // ======================================
    // SEARCH
    // ======================================

    const searchBtn =
        document.getElementById("searchBtn");

    if (searchBtn && searchArea && search) {

        searchBtn.addEventListener("click", () => {

            searchArea.classList.toggle("active");

            if (searchArea.classList.contains("active")) {

                search.focus();

            } else {

                search.value = "";
                renderChannels();
            }
        });
    }


    // ======================================
    // FAVORITES
    // ======================================

    const favHeaderBtn =
        document.getElementById("favHeaderBtn");

    if (favHeaderBtn) {

        favHeaderBtn.addEventListener("click", () => {

            document
                .querySelectorAll(".categories-folder .cat")
                .forEach(cat => {
                    cat.classList.remove("active");
                });

            currentCategory = "Favorites";

            updateSectionTitle();
            renderChannels();
        });
    }


    // ======================================
    // REFRESH
    // ======================================

    const refreshBtn =
        document.getElementById("refreshBtn");

    if (refreshBtn) {

        refreshBtn.addEventListener("click", () => {

            loadChannels();

        });
    }


    // ======================================
    // SEARCH INPUT
    // ======================================

    if (search) {

        search.addEventListener("input", () => {
            renderChannels();
        });
    }


    // ======================================
    // CATEGORY BUTTONS
    // ======================================

    document
        .querySelectorAll(".categories-folder .cat")
        .forEach(cat => {

            cat.addEventListener("click", e => {

                document
                    .querySelectorAll(
                        ".categories-folder .cat"
                    )
                    .forEach(c => {
                        c.classList.remove("active");
                    });

                const target = e.currentTarget;

                target.classList.add("active");

                currentCategory =
                    target.dataset.category || "Sports";

                updateSectionTitle();
                renderChannels();
            });
        });


    // ======================================
    // CLOSE PLAYER
    // ======================================

    const closePlayerBtn =
        document.getElementById("closePlayerBtn");

    if (closePlayerBtn) {

        closePlayerBtn.addEventListener(
            "click",
            closePlayer
        );
    }


    // ======================================
    // BOTTOM NAVIGATION
    // HTML-এর আসল ID ব্যবহার করা হয়েছে
    // ======================================

    const liveEventBtn =
        document.getElementById("liveEventNav");

    const sportsNavBtn =
        document.getElementById("sportsNav");

    const categoryNavBtn =
        document.getElementById("categoryNav");


    // ======================================
    // LIVE EVENT
    // ======================================

    if (liveEventBtn) {

        liveEventBtn.addEventListener("click", () => {

            setActiveBottomNav(liveEventBtn);

            mainSectionTitle.textContent =
                "🔴 Live Events";

            channelList.innerHTML = `
                <div style="
                    grid-column:1/-1;
                    text-align:center;
                    padding:30px;
                    color:var(--text-muted);
                ">
                    🔴 Live Events
                    <br>
                    <small>
                        Live Events module will appear here.
                    </small>
                </div>
            `;
        });
    }


    // ======================================
    // SPORTS
    // ======================================

    if (sportsNavBtn) {

        sportsNavBtn.addEventListener("click", () => {

            setActiveBottomNav(sportsNavBtn);

            currentCategory = "Sports";

            document
                .querySelectorAll(
                    ".categories-folder .cat"
                )
                .forEach(cat => {

                    cat.classList.toggle(
                        "active",
                        cat.dataset.category === "Sports"
                    );
                });

            updateSectionTitle();
            renderChannels();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }


    // ======================================
    // CATEGORY
    // ======================================

    if (categoryNavBtn) {

        categoryNavBtn.addEventListener("click", () => {

            setActiveBottomNav(categoryNavBtn);

            const categoryFolder =
                document.querySelector(
                    ".categories-folder"
                );

            if (categoryFolder) {

                categoryFolder.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    }
}


// ==========================================
// BOTTOM NAV ACTIVE
// ==========================================

function setActiveBottomNav(activeButton) {

    document
        .querySelectorAll(".bottom-nav-btn")
        .forEach(button => {
            button.classList.remove("active");
        });

    if (activeButton) {
        activeButton.classList.add("active");
    }
}


// ==========================================
// SECTION TITLE
// ==========================================

function updateSectionTitle() {

    const titles = {

        Sports:
            "⚽ Sports Channels",

        Entertainment:
            "🎬 Entertainment Channels",

        News:
            "📰 News Channels",

        Movies:
            "🎬 Movies Channels",

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
// FAVORITES
// ==========================================

function toggleFavorite(channelId, event) {

    if (event) {
        event.stopPropagation();
    }

    const id = String(channelId);

    const index =
        favorites.findIndex(
            fav => String(fav) === id
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
    renderFeaturedChannels();
}


// ==========================================
// LOAD CHANNELS
// ==========================================

async function loadChannels() {

    if (!channelList) {
        hideSplash();
        return;
    }

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

        // ======================================
        // FETCH WITH TIMEOUT
        // ======================================

        const controller =
            new AbortController();

        const timeout =
            setTimeout(() => {
                controller.abort();
            }, 7000);


        const response =
            await fetch(
                "./channels.json?t=" + Date.now(),
                {
                    cache: "no-store",
                    signal: controller.signal
                }
            );

        clearTimeout(timeout);


        if (!response.ok) {

            throw new Error(
                "channels.json HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        // ======================================
        // SUPPORT:
        // []
        // OR
        // { channels: [] }
        // ======================================

        if (Array.isArray(data)) {

            channels = data;

        } else if (
            data &&
            Array.isArray(data.channels)
        ) {

            channels = data.channels;

        } else {

            channels = [];

            throw new Error(
                "Invalid channels.json format"
            );
        }


        console.log(
            "✅ Channels loaded:",
            channels.length
        );


        renderFeaturedChannels();
        renderChannels();


    } catch (error) {

        console.error(
            "❌ Channel loading error:",
            error
        );


        let errorMessage =
            error.name === "AbortError"
                ? "channels.json loading timeout"
                : error.message;


        channelList.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:30px 15px;
                color:#ef4444;
            ">

                ❌ Could not load channels

                <br><br>

                <small style="
                    color:var(--text-muted);
                    display:block;
                ">
                    ${escapeHTML(errorMessage)}
                </small>

                <br>

                <button
                    onclick="loadChannels()"
                    style="
                        padding:10px 18px;
                        border:none;
                        border-radius:10px;
                        background:#e50914;
                        color:#fff;
                        font-weight:600;
                    "
                >
                    🔄 Try Again
                </button>

            </div>
        `;
    }

    // ======================================
    // ALWAYS HIDE SPLASH
    // ======================================

    hideSplash();
}


// ==========================================
// FEATURED CHANNELS
// ==========================================

function renderFeaturedChannels() {

    if (
        !featuredList ||
        !featuredSection
    ) return;


    const featured =
        channels.filter(channel =>
            channel.featured === true ||
            channel.featured === "true"
        );


    if (!featured.length) {

        featuredSection.style.display = "none";

        return;
    }


    featuredSection.style.display = "block";

    featuredList.innerHTML = "";


    featured.forEach(channel => {

        const isFav =
            favorites.some(
                fav =>
                    String(fav) ===
                    String(channel.id)
            );


        const card =
            document.createElement("div");

        card.className = "featured-card";


        card.innerHTML = `

            <button
                class="fav-btn ${
                    isFav ? "active" : ""
                }"
                title="Favorite">

                <i class="${
                    isFav
                        ? "fa-solid"
                        : "fa-regular"
                } fa-star"></i>

            </button>


            <img
                src="${escapeHTML(
                    getChannelLogo(channel)
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


            <p>
                ${escapeHTML(
                    channel.category || "General"
                )}
            </p>

        `;


        const favBtn =
            card.querySelector(".fav-btn");


        favBtn.addEventListener(
            "click",
            event => {

                toggleFavorite(
                    channel.id,
                    event
                );
            }
        );


        card.addEventListener(
            "click",
            () => {

                playChannelWithAd(channel);

            }
        );


        featuredList.appendChild(card);
    });
}


// ==========================================
// MAIN CHANNELS
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
                String(channel.name || "")
                    .toLowerCase()
                    .includes(keyword);


            let categoryMatch = false;


            if (
                currentCategory ===
                "Favorites"
            ) {

                categoryMatch =
                    favorites.some(
                        fav =>
                            String(fav) ===
                            String(channel.id)
                    );

            } else {

                categoryMatch =
                    String(channel.category || "")
                        .toLowerCase()
                        .includes(
                            currentCategory.toLowerCase()
                        );
            }


            return (
                nameMatch &&
                categoryMatch
            );
        });


    if (!filtered.length) {

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
            favorites.some(
                fav =>
                    String(fav) ===
                    String(channel.id)
            );


        const card =
            document.createElement("div");

        card.className = "channel-card";


        card.innerHTML = `

            <button
                class="fav-btn ${
                    isFav ? "active" : ""
                }"
                title="Favorite">

                <i class="${
                    isFav
                        ? "fa-solid"
                        : "fa-regular"
                } fa-star"></i>

            </button>


            <img
                src="${escapeHTML(
                    getChannelLogo(channel)
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


        favBtn.addEventListener(
            "click",
            event => {

                toggleFavorite(
                    channel.id,
                    event
                );
            }
        );


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
// GET CHANNEL LOGO
// ==========================================

function getChannelLogo(channel) {

    return (
        channel.logo ||
        channel.image ||
        channel.logoUrl ||
        "logo.png"
    );
}


// ==========================================
// GET CHANNEL URL
// ==========================================

function getChannelURL(channel) {

    return (
        channel.url ||
        channel.stream_url ||
        channel.streamUrl ||
        channel.m3u8 ||
        channel.m3u8_url ||
        ""
    );
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// MONETAG
// ==========================================

function playChannelWithAd(channel) {

    if (!channel) return;


    const url =
        getChannelURL(channel);


    if (!url) {

        alert(
            "এই চ্যানেলের কোনো stream URL নেই।"
        );

        return;
    }


    // প্রথমবারের পর সরাসরি player
    if (firstChannelAdShown) {

        playChannel(channel);

        return;
    }


    // Monetag unavailable হলে
    // সরাসরি player
    if (
        typeof show_11580289 !==
        "function"
    ) {

        firstChannelAdShown = true;

        playChannel(channel);

        return;
    }


    if (isAdShowing) return;

    isAdShowing = true;


    try {

        const ad =
            show_11580289("pop");


        if (
            ad &&
            typeof ad.then ===
            "function"
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

    if (!channel) return;


    const url =
        getChannelURL(channel);


    if (!url) {

        alert(
            "এই চ্যানেলের stream URL পাওয়া যায়নি।"
        );

        return;
    }


    if (
        !video ||
        !playerContainer
    ) return;


    currentChannelName.textContent =
        channel.name || "Live TV";


    playerContainer.classList.remove(
        "hidden"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    // ======================================
    // DESTROY OLD HLS
    // ======================================

    if (hls) {

        try {
            hls.destroy();
        } catch (e) {
            console.log(e);
        }

        hls = null;
    }


    // ======================================
    // RESET VIDEO
    // ======================================

    video.pause();

    video.removeAttribute("src");

    video.load();


    const streamURL =
        String(url).trim();


    // ======================================
    // HLS.JS
    // ======================================

    if (
        typeof Hls !== "undefined" &&
        Hls.isSupported() &&
        /m3u8/i.test(streamURL)
    ) {

        hls =
            new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });


        hls.loadSource(streamURL);

        hls.attachMedia(video);


        hls.on(
            Hls.Events.MANIFEST_PARSED,
            () => {

                video.play()
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
            (event, data) => {

                console.error(
                    "HLS error:",
                    data
                );


                if (
                    data.fatal &&
                    data.type ===
                    Hls.ErrorTypes.NETWORK_ERROR
                ) {

                    console.log(
                        "Trying HLS recovery..."
                    );

                    hls.startLoad();
                }


                else if (
                    data.fatal &&
                    data.type ===
                    Hls.ErrorTypes.MEDIA_ERROR
                ) {

                    console.log(
                        "Trying media recovery..."
                    );

                    hls.recoverMediaError();
                }


                else if (data.fatal) {

                    console.error(
                        "Fatal HLS error"
                    );
                }
            }
        );

    }


    // ======================================
    // NATIVE HLS
    // ======================================

    else if (
        video.canPlayType(
            "application/vnd.apple.mpegurl"
        )
    ) {

        video.src = streamURL;

        video.play()
            .catch(error => {

                console.log(
                    "Autoplay blocked:",
                    error
                );
            });
    }


    // ======================================
    // NORMAL MP4 / VIDEO
    // ======================================

    else {

        video.src = streamURL;

        video.play()
            .catch(error => {

                console.log(
                    "Autoplay blocked:",
                    error
                );
            });
    }


    // ======================================
    // SAVE LAST CHANNEL
    // ======================================

    try {

        localStorage.setItem(
            "lastChannel",
            JSON.stringify(channel)
        );

    } catch (e) {

        console.log(
            "Could not save last channel",
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
        } catch (e) {
            console.log(e);
        }

        hls = null;
    }


    if (video) {

        video.pause();

        video.removeAttribute("src");

        video.load();
    }


    if (playerContainer) {

        playerContainer.classList.add(
            "hidden"
        );
    }
        }
