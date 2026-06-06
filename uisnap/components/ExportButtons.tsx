import type { PromptExports } from "../lib/types"

type ExportButtonsProps = {
  prompts: PromptExports
  onCopy: (label: string, value: string) => void
}

const buttons = [
  ["Copy", "general"],
  ["Developer", "developer"],
  ["Next.js", "nextjs"],
  ["v0", "v0"],
  ["Cursor", "cursor"],
  ["JSON", "json"],
  ["Markdown", "markdown"]
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
          onClick={() => onCopy(label, prompts[key])}
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