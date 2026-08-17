// ==========================================
// StreamZX - Complete Script
// ==========================================

let channels = [];

let currentCategory = "Sports";

let favorites =
    JSON.parse(localStorage.getItem("favChannels")) || [];

let hls = null;


// ==========================================
// MONETAG
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

let categoryPage;


// ==========================================
// APP START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        channelList =
            document.getElementById(
                "channelList"
            );

        featuredList =
            document.getElementById(
                "featuredList"
            );

        featuredSection =
            document.getElementById(
                "featuredSection"
            );

        video =
            document.getElementById(
                "video"
            );

        search =
            document.getElementById(
                "search"
            );

        searchArea =
            document.getElementById(
                "searchArea"
            );

        playerContainer =
            document.getElementById(
                "playerContainer"
            );

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


        initApp();

    }
);


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
        document.getElementById(
            "splash"
        );

    if (!splash) return;

    splash.classList.add(
        "hidden"
    );

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

                // যদি Category Page খোলা থাকে
                if (
                    categoryPage &&
                    !categoryPage.classList.contains(
                        "hidden"
                    )
                ) {

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

                    search.focus();

                } else {

                    search.value = "";

                    renderChannels();

                }

            }
        );

    }


    // ======================================
    // FAVORITES
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

                setActiveBottomNav(null);

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


                hideCategoryPage();


                if (featuredSection) {

                    featuredSection.style.display =
                        "none";

                }


                if (
                    document.querySelector(
                        ".main-content"
                    )
                ) {

                    document.querySelector(
                        ".main-content"
                    ).style.display =
                        "block";

                }


                mainSectionTitle.textContent =
                    "🔴 Live Events";


                channelList.innerHTML = `

                    <div style="
                        grid-column:1/-1;
                        text-align:center;
                        padding:40px 20px;
                        color:var(--text-muted);
                    ">

                        <i
                            class="fa-solid fa-tower-broadcast"
                            style="
                                font-size:40px;
                                margin-bottom:15px;
                                display:block;
                            "
                        ></i>

                        <div>
                            Live Events
                        </div>

                        <small>
                            Live event system will appear here.
                        </small>

                    </div>

                `;


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    // ======================================
    // CATEGORY BUTTON
    // ======================================

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


    // ======================================
    // SPORTS BUTTON
    // ======================================

    if (sportsNavBtn) {

        sportsNavBtn.addEventListener(
            "click",
            () => {

                setActiveBottomNav(
                    sportsNavBtn
                );


                hideCategoryPage();

                showNormalContent();


                currentCategory =
                    "Sports";


                updateSectionTitle();

                renderFeaturedChannels();

                renderChannels();


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


                    currentCategory =
                        selectedCategory;


                    hideCategoryPage();

                    showNormalContent();


                    updateSectionTitle();

                    renderFeaturedChannels();

                    renderChannels();


                    setActiveBottomNav(
                        document.getElementById(
                            "sportsNav"
                        )
                    );


                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }
            );

        });

}


// ==========================================
// SHOW CATEGORY PAGE
// ==========================================

function showCategoryPage() {

    if (categoryPage) {

        categoryPage.classList.remove(
            "hidden"
        );

    }


    if (featuredSection) {

        featuredSection.style.display =
            "none";

    }


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
// HIDE CATEGORY PAGE
// ==========================================

function hideCategoryPage() {

    if (categoryPage) {

        categoryPage.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// SHOW NORMAL CONTENT
// ==========================================

function showNormalContent() {

    hideCategoryPage();


    if (featuredSection) {

        featuredSection.style.display =
            "block";

    }


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


        if (Array.isArray(data)) {

            channels = data;

        }

        else if (
            data &&
            Array.isArray(
                data.channels
            )
        ) {

            channels =
                data.channels;

        }

        else {

            channels = [];

        }


                // অ্যাপ ওপেন হলেই যেন ডিফল্টভাবে Live Event বাটনে ক্লিক হয়ে যায়
        const liveEventBtn = document.getElementById("liveEventNav");
        if (liveEventBtn) {
            liveEventBtn.click();
        } else {
            renderFeaturedChannels();
            renderChannels();
        }



        console.log(
            "Channels loaded:",
            channels.length
        );


    }

    catch (error) {

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

                    ${escapeHTML(
                        error.message
                    )}

                </small>

            </div>

        `;

    }

    finally {

        // JSON fail হলেও splash বন্ধ হবে

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


    featured.forEach(
        channel => {

            const isFav =
                favorites.includes(
                    channel.id
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "featured-card";


            card.innerHTML = `

                <button
                    class="fav-btn ${
                        isFav
                            ? "active"
                            : ""
                    }"
                    title="Favorite"
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
                    onerror="
                        this.onerror=null;
                        this.src='https://via.placeholder.com/80?text=TV';
                    "
                >


                <h4>
                    ${escapeHTML(
                        channel.name ||
                        "Unknown"
                    )}
                </h4>


                <p>
                    ${escapeHTML(
                        channel.category ||
                        "General"
                    )}
                </p>

            `;


            const favBtn =
                card.querySelector(
                    ".fav-btn"
                );


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

                    playChannelWithAd(
                        channel
                    );

                }
            );


            featuredList.appendChild(
                card
            );

        }
    );

}


// ==========================================
// RENDER CHANNELS
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
        channels.filter(
            channel => {

                const name =
                    String(
                        channel.name || ""
                    )
                        .toLowerCase();


                const nameMatch =
                    name.includes(
                        keyword
                    );


                let categoryMatch =
                    false;


                if (
                    currentCategory ===
                    "Favorites"
                ) {

                    categoryMatch =
                        favorites.includes(
                            channel.id
                        );

                }

                else {

                    categoryMatch =
                        String(
                            channel.category ||
                            ""
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

            }
        );


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


    filtered.forEach(
        channel => {

            const isFav =
                favorites.includes(
                    channel.id
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "channel-card";


            card.innerHTML = `

                <button
                    class="fav-btn ${
                        isFav
                            ? "active"
                            : ""
                    }"
                    title="Favorite"
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
                    onerror="
                        this.onerror=null;
                        this.src='https://via.placeholder.com/80?text=TV';
                    "
                >


                <h4>
                    ${escapeHTML(
                        channel.name ||
                        "Unknown"
                    )}
                </h4>

            `;


            const favBtn =
                card.querySelector(
                    ".fav-btn"
                );


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

                    playChannelWithAd(
                        channel
                    );

                }
            );


            channelList.appendChild(
                card
            );

        }
    );

}


// ==========================================
// FAVORITE
// ==========================================

function toggleFavorite(
    channelId,
    event
) {

    if (event) {

        event.stopPropagation();

    }


    const index =
        favorites.indexOf(
            channelId
        );


    if (index === -1) {

        favorites.push(
            channelId
        );

    }

    else {

        favorites.splice(
            index,
            1
        );

    }


    localStorage.setItem(
        "favChannels",
        JSON.stringify(
            favorites
        )
    );


    renderChannels();

    renderFeaturedChannels();

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value)

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
// MONETAG
// ==========================================

function playChannelWithAd(
    channel
) {

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
            show_11580289(
                "pop"
            );


        if (
            ad &&
            typeof ad.then ===
            "function"
        ) {

            ad.then(
                () => {

                    firstChannelAdShown =
                        true;

                    isAdShowing =
                        false;

                    playChannel(
                        channel
                    );

                }
            )
            .catch(
                () => {

                    firstChannelAdShown =
                        true;

                    isAdShowing =
                        false;

                    playChannel(
                        channel
                    );

                }
            );

        }

        else {

            firstChannelAdShown =
                true;

            isAdShowing =
                false;

            playChannel(
                channel
            );

        }

    }

    catch (error) {

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
    ) return;


    currentChannelName.textContent =
        channel.name ||
        "Live TV";


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

    video.removeAttribute(
        "src"
    );

    video.load();


    const url =
        String(
            channel.url
        ).trim();


    // ======================================
    // HLS.JS
    // ======================================

    if (
        typeof Hls !==
        "undefined" &&
        Hls.isSupported() &&
        (
            url.includes(
                ".m3u8"
            ) ||
            url.includes(
                "m3u8"
            )
        )
    ) {

        hls =
            new Hls({
                enableWorker: true
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

                video.play()
                    .catch(
                        error => {

                            console.log(
                                "Autoplay blocked:",
                                error
                            );

                        }
                    );

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

        video.src =
            url;


        video.play()
            .catch(
                error => {

                    console.log(
                        "Autoplay blocked:",
                        error
                    );

                }
            );

    }


    // ======================================
    // NORMAL VIDEO
    // ======================================

    else {

        video.src =
            url;


        video.play()
            .catch(
                error => {

                    console.log(
                        "Autoplay blocked:",
                        error
                    );

                }
            );

    }


    localStorage.setItem(
        "lastChannel",
        JSON.stringify(
            channel
        )
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

}
