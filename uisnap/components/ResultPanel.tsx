import { ExportButtons } from "./ExportButtons"
import type { DesignTokens, GeminiAnalysis, PromptExports } from "../lib/types"

type ResultPanelProps = {
  screenshotCount: number
  tokens: DesignTokens
  analysis: GeminiAnalysis
  prompts: PromptExports
  onCopy: (label: string, value: string) => void
  promptPreview: string
}

function colorChip(value: string) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(148, 163, 184, 0.18)",
        background: "rgba(15, 23, 42, 0.45)",
        fontSize: 12
      }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: value,
          border: "1px solid rgba(255,255,255,0.2)"
        }}
      />
      {value}
    </span>
  )
}

export function ResultPanel({
  screenshotCount,
  tokens,
  analysis,
  prompts,
  onCopy,
  promptPreview
}: ResultPanelProps) {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        padding: 16,
        borderRadius: 20,
        background: "rgba(15, 23, 42, 0.72)",
        border: "1px solid rgba(148, 163, 184, 0.12)"
      }}>
      <div>
        <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 8 }}>
          Captured {screenshotCount} screenshots
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12
          }}>
          {[
            tokens.colors.primary,
            tokens.colors.secondary,
            tokens.colors.accent,
            tokens.colors.background,
            tokens.colors.text
          ].map((color, index) => (
            <div key={`${color}-${index}`}>{colorChip(color)}</div>
          ))}
        </div>
        <div style={{ display: "grid", gap: 8, fontSize: 12, color: "#CBD5E1" }}>
          <div>Heading font: {tokens.typography.headingFont}</div>
          <div>Body font: {tokens.typography.bodyFont}</div>
          <div>Border radius: {tokens.borderRadius}</div>
          <div>Components: {tokens.components.join(", ") || "None"}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 12, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8 }}>
          Analysis
        </div>
        <div style={{ fontSize: 13, color: "#E2E8F0", lineHeight: 1.55 }}>
          {analysis.designStyle} · {analysis.layoutStyle} · {analysis.navigationStyle}
        </div>
        <div style={{ fontSize: 12, color: "#CBD5E1" }}>
          Sections: {analysis.sections.join(", ") || "None"}
        </div>
        <div style={{ fontSize: 12, color: "#CBD5E1" }}>
          Patterns: {analysis.uniquePatterns.join(", ") || "None"}
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 12, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8 }}>
          Prompt preview
        </div>
        <div
          style={{
            padding: 12,
            borderRadius: 14,
            background: "rgba(2, 6, 23, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.12)",
            fontSize: 12,
            color: "#E2E8F0",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap"
          }}>
          {promptPreview}
        </div>
      </div>

      <ExportButtons prompts={prompts} onCopy={onCopy} />
    </div>
  )
}
