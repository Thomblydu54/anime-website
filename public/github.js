const OWNER = "Thomblydu54";
const REPO = "Anime";

function animateNumber(element, target, duration = 1200) {
  if (!element) return;

  const start = Number(element.textContent) || 0;
  const startTime = performance.now();

  function update(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);

    const value = Math.floor(start + (target - start) * progress);

    element.textContent = value.toLocaleString("fr-FR");

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

async function updateGitHub() {
  try {
    const [repoResponse, releaseResponse] = await Promise.all([
      fetch(`https://api.github.com/repos/${OWNER}/${REPO}`),
      fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`)
    ]);

    const repo = await repoResponse.json();
    const release = await releaseResponse.json();

    const downloads =
      release.assets?.reduce((t, a) => t + a.download_count, 0) ?? 0;

    animateNumber(document.getElementById("stars"), repo.stargazers_count);
    animateNumber(document.getElementById("forks"), repo.forks_count);
    animateNumber(document.getElementById("watchers"), repo.subscribers_count);
    animateNumber(document.getElementById("downloads"), downloads);

    const version = document.getElementById("version");
    if (version) version.textContent = release.tag_name;

    const date = document.getElementById("release-date");
    if (date) {
      date.textContent = new Date(release.published_at).toLocaleDateString("fr-FR");
    }

    const body = document.getElementById("release-body");
    if (body) {
      body.textContent = release.body;
    }
  } catch (err) {
    console.error("Erreur GitHub :", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateGitHub();
  setInterval(updateGitHub, 300000);
});