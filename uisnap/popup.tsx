import { useState, useEffect } from "react"

import { ResultPanel } from "./components/ResultPanel"
import { ScanButton } from "./components/ScanButton"
import { FALLBACK_ANALYSIS } from "./lib/gemini"
import { DEFAULT_TOKENS } from "./lib/extract"
import type { PromptExports, ScanResult, ScanStatus, ScanHistoryItem, DesignTokens } from "./lib/types"

const EMPTY_PROMPTS: PromptExports = {
  v0: "",
  lovable: "",
  cursor: "",
  universal: "",
  colorPalette: ""
}

const EMPTY_RESULT: ScanResult = {
  screenshots: [],
  screenshotCount: 0,
  pageHeight: 0,
  scrollSteps: 0,
  tokens: DEFAULT_TOKENS,
  analysis: FALLBACK_ANALYSIS,
  prompts: EMPTY_PROMPTS
}

function IndexPopup() {
  const [activeTab, setActiveTab] = useState<"scan" | "history" | "settings">("scan")
  const [status, setStatus] = useState<ScanStatus>("idle")
  const [statusLabel, setStatusLabel] = useState("Ready to scan")
  const [error, setError] = useState("")
  const [result, setResult] = useState<ScanResult>(EMPTY_RESULT)
  const [copiedLabel, setCopiedLabel] = useState("")

  const [progressTokens, setProgressTokens] = useState<DesignTokens | null>(null)
  const [progressCount, setProgressCount] = useState(0)

  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [savedApiKey, setSavedApiKey] = useState(false)

  const canScan = status !== "capturing" && status !== "extracting" && status !== "analyzing"

  useEffect(() => {
    // Load history and settings
    chrome.storage.local.get(["uisnap_history", "gemini_api_key"], (res) => {
      if (res.uisnap_history) setHistory(res.uisnap_history)
      if (res.gemini_api_key) setSavedApiKey(true)
    })

    // Listen for progress messages
    const listener = (message: any) => {
      if (message.action === "scanProgress") {
        if (message.step === "extracting") {
          setStatusLabel("Extracting design tokens...")
        } else if (message.step === "capturing") {
          setStatusLabel(`Capturing screenshots (${message.data?.count || 0})...`)
          if (message.data?.count) setProgressCount(message.data.count)
          if (message.data?.tokens) setProgressTokens(message.data.tokens)
        } else if (message.step === "analyzing") {
          setStatusLabel("Analyzing with Gemini AI...")
          if (message.data?.tokens) setProgressTokens(message.data.tokens)
        }
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  async function handleScan() {
    setError("")
    setCopiedLabel("")
    setStatus("extracting")
    setStatusLabel("Starting scan...")
    setProgressTokens(null)
    setProgressCount(0)

    chrome.runtime.sendMessage({ action: "startScan" }, (response) => {
      if (chrome.runtime.lastError) {
        setStatus("error")
        setStatusLabel("Scan failed")
        setError(chrome.runtime.lastError.message)
        return
      }

      if (!response?.ok) {
        setStatus("error")
        setStatusLabel("Scan failed")
        setError(response?.error || "UISnap scan failed")
        return
      }

      setResult(response.result)
      setStatus("done")
      setStatusLabel("Scan complete")
      
      // Update history in background, just reload it here
      chrome.storage.local.get("uisnap_history", (res) => {
        if (res.uisnap_history) setHistory(res.uisnap_history)
      })
    })
  }

  async function handleCopy(label: string, value: string) {
    try {
      window.focus()
      await navigator.clipboard.writeText(value)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = value
      textarea.style.position = "fixed"
      textarea.style.left = "-9999px"
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand("copy")
      textarea.remove()
    }

    setCopiedLabel(`${label} copied`)
  }

  const promptPreview = result.prompts.universal
    ? `${result.prompts.universal.slice(0, 220)}${
        result.prompts.universal.length > 220 ? "..." : ""
      }`
    : "Run a scan to generate prompt formats."

  const currentPrompts =
    result.screenshotCount > 0 ? result.prompts : EMPTY_PROMPTS

  const handleSaveApiKey = () => {
    chrome.storage.local.set({ gemini_api_key: apiKeyInput }, () => {
      setSavedApiKey(true)
      setApiKeyInput("")
    })
  }

  const handleRemoveApiKey = () => {
    chrome.storage.local.remove("gemini_api_key", () => {
      setSavedApiKey(false)
    })
  }

  return (
    <div
      style={{
        width: 400,
        minHeight: 480,
        maxHeight: 600,
        overflowY: "auto",
        padding: 16,
        boxSizing: "border-box",
        color: "#E2E8F0",
        background:
          "radial-gradient(circle at top, rgba(251, 191, 36, 0.18), transparent 38%), linear-gradient(180deg, #020617 0%, #0F172A 100%)",
        fontFamily: "Aptos, Segoe UI, sans-serif"
      }}>
      <div
        style={{
          display: "grid",
          gap: 16,
          padding: 18,
          borderRadius: 24,
          background: "rgba(15, 23, 42, 0.78)",
          border: "1px solid rgba(148, 163, 184, 0.14)",
          boxShadow: "0 20px 40px rgba(2, 6, 23, 0.4)"
        }}>
        <header style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.8 }}>
            UISnap
          </div>
          <div style={{ color: "#94A3B8", fontSize: 13 }}>
            Reverse engineer any UI — free, no setup needed
          </div>
        </header>

        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid rgba(148, 163, 184, 0.14)", paddingBottom: 8 }}>
          {(["scan", "history", "settings"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                background: "transparent",
                border: "none",
                color: activeTab === t ? "#FBBF24" : "#94A3B8",
                fontWeight: activeTab === t ? 700 : 500,
                cursor: "pointer",
                padding: "4px 8px",
                textTransform: "capitalize"
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {activeTab === "scan" && (
          <>
            <ScanButton
              disabled={!canScan}
              statusText={canScan ? "Scan This Page" : "Scanning..."}
              onClick={handleScan}
            />

            <div style={{ fontSize: 12, color: "#94A3B8" }}>
              Status: {statusLabel}
            </div>
            
            {!canScan && progressTokens && (
              <div style={{ padding: 12, borderRadius: 14, background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", fontSize: 12 }}>
                <div style={{ color: "#CBD5E1", marginBottom: 6 }}>Live Preview:</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                  {[progressTokens.colors.primary, progressTokens.colors.secondary, progressTokens.colors.accent].map(c => (
                    <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c, border: "1px solid rgba(255,255,255,0.2)" }} />
                  ))}
                </div>
                <div style={{ color: "#94A3B8" }}>Screenshots captured: {progressCount}</div>
              </div>
            )}

            {error ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  background: "rgba(127, 29, 29, 0.4)",
                  border: "1px solid rgba(248, 113, 113, 0.24)",
                  color: "#FCA5A5",
                  fontSize: 12
                }}>
                {error}
              </div>
            ) : null}

            {status === "done" && result.tokens.isFallback && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  background: "rgba(202, 138, 4, 0.2)",
                  border: "1px solid rgba(250, 204, 21, 0.24)",
                  color: "#FDE047",
                  fontSize: 12
                }}>
                We had trouble reading this site's exact code. The AI will rely mostly on visual screenshots.
              </div>
            )}

            {copiedLabel ? (
              <div style={{ fontSize: 12, color: "#86EFAC" }}>{copiedLabel}</div>
            ) : null}

            {status === "done" && (
              <ResultPanel
                screenshotCount={result.screenshotCount}
                tokens={result.tokens}
                analysis={result.analysis}
                prompts={currentPrompts}
                onCopy={handleCopy}
                promptPreview={promptPreview}
              />
            )}
          </>
        )}

        {activeTab === "history" && (
          <div style={{ display: "grid", gap: 8 }}>
            {history.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94A3B8" }}>No scan history yet.</div>
            ) : (
              history.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setResult(item.result)
                    setStatus("done")
                    setStatusLabel("Loaded from history")
                    setActiveTab("scan")
                  }}
                  style={{
                    background: "rgba(15, 23, 42, 0.5)",
                    border: "1px solid rgba(148, 163, 184, 0.14)",
                    borderRadius: 12,
                    padding: 12,
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#E2E8F0"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.url}
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                    {new Date(item.timestamp).toLocaleString()} • {item.result.screenshotCount} screenshots
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#F8FAFC" }}>Gemini API Key</div>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>
              Bypass the proxy and use your own Gemini API key for scanning.
            </div>
            
            {savedApiKey ? (
              <div style={{ padding: 12, borderRadius: 12, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                <div style={{ color: "#34D399", fontSize: 13, marginBottom: 8 }}>✓ API Key is saved securely.</div>
                <button
                  onClick={handleRemoveApiKey}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(248, 113, 113, 0.4)",
                    color: "#FCA5A5",
                    padding: "6px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12
                  }}
                >
                  Remove API Key
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                <input
                  type="password"
                  placeholder="Enter Gemini API Key..."
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    background: "rgba(2, 6, 23, 0.5)",
                    color: "#F8FAFC",
                    fontSize: 13,
                    boxSizing: "border-box"
                  }}
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput}
                  style={{
                    background: apiKeyInput ? "rgba(251, 191, 36, 0.2)" : "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(251, 191, 36, 0.3)",
                    color: apiKeyInput ? "#FDE047" : "#94A3B8",
                    padding: "8px",
                    borderRadius: 8,
                    cursor: apiKeyInput ? "pointer" : "not-allowed",
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  Save API Key
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default IndexPopup
