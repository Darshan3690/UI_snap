import type { PromptExports } from "../lib/types"

type ExportButtonsProps = {
  prompts: PromptExports
  onCopy: (label: string, value: string) => Promise<void>
}

const buttons = [
  ["V0 Prompt", "v0"],
  ["Lovable Prompt", "lovable"],
  ["Cursor Prompt", "cursor"],
  ["Universal Prompt", "universal"],
  ["Color Palette", "colorPalette"]
] as const

export function ExportButtons({ prompts, onCopy }: ExportButtonsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 8
      }}>
      {buttons.map(([label, key]) => (
        <button
          key={label}
          onClick={async () => {
            await onCopy(label, prompts[key])
            if (key === "v0") window.open("https://v0.dev/chat", "_blank")
            if (key === "lovable") window.open("https://lovable.dev/", "_blank")
          }}
          style={{
            border: "1px solid rgba(148, 163, 184, 0.18)",
            borderRadius: 12,
            background: "rgba(15, 23, 42, 0.6)",
            color: "#E2E8F0",
            padding: "10px 12px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600
          }}>
          {label}
        </button>
      ))}
    </div>
  )
}
