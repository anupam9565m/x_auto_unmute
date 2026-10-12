const DEFAULTS = {
  enabled: true,
  clickSiteMuteButton: true
};

const enabledInput = document.getElementById("enabled");
const siteButtonInput = document.getElementById("siteButton");
const status = document.getElementById("status");

function render(settings) {
  enabledInput.checked = settings.enabled;
  siteButtonInput.checked = settings.clickSiteMuteButton;
  status.textContent = settings.enabled
    ? "Auto-unmute is enabled"
    : "Auto-unmute is disabled";
}

chrome.storage.sync.get(DEFAULTS, render);

async function save() {
  const settings = {
    enabled: enabledInput.checked,
    clickSiteMuteButton: siteButtonInput.checked
  };
  await chrome.storage.sync.set(settings);
  render(settings);
}

enabledInput.addEventListener("change", save);
siteButtonInput.addEventListener("change", save);