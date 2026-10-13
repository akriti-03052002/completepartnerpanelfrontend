const RETRY_KEY = "spotx:page-update-retry";
const RETRY_WINDOW = 60_000;

export function isPageUpdateError(error) {
  const message = String(error?.message || error || "");
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk .* failed|ChunkLoadError|Unable to preload CSS/i.test(message);
}

// Retry a missing deployment asset once, without creating a refresh loop.
export function recoverPageUpdate(error, browser = globalThis.window, now = Date.now()) {
  if (!browser || !isPageUpdateError(error) || browser.navigator?.onLine === false) return false;
  try {
    const previous = Number(browser.sessionStorage.getItem(RETRY_KEY));
    if (previous && now - previous < RETRY_WINDOW) return false;
    browser.sessionStorage.setItem(RETRY_KEY, String(now));
  } catch {
    // Without persistent retry tracking, automatic reload could loop.
    return false;
  }
  browser.location.reload();
  return true;
}
