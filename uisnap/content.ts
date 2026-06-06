import { extractDesignTokens } from "./lib/extract"

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === "scroll") {
    window.scrollTo({
      top: message.position,
      behavior: "instant"
    })
    sendResponse({ ok: true })
    return false
  }

  if (message?.action === "extract") {
    try {
      const tokens = extractDesignTokens()
      sendResponse({ ok: true, tokens })
    } catch (error) {
      sendResponse({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to extract design tokens"
      })
    }

    return false
  }

  if (message?.action === "links") {
    try {
      const anchors = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[]
      const hrefs = anchors
        .map((a) => a.href)
        .filter(Boolean)
        .map((h) => h.split("#")[0])
      sendResponse({ ok: true, links: Array.from(new Set(hrefs)) })
    } catch (error) {
      sendResponse({ ok: false, links: [] })
    }

    return false
  }

  if (message?.action === "getPageHeight") {
    sendResponse({
      ok: true,
      pageHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight
    })
    return false
  }

  return false
})