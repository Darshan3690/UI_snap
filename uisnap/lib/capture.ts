const CAPTURE_DELAY_MS = 800
const MAX_SCREENSHOTS = 12

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getTabMetrics(tabId: number) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const doc = document.documentElement

      return {
        pageHeight: Math.max(
          doc.scrollHeight,
          document.body?.scrollHeight ?? 0,
          doc.offsetHeight,
          document.body?.offsetHeight ?? 0
        ),
        viewportHeight: window.innerHeight || doc.clientHeight || 800
      }
    }
  })

  return results[0]?.result ?? { pageHeight: 0, viewportHeight: 800 }
}

async function scrollPage(tabId: number, position: number) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: "scroll",
      position
    })
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (scrollPosition: number) => {
        window.scrollTo({
          top: scrollPosition,
          behavior: "instant" as ScrollBehavior
        })
      },
      args: [position]
    })
  }
}

export async function captureFullPage(tabId: number, windowId: number) {
  const { pageHeight, viewportHeight } = await getTabMetrics(tabId)
  const screenshots: string[] = []
  const seenPrefixes = new Set<string>()

  for (
    let position = 0;
    position < pageHeight && screenshots.length < MAX_SCREENSHOTS;
    position += viewportHeight
  ) {
    await scrollPage(tabId, position)
    await sleep(CAPTURE_DELAY_MS)

    let image: string | undefined = undefined
    let attempts = 0
    const maxAttempts = 4

    while (attempts < maxAttempts) {
      try {
        image = await chrome.tabs.captureVisibleTab(windowId, { format: "png" })
        break
      } catch (err: any) {
        const msg = String(err)

        if (msg.includes("MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND")) {
          // Exponential backoff when the capture quota is exceeded
          const backoff = CAPTURE_DELAY_MS * (attempts + 1)
          await sleep(backoff)
          attempts++
          continue
        }

        // Unexpected error — rethrow so the caller can handle it
        throw err
      }
    }

    if (!image) {
      // Could not capture after retries — skip this step and continue
      continue
    }

    const prefix = image.slice(0, 100)

    if (seenPrefixes.has(prefix)) {
      continue
    }

    seenPrefixes.add(prefix)
    screenshots.push(image)
  }

  return {
    screenshots,
    pageHeight,
    scrollSteps: screenshots.length
  }
}