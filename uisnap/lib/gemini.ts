import { DesignTokens, GeminiAnalysis } from "./types"

const GEMINI_MODEL = "gemini-2.5-flash-preview-05-20"
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

const FALLBACK_ANALYSIS: GeminiAnalysis = {
  layoutStyle: "Unknown",
  navigationStyle: "Unknown",
  sections: [],
  designStyle: "Unknown",
  colorMood: "Neutral",
  keyComponents: [],
  uniquePatterns: [],
  sectionDetails: {},
  imagePatterns: [],
  responsiveHints: "",
  componentTree: ["App"]
}

const SYSTEM_PROMPT = `You are an expert UI/UX analyst and frontend developer.
Your job is to analyze website screenshots alongside structured DOM data and produce a precise, developer-ready UI description.

Rules:
- Be specific. "Large hero with full-bleed image and white overlay text" is good. "Nice header" is not.
- Section names must come from the provided headings list when available. Never invent section names.
- Never hallucinate components.
- Color descriptions are already extracted from CSS — trust those over visual guessing.
- Output valid JSON only. No markdown fences, no preamble, no explanation.`

function screenshotPart(base64: string) {
  const data = base64.replace(/^data:image\/\w+;base64,/, "")
  return {
    inlineData: {
      mimeType: "image/png",
      data
    }
  }
}

function selectScreenshots(screenshots: string[], max = 6): string[] {
  if (screenshots.length <= max) return screenshots
  const selected: string[] = [screenshots[0]]
  const middleCount = Math.max(max - 2, 1)
  const step = Math.max(Math.floor((screenshots.length - 2) / middleCount), 1)
  for (let i = 1; i < max - 1; i++) {
    selected.push(screenshots[Math.min(i * step, screenshots.length - 2)])
  }
  selected.push(screenshots[screenshots.length - 1])
  return selected
}

function buildUserPrompt(tokens: DesignTokens, screenshotCount: number): string {
  const headings = tokens.headings ?? []
  const components = tokens.components ?? []
  const meta = tokens.meta ?? {
    title: "",
    description: "",
    url: "",
    scrollSteps: screenshotCount
  }

  return `Analyze this website UI.
I am providing ${meta.scrollSteps || screenshotCount} screenshots from top to bottom and structured DOM data.

DOM Context:
Page title: "${meta.title || ""}"
Page description: "${meta.description || ""}"
URL: ${meta.url || ""}

Detected headings (h1-h3):
${headings.length > 0 ? headings.map((h, i) => `${i + 1}. ${h}`).join("\n") : "(none detected)"}

Detected components:
${components.length > 0 ? components.map((c) => `- ${c}`).join("\n") : "(none detected)"}

Extracted colors:
- Primary: ${tokens.colors.primary}
- Secondary: ${tokens.colors.secondary}
- Accent: ${tokens.colors.accent}
- Background: ${tokens.colors.background}
- Text: ${tokens.colors.text}

Extracted fonts:
- Heading: ${tokens.typography.headingFont}
- Body: ${tokens.typography.bodyFont}

Return JSON with keys:
layoutStyle, navigationStyle, sections, sectionDetails, designStyle, colorMood, keyComponents, imagePatterns, uniquePatterns, responsiveHints, componentTree.

Important: Use heading text exactly when naming sections whenever headings are available.`
}

function buildFallbackAnalysis(tokens: DesignTokens): GeminiAnalysis {
  const headings = tokens.headings ?? []
  const components = tokens.components ?? []
  const sections: string[] = []

  if (components.includes("Navbar")) sections.push("Navigation")
  if (components.includes("Hero section")) sections.push("Hero")
  for (const h of headings.slice(0, 12)) {
    if (!sections.includes(h)) sections.push(h)
  }
  if (components.includes("Gallery / image grid")) sections.push("Image gallery")
  if (components.includes("FAQ / accordion")) sections.push("FAQ")
  if (components.includes("Footer")) sections.push("Footer")

  return {
    layoutStyle: "single-column full-width sections",
    navigationStyle: components.includes("Navbar") ? "top navbar" : "Unknown",
    sections: sections.length > 0 ? sections : ["Hero", "Content", "Footer"],
    designStyle: "Unknown",
    colorMood: "Neutral",
    keyComponents: components,
    uniquePatterns: [],
    sectionDetails: {},
    imagePatterns: [],
    responsiveHints: "",
    componentTree: ["App", "  Navbar", "  Hero", "  Footer"]
  }
}

function stripCodeFence(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
}

export async function analyzeWithGemini(
  apiKey: string,
  screenshots: string[],
  tokens: DesignTokens
): Promise<GeminiAnalysis> {
  if (!apiKey || screenshots.length === 0) {
    return buildFallbackAnalysis(tokens)
  }

  const selected = selectScreenshots(screenshots, 6)
  const userPrompt = buildUserPrompt(tokens, selected.length)

  const parts: any[] = [{ text: userPrompt }]
  for (let i = 0; i < selected.length; i++) {
    parts.push({
      text: `Screenshot ${i + 1} of ${selected.length} (${Math.round((i / Math.max(selected.length - 1, 1)) * 100)}% down page)`
    })
    parts.push(screenshotPart(selected[i]))
  }

  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: [
      {
        role: "user",
        parts
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 4096,
      responseMimeType: "application/json"
    }
  }

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }
    )

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Gemini API error ${response.status}: ${err}`)
    }

    const data = await response.json()
    const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    if (!rawText) {
      throw new Error("Gemini returned empty response")
    }

    const parsed = JSON.parse(stripCodeFence(rawText)) as Partial<GeminiAnalysis>

    return {
      layoutStyle: parsed.layoutStyle || FALLBACK_ANALYSIS.layoutStyle,
      navigationStyle: parsed.navigationStyle || FALLBACK_ANALYSIS.navigationStyle,
      sections: Array.isArray(parsed.sections) ? parsed.sections : FALLBACK_ANALYSIS.sections,
      designStyle: parsed.designStyle || FALLBACK_ANALYSIS.designStyle,
      colorMood: parsed.colorMood || FALLBACK_ANALYSIS.colorMood,
      keyComponents: Array.isArray(parsed.keyComponents) ? parsed.keyComponents : FALLBACK_ANALYSIS.keyComponents,
      uniquePatterns: Array.isArray(parsed.uniquePatterns) ? parsed.uniquePatterns : FALLBACK_ANALYSIS.uniquePatterns,
      sectionDetails: parsed.sectionDetails || {},
      imagePatterns: Array.isArray(parsed.imagePatterns) ? parsed.imagePatterns : [],
      responsiveHints: parsed.responsiveHints || "",
      componentTree: Array.isArray(parsed.componentTree) ? parsed.componentTree : []
    }
  } catch {
    return buildFallbackAnalysis(tokens)
  }
}

export { FALLBACK_ANALYSIS }