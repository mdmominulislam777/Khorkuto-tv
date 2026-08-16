// ==========================================
// StreamZX - Consolidated Script
// ==========================================

let channels = [];
let currentCategory = "Sports";

let favorites =
    JSON.parse(localStorage.getItem("favChannels")) || [];

let hls = null;

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
// SPLASH
// ==========================================

function hideSplash() {

    const splash =
        document.getElementById("splash");

    if (!splash) return;

    setTimeout(() => {

        splash.classList.add("hidden");

    }, 500);

}


// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {


    // ======================================
    // SEARCH BUTTON
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

            currentCategory = "Favorites";

            mainSectionTitle.textContent =
                "⭐ Favorite Channels";

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
    // CATEGORIES
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
    // Only 3 Buttons
    // Live Event / Category / Sports
    // ======================================

    const bottomNavButtons =
        document.querySelectorAll(".bottom-nav-btn");


    bottomNavButtons.forEach(btn => {

        btn.addEventListener("click", () => {

            // Remove active from all buttons
            bottomNavButtons.forEach(item => {

                item.classList.remove("active");

            });


            // Active current button
            btn.classList.add("active");


            const page =
                btn.getAttribute("data-page");


            // ==================================
            // LIVE EVENT
            // ==================================

            if (page === "live-event") {

                // Keep existing channel system
                currentCategory = "Sports";


                document
                    .querySelectorAll(
                        ".categories-folder .cat"
                    )
                    .forEach(cat => {

                        cat.classList.remove(
                            "active"
                        );


                        if (
                            cat.getAttribute(
                                "data-category"
                            ) === "Sports"
                        ) {

                            cat.classList.add(
                                "active"
                            );

                        }

                    });


                if (mainSectionTitle) {

                    mainSectionTitle.textContent =
                        "🔴 Live Events";

                }


                renderChannels();


                // Scroll to channel area
                const main =
                    document.querySelector(
                        ".main-content"
                    );

                if (main) {

                    main.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }


            // ==================================
            // CATEGORY
            // ==================================

            else if (page === "category") {

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


            // ==================================
            // SPORTS
            // ==================================

            else if (page === "sports") {

                currentCategory =
                    "Sports";


                document
                    .querySelectorAll(
                        ".categories-folder .cat"
                    )
                    .forEach(cat => {

                        cat.classList.remove(
                            "active"
                        );


                        if (
                            cat.getAttribute(
                                "data-category"
                            ) === "Sports"
                        ) {

                            cat.classList.add(
                                "active"
                            );

                        }

                    });


                updateSectionTitle();

                renderChannels();


                const main =
                    document.querySelector(
                        ".main-content"
                    );


                if (main) {

                    main.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }

        });

    });

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
                Date.now()
            );


        if (!response.ok) {

            throw new Error(
                "channels.json not found"
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


        renderFeaturedChannels();

        renderChannels();

        hideSplash();


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
            </div>
        `;


        hideSplash();

    }

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
            favorites.includes(channel.id);


        const card =
            document.createElement("div");


        card.className =
            "featured-card";


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
                src="${channel.logo || "logo.png"}"
                alt="${channel.name || "TV"}"
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
                (channel.name || "")
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
                class="fav-btn ${isFav ? "active" : ""}"
                title="Favorite">

                <i class="${
                    isFav
                        ? "fa-solid"
                        : "fa-regular"
                } fa-star"></i>

            </button>


            <img
                src="${channel.logo || "logo.png"}"
                alt="${channel.name || "TV"}"
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
// HTML SAFE TEXT
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
// First Channel Click = One Ad
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
            typeof ad.then === "function"
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
       
