(() => {
  "use strict";

  const DEFAULTS = {
    enabled: true,
    clickSiteMuteButton: true
  };

  let settings = { ...DEFAULTS };
  let observer = null;
  let scanQueued = false;
  const lastAttempt = new WeakMap();
  const RETRY_DELAY_MS = 1200;

  function isVideoVisible(video) {
    const rect = video.getBoundingClientRect();
    const style = getComputedStyle(video);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      rect.bottom > 0 &&
      rect.top < window.innerHeight
    );
  }

  function findMuteButton(video) {
    // X's markup changes over time. Prefer the nearest video container,
    // then search a small ancestor region for accessible mute controls.
    let node = video.parentElement;
    for (let depth = 0; node && depth < 8; depth++, node = node.parentElement) {
      const buttons = node.querySelectorAll('button, [role="button"]');
      for (const button of buttons) {
        const label = [
          button.getAttribute("aria-label"),
          button.getAttribute("title"),
          button.textContent
        ].filter(Boolean).join(" ").toLowerCase();

        // Only click controls that appear to mean "unmute" or "turn sound on".
        // Do not click controls currently labelled "Mute".
        const meansUnmute =
          /\bunmute\b/.test(label) ||
          /turn sound on/.test(label) ||
          /enable sound/.test(label) ||
          /sound on/.test(label);

        if (meansUnmute && !/\bmute\b/.test(label.replace(/\bunmute\b/g, ""))) {
          return button;
        }
      }
    }
    return null;
  }

  function attemptUnmute(video) {
    if (!settings.enabled || !video.isConnected || !isVideoVisible(video)) {
      return;
    }

    // Try the HTML media element first. This may work for native video state,
    // but X may keep its own UI state and overwrite it.
    if (video.muted) {
      video.muted = false;
      video.defaultMuted = false;
    }

    if (!video.muted) return;

    const now = Date.now();
    const previous = lastAttempt.get(video) || 0;
    if (now - previous < RETRY_DELAY_MS) return;
    lastAttempt.set(video, now);

    if (settings.clickSiteMuteButton) {
      const button = findMuteButton(video);
      if (button && !button.disabled) {
        button.click();
      }
    }
  }

  function scan(root = document) {
    if (!settings.enabled) return;

    if (root instanceof HTMLVideoElement) {
      attemptUnmute(root);
    }

    if (root.querySelectorAll) {
      root.querySelectorAll("video").forEach(attemptUnmute);
    }
  }

  function queueScan(root) {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(() => {
      scanQueued = false;
      scan(root || document);
    });
  }

  function startObserver() {
    if (observer || !document.body) return;

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            queueScan(node);
          }
        }
      }
      // X can update mute labels without adding a new video node.
      queueScan(document);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-label", "muted"]
    });

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    document.addEventListener("play", onMediaPlay, true);
    scan();
  }

  function onScrollOrResize() {
    queueScan(document);
  }

  function onMediaPlay(event) {
    if (event.target instanceof HTMLVideoElement) {
      attemptUnmute(event.target);
    }
  }

  function applySettings(next) {
    settings = { ...DEFAULTS, ...next };
    if (settings.enabled) {
      startObserver();
      queueScan(document);
    }
  }

  chrome.storage.sync.get(DEFAULTS, applySettings);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    const next = { ...settings };
    for (const key of Object.keys(DEFAULTS)) {
      if (changes[key]) next[key] = changes[key].newValue;
    }
    applySettings(next);
  });

  // Re-scan after X performs client-side navigation.
  window.addEventListener("popstate", () => setTimeout(() => queueScan(document), 300));
})();