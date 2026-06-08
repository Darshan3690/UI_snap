const CAPTURE_DELAY_MS = 500
const MAX_SCROLL_STEPS = 150

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getTabMetrics(tabId: number) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const doc = document.documentElement
      const body = document.body
      const pageHeight = Math.max(
        body?.scrollHeight ?? 0,
        doc.scrollHeight
      )
      const viewportHeight = window.innerHeight || doc.clientHeight || 800

      return {
        isBottom:
          window.innerHeight + window.scrollY >=
          pageHeight - 50,
        pageHeight,
        scrollY: window.scrollY,
        viewportHeight
      }
    }
  })

  return results[0]?.result ?? {
    isBottom: true,
    pageHeight: 0,
    scrollY: 0,
    viewportHeight: 800
  }
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

function hashString(value: string) {
  let hash = 5381

  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }

  return String(hash >>> 0)
}

async function captureVisible(windowId: number) {
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
        const backoff = CAPTURE_DELAY_MS * (attempts + 1)
        await sleep(backoff)
        attempts++
        continue
      }

      throw err
    }
  }

  return image
}

async function captureUnique(
  windowId: number,
  screenshots: string[],
  seenHashes: Set<string>
) {
  const image = await captureVisible(windowId)

  if (!image) return false

  const hash = hashString(image)

  if (seenHashes.has(hash)) {
    return false
  }

  seenHashes.add(hash)
  screenshots.push(image)
  return true
}

export async function captureFullPage(tabId: number, windowId: number) {
  let { pageHeight, viewportHeight } = await getTabMetrics(tabId)
  const screenshots: string[] = []
  const seenHashes = new Set<string>()
  let currentY = 0
  let reachedBottom = false
  let scrollSteps = 0

  await scrollPage(tabId, 0)
  await sleep(CAPTURE_DELAY_MS)

  while (currentY < pageHeight && scrollSteps < MAX_SCROLL_STEPS) {
    await scrollPage(tabId, currentY)
    await sleep(CAPTURE_DELAY_MS)

    await captureUnique(windowId, screenshots, seenHashes)
    scrollSteps++

    const metrics = await getTabMetrics(tabId)
    pageHeight = metrics.pageHeight
    viewportHeight = metrics.viewportHeight

    if (metrics.isBottom) {
      reachedBottom = true
      break
    }

    const bottomY = Math.max(pageHeight - viewportHeight, 0)
    const nextY = Math.min(currentY + viewportHeight, bottomY)

    if (nextY <= currentY) {
      break
    }

    currentY = nextY
  }

  if (!reachedBottom) {
    const metrics = await getTabMetrics(tabId)
    pageHeight = metrics.pageHeight
    viewportHeight = metrics.viewportHeight
    currentY = Math.max(pageHeight - viewportHeight, 0)

    await scrollPage(tabId, currentY)
    await sleep(CAPTURE_DELAY_MS)
    await captureUnique(windowId, screenshots, seenHashes)
    scrollSteps++
  }

  return {
    screenshots,
    screenshotCount: screenshots.length,
    pageHeight,
    scrollSteps
  }
}
