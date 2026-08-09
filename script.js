// ১. খেলার ডেটাবেজ (ডাটা পরিবর্তন করলে এখানে করবেন)
const matchesDatabase = [
  {
    id: 1,
    sport: "Cricket",
    league: "The Hundred Women",
    team1: "Sunrisers Leeds",
    team2: "Welsh Fire",
    team1_logo: "https://via.placeholder.com/40",
    team2_logo: "https://via.placeholder.com/40",
    startTime: "2026-08-09T16:00:00"
  },
  {
    id: 2,
    sport: "Cricket",
    league: "ICC CWC League 2",
    team1: "Scotland",
    team2: "UAE",
    team1_logo: "https://via.placeholder.com/40",
    team2_logo: "https://via.placeholder.com/40",
    startTime: "2026-08-09T18:30:00"
  },
  {
    id: 3,
    sport: "Football",
    league: "Club Friendly Games",
    team1: "Manchester City",
    team2: "Atlético Madrid",
    team1_logo: "https://via.placeholder.com/40",
    team2_logo: "https://via.placeholder.com/40",
    startTime: "2026-08-09T15:00:00"
  },
  {
    id: 4,
    sport: "Football",
    league: "2. Bundesliga",
    team1: "Energie Cottbus",
    team2: "Hannover 96",
    team1_logo: "https://via.placeholder.com/40",
    team2_logo: "https://via.placeholder.com/40",
    startTime: "2026-08-10T17:30:00"
  },
  {
    id: 5,
    sport: "Tennis",
    league: "Grand Slam",
    team1: "Nadal",
    team2: "Djokovic",
    team1_logo: "https://via.placeholder.com/40",
    team2_logo: "https://via.placeholder.com/40",
    startTime: "2026-08-08T14:00:00"
  }
];

let currentSport = "All";
let currentStatus = "All";

// ২. অটোমেটিক তারিখ ও সময় প্রসেসিং লজিক
function getMatchStatus(startTimeStr) {
  const now = new Date();
  const matchTime = new Date(startTimeStr);
  const diffMs = matchTime - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  // লাইভ ম্যাচ
  if (diffHours <= 0 && diffHours >= -2) {
    return { status: "LIVE", text: "● LIVE", isLive: true };
  } 
  // শেষ হওয়া ম্যাচ
  else if (diffHours < -2) {
    return { status: "Finished", text: "Finished", isLive: false };
  } 
  // আগামীকালের/আসন্ন ম্যাচ
  else {
    const hoursLeft = Math.floor(diffHours);
    const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    let timeText = hoursLeft > 0 ? `Starts in ${hoursLeft}h ${minsLeft}m` : `Starts in ${minsLeft}m`;
    return { status: "Upcoming", text: timeText, isLive: false };
  }
}

// ৩. রেন্ডার ফাংশন
function renderApp() {
  const eventsContainer = document.getElementById("eventsList");
  eventsContainer.innerHTML = "";

  // ফিল্টারিং
  let filtered = matchesDatabase.filter(m => {
    const matchInfo = getMatchStatus(m.startTime);
    const sportMatch = (currentSport === "All" || m.sport === currentSport);
    
    let statusMatch = true;
    if (currentStatus === "Live") statusMatch = matchInfo.status === "LIVE";
    if (currentStatus === "Upcoming") statusMatch = matchInfo.status === "Upcoming";
    if (currentStatus === "Finished") statusMatch = matchInfo.status === "Finished";

    return sportMatch && statusMatch;
  });

  if(filtered.length === 0) {
    eventsContainer.innerHTML = `<div style="text-align:center; padding: 20px; color:#64748b;">কোনো খেলা পাওয়া যায়নি</div>`;
    return;
  }

  filtered.forEach(m => {
    const matchInfo = getMatchStatus(m.startTime);
    const matchDateObj = new Date(m.startTime);
    
    const formattedTime = matchDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = matchDateObj.toLocaleDateString('en-GB');

    const card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML = `
      <div class="card-header-badge">${m.sport} || ${m.league}</div>
      <div class="card-content">
        <div class="team">
          <img class="team-logo" src="${m.team1_logo}" alt="Logo">
          <span class="team-name">${m.team1}</span>
        </div>
        <div class="match-info">
          <span class="match-time">${formattedTime}</span>
          <span class="match-date">${formattedDate}</span>
          <span class="match-status ${matchInfo.isLive ? 'status-live' : ''}">${matchInfo.text}</span>
        </div>
        <div class="team">
          <img class="team-logo" src="${m.team2_logo}" alt="Logo">
          <span class="team-name">${m.team2}</span>
        </div>
      </div>
    `;
    eventsContainer.appendChild(card);
  });

  renderFilters();
}

// ৪. ফিল্টার বাটন লোড
function renderFilters() {
  const sportsList = [
    { name: "All", icon: "🌐" },
    { name: "Football", icon: "⚽" },
    { name: "Cricket", icon: "🏏" },
    { name: "Tennis", icon: "🎾" }
  ];

  const carousel = document.getElementById("sportCategories");
  carousel.innerHTML = sportsList.map(s => {
    const count = s.name === "All" ? matchesDatabase.length : matchesDatabase.filter(m => m.sport === s.name).length;
    return `
      <div class="sport-item ${currentSport === s.name ? 'active' : ''}" onclick="setSport('${s.name}')">
        <div class="icon-wrapper">${s.icon} <span class="badge">${count}</span></div>
        <span>${s.name}</span>
      </div>
    `;
  }).join('');

  const statuses = ["All", "Live", "Upcoming", "Finished"];
  const statusPills = document.getElementById("statusPills");
  statusPills.innerHTML = statuses.map(st => {
    return `<button class="pill ${currentStatus === st ? 'active' : ''}" onclick="setStatus('${st}')">${st}</button>`;
  }).join('');
}

function setSport(sport) {
  currentSport = sport;
  renderApp();
}

function setStatus(status) {
  currentStatus = status;
  renderApp();
}

// প্রতি ৬০ সেকেণ্ডে রিফ্রেশ
setInterval(renderApp, 60000);

// প্রথমবার চালুর জন্য
renderApp();
