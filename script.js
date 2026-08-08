
  renderFeaturedChannels();

  document.querySelectorAll(".cat").forEach((x) => {
    const matches = targetBtn
      ? x === targetBtn
      : x.dataset.category === category;
    x.classList.toggle("active", matches);
  });

  renderChannels();
}

function setupBannerSlider() {
  const bannerImg = document.querySelector(".banner img");
  if (!bannerImg) return;

  const banners = ["banner1.jpg", "banner2.jpg", "banner3.jpg"];
  let i = 0;

  setInterval(() => {
    i = (i + 1) % banners.length;
    bannerImg.src = banners[i];
  }, 4000);
}

function setupTelegram() {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }
}
