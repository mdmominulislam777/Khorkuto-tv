// ==========================================
// Khorkuto TV - YuppTV Style Consolidated Script
// ==========================================

let channels = [];
let currentCategory = "All";
let hls = null;

let categorizedContainer, video, search, playerModal, playingChannelTitle;

document.addEventListener("DOMContentLoaded", () => {
    categorizedContainer = document.getElementById("categorizedChannels");
    video = document.getElementById("video");
    search = document.getElementById("search");
    playerModal = document.getElementById("playerModal");
    playingChannelTitle = document.getElementById("playingChannelTitle");

    initApp();
});

function initApp() {
    setupEventListeners();
    loadChannels();
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

// ------------------------------------------
// YuppTV Style Category-Wise Rendering
// ------------------------------------------
function renderCategorizedChannels() {
    if (!categorizedContainer) return;

    categorizedContainer.innerHTML = "";
    const keyword = search ? search.value.toLowerCase().trim() : "";

    // ফিল্টারকৃত চ্যানেল
    const filtered = channels.filter(c => 
        (c.name || "").toLowerCase().includes(keyword)
    );

    if (filtered.length === 0) {
        categorizedContainer.innerHTML = "<p style='text-align:center; padding:30px; color:var(--text-muted);'>কোনো চ্যানেল পাওয়া যায়নি</p>";
        return;
    }

    // ইউনিক ক্যাটাগরি তৈরি
    let categories = [];
    if (currentCategory === "All") {
        categories = [...new Set(filtered.map(c => c.category || "General"))];
    } else {
        categories = [currentCategory];
    }

    categories.forEach(catName => {
        const catChannels = filtered.filter(c => (c.category || "General").toLowerCase().includes(catName.toLowerCase()));

        if (catChannels.length > 0) {
            const rowBlock = document.createElement("div");
            rowBlock.className = "category-row-block";

            rowBlock.innerHTML = `
                <div class="category-title">
                    📍 ${catName}
                    <span>${catChannels.length} টি চ্যানেল</span>
                </div>
                <div class="horizontal-channel-slider"></div>
            `;

            const slider = rowBlock.querySelector(".horizontal-channel-slider");

            catChannels.forEach(channel => {
                const isFav = localStorage.getItem("fav_" + channel.name) === "true";
                const card = document.createElement("div");
                card.className = "ott-card";

                card.innerHTML = `
                    <span class="fav-icon">${isFav ? "❤️" : "🤍"}</span>
                    <img src="${channel.logo || 'logo.png'}" onerror="this.onerror=null; this.src='https://via.placeholder.com/80?text=TV';">
                    <h4>${channel.name || 'Unknown'}</h4>
                `;

                // ফেভারিট আইকনে ক্লিক
                const favBtn = card.querySelector(".fav-icon");
                favBtn.onclick = (e) => {
                    e.stopPropagation();
                    toggleFavorite(channel, favBtn);
                };

                // চ্যানেলে ক্লিক করলে সাথে সাথে চালু হবে
                card.onclick = () => playChannel(channel);

                slider.appendChild(card);
            });

            categorizedContainer.appendChild(rowBlock);
        }
    });
}

// ------------------------------------------
// Play Channel in Pop-up Modal
// ------------------------------------------
function playChannel(channel) {
    if (!video || !channel.url) return;

    // শিরোনাম আপডেট
    if (playingChannelTitle) {
        playingChannelTitle.innerText = "🔴 " + (channel.name || "Live TV");
    }

    // পপআপ প্লেয়ার প্রদর্শন
    if (playerModal) {
        playerModal.classList.add("active");
    }

    localStorage.setItem("lastChannel", JSON.stringify(channel));
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
// Favorites & History
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

function addToHistory(channel) {
    let history = JSON.parse(localStorage.getItem("watch_history") || "[]");
    history = history.filter(item => item.name !== channel.name);
    history.unshift(channel);
    if (history.length > 20) history.pop();
    localStorage.setItem("watch_history", JSON.stringify(history));
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
}

function setupTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
}
