document.addEventListener("DOMContentLoaded", () => {
    // Hide Splash Screen after loading
    setTimeout(() => {
        const splash = document.getElementById("splash");
        if (splash) splash.classList.add("hidden");
    }, 1000);

    // Sample Channel Data
    const channels = [
        { id: 1, name: "Gazi TV", category: "Sports", featured: true, logo: "https://via.placeholder.com/150", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { id: 2, name: "T Sports (1080p)", category: "Sports", featured: true, logo: "https://via.placeholder.com/150", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { id: 3, name: "RTV HD", category: "Entertainment", featured: true, logo: "https://via.placeholder.com/150", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { id: 4, name: "A Sports HD", category: "Sports", featured: false, logo: "https://via.placeholder.com/150", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { id: 5, name: "Pk Sports HD", category: "Sports", featured: false, logo: "https://via.placeholder.com/150", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { id: 6, name: "QAZ Sports HD", category: "Sports", featured: false, logo: "https://via.placeholder.com/150", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
    ];

    let favorites = JSON.parse(localStorage.getItem("streamzx_favs")) || [];
    let currentCategory = "Sports";

    const channelList = document.getElementById("channelList");
    const featuredList = document.getElementById("featuredList");
    const searchArea = document.getElementById("searchArea");
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("search");
    const refreshBtn = document.getElementById("refreshBtn");
    const favHeaderBtn = document.getElementById("favHeaderBtn");
    const mainSectionTitle = document.getElementById("mainSectionTitle");

    // Player Elements
    const playerContainer = document.getElementById("playerContainer");
    const video = document.getElementById("video");
    const currentChannelName = document.getElementById("currentChannelName");
    const closePlayerBtn = document.getElementById("closePlayerBtn");
    let hls;

    // Render Featured Channels
    function renderFeatured() {
        featuredList.innerHTML = "";
        const featured = channels.filter(c => c.featured);
        featured.forEach(ch => {
            const card = document.createElement("div");
            card.className = "featured-card";
            card.onclick = () => playChannel(ch.name, ch.url);
            card.innerHTML = `
                <img src="${ch.logo}" alt="${ch.name}">
                <h4>${ch.name}</h4>
                <p>${ch.category}</p>
            `;
            featuredList.appendChild(card);
        });
    }

    // Render Main Channel Grid
    function renderChannels(category = "Sports", filterText = "", showOnlyFavs = false) {
        channelList.innerHTML = "";
        
        let filtered = channels;

        if (showOnlyFavs) {
            filtered = channels.filter(c => favorites.includes(c.id));
            mainSectionTitle.textContent = "❤️ Favorite Channels";
        } else {
            if (category) {
                filtered = filtered.filter(c => c.category === category);
                mainSectionTitle.textContent = `⚽ ${category} Channels`;
            }
            if (filterText) {
                filtered = filtered.filter(c => c.name.toLowerCase().includes(filterText.toLowerCase()));
            }
        }

        if (filtered.length === 0) {
            channelList.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">No channels found!</p>`;
            return;
        }

        filtered.forEach(ch => {
            const isFav = favorites.includes(ch.id);
            const card = document.createElement("div");
            card.className = "channel-card";
            card.innerHTML = `
                <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${ch.id})">
                    <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
                </button>
                <img src="${ch.logo}" alt="${ch.name}">
                <h4>${ch.name}</h4>
            `;
            card.onclick = () => playChannel(ch.name, ch.url);
            channelList.appendChild(card);
        });
    }

    // Toggle Favorite Function
    window.toggleFavorite = (id) => {
        if (favorites.includes(id)) {
            favorites = favorites.filter(fId => fId !== id);
        } else {
            favorites.push(id);
        }
        localStorage.setItem("streamzx_favs", JSON.stringify(favorites));
        renderChannels(currentCategory, searchInput.value);
    };

    // Play Channel in Modal
    function playChannel(name, url) {
        currentChannelName.textContent = name;
        playerContainer.classList.remove("hidden");

        if (Hls.isSupported()) {
            if (hls) hls.destroy();
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = url;
            video.play();
        }
    }

    // Close Video Player
    closePlayerBtn.onclick = () => {
        playerContainer.classList.add("hidden");
        video.pause();
        if (hls) hls.destroy();
    };

    // Category Click Event
    document.querySelectorAll(".cat").forEach(catBtn => {
        catBtn.onclick = () => {
            document.querySelectorAll(".cat").forEach(c => c.classList.remove("active"));
            catBtn.classList.add("active");
            currentCategory = catBtn.dataset.category;
            renderChannels(currentCategory, searchInput.value);
        };
    });

    // Toggle Search Bar
    searchBtn.onclick = () => {
        searchArea.classList.toggle("active");
        if (searchArea.classList.contains("active")) searchInput.focus();
    };

    // Search Input Event
    searchInput.oninput = (e) => {
        renderChannels(currentCategory, e.target.value);
    };

    // Refresh Button Event
    refreshBtn.onclick = () => {
        searchInput.value = "";
        renderFeatured();
        renderChannels(currentCategory);
    };

    // Favorite Header Button Click
    favHeaderBtn.onclick = () => {
        renderChannels(null, "", true);
    };

    // Initial Load
    renderFeatured();
    renderChannels(currentCategory);
});
