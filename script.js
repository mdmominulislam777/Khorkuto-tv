// ==========================================
// Khorkuto TV - Final Script (v10.3)
// ==========================================

let channels = [];
let currentCategory = "All";
let hls = null;

let categorizedContainer, video, search, playerModal, playingChannelTitle, sportsMatchesList;

document.addEventListener("DOMContentLoaded", () => {
    categorizedContainer = document.getElementById("categorizedChannels");
    sportsMatchesList = document.getElementById("sportsMatchesList");
    video = document.getElementById("video");
    search = document.getElementById("search");
    playerModal = document.getElementById("playerModal");
    playingChannelTitle = document.getElementById("playingChannelTitle");

    initApp();
});

function initApp() {
    setupEventListeners();
    loadChannels();
    fetchLiveSportsMatches();
    
    // প্রতি ২ মিনিট পর পর অটোমেটিক লাইভ স্কোরের তথ্য রিফ্রেশ হবে
    setInterval(fetchLiveSportsMatches, 120000);

    setupTelegram();
    hideSplash();
}

function hideSplash() {
    const splash = document.getElementById("splash");
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = "0";
            setTimeout(() => splash.style.display = "none", 400);
        }, 1200);
    }
}

// ------------------------------------------
// Automated Live Sports API Fetch
// ------------------------------------------
async function fetchLiveSportsMatches() {
    if (!sportsMatchesList) return;

    try {
        const response = await fetch("https://site.api.espn.com/apis/site/v2/sports/cricket/13876/scoreboard");
        
        if (!response.ok) throw new Error("Sports API offline");
        
        const data = await response.json();
        const events = data.events || [];

        sportsMatchesList.innerHTML = "";

        if (events.length === 0) {
            sportsMatchesList.innerHTML = `
                <div class="match-card">
                    <span class="match-status" style="background:#64748b;">ℹ️ INFO</span>
                    <div class="match-title">বর্তমানে কোনো লাইভ ম্যাচ নেই</div>
                    <div class="match-sub">পরবর্তী ম্যাচ আপডেট শীঘ্রই আসছে</div>
                </div>`;
            return;
        }

        events.forEach(event => {
            const matchTitle = event.name || "Live Match";
            const statusDetail = event.status?.type?.detail || "🔴 LIVE";
            const competitionName = event.season?.slug || "Cricket Match";

            const card = document.createElement("div");
            card.className = "match-card";
            card.innerHTML = `
                <span class="match-status">${statusDetail.includes("Final") ? "🏁 FINISHED" : "🔴 LIVE"}</span>
                <div class="match-title">${matchTitle}</div>
                <div class="match-sub">${competitionName}</div>
            `;

            card.onclick = () => {
                const sportsChannel = channels.find(c => 
                    (c.category && c.category.toLowerCase() === "sports") || 
                    c.name.toLowerCase().includes("sports")
                );

                if (sportsChannel) {
                    playChannel(sportsChannel);
                } else {
                    alert("স্ট্রিমিং দেখতে স্পোর্টস ক্যাটাগরি থেকে চ্যানেল বাছাই করুন।");
                }
            };

            sportsMatchesList.appendChild(card);
        });

    } catch (error) {
        console.warn("Sports API fallback executed:", error);
        sportsMatchesList.innerHTML = `
            <div class="match-card">
                <span class="match-status">🔴 LIVE</span>
                <div class="match-title">লাইভ স্পোর্টস টি ভি</div>
                <div class="match-sub">খেলার সরাসরি সম্প্রচার দেখতে ক্লিক করুন</div>
            </div>`;
    }
}

// ------------------------------------------
// Load Channels & Layout
// ------------------------------------------
async function loadChannels() {
    if (!categorizedContainer) return;

    categorizedContainer.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--text-muted);">
            ⏳ চ্যানেল লোড হচ্ছে...
        </div>`;

    try {
        const response = await fetch("channels.json?t=" + Date.now());
        if (!response.ok) throw new Error("Failed to load channels");

        const data = await response.json();
        channels = Array.isArray(data) ? data : (data.channels || []);

        renderCategorizedChannels();

    } catch (err) {
        console.error(err);
        categorizedContainer.innerHTML = `
            <div style="text-align:center; padding:30px; color:#ef4444;">
                ❌ channels.json ফাইল লোড করা সম্ভব হয়নি।
            </div>`;
    }
}

function renderCategorizedChannels() {
    if (!categorizedContainer) return;

    categorizedContainer.innerHTML = "";
    const keyword = search ? search.value.toLowerCase().trim() : "";

    const filtered = channels.filter(c => 
        (c.name || "").toLowerCase().includes(keyword)
    );

    if (filtered.length === 0) {
        categorizedContainer.innerHTML = "<p style='text-align:center; padding:30px; color:var(--text-muted);'>কোনো চ্যানেল পাওয়া যায়নি</p>";
        return;
    }

    let categories = [];
    if (currentCategory === "All") {
        categories = [...new Set(filtered.map(c => c.category || "General"))];
    } else {
        categories = [currentCategory];
    }

    categories.forEach(catName => {
        const catChannels = filtered.filter(c => (c.category || "General").toLowerCase().includes(catName.toLowerCase()));

        if (catChannels.length > 0) {
            renderCustomList("📍 " + catName, catChannels);
        }
    });
}

function renderCustomList(title, list) {
    if (!categorizedContainer) return;

    if (list.length === 0) {
        categorizedContainer.innerHTML = `<p style='text-align:center; padding:30px; color:var(--text-muted);'>কোনো চ্যানেল পাওয়া যায়নি</p>`;
        return;
    }

    const rowBlock = document.createElement("div");
    rowBlock.className = "category-row-block";

    rowBlock.innerHTML = `
        <div class="category-title">
            ${title}
            <span>${list.length} টি চ্যানেল</span>
        </div>
        <div class="horizontal-channel-slider"></div>
    `;

    const slider = rowBlock.querySelector(".horizontal-channel-slider");

    list.forEach(channel => {
        const isFav = localStorage.getItem("fav_" + channel.name) === "true";
        const card = document.createElement("div");
        card.className = "ott-card";

        card.innerHTML = `
            <span class="fav-icon">${isFav ? "❤️" : "🤍"}</span>
            <img src="${channel.logo || 'logo.png'}" onerror="this.onerror=null; this.src='https://via.placeholder.com/80?text=TV';">
            <h4>${channel.name || 'Unknown'}</h4>
        `;

        const favBtn = card.querySelector(".fav-icon");
        favBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(channel, favBtn);
        };

        card.onclick = () => playChannel(channel);

        slider.appendChild(card);
    });

    categorizedContainer.appendChild(rowBlock);
}

// ------------------------------------------
// Streaming Player Functionality
// ------------------------------------------
function playChannel(channel) {
    if (!video || !channel.url) return;

    if (playingChannelTitle) {
        playingChannelTitle.innerText = "🔴 " + (channel.name || "Live TV");
    }

    if (playerModal) {
        playerModal.classList.add("active");
    }

    addToHistory(channel);

    if (hls) {
        hls.destroy();
        hls = null;
    }

    if (Hls.isSupported() && channel.url.includes(".m3u8")) {
        hls = new Hls();
        hls.loadSource(channel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(e => console.log("Autoplay blocked:", e));
        });
    } else {
        video.src = channel.url;
        video.play().catch(e => console.log("Autoplay blocked:", e));
    }
}

function closePlayer() {
    if (playerModal) {
        playerModal.classList.remove("active");
    }
    if (video) {
        video.pause();
    }
    if (hls) {
        hls.destroy();
        hls = null;
    }
}

// ------------------------------------------
// Favorites & History Management
// ------------------------------------------
function toggleFavorite(channel, btnElement) {
    const key = "fav_" + channel.name;
    const isFav = localStorage.getItem(key) === "true";

    if (isFav) {
        localStorage.removeItem(key);
        btnElement.innerText = "🤍";
    } else {
        localStorage.setItem(key, "true");
        btnElement.innerText = "❤️";
    }
}

function renderFavorites() {
    if (!categorizedContainer) return;
    categorizedContainer.innerHTML = "";
    const favChannels = channels.filter(c => localStorage.getItem("fav_" + c.name) === "true");
    renderCustomList("❤️ ফেভারিট চ্যানেলসমূহ", favChannels);
}

function addToHistory(channel) {
    let history = JSON.parse(localStorage.getItem("watch_history") || "[]");
    history = history.filter(item => item.name !== channel.name);
    history.unshift(channel);
    if (history.length > 20) history.pop();
    localStorage.setItem("watch_history", JSON.stringify(history));
}

function renderHistory() {
    if (!categorizedContainer) return;
    categorizedContainer.innerHTML = "";
    const historyChannels = JSON.parse(localStorage.getItem("watch_history") || "[]");
    renderCustomList("🕒 সাম্প্রতিক দেখা চ্যানেল", historyChannels);
}

// ------------------------------------------
// Event Listeners
// ------------------------------------------
function setupEventListeners() {
    if (search) {
        search.addEventListener("input", () => renderCategorizedChannels());
    }

    document.querySelectorAll(".cat").forEach(pill => {
        pill.addEventListener("click", () => {
            document.querySelectorAll(".cat").forEach(c => c.classList.remove("active"));
            pill.classList.add("active");
            
            currentCategory = pill.dataset.category || "All";
            renderCategorizedChannels();
        });
    });

    const setActiveNav = (id) => {
        document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
        document.getElementById(id)?.classList.add("active");
    };

    document.getElementById("homeNav")?.addEventListener("click", () => {
        setActiveNav("homeNav");
        currentCategory = "All";
        renderCategorizedChannels();
    });

    document.getElementById("sportsNav")?.addEventListener("click", () => {
        setActiveNav("sportsNav");
        currentCategory = "Sports";
        renderCategorizedChannels();
    });

    document.getElementById("favoriteNav")?.addEventListener("click", () => {
        setActiveNav("favoriteNav");
        renderFavorites();
    });

    document.getElementById("historyNav")?.addEventListener("click", () => {
        setActiveNav("historyNav");
        renderHistory();
    });

    document.getElementById("searchNav")?.addEventListener("click", () => {
        setActiveNav("searchNav");
        search?.scrollIntoView({ behavior: "smooth" });
        search?.focus();
    });

    document.getElementById("closePlayerBtn")?.addEventListener("click", closePlayer);
    document.getElementById("refreshBtn")?.addEventListener("click", () => location.reload());

    document.getElementById("fullscreenBtn")?.addEventListener("click", () => {
        if (!video) return;
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    });

    // Settings
    const settingsSheet = document.getElementById("settingsSheet");
    const settingsOverlay = document.getElementById("settingsOverlay");

    document.getElementById("settingsBtn")?.addEventListener("click", () => {
        settingsOverlay?.classList.add("show");
        settingsSheet?.classList.add("show");
    });

    document.getElementById("closeSettings")?.addEventListener("click", () => {
        settingsOverlay?.classList.remove("show");
        settingsSheet?.classList.remove("show");
    });

    document.getElementById("clearFavBtn")?.addEventListener("click", () => {
        channels.forEach(c => localStorage.removeItem("fav_" + c.name));
        alert("সব ফেভারিট চ্যানেল মুছে ফেলা হয়েছে!");
        settingsOverlay?.classList.remove("show");
        settingsSheet?.classList.remove("show");
        renderCategorizedChannels();
    });

    document.getElementById("clearHistoryBtn")?.addEventListener("click", () => {
        localStorage.removeItem("watch_history");
        alert("হিস্ট্রি ক্লিয়ার করা হয়েছে!");
        settingsOverlay?.classList.remove("show");
        settingsSheet?.classList.remove("show");
        renderCategorizedChannels();
    });
}

function setupTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
}
