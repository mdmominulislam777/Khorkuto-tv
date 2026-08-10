// আপনার গিটহাব Raw লিঙ্কটি এখানে বসাবেন
const GITHUB_JSON_URL = "https://raw.githubusercontent.com/mdmominulislam777/Khorkuto-tv/refs/heads/main/data.json";

let appData = [];

// ১. ডাটা ফেচ করা এবং লোডার বন্ধ করা
async function loadAppData() {
    try {
        // টাইমস্ট্যাম্প যোগ করে ক্যাশ সমস্যা সমাধান
        const response = await fetch(`${GITHUB_JSON_URL}?t=${Date.now()}`);
        const data = await response.json();
        
        appData = data.categories || [];

        // লোডার হাইড করা
        document.getElementById("appLoader").style.display = "none";

        // ক্যাটাগরিগুলো ডিসপ্লে করা
        renderCategories();

    } catch (error) {
        console.error("ডাটা লোড হতে সমস্যা হয়েছে:", error);
        document.getElementById("appLoader").innerHTML = `<p style="color:#ef4444;">❌ ডাটা লোড করতে ব্যর্থ হয়েছে!</p>`;
    }
}

// ২. ক্যাটাগরি লিস্ট রেন্ডার করা
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

// ৩. ক্যাটাগরিতে ক্লিক করলে তার ভেতরের চ্যানেলগুলো দেখানো
function openCategory(catId) {
    const selectedCategory = appData.find(c => c.id === catId);
    if (!selectedCategory) return;

    // হেডার টাইটেল ও ব্যাক বাটন আপডেট
    document.getElementById("headerTitle").innerText = selectedCategory.name;
    document.getElementById("backBtn").style.display = "block";

    // ভিউ সুইচিং
    document.getElementById("categoryList").style.display = "none";
    const channelContainer = document.getElementById("channelList");
    channelContainer.style.display = "grid";

    // চ্যানেল কার্ড তৈরি
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

// ৪. ক্যাটাগরি ভিউতে ফেরত যাওয়া (Back Button Click)
function showCategoriesView() {
    document.getElementById("headerTitle").innerText = "Categories";
    document.getElementById("backBtn").style.display = "none";

    document.getElementById("channelList").style.display = "none";
    document.getElementById("categoryList").style.display = "grid";
}

// ৫. চ্যানেলে ক্লিক করলে প্লে হওয়ার অ্যালার্ট/লজিক
function playStream(channelName, url) {
    alert(`অপেক্ষা করুন, ${channelName} প্লে হচ্ছে...\nStream URL: ${url}`);
}

// অ্যাপ স্টার্ট
document.addEventListener("DOMContentLoaded", loadAppData);
const GITHUB_JSON_URL = "https://raw.githubusercontent.com/mdmominulislam777/Khorkuto-tv/main/data.json";

let appData = [];
let hlsPlayer = null;

// ১. ডাটা ফেচ করা
async function loadAppData() {
    try {
        const response = await fetch(`${GITHUB_JSON_URL}?t=${Date.now()}`);
        const data = await response.json();
        
        appData = data.categories || [];

        document.getElementById("appLoader").style.display = "none";
        renderCategories();

    } catch (error) {
        console.error("ডাটা লোড হতে সমস্যা হয়েছে:", error);
        document.getElementById("appLoader").innerHTML = `<p style="color:#ef4444;">❌ ডাটা লোড করতে ব্যর্থ হয়েছে!</p>`;
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

// ৫. চ্যানেল প্লে করা (Live Stream Video Player)
function playStream(channelName, url) {
    if (!url || url === "YOUR_M3U8_LINK_HERE") {
        alert("এই চ্যানেলের স্ট্রিম লিংক এখনো যুক্ত করা হয়নি! data.json-এ আসল .m3u8 লিংক বসান।");
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
