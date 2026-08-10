const GITHUB_JSON_URL = "https://raw.githubusercontent.com/mdmominulislam777/Khorkuto-tv/main/data.json";

let appData = [];
let hlsPlayer = null;

// 1. Fetch App Data from GitHub JSON
async function loadAppData() {
    const splashScreen = document.getElementById("splashScreen");

    try {
        const response = await fetch(`${GITHUB_JSON_URL}?t=${Date.now()}`);
        
        if (!response.ok) {
            throw new Error(`Server Response Error (${response.status})`);
        }
        
        const data = await response.json();
        appData = data.categories || [];

        // Render categories on main page
        renderCategories();

    } catch (error) {
        console.error("Data loading error:", error);
        alert("Failed to load data! Please check your internet connection.");
    } finally {
        // Ensure splash screen always hides cleanly
        if (splashScreen) {
            splashScreen.style.opacity = "0";
            splashScreen.style.transition = "opacity 0.5s ease";
            
            setTimeout(() => {
                splashScreen.style.display = "none";
            }, 500);
        }
    }
}

// 2. Render Categories in Big Cards
function renderCategories() {
    const categoryContainer = document.getElementById("categoryList");
    if (!categoryContainer) return;

    if (appData.length === 0) {
        categoryContainer.innerHTML = `<p style="text-align:center; grid-column: 1/-1; padding:30px; color:#94a3b8;">No categories found!</p>`;
        return;
    }

    let html = "";
    appData.forEach(cat => {
        const safeId = (cat.id || '').replace(/'/g, "\\'");
        html += `
            <div class="category-card" onclick="openCategory('${safeId}')">
                <i class="${cat.icon || 'fa-solid fa-folder'}"></i>
                <h3>${cat.name}</h3>
            </div>
        `;
    });

    categoryContainer.innerHTML = html;
}

// 3. Open Selected Category Channels
function openCategory(catId) {
    const selectedCategory = appData.find(c => c.id === catId);
    if (!selectedCategory) return;

    document.getElementById("headerTitle").innerText = selectedCategory.name;
    document.getElementById("backBtn").style.display = "flex";
    document.getElementById("menuBtn").style.display = "none";

    document.getElementById("categoryList").style.display = "none";
    const channelContainer = document.getElementById("channelList");
    channelContainer.style.display = "grid";

    let html = "";
    if (!selectedCategory.channels || selectedCategory.channels.length === 0) {
        html = `<p style="text-align:center; grid-column: 1/-1; padding:30px; color:#94a3b8;">No channels available in this category.</p>`;
    } else {
        selectedCategory.channels.forEach(ch => {
            const safeName = (ch.name || '').replace(/'/g, "\\'");
            const safeUrl = (ch.stream_url || '').replace(/'/g, "\\'");
            html += `
                <div class="channel-card" onclick="playStream('${safeName}', '${safeUrl}')">
                    <img src="${ch.logo}" alt="${ch.name}" onerror="this.src='https://via.placeholder.com/60'">
                    <span>${ch.name}</span>
                </div>
            `;
        });
    }

    channelContainer.innerHTML = html;
}

// 4. Back to Categories View
function showCategoriesView() {
    document.getElementById("headerTitle").innerText = "Categories";
    document.getElementById("backBtn").style.display = "none";
    document.getElementById("menuBtn").style.display = "flex";

    document.getElementById("channelList").style.display = "none";
    document.getElementById("categoryList").style.display = "grid";
}

// 5. Sidebar Toggle Functions
function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebarOverlay").classList.add("active");
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("active");
}

// 6. Play HLS Stream
function playStream(channelName, url) {
    if (!url || url.includes("YOUR_M3U8_LINK")) {
        alert("No live stream URL provided for this channel!");
        return;
    }

    const modal = document.getElementById("playerModal");
    const video = document.getElementById("videoPlayer");
    const title = document.getElementById("playingChannelTitle");

    title.innerText = channelName;
    modal.classList.add("active");

    if (Hls.isSupported()) {
        if (hlsPlayer) hlsPlayer.destroy();
        hlsPlayer = new Hls();
        hlsPlayer.loadSource(url);
        hlsPlayer.attachMedia(video);
        hlsPlayer.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play();
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', function () {
            video.play();
        });
    } else {
        alert("Your browser does not support HLS streaming.");
    }
}

// 7. Close Video Player
function closePlayer() {
    const modal = document.getElementById("playerModal");
    const video = document.getElementById("videoPlayer");

    video.pause();
    if (hlsPlayer) {
        hlsPlayer.destroy();
        hlsPlayer = null;
    }
    video.src = "";
    modal.classList.remove("active");
}

// Initialize App
document.addEventListener("DOMContentLoaded", loadAppData);
