// ==========================================
// StreamZX - Consolidated Script
// ==========================================

let channels = [];

let currentCategory = "Sports";

let favorites =
    JSON.parse(localStorage.getItem("favChannels")) || [];

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

    channelList =
        document.getElementById("channelList");

    featuredList =
        document.getElementById("featuredList");

    featuredSection =
        document.getElementById("featuredSection");

    video =
        document.getElementById("video");

    search =
        document.getElementById("search");

    searchArea =
        document.getElementById("searchArea");

    playerContainer =
        document.getElementById("playerContainer");

    currentChannelName =
        document.getElementById("currentChannelName");

    mainSectionTitle =
        document.getElementById("mainSectionTitle");


    initApp();

});


// ==========================================
// INIT
// ==========================================

function initApp() {

    setupEventListeners();

    loadChannels();

}


// ==========================================
// HIDE SPLASH
// ==========================================

function hideSplash() {

    const splash =
        document.getElementById("splash");

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

    if (searchBtn) {

        searchBtn.addEventListener("click", () => {

            searchArea.classList.toggle("active");

            if (
                searchArea.classList.contains("active")
            ) {

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


            currentCategory =
                "Favorites";


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


                const target =
                    e.currentTarget;


                target.classList.add("active");


                currentCategory =
                    target.dataset.category;


                updateSectionTitle();

                renderChannels();

            });

        });


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
    // BOTTOM NAVIGATION
    // ONLY 3 BUTTONS
    // ======================================

    const liveEventBtn =
        document.getElementById(
            "liveEventBtn"
        );

    const sportsNavBtn =
        document.getElementById(
            "sportsNavBtn"
        );

    const categoryNavBtn =
        document.getElementById(
            "categoryNavBtn"
        );


    // ======================================
    // LIVE EVENT
    // ======================================

    if (liveEventBtn) {

        liveEventBtn.addEventListener(
            "click",
            () => {

                setActiveBottomNav(
                    liveEventBtn
                );


                // বর্তমানে Live Event-এর জন্য
                // placeholder section

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
                    </div>
                `;

            }
        );

    }


    // ======================================
    // SPORTS
    // ======================================

    if (sportsNavBtn) {

        sportsNavBtn.addEventListener(
            "click",
            () => {

                setActiveBottomNav(
                    sportsNavBtn
                );


                currentCategory =
                    "Sports";


                document
                    .querySelectorAll(
                        ".categories-folder .cat"
                    )
                    .forEach(cat => {

                        cat.classList.toggle(
                            "active",
                            cat.dataset.category ===
                            "Sports"
                        );

                    });


                updateSectionTitle();

                renderChannels();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    // ======================================
    // CATEGORY
    // ======================================

    if (categoryNavBtn) {

        categoryNavBtn.addEventListener(
            "click",
            () => {

                setActiveBottomNav(
                    categoryNavBtn
                );


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

            }
        );

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


    const index =
        favorites.indexOf(channelId);


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
            await fetch(
                "channels.json?t=" +
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


        channels =
            Array.isArray(data)
                ? data
                : Array.isArray(data.channels)
                    ? data.channels
                    : [];


        if (!Array.isArray(channels)) {

            channels = [];

        }


        renderFeaturedChannels();

        renderChannels();


        console.log(
            "Channels loaded:",
            channels.length
        );


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
                    color:var(--text-muted);
                    display:block;
                    margin-top:8px;
                ">
                    ${escapeHTML(error.message)}
                </small>
            </div>
        `;


    } finally {

        // গুরুত্বপূর্ণ:
        // JSON load fail হলেও Splash আটকে থাকবে না

        hideSplash();

    }

}


// ==========================================
// FEATURED
// ==========================================

function renderFeaturedChannels() {

    if (
        !featuredList ||
        !featuredSection
    ) return;


    const featured =
        channels.filter(
            channel =>
                channel.featured === true
        );


    if (!featured.length) {

        featuredSection.style.display =
            "none";

        return;

    }


    featuredSection.style.display =
        "block";


    featuredList.innerHTML = "";


    featured.forEach(channel => {

        const isFav =
            favorites.includes(
                channel.id
            );


        const card =
            document.createElement("div");


        card.className =
            "featured-card";


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
                    channel.logo || "logo.png"
                )}"
                alt="${escapeHTML(
                    channel.name || "TV"
                )}"
                onerror="
                    this.onerror=null;
                    this.src='https://via.placeholder.com/80?text=TV';
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
            ? search.value
                .toLowerCase()
                .trim()
            : "";


    const filtered =
        channels.filter(channel => {

            const nameMatch =
                String(
                    channel.name || ""
                )
                    .toLowerCase()
                    .includes(keyword);


            let categoryMatch = false;


            if (
                currentCategory ===
                "Favorites"
            ) {

                categoryMatch =
                    favorites.includes(
                        channel.id
                    );

            } else {

                categoryMatch =
                    String(
                        channel.category || ""
                    )
                        .toLowerCase()
                        .includes(
                            currentCategory
                                .toLowerCase()
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
            favorites.includes(
                channel.id
            );


        const card =
            document.createElement("div");


        card.className =
            "channel-card";


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
                    channel.logo || "logo.png"
                )}"
                alt="${escapeHTML(
                    channel.name || "TV"
                )}"
                onerror="
                    this.onerror=null;
                    this.src='https://via.placeholder.com/80?text=TV';
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

    if (
        !channel ||
        !channel.url
    ) return;


    if (firstChannelAdShown) {

        playChannel(channel);

        return;

    }


    if (
        typeof show_11580289 !==
        "function"
    ) {

        firstChannelAdShown =
            true;

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

                firstChannelAdShown =
                    true;

                isAdShowing =
                    false;

                playChannel(channel);

            }).catch(() => {

                firstChannelAdShown =
                    true;

                isAdShowing =
                    false;

                playChannel(channel);

            });

        } else {

            firstChannelAdShown =
                true;

            isAdShowing =
                false;

            playChannel(channel);

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

        playChannel(channel);

    }

}


// ==========================================
// PLAY CHANNEL
// ==========================================

function playChannel(channel) {

    if (
        !channel ||
        !channel.url
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


    if (hls) {

        hls.destroy();

        hls = null;

    }


    video.pause();

    video.removeAttribute("src");

    video.load();


    const url =
        String(
            channel.url
        ).trim();


    // ======================================
    // HLS
    // ======================================

    if (
        typeof Hls !== "undefined" &&
        Hls.isSupported() &&
        (
            url.includes(".m3u8") ||
            url.includes("m3u8")
        )
    ) {

        hls =
            new Hls({
                enableWorker: true
            });


        hls.loadSource(url);

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

        video.src = url;


        video.play()
            .catch(error => {

                console.log(
                    "Autoplay blocked:",
                    error
                );

            });

    }


    // ======================================
    // NORMAL VIDEO
    // ======================================

    else {

        video.src = url;


        video.play()
            .catch(error => {

                console.log(
                    "Autoplay blocked:",
                    error
                );

            });

    }


    localStorage.setItem(
        "lastChannel",
        JSON.stringify(channel)
    );

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

        playerContainer.classList.add(
            "hidden"
        );

    }

}
