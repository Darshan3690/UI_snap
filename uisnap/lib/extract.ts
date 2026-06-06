import { DesignTokens } from "./types"

const DEFAULT_TOKENS: DesignTokens = {
  colors: {
    primary: "#635BFF",
    secondary: "#111827",
    accent: "#22C55E",
    background: "#FFFFFF",
    text: "#111827",
    backgroundSecondary: null,
    raw: []
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingSizes: ["48px", "32px", "24px"],
    bodySize: "16px",
    allDeclaredFonts: ["Inter"],
    heroFontSize: "48px",
    sectionFontSize: "24px",
    bodyFontSize: "16px",
    headingWeight: "700",
    bodyWeight: "400",
    lineHeight: "1.5"
  },
  spacing: {
    sectionGap: "48px",
    containerPadding: "24px"
  },
  borderRadius: "8px",
  borderRadiusByType: {
    card: "8px",
    button: "6px",
    input: "4px",
    image: "0px"
  },
  components: ["Navbar", "Hero section", "Footer"],
  headings: [],
  meta: {
    title: "",
    description: "",
    pageHeight: 0,
    viewportHeight: 0,
    scrollSteps: 0,
    url: ""
  },
  rootVars: {}
}

function frequency<T>(arr: T[]): Map<T, number> {
  const map = new Map<T, number>()
  for (const item of arr) {
    map.set(item, (map.get(item) ?? 0) + 1)
  }
  return map
}

function topN<T>(map: Map<T, number>, n: number): T[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k)
}

function toHex(color: string): string | null {
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") {
    return null
  }

  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  if (a < 10) return null
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase()}`
}

function isUsefulColor(hex: string): boolean {
  const skip = ["#FFFFFF", "#000000", "#FAFAFA", "#F5F5F5", "#EEEEEE", "#E0E0E0"]
  if (skip.includes(hex)) return false

  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  const saturation = Math.max(r, g, b) - Math.min(r, g, b)
  return saturation > 20 || brightness < 60
}

function extractRootCSSVariables(): Record<string, string> {
  const vars: Record<string, string> = {}
  try {
    const root = document.documentElement
    const style = getComputedStyle(root)

    for (const sheet of [...document.styleSheets]) {
      try {
        for (const rule of [...sheet.cssRules]) {
          if (rule instanceof CSSStyleRule && rule.selectorText === ":root") {
            const matches = rule.cssText.matchAll(/--([\w-]+)\s*:\s*([^;]+)/g)
            for (const [, name, value] of matches) {
              const resolved = style.getPropertyValue(`--${name}`).trim()
              vars[`--${name}`] = resolved || value.trim()
            }
          }
        }
      } catch {
        // cross-origin stylesheet
      }
    }
  } catch {
    // ignore
  }

  return vars
}

function extractColors(rootVars: Record<string, string>): DesignTokens["colors"] {
  const brandSelectors = [
    "button",
    "a",
    ".btn",
    '[class*="btn"]',
    '[class*="button"]',
    '[class*="badge"]',
    '[class*="tag"]',
    '[class*="chip"]',
    '[class*="accent"]',
    '[class*="primary"]',
    '[class*="brand"]',
    "h1",
    "h2",
    "nav a",
    "nav button",
    "header a",
    '[class*="cta"]'
  ]

  const bgSelectors = [
    "body",
    "main",
    '[class*="section"]',
    '[class*="container"]',
    '[class*="wrapper"]',
    "header",
    "footer"
  ]

  const fgColors: string[] = []
  const bgColors: string[] = []

  for (const sel of brandSelectors) {
    try {
      const els = [...document.querySelectorAll<HTMLElement>(sel)].slice(0, 6)
      for (const el of els) {
        const s = getComputedStyle(el)
        const fg = toHex(s.color)
        const bg = toHex(s.backgroundColor)
        const border = toHex(s.borderColor)
        if (fg) fgColors.push(fg)
        if (bg) bgColors.push(bg)
        if (border && border !== fg && border !== bg) fgColors.push(border)
      }
    } catch {
      // ignore invalid selector
    }
  }

  for (const sel of bgSelectors) {
    try {
      const els = [...document.querySelectorAll<HTMLElement>(sel)].slice(0, 3)
      for (const el of els) {
        const bg = toHex(getComputedStyle(el).backgroundColor)
        if (bg) bgColors.push(bg)
      }
    } catch {
      // ignore invalid selector
    }
  }

  const cssColorVars = Object.entries(rootVars)
    .filter(([k]) => /color|primary|accent|brand/i.test(k))
    .map(([, v]) => toHex(v))
    .filter(Boolean) as string[]

  const allFg = [...cssColorVars, ...fgColors].filter(isUsefulColor)
  const allBg = [...bgColors].filter(Boolean) as string[]

  const topFg = topN(frequency(allFg), 4)
  const topBg = topN(frequency(allBg), 2)
  const bodyColor = toHex(getComputedStyle(document.body).color)

  return {
    primary: topFg[0] || DEFAULT_TOKENS.colors.primary,
    secondary: topFg[1] || DEFAULT_TOKENS.colors.secondary,
    accent: topFg[2] || topFg[0] || DEFAULT_TOKENS.colors.accent,
    background: topBg[0] || DEFAULT_TOKENS.colors.background,
    backgroundSecondary: topBg[1] || null,
    text: bodyColor || DEFAULT_TOKENS.colors.text,
    raw: topN(frequency([...allFg, ...allBg.filter(isUsefulColor)]), 8)
  }
}

function extractFonts(rootVars: Record<string, string>): DesignTokens["typography"] {
  const declaredFonts: string[] = []

  const linkTags = [...document.querySelectorAll<HTMLLinkElement>('link[href*="fonts.googleapis.com"]')]
  for (const link of linkTags) {
    const match = link.href.match(/family=([^&]+)/)
    if (!match) continue
    const families = decodeURIComponent(match[1])
      .split("|")
      .map((f) => f.split(":")[0].replace(/\+/g, " ").trim())
    declaredFonts.push(...families)
  }

  try {
    for (const sheet of [...document.styleSheets]) {
      try {
        for (const rule of [...sheet.cssRules]) {
          if (rule instanceof CSSFontFaceRule) {
            const family = rule.style.getPropertyValue("font-family").replace(/["']/g, "").trim()
            if (family && !/^font awesome|^fa-/i.test(family)) {
              declaredFonts.push(family)
            }
          }
        }
      } catch {
        // cross-origin stylesheet
      }
    }
  } catch {
    // ignore
  }

  const varFonts = Object.entries(rootVars)
    .filter(([k]) => /font|typeface/i.test(k))
    .map(([, v]) => v.replace(/["']/g, "").split(",")[0].trim())
    .filter((f) => f && !/^system|-apple/i.test(f))
  declaredFonts.push(...varFonts)

  const uniqueFonts = [...new Set(declaredFonts.map((f) => f.trim()))].filter(Boolean)

  let headingFont = uniqueFonts[0] || ""
  let bodyFont = uniqueFonts[1] || uniqueFonts[0] || ""

  if (!headingFont) {
    const h1 = document.querySelector<HTMLElement>("h1")
    if (h1) headingFont = getComputedStyle(h1).fontFamily.split(",")[0].replace(/["']/g, "").trim()
  }
  if (!bodyFont) {
    const p = document.querySelector<HTMLElement>("p, main, article")
    if (p) bodyFont = getComputedStyle(p).fontFamily.split(",")[0].replace(/["']/g, "").trim()
  }

  const h1 = document.querySelector<HTMLElement>("h1, [class*='hero'] h1, [class*='heading']")
  const h2 = document.querySelector<HTMLElement>("h2")
  const p = document.querySelector<HTMLElement>("p, main p")

  const heroSize = h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : 48
  const sectionSize = h2 ? Math.round(parseFloat(getComputedStyle(h2).fontSize)) : 24
  const bodySize = p ? Math.round(parseFloat(getComputedStyle(p).fontSize)) : 16

  const headingWeight = h1 ? getComputedStyle(h1).fontWeight : "700"
  const bodyWeight = p ? getComputedStyle(p).fontWeight : "400"
  const lineHeight = p ? getComputedStyle(p).lineHeight : "1.5"

  return {
    headingFont: headingFont || DEFAULT_TOKENS.typography.headingFont,
    bodyFont: bodyFont || DEFAULT_TOKENS.typography.bodyFont,
    headingSizes: [`${heroSize}px`, `${sectionSize}px`, `${Math.max(sectionSize - 2, 16)}px`],
    bodySize: `${bodySize}px`,
    allDeclaredFonts: uniqueFonts,
    heroFontSize: `${heroSize}px`,
    sectionFontSize: `${sectionSize}px`,
    bodyFontSize: `${bodySize}px`,
    headingWeight,
    bodyWeight,
    lineHeight
  }
}

function extractSpacing(): DesignTokens["spacing"] {
  const sections = [...document.querySelectorAll<HTMLElement>(
    "section, article, [class*='section'], [class*='block'], main > div"
  )].slice(0, 8)

  const sectionGaps: number[] = []
  const containerPaddings: number[] = []

  for (const el of sections) {
    const s = getComputedStyle(el)
    const pt = parseFloat(s.paddingTop)
    const pb = parseFloat(s.paddingBottom)
    const mt = parseFloat(s.marginTop)
    const mb = parseFloat(s.marginBottom)
    if (pt + pb > 0) sectionGaps.push(Math.round((pt + pb) / 2))
    if (mt + mb > 0) sectionGaps.push(Math.round((mt + mb) / 2))
    const pl = parseFloat(s.paddingLeft)
    const pr = parseFloat(s.paddingRight)
    if (pl + pr > 0) containerPaddings.push(Math.round((pl + pr) / 2))
  }

  const avgSectionGap = sectionGaps.length
    ? Math.round(sectionGaps.reduce((a, b) => a + b, 0) / sectionGaps.length)
    : 48

  const avgContainerPadding = containerPaddings.length
    ? Math.round(containerPaddings.reduce((a, b) => a + b, 0) / containerPaddings.length)
    : 24

  return {
    sectionGap: `${avgSectionGap}px`,
    containerPadding: `${avgContainerPadding}px`
  }
}

function extractBorderRadius(tokens: DesignTokens): { borderRadius: string; borderRadiusByType: NonNullable<DesignTokens["borderRadiusByType"]> } {
  const sample = (sel: string): string | null => {
    const el = document.querySelector<HTMLElement>(sel)
    if (!el) return null
    const r = parseFloat(getComputedStyle(el).borderRadius)
    return !Number.isNaN(r) && r > 0 ? `${Math.round(r)}px` : null
  }

  const borderRadiusByType = {
    card: sample('[class*="card"], article') || "8px",
    button: sample("button, .btn, [class*='btn']") || "6px",
    input: sample("input, textarea") || "4px",
    image: sample("img, [class*='img'], [class*='image']") || "0px"
  }

  return {
    borderRadius: borderRadiusByType.card || tokens.borderRadius,
    borderRadiusByType
  }
}

function detectComponentsAndHeadings() {
  const found: string[] = []

  const checks: Array<{ label: string; selectors: string[] }> = [
    { label: "Navbar", selectors: ["nav", "header nav", '[class*="navbar"]', '[role="navigation"]'] },
    { label: "Hero section", selectors: ['[class*="hero"]', '[class*="banner"]', "main > section:first-child"] },
    { label: "Image carousel / slider", selectors: ['[class*="slider"]', '[class*="carousel"]', '[class*="swiper"]'] },
    { label: "Feature grid", selectors: ['[class*="feature"]', '[class*="benefit"]', '[class*="service"]'] },
    { label: "Testimonials", selectors: ['[class*="testimonial"]', '[class*="review"]', '[class*="quote"]'] },
    { label: "Pricing table", selectors: ['[class*="pricing"]', '[class*="plan"]', '[class*="tier"]'] },
    { label: "FAQ / accordion", selectors: ['[class*="faq"]', '[class*="accordion"]', "details", "summary"] },
    { label: "Stats / counters", selectors: ['[class*="stat"]', '[class*="counter"]', '[class*="metric"]'] },
    { label: "Team section", selectors: ['[class*="team"]', '[class*="member"]', '[class*="staff"]'] },
    { label: "Gallery / image grid", selectors: ['[class*="gallery"]', '[class*="grid"] img', '[class*="photo"]'] },
    { label: "Call to action", selectors: ['[class*="cta"]', '[class*="call-to-action"]'] },
    { label: "Footer", selectors: ["footer", '[class*="footer"]'] },
    { label: "Search bar", selectors: ['[role="search"]', 'input[type="search"]', '[class*="search"]'] }
  ]

  for (const { label, selectors } of checks) {
    for (const sel of selectors) {
      try {
        if (document.querySelector(sel)) {
          found.push(label)
          break
        }
      } catch {
        // ignore selector errors
      }
    }
  }

  const headings = [...document.querySelectorAll("h1, h2, h3")]
    .map((el) => el.textContent?.trim())
    .filter(Boolean)
    .slice(0, 16) as string[]

  return { components: found, headings }
}

function extractPageMeta() {
  const pageHeight = document.documentElement.scrollHeight
  const viewportHeight = window.innerHeight || 800
  return {
    title: document.title,
    description: document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content || "",
    pageHeight,
    viewportHeight,
    scrollSteps: Math.min(Math.ceil(pageHeight / viewportHeight), 20),
    url: window.location.href
  }
}

export function extractDesignTokens(): DesignTokens {
  try {
    const rootVars = extractRootCSSVariables()
    const colors = extractColors(rootVars)
    const typography = extractFonts(rootVars)
    const spacing = extractSpacing()
    const { components, headings } = detectComponentsAndHeadings()

    const draft: DesignTokens = {
      colors,
      typography,
      spacing,
      borderRadius: DEFAULT_TOKENS.borderRadius,
      components,
      headings,
      meta: extractPageMeta(),
      rootVars
    }

    const { borderRadius, borderRadiusByType } = extractBorderRadius(draft)
    draft.borderRadius = borderRadius
    draft.borderRadiusByType = borderRadiusByType

    return draft
  } catch {
    return DEFAULT_TOKENS
  }
}

export { DEFAULT_TOKENS }