const GITHUB_JSON_URL = "https://raw.githubusercontent.com/mdmominulislam777/Khorkuto-tv/main/data.json";

let appData = [];
let hlsPlayer = null;

// ১. ডাটা ফেচ করা
async function loadAppData() {
    const splashScreen = document.getElementById("splashScreen");

    try {
        const response = await fetch(`${GITHUB_JSON_URL}?t=${Date.now()}`);
        
        if (!response.ok) {
            throw new Error(`Server Response Error (${response.status})`);
        }
        
        const data = await response.json();
        appData = data.categories || [];

        // ক্যাটাগরি রেন্ডার করা
        renderCategories();

    } catch (error) {
        console.error("ডাটা লোড সমস্যা:", error);
        alert("ডাটা লোড করতে সমস্যা হয়েছে! দয়া করে পেজটি রিফ্রেশ দিন।");
    } finally {
        // ডাটা আসুক বা না আসুক — লোডিং পেজ অবশ্যই সরে যাবে
        if (splashScreen) {
            splashScreen.style.opacity = "0";
            splashScreen.style.transition = "opacity 0.5s ease";
            
            setTimeout(() => {
                splashScreen.style.display = "none";
            }, 500);
        }
    }
}

// ২. ক্যাটাগরি দেখানো
function renderCategories() {
    const categoryContainer = document.getElementById("categoryList");
    if (!categoryContainer) return;

    if (appData.length === 0) {
        categoryContainer.innerHTML = `<p style="text-align:center; padding:20px; color:#94a3b8;">কোনো ক্যাটাগরি পাওয়া যায়নি!</p>`;
        return;
    }

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

// ৪. ব্যাক বাটন (ক্যাটাগরি ভিউতে ফিরে যাওয়া)
function showCategoriesView() {
    document.getElementById("headerTitle").innerText = "Categories";
    document.getElementById("backBtn").style.display = "none";

    document.getElementById("channelList").style.display = "none";
    document.getElementById("categoryList").style.display = "grid";
}

// ৫. প্লেয়ার চালু করা
function playStream(channelName, url) {
    if (!url || url.includes("YOUR_M3U8_LINK")) {
        alert("এই চ্যানেলের লাইভ লিংক যুক্ত করা হয়নি!");
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
        alert("আপনার ব্রাউজারে HLS সাপোর্ট করে না।");
    }
}

// ৬. প্লেয়ার বন্ধ করা
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

// অ্যাপ স্টার্ট
document.addEventListener("DOMContentLoaded", loadAppData);
