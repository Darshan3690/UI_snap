import { captureFullPage } from "./lib/capture"
import { FALLBACK_ANALYSIS, analyzeWithGemini } from "./lib/gemini"
import { buildPromptExports } from "./lib/prompt-builder"
import { DEFAULT_TOKENS } from "./lib/extract"
import type { DesignTokens, GeminiAnalysis, ScanResult, ScanHistoryItem } from "./lib/types"
import { crawlFromTab } from "./lib/crawler"

type ExtractResponse =
  | { ok: true; tokens: DesignTokens }
  | { ok: false; error: string }

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id || !tab.windowId) {
    throw new Error("No active tab found")
  }

  return tab
}

async function extractTokens(tabId: number) {
  try {
    chrome.runtime.sendMessage({ action: "scanProgress", step: "extracting" }).catch(() => {})
    const response = (await chrome.tabs.sendMessage(tabId, {
      action: "extract"
    })) as ExtractResponse

    if (!response?.ok) {
      return { ...DEFAULT_TOKENS, isFallback: true }
    }

    return response.tokens
  } catch {
    return { ...DEFAULT_TOKENS, isFallback: true }
  }
}

async function runScan(): Promise<ScanResult> {
  const tab = await getActiveTab()
  const tokens = await extractTokens(tab.id)
  chrome.runtime.sendMessage({ action: "scanProgress", step: "analyzing", data: { tokens } }).catch(() => {})
  
  const captureResult = await captureFullPage(tab.id, tab.windowId, (count) => {
    chrome.runtime.sendMessage({ action: "scanProgress", step: "capturing", data: { count, tokens } }).catch(() => {})
  })

  // API key is now handled server-side in the Cloudflare Worker proxy
  const analysis: GeminiAnalysis = await analyzeWithGemini(
    captureResult.screenshots,
    tokens
  )

  const baseResult: ScanResult = {
    screenshots: captureResult.screenshots.slice(0, 1),
    screenshotCount: captureResult.screenshots.length,
    pageHeight: captureResult.pageHeight,
    scrollSteps: captureResult.scrollSteps,
    tokens,
    analysis,
    prompts: {
      v0: "",
      lovable: "",
      cursor: "",
      universal: "",
      colorPalette: ""
    }
  }

  const prompts = buildPromptExports(baseResult)

  return {
    ...baseResult,
    prompts
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action !== "startScan") {
    return false
  }

  void (async () => {
    try {
      const result = await runScan()

      await chrome.storage.session.set({
        uisnapLastScan: {
          screenshotCount: result.screenshotCount,
          pageHeight: result.pageHeight,
          scrollSteps: result.scrollSteps,
          tokens: result.tokens,
          analysis: result.analysis,
          prompts: result.prompts
        }
      })

      try {
        const tab = await getActiveTab()
        const historyRes = await chrome.storage.local.get("uisnap_history")
        let history: ScanHistoryItem[] = Array.isArray(historyRes.uisnap_history) ? historyRes.uisnap_history : []
        
        history.unshift({
          id: Date.now().toString(),
          url: tab.url || "Unknown URL",
          timestamp: Date.now(),
          result
        })
        
        history = history.slice(0, 10)
        await chrome.storage.local.set({ uisnap_history: history })
      } catch (e) {
        console.error("Failed to save history", e)
      }

      sendResponse({ ok: true, result })
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "UISnap scan failed"
      sendResponse({ ok: false, error: messageText })
    }
  })()

  return true
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action !== "startCrawl") {
    return false
  }

  void (async () => {
    try {
      const tab = await getActiveTab()
      const options = {
        maxPages: typeof message.maxPages === "number" ? message.maxPages : 8,
        maxDepth: typeof message.maxDepth === "number" ? message.maxDepth : 2,
        delayMs: typeof message.delayMs === "number" ? message.delayMs : 1200,
        skipQueryParams: typeof message.skipQueryParams === "boolean" ? message.skipQueryParams : true
      }

      const { results, combinedPrompt } = await crawlFromTab(tab.id, tab.windowId, options)

      await chrome.storage.session.set({ uisnapLastCrawl: { pageCount: results.length, combinedPrompt } })

      sendResponse({ ok: true, pages: results, combinedPrompt })
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "UISnap crawl failed"
      sendResponse({ ok: false, error: messageText })
    }
  })()

  return true
})
