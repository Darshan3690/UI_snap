import { captureFullPage } from "./capture"
import { analyzeWithGemini, FALLBACK_ANALYSIS } from "./gemini"
import { buildPromptExports } from "./prompt-builder"
import { DEFAULT_TOKENS } from "./extract"
import type { DesignTokens, GeminiAnalysis, ScanResult } from "./types"

async function waitForTabComplete(tabId: number, timeout = 30000) {
  return new Promise<void>((resolve, reject) => {
    const onUpdated = (
      id: number,
      info: chrome.tabs.TabChangeInfo
    ) => {
      if (id !== tabId) return
      if (info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(onUpdated)
        resolve()
      }
    }

    chrome.tabs.onUpdated.addListener(onUpdated)

    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated)
      reject(new Error("Tab load timeout"))
    }, timeout)
  })
}

function normalizeOrigin(url: string) {
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.host}`
  } catch {
    return ""
  }
}

async function getPageLinks(tabId: number) {
  try {
    const resp = (await chrome.tabs.sendMessage(tabId, {
      action: "links"
    })) as { ok: true; links: string[] } | { ok: false; links: string[] }

    if (resp?.ok && Array.isArray(resp.links)) {
      return resp.links
    }
  } catch {
    // fall through to direct DOM extraction
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () =>
        Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
          .map((anchor) => anchor.href.split("#")[0])
          .filter(Boolean)
    })

    return (results[0]?.result as string[]) ?? []
  } catch {
    return []
  }
}

export interface CrawlOptions {
  maxPages?: number
  maxDepth?: number
  delayMs?: number
  skipQueryParams?: boolean
}

export async function crawlFromTab(
  startTabId: number,
  windowId: number,
  options: CrawlOptions = {}
): Promise<{ results: ScanResult[]; combinedPrompt: string }> {
  const { maxPages = 10, maxDepth = 2, delayMs = 1200, skipQueryParams = true } = options

  const startTab = await chrome.tabs.get(startTabId)
  if (!startTab.url) return { results: [], combinedPrompt: "" }

  const origin = normalizeOrigin(startTab.url)
  const visited = new Set<string>()
  const queue: Array<{ url: string; depth: number }> = [{ url: startTab.url, depth: 0 }]
  const results: ScanResult[] = []

  function normalizeForCompare(u: string) {
    try {
      const parsed = new URL(u)
      if (skipQueryParams) parsed.search = ""
      return parsed.toString()
    } catch {
      return u
    }
  }

  while (queue.length > 0 && results.length < maxPages) {
    const { url, depth } = queue.shift()!
    const cmp = normalizeForCompare(url)
    if (visited.has(cmp)) continue
    visited.add(cmp)

    // navigate active tab to the URL
    await chrome.tabs.update(startTabId, { url })
    try {
      await waitForTabComplete(startTabId)
    } catch {
      // continue even if timeout
    }

    // small delay to let content scripts initialize
    await new Promise((r) => setTimeout(r, 500))

    // extract tokens
    let tokens: DesignTokens | null = null
    try {
      const resp = (await chrome.tabs.sendMessage(startTabId, {
        action: "extract"
      })) as { ok: true; tokens: DesignTokens } | { ok: false; error: string }

      if (resp?.ok) tokens = resp.tokens
    } catch {
      tokens = null
    }

    // capture
    let captureResult
    try {
      captureResult = await captureFullPage(startTabId, windowId)
    } catch (e) {
      captureResult = { screenshots: [], screenshotCount: 0, pageHeight: 0, scrollSteps: 0 }
    }

    const apiKeyResp = await chrome.storage.local.get(["geminiApiKey"])
    const apiKey = (apiKeyResp.geminiApiKey as string | undefined) ?? ""

    const analysis: GeminiAnalysis = apiKey
      ? await analyzeWithGemini(apiKey, captureResult.screenshots, tokens ?? DEFAULT_TOKENS)
      : FALLBACK_ANALYSIS

    const baseResult: ScanResult = {
      screenshots: captureResult.screenshots.slice(0, 1),
      screenshotCount: captureResult.screenshotCount,
      pageHeight: captureResult.pageHeight,
      scrollSteps: captureResult.scrollSteps,
      tokens: tokens ?? ({} as DesignTokens),
      analysis,
      prompts: {
        v0: "",
        lovable: "",
        cursor: "",
        universal: "",
        colorPalette: ""
      }
    }

    baseResult.prompts = buildPromptExports(baseResult)
    results.push(baseResult)

    // gather links from page
    try {
      const links = await getPageLinks(startTabId)

      for (const l of links) {
        if (normalizeOrigin(l) !== origin) continue
        const normalized = normalizeForCompare(l)
        if (visited.has(normalized)) continue
        const already = queue.find((q) => normalizeForCompare(q.url) === normalized)
        if (already) continue
        if (depth + 1 <= maxDepth) queue.push({ url: l, depth: depth + 1 })
      }
    } catch {
      // ignore
    }

    // politeness delay
    await new Promise((r) => setTimeout(r, delayMs))
  }

  const combinedPrompt = results.map((r) => r.prompts.universal).filter(Boolean).join("\n\n---\n\n")
  return { results, combinedPrompt }
}

export default crawlFromTab
