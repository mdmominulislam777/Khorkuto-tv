const GITHUB_JSON_URL = "https://raw.githubusercontent.com/mdmominulislam777/Khorkuto-tv/main/data.json";

let appData = [];
let hlsPlayer = null;

// ১. ডাটা ফেচ করা এবং লোডিং পেজ হাইড করা
async function loadAppData() {
    const splashScreen = document.getElementById("splashScreen");
    const statusText = document.getElementById("statusText");

    try {
        if(statusText) statusText.innerText = "কানেক্ট করা হচ্ছে...";

        const response = await fetch(`${GITHUB_JSON_URL}?t=${Date.now()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP Status: ${response.status}`);
        }
        
        const data = await response.json();
        appData = data.categories || [];

        // ক্যাটাগরি সাজানো
        renderCategories();

        // ডাটা লোড সম্পূর্ণ হলে লোডিং পেজ হাইড করা
        setTimeout(() => {
            if(splashScreen) splashScreen.classList.add("fade-out");
        }, 500);

    } catch (error) {
        console.error("ডাটা লোড হতে সমস্যা হয়েছে:", error);
        if (splashScreen) {
            splashScreen.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 45px; color: #ef4444; margin-bottom: 12px;"></i>
                    <h3 style="color: #ffffff; font-size: 18px;">ডাটা লোড করতে ব্যর্থ হয়েছে!</h3>
                    <p style="color: #94a3b8; font-size: 13px; margin-top: 6px;">ইন্টারনেট কানেকশন চেক করে রিফ্রেশ দিন।</p>
                </div>
            `;
        }
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
