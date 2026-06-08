import { useState } from "react"

import { ResultPanel } from "./components/ResultPanel"
import { ScanButton } from "./components/ScanButton"
import { FALLBACK_ANALYSIS } from "./lib/gemini"
import { DEFAULT_TOKENS } from "./lib/extract"
import type { PromptExports, ScanResult, ScanStatus } from "./lib/types"

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
  const [status, setStatus] = useState<ScanStatus>("idle")
  const [statusLabel, setStatusLabel] = useState("Ready to scan")
  const [apiKey, setApiKey] = useState("")
  const [error, setError] = useState("")
  const [result, setResult] = useState<ScanResult>(EMPTY_RESULT)
  const [copiedLabel, setCopiedLabel] = useState("")

  const canScan = status !== "capturing" && status !== "extracting" && status !== "analyzing"

  async function saveApiKey() {
    await chrome.storage.local.set({ geminiApiKey: apiKey.trim() })
    setStatusLabel("API key saved")
  }

  async function handleScan() {
    setError("")
    setCopiedLabel("")
    setStatus("capturing")
    setStatusLabel("Scanning page...")

    await chrome.storage.local.set({ geminiApiKey: apiKey.trim() })

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

  return (
    <div
      style={{
        width: 400,
        minHeight: 520,
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
            Reverse engineer any UI
          </div>
        </header>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#94A3B8" }}>
            Gemini API key
          </label>
          <input
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Enter your Gemini API key"
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 12,
              border: "1px solid rgba(148, 163, 184, 0.18)",
              background: "rgba(2, 6, 23, 0.7)",
              color: "#E2E8F0",
              padding: "12px 14px",
              outline: "none"
            }}
          />
          <button
            onClick={saveApiKey}
            style={{
              border: "1px solid rgba(148, 163, 184, 0.18)",
              borderRadius: 12,
              padding: "10px 12px",
              cursor: "pointer",
              background: "rgba(30, 41, 59, 0.9)",
              color: "#E2E8F0",
              fontWeight: 600
            }}>
            Save API key
          </button>
        </div>

        <ScanButton
          disabled={!canScan}
          statusText="Scan This Page"
          onClick={handleScan}
        />

        <div style={{ fontSize: 12, color: "#94A3B8" }}>
          Status: {statusLabel}
        </div>

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

        {copiedLabel ? (
          <div style={{ fontSize: 12, color: "#86EFAC" }}>{copiedLabel}</div>
        ) : null}

        <ResultPanel
          screenshotCount={result.screenshotCount}
          tokens={result.tokens}
          analysis={result.analysis}
          prompts={currentPrompts}
          onCopy={handleCopy}
          promptPreview={promptPreview}
        />
      </div>
    </div>
  )
}

export default IndexPopup

