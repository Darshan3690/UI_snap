import { DesignTokens, GeminiAnalysis, PromptExports, ScanResult } from "./types"

function isKnown(value: string) {
  const normalized = value.trim().toLowerCase()
  return normalized !== "" && normalized !== "unknown" && normalized !== "none detected"
}

function formatList(values: string[]) {
  const filtered = values.map((value) => value.trim()).filter(Boolean)
  return filtered.length > 0 ? filtered.join(", ") : ""
}

function formatLine(label: string, value: string) {
  return isKnown(value) ? `${label}: ${value}` : ""
}

function hasEnoughSignal(tokens: DesignTokens, analysis: GeminiAnalysis) {
  const tokenSignals = [
    tokens.colors.primary,
    tokens.colors.secondary,
    tokens.colors.background,
    tokens.typography.headingFont,
    tokens.typography.bodyFont,
    tokens.borderRadius
  ].filter(isKnown).length

  const analysisSignals = [
    analysis.layoutStyle,
    analysis.navigationStyle,
    analysis.designStyle,
    analysis.colorMood,
    ...analysis.sections,
    ...analysis.keyComponents,
    ...analysis.uniquePatterns
  ].filter(isKnown).length

  return tokenSignals >= 4 || analysisSignals >= 3
}

function buildGeneralPrompt(tokens: DesignTokens, analysis: GeminiAnalysis) {
  const intro = hasEnoughSignal(tokens, analysis)
    ? "Recreate the original website UI/UX as closely as possible in a production-ready implementation."
    : "Recreate the overall look and feel of the original website UI/UX using a high-level design interpretation."

  const lines = [
    intro,
    "Match the structure, spacing, typography, colors, visual hierarchy, and component behavior.",
    "Use the provided design tokens as the primary source of truth and fill only the missing details with sensible defaults.",
    formatLine("Primary color", tokens.colors.primary),
    formatLine("Secondary color", tokens.colors.secondary),
    formatLine("Background color", tokens.colors.background),
    formatLine("Accent color", tokens.colors.accent),
    formatLine("Heading font", tokens.typography.headingFont),
    formatLine("Body font", tokens.typography.bodyFont),
    formatLine("Hero heading size", tokens.typography.headingSizes[0] || tokens.typography.bodySize),
    formatLine("Border radius", tokens.borderRadius),
    formatLine("Layout style", analysis.layoutStyle),
    formatLine("Navigation style", analysis.navigationStyle),
    formatLine("Design style", analysis.designStyle),
    formatLine("Color mood", analysis.colorMood),
    analysis.sections.length > 0 ? `Sections: ${formatList(analysis.sections)}` : "",
    analysis.keyComponents.length > 0 ? `Key components: ${formatList(analysis.keyComponents)}` : "",
    analysis.uniquePatterns.length > 0 ? `Special patterns: ${formatList(analysis.uniquePatterns)}` : "",
    "Build it as a clean, polished, responsive UI that a developer can use as a close starting point for the original site."
  ]

  return lines.filter(Boolean).join("\n")
}

function buildDeveloperPrompt(tokens: DesignTokens, analysis: GeminiAnalysis) {
  const designQuality = hasEnoughSignal(tokens, analysis)
    ? "Match the source UI as closely as possible while keeping the result modern, responsive, and production-ready."
    : "Use the available visual tokens and make a high-level but faithful UI/UX reconstruction of the source site."

  const sections = analysis.sections.length > 0 ? formatList(analysis.sections) : "Infer from the screenshots and keep the structure minimal and clear."
  const keyComponents = analysis.keyComponents.length > 0 ? formatList(analysis.keyComponents) : "Infer the most important UI blocks from the page."
  const specialPatterns = analysis.uniquePatterns.length > 0 ? formatList(analysis.uniquePatterns) : "None detected"
  const layout = isKnown(analysis.layoutStyle) ? analysis.layoutStyle : "Unknown"
  const navigation = isKnown(analysis.navigationStyle) ? analysis.navigationStyle : "Unknown"
  const designStyle = isKnown(analysis.designStyle) ? analysis.designStyle : "Unknown"
  const colorMood = isKnown(analysis.colorMood) ? analysis.colorMood : "Neutral"
  const heroHeading = tokens.typography.headingSizes[0] || tokens.typography.bodySize
  const sectionHeading = tokens.typography.headingSizes[1] || tokens.typography.bodySize

  const pageStructure = [
    "## Page Structure (top to bottom)",
    `- Layout: ${layout}`,
    `- Navigation: ${navigation}`,
    `- Design style: ${designStyle}`,
    `- Color mood: ${colorMood}`,
    `- Sections: ${sections}`,
    `- Key components: ${keyComponents}`,
    `- Special patterns: ${specialPatterns}`,
    "- Build the page so the structure and visual hierarchy feel as close to the original site as possible."
  ]

  const responsiveBehavior = [
    "## Responsive Behavior",
    "- Mobile-first implementation.",
    "- Keep the layout readable and visually tight on small screens.",
    "- Use responsive spacing, typography, and grids so the UI adapts cleanly across breakpoints.",
    "- Preserve the original hierarchy instead of adding unnecessary decoration."
  ]

  const interactions = [
    "## Interactions",
    "- Keep interactions subtle and functional.",
    "- Use hover and focus states where they improve clarity and polish.",
    "- Avoid adding animation systems unless they are clearly present in the source design.",
    "- If the source page is mostly static, keep the final output similarly restrained."
  ]

  const componentFileStructure = [
    "## Component File Structure",
    "- app/page.tsx",
    "- components/Navbar.tsx",
    "- components/Hero.tsx",
    "- components/Features.tsx",
    "- components/Pricing.tsx",
    "- components/Footer.tsx",
    "- Keep the component breakdown clean and production-ready.",
    "- If the page has more sections, add only the minimum number of reusable components required."
  ]

  const notes = [
    "## Notes",
    "- Use Next.js 14 App Router.",
    "- Use Tailwind CSS for styling.",
    "- Use shadcn/ui components where appropriate.",
    "- Use next/image for imagery.",
    "- Make it pixel-perfect, responsive, and production-ready.",
    "- Aim for a high-level prompt that any AI can understand and turn into a close UI/UX reproduction."
  ]

  return [
    "Recreate this website UI/UX as a modern, responsive web page.",
    "",
    "## Tech Stack",
    "- Next.js 14 App Router",
    "- Tailwind CSS",
    "- shadcn/ui components",
    "",
    "---",
    "",
    "## Design Tokens",
    `Colors:\n- Primary: ${tokens.colors.primary}\n- Secondary: ${tokens.colors.secondary}\n- Accent: ${tokens.colors.accent}\n- Background: ${tokens.colors.background}\n- Text: ${tokens.colors.text}`,
    `Typography:\n- Heading Font: ${tokens.typography.headingFont}\n- Body Font: ${tokens.typography.bodyFont}\n- Hero heading: ${tokens.typography.headingSizes[0] || tokens.typography.bodySize}\n- Section heading: ${tokens.typography.headingSizes[1] || tokens.typography.bodySize}`,
    `Spacing:\n- Section vertical gap: ${tokens.spacing.sectionGap}\n- Container padding: ${tokens.spacing.containerPadding}`,
    `Border Radius:\n- Cards: ${tokens.borderRadius}`,
    "",
    "---",
    "",
    ...pageStructure,
    "",
    ...responsiveBehavior,
    "",
    ...interactions,
    "",
    ...componentFileStructure,
    "",
    ...notes,
    "",
    designQuality
  ].join("\n")
}

function buildNextJsPrompt(tokens: DesignTokens, analysis: GeminiAnalysis) {
  return [
    "Build this as a production Next.js 14 App Router project using Tailwind CSS and shadcn/ui where appropriate.",
    buildGeneralPrompt(tokens, analysis)
  ].join("\n")
}

function buildV0Prompt(tokens: DesignTokens, analysis: GeminiAnalysis) {
  return [
    "Create a polished landing page that matches the original website's UI/UX as closely as possible.",
    formatLine("Primary color", tokens.colors.primary),
    formatLine("Design style", analysis.designStyle),
    analysis.sections.length > 0 ? `Sections: ${formatList(analysis.sections)}` : "",
    analysis.keyComponents.length > 0 ? `Key components: ${formatList(analysis.keyComponents)}` : "",
    "Keep the result highly visual, production-ready, and faithful to the original layout and feel."
  ].filter(Boolean).join("\n")
}

function buildCursorPrompt(tokens: DesignTokens, analysis: GeminiAnalysis) {
  return [
    "Build a production Next.js app with this structure:",
    "- app/page.tsx (main landing)",
    "- components/Navbar.tsx",
    "- components/Hero.tsx",
    "- components/Features.tsx",
    "- components/Pricing.tsx",
    "- components/Footer.tsx",
    "Use this brief to match the original website UI/UX as closely as possible:",
    buildGeneralPrompt(tokens, analysis)
  ].join("\n")
}

function buildMarkdownPrompt(tokens: DesignTokens, analysis: GeminiAnalysis, general: string) {
  return [
    "# UISnap Export",
    "",
    "## Goal",
    "Recreate the original website UI/UX as closely as possible.",
    "",
    "## Design Tokens",
    `- Primary color: ${tokens.colors.primary}`,
    `- Secondary color: ${tokens.colors.secondary}`,
    `- Accent color: ${tokens.colors.accent}`,
    `- Background color: ${tokens.colors.background}`,
    `- Text color: ${tokens.colors.text}`,
    `- Heading font: ${tokens.typography.headingFont}`,
    `- Body font: ${tokens.typography.bodyFont}`,
    `- Hero heading size: ${tokens.typography.headingSizes[0] || tokens.typography.bodySize}`,
    `- Border radius: ${tokens.borderRadius}`,
    "",
    "## Analysis",
    analysis.layoutStyle && isKnown(analysis.layoutStyle) ? `- Layout: ${analysis.layoutStyle}` : "",
    analysis.navigationStyle && isKnown(analysis.navigationStyle) ? `- Navigation: ${analysis.navigationStyle}` : "",
    analysis.designStyle && isKnown(analysis.designStyle) ? `- Design style: ${analysis.designStyle}` : "",
    analysis.sections.length > 0 ? `- Sections: ${formatList(analysis.sections)}` : "",
    analysis.keyComponents.length > 0 ? `- Components: ${formatList(analysis.keyComponents)}` : "",
    analysis.uniquePatterns.length > 0 ? `- Patterns: ${formatList(analysis.uniquePatterns)}` : "",
    "",
    "## Prompt",
    general
  ].filter(Boolean).join("\n")
}

export function buildPromptExports(result: ScanResult): PromptExports {
  const { tokens, analysis, screenshots, screenshotCount, pageHeight, scrollSteps } = result

  const general = buildGeneralPrompt(tokens, analysis)
  const developer = buildDeveloperPrompt(tokens, analysis)
  const nextjs = buildNextJsPrompt(tokens, analysis)
  const v0 = buildV0Prompt(tokens, analysis)
  const cursor = buildCursorPrompt(tokens, analysis)
  const json = JSON.stringify(
    {
      screenshotCount,
      pageHeight,
      scrollSteps,
      tokens,
      analysis,
      screenshots: screenshots.slice(0, 1)
    },
    null,
    2
  )
  const markdown = buildMarkdownPrompt(tokens, analysis, general)

  return {
    general,
    developer,
    nextjs,
    v0,
    cursor,
    json,
    markdown
  }
}