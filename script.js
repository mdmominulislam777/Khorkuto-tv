const GITHUB_JSON_URL = "https://raw.githubusercontent.com/mdmominulislam777/Khorkuto-tv/main/data.json";

let appData = [];
let hlsPlayer = null;

// ১. ডাটা ফেচ করা
async function loadAppData() {
    const loader = document.getElementById("appLoader");
    try {
        const response = await fetch(`${GITHUB_JSON_URL}?t=${Date.now()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        appData = data.categories || [];

        loader.style.display = "none";
        renderCategories();

    } catch (error) {
        console.error("ডাটা লোড হতে সমস্যা হয়েছে:", error);
        loader.innerHTML = `
            <div style="color: #ef4444; text-align: center; padding: 20px;">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 40px; margin-bottom: 10px;"></i>
                <p style="font-weight: bold; font-size: 16px;">ডাটা লোড হতে সমস্যা হয়েছে!</p>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 5px;">${error.message}</p>
            </div>
        `;
    }
}

// ২. ক্যাটাগরি দেখানো
function renderCategories() {
    const categoryContainer = document.getElementById("categoryList");
    let html = "";

    appData.forEach(cat => {
        html += `
            <div class="category-card" onclick="openCategory('${cat.id}')">
                <i class="${cat.icon || 'fa-solid fa-folder'}"></i>
                <h3>${cat.name}</h3>
            </div>
        `;
    });

    categoryContainer.innerHTML = html;
}

// ৩. ক্যাটাগরিতে ক্লিক করলে চ্যানেল দেখানো
function openCategory(catId) {
    const selectedCategory = appData.find(c => c.id === catId);
    if (!selectedCategory) return;

    document.getElementById("headerTitle").innerText = selectedCategory.name;
    document.getElementById("backBtn").style.display = "block";

    document.getElementById("categoryList").style.display = "none";
    const channelContainer = document.getElementById("channelList");
    channelContainer.style.display = "grid";

    let html = "";
    selectedCategory.channels.forEach(ch => {
        html += `
            <div class="channel-card" onclick="playStream('${ch.name}', '${ch.stream_url}')">
                <img src="${ch.logo}" alt="${ch.name}" onerror="this.src='https://via.placeholder.com/60'">
                <span>${ch.name}</span>
            </div>
        `;
    });

    channelContainer.innerHTML = html;
}

// ৪. ক্যাটাগরি ভিউতে ফেরত যাওয়া
function showCategoriesView() {
    document.getElementById("headerTitle").innerText = "Categories";
    document.getElementById("backBtn").style.display = "none";

    document.getElementById("channelList").style.display = "none";
    document.getElementById("categoryList").style.display = "grid";
}

// ৫. চ্যানেল প্লে করা
function playStream(channelName, url) {
    if (!url) {
        alert("এই চ্যানেলের স্ট্রিম লিংক পাওয়া যায়নি!");
        return;
    }

    const modal = document.getElementById("playerModal");
    const video = document.getElementById("videoPlayer");
    const title = document.getElementById("playingChannelTitle");

    title.innerText = channelName;
    modal.classList.add("active");

    if (Hls.isSupported()) {
        if (hlsPlayer) {
            hlsPlayer.destroy();
        }
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
        alert("আপনার ব্রাউজারে HLS ভিডিও সাপোর্ট করছে না।");
    }
}

// ৬. ভিডিও বন্ধ করা
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

document.addEventListener("DOMContentLoaded", loadAppData);
