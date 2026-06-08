import type { DesignTokens, GeminiAnalysis, PromptExports, ScanResult } from "./types"

function list(values: string[]) {
  const filtered = values.map((value) => value.trim()).filter(Boolean)
  return filtered.length > 0 ? filtered.map((value) => `- ${value}`).join("\n") : "- None detected"
}

function numbered(values: string[]) {
  const filtered = values.map((value) => value.trim()).filter(Boolean)
  return filtered.length > 0 ? filtered.map((value, index) => `${index + 1}. ${value}`).join("\n") : "1. Hero\n2. Content\n3. Footer"
}

function rawColors(tokens: DesignTokens) {
  return tokens.colors.raw?.length ? tokens.colors.raw.join(", ") : "None detected"
}

function cardRadius(tokens: DesignTokens) {
  return tokens.borderRadiusByType?.card ?? tokens.borderRadius
}

function buttonRadius(tokens: DesignTokens) {
  return tokens.borderRadiusByType?.button ?? tokens.borderRadius
}

function heroSize(tokens: DesignTokens) {
  return tokens.typography.heroFontSize ?? tokens.typography.headingSizes[0] ?? tokens.typography.bodySize
}

function sectionSize(tokens: DesignTokens) {
  return tokens.typography.sectionFontSize ?? tokens.typography.headingSizes[1] ?? tokens.typography.bodySize
}

function visualPatternLines(tokens: DesignTokens, analysis: GeminiAnalysis) {
  const heroType = analysis.heroType ?? tokens.visualPatterns?.heroType ?? "unknown"
  const galleryType = analysis.galleryType ?? tokens.visualPatterns?.galleryType ?? "unknown"
  const footerType = analysis.footerType ?? tokens.visualPatterns?.footerType ?? "unknown"
  const carouselEvidence = tokens.visualPatterns?.carouselEvidence ?? []

  return `Hero type: ${heroType}
Gallery type: ${galleryType}
Footer type: ${footerType}
Carousel evidence: ${carouselEvidence.length ? carouselEvidence.join(", ") : "none"}`
}

function strictPatternRules(tokens: DesignTokens, analysis: GeminiAnalysis) {
  const heroType = analysis.heroType ?? tokens.visualPatterns?.heroType
  const galleryType = analysis.galleryType ?? tokens.visualPatterns?.galleryType
  const footerType = analysis.footerType ?? tokens.visualPatterns?.footerType
  const rules: string[] = []

  if (heroType === "static-image") {
    rules.push("- Hero is a single static image/banner. Do not create an auto-rotating carousel.")
  }
  if (galleryType === "single-column-stacked") {
    rules.push("- Gallery must be single-column stacked, full-width image cards/photos, not a 2-column grid.")
  }
  if (footerType === "minimal-seal") {
    rules.push("- Footer must be minimal and centered with seal/emblem styling. Do not create multi-column nav links.")
  }

  return rules.length ? rules.join("\n") : "- Match detected component behavior exactly."
}

function colorPalette(tokens: DesignTokens) {
  const { colors } = tokens

  return `Primary: ${colors.primary}
Secondary: ${colors.secondary}
Accent: ${colors.accent}
Background: ${colors.background}
Text: ${colors.text}
All detected colors: ${rawColors(tokens)}

:root {
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-text: ${colors.text};
}

tailwind colors:
colors: {
  primary: "${colors.primary}",
  secondary: "${colors.secondary}",
  accent: "${colors.accent}",
  background: "${colors.background}",
  text: "${colors.text}",
},`
}

function buildV0Prompt(tokens: DesignTokens, analysis: GeminiAnalysis) {
  return `Create a pixel-perfect, mobile-first ${analysis.designStyle} website landing page.

Design Style:
- Style: ${analysis.designStyle}
- Color mood: ${analysis.colorMood}
- Navigation: ${analysis.navigationStyle}
- Clean, modern, production-ready UI

Color System:
- Primary: ${tokens.colors.primary}
- Secondary: ${tokens.colors.secondary}
- Accent: ${tokens.colors.accent}
- Background: ${tokens.colors.background}
- Text: ${tokens.colors.text}

Typography:
- Heading font: ${tokens.typography.headingFont}
- Body font: ${tokens.typography.bodyFont}
- Hero heading size: ${heroSize(tokens)}
- Section heading size: ${sectionSize(tokens)}

Spacing & Shape:
- Section vertical gap: ${tokens.spacing.sectionGap}
- Container padding: ${tokens.spacing.containerPadding}
- Card radius: ${cardRadius(tokens)}
- Button radius: ${buttonRadius(tokens)}

Page Sections:
${numbered(analysis.sections)}

Key UI Components:
${list(analysis.keyComponents)}

Detected Visual Patterns:
${visualPatternLines(tokens, analysis)}

Must-Reproduce Patterns:
${list(analysis.uniquePatterns)}

Strict Layout Rules:
${strictPatternRules(tokens, analysis)}

Requirements:
- Use Next.js App Router, Tailwind CSS, shadcn/ui, and next/image
- Use Card, Button, Badge, NavigationMenu, Carousel, and Accordion where useful
- Make the page fully responsive: mobile, tablet, desktop
- Add sticky navigation, hover states, and clean transitions
- Recreate this UI as closely as possible and prioritize visual accuracy.`
}

function buildLovablePrompt(tokens: DesignTokens, analysis: GeminiAnalysis) {
  return `Build a complete, production-ready ${analysis.designStyle} website application.

Application Pages:
- Home
- About
- Programs or Services
- Gallery
- Contact

Home Page Sections:
${numbered(analysis.sections)}

Core Features:
${list(analysis.keyComponents)}
- Responsive navigation with mobile hamburger menu
- Smooth scroll between sections
- Hover and focus states on all interactive elements
- Loading states for dynamic content

Detected Visual Patterns:
${visualPatternLines(tokens, analysis)}

Strict Layout Rules:
${strictPatternRules(tokens, analysis)}

Design System:
- Primary color: ${tokens.colors.primary}
- Secondary color: ${tokens.colors.secondary}
- Accent: ${tokens.colors.accent}
- Background: ${tokens.colors.background}
- Text: ${tokens.colors.text}
- Heading font: ${tokens.typography.headingFont}
- Body font: ${tokens.typography.bodyFont}

Tech:
- React
- TypeScript
- Tailwind CSS
- Component-based architecture

Generate the full application with clean structure, working navigation, and responsive UI.`
}

function buildCursorPrompt(tokens: DesignTokens, analysis: GeminiAnalysis) {
  return `Build a production-grade ${analysis.designStyle} website using this exact specification.

Tech Stack:
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- next/image

Folder Structure:
app/
├── page.tsx
├── layout.tsx
└── globals.css

components/
├── Navbar.tsx
├── Hero.tsx
├── Sections.tsx
├── Gallery.tsx
├── CTASection.tsx
└── Footer.tsx

Design Tokens:
- Primary: ${tokens.colors.primary}
- Secondary: ${tokens.colors.secondary}
- Accent: ${tokens.colors.accent}
- Background: ${tokens.colors.background}
- Text: ${tokens.colors.text}
- Heading font: ${tokens.typography.headingFont}
- Body font: ${tokens.typography.bodyFont}
- Hero size: ${heroSize(tokens)}
- Section size: ${sectionSize(tokens)}
- Card radius: ${cardRadius(tokens)}
- Button radius: ${buttonRadius(tokens)}

Navigation:
- ${analysis.navigationStyle}
- Sticky navbar
- Mobile hamburger menu
- Active link highlighting

Page Sections:
${numbered(analysis.sections)}

Component Requirements:
${list(analysis.keyComponents)}

Critical Patterns:
${list(analysis.uniquePatterns)}

Detected Visual Patterns:
${visualPatternLines(tokens, analysis)}

Strict Layout Rules:
${strictPatternRules(tokens, analysis)}

Accessibility and Performance:
- Semantic HTML
- aria-label on icon-only buttons
- Focus-visible rings
- Responsive image sizing
- Lighthouse score target: above 90

Generate the complete codebase.`
}

function buildUniversalPrompt(tokens: DesignTokens, analysis: GeminiAnalysis) {
  return `Analyze and recreate this website UI with high visual fidelity.

DESIGN STYLE:
${analysis.designStyle}

LAYOUT:
${numbered(analysis.sections)}

COMPONENTS DETECTED:
${list(analysis.keyComponents)}

DETECTED VISUAL PATTERNS:
${visualPatternLines(tokens, analysis)}

STRICT LAYOUT RULES:
${strictPatternRules(tokens, analysis)}

COLOR PALETTE:
Primary: ${tokens.colors.primary}
Secondary: ${tokens.colors.secondary}
Accent: ${tokens.colors.accent}
Background: ${tokens.colors.background}
Text: ${tokens.colors.text}

TYPOGRAPHY:
Heading font: ${tokens.typography.headingFont}
Body font: ${tokens.typography.bodyFont}
Hero heading: ${heroSize(tokens)}
Section heading: ${sectionSize(tokens)}

SPACING:
Section gap: ${tokens.spacing.sectionGap}
Container padding: ${tokens.spacing.containerPadding}
Card radius: ${cardRadius(tokens)}
Button radius: ${buttonRadius(tokens)}

ANIMATIONS:
- Fade-in sections
- Smooth transitions
- Hover effects where relevant

RESPONSIVE REQUIREMENTS:
- Mobile first
- Tablet optimized
- Desktop responsive

OUTPUT:
Generate a pixel-perfect, production-ready implementation using modern frontend best practices.`
}

export function buildPromptExports(result: ScanResult): PromptExports {
  const { tokens, analysis } = result

  return {
    v0: buildV0Prompt(tokens, analysis),
    lovable: buildLovablePrompt(tokens, analysis),
    cursor: buildCursorPrompt(tokens, analysis),
    universal: buildUniversalPrompt(tokens, analysis),
    colorPalette: colorPalette(tokens)
  }
}
