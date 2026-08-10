// ==========================================
// Khorkuto TV - Final Consolidated Script
// ==========================================

// --- Global State ---
let channels = [];
let currentCategory = "All";
let isSpecialView = false;
let hls = null;

// --- DOM References ---
let channelList, featuredList, featuredSection, video, search;

document.addEventListener("DOMContentLoaded", () => {
    channelList = document.getElementById("channelList");
    featuredList = document.getElementById("featuredList");
    featuredSection = document.getElementById("featuredSection");
    video = document.getElementById("video");
    search = document.getElementById("search");

    initApp();
});

function initApp() {
    setupEventListeners();
    loadChannels();
    setupBannerSlider();
    setupTelegram();
    hideSplash();
}

// ------------------------------------------
// 1. Load Channels & Auto Restore
// ------------------------------------------
async function loadChannels() {
    if (!channelList) return;

    channelList.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-muted);">
            ⏳ চ্যানেল লোড হচ্ছে...
        </div>`;

    try {
        // Cache breaking timestamp query appended
        const response = await fetch("channels.json?t=" + Date.now());

        if (!response.ok) throw new Error("Failed to load channels");

        const data = await response.json();
        channels = Array.isArray(data) ? data : (data.channels || []);

        renderFeaturedChannels();
        renderChannels();

        // Auto load last played channel
        loadLastChannel();

    } catch (err) {
        console.error(err);
        channelList.innerHTML = `
            <div style="text-align:center; padding:30px; color:#ef4444;">
                ❌ channels.json ফাইল লোড করা সম্ভব হয়নি।
            </div>`;
    }
}

function loadLastChannel() {
    const lastChannelData = localStorage.getItem("lastChannel");
    if (!lastChannelData || !video) return;

    try {
        const channel = JSON.parse(lastChannelData);
        if (channel && channel.url) {
            playChannel(channel, false);
        }
    } catch (err) {
        console.warn("Could not load last channel:", err);
    }
}

// ------------------------------------------
// 2. Render Featured Channels
// ------------------------------------------
function renderFeaturedChannels() {
    if (!featuredList || !featuredSection) return;

    const featured = channels.filter(c => c.featured === true);

    if (featured.length === 0) {
        featuredSection.style.display = "none";
        return;
    }

    featuredSection.style.display = "block";
    featuredList.innerHTML = "";

    featured.forEach(channel => {
        const card = document.createElement("div");
        card.className = "featured-card";
        card.innerHTML = `
            <img src="${channel.logo || 'logo.png'}" onerror="this.onerror=null; this.src='logo.png';">
            <h4>${channel.name || 'Unknown'}</h4>
            <p>${channel.category || 'General'}</p>
        `;

        card.onclick = () => playChannel(channel, true);
        featuredList.appendChild(card);
    });
}

// ------------------------------------------
// 3. Render Main Channel List
// ------------------------------------------
function renderChannels(list = channels) {
    if (!channelList) return;

    channelList.innerHTML = "";
    const keyword = search ? search.value.toLowerCase().trim() : "";

    const filtered = list.filter(channel => {
        const nameMatch = (channel.name || "").toLowerCase().includes(keyword);
       
