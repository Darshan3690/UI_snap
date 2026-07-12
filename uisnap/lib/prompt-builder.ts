import type { DesignTokens, GeminiAnalysis, PromptExports, ScanResult } from "./types"

// ─────────────────────────────────────────────
// Shared utility helpers
// ─────────────────────────────────────────────

function list(values: string[]) {
  const filtered = values.map((v) => v.trim()).filter(Boolean)
  return filtered.length > 0 ? filtered.map((v) => `  - ${v}`).join("\n") : "  - None detected"
}

function numbered(values: string[]) {
  const filtered = values.map((v) => v.trim()).filter(Boolean)
  return filtered.length > 0
    ? filtered.map((v, i) => `  ${i + 1}. ${v}`).join("\n")
    : "  1. Hero\n  2. Content\n  3. Footer"
}

function rawColors(tokens: DesignTokens) {
  return tokens.colors.raw?.filter(Boolean).join(", ") || "none"
}

function cardRadius(tokens: DesignTokens) {
  return tokens.borderRadiusByType?.card ?? tokens.borderRadius
}

function buttonRadius(tokens: DesignTokens) {
  return tokens.borderRadiusByType?.button ?? tokens.borderRadius
}

function inputRadius(tokens: DesignTokens) {
  return tokens.borderRadiusByType?.input ?? tokens.borderRadius
}

function heroSize(tokens: DesignTokens) {
  return tokens.typography.heroFontSize ?? tokens.typography.headingSizes[0] ?? "48px"
}

function sectionSize(tokens: DesignTokens) {
  return tokens.typography.sectionFontSize ?? tokens.typography.headingSizes[1] ?? "32px"
}

function bodySize(tokens: DesignTokens) {
  return tokens.typography.bodyFontSize ?? tokens.typography.bodySize ?? "16px"
}

/** Render all section details from Gemini with exact descriptions */
function sectionDetails(analysis: GeminiAnalysis) {
  if (!analysis.sectionDetails || Object.keys(analysis.sectionDetails).length === 0) {
    return "  (Use the section list above with appropriate layout for each)"
  }
  return Object.entries(analysis.sectionDetails)
    .map(([name, desc]) => `  [${name}]\n    ${desc}`)
    .join("\n\n")
}

/** Inject page metadata (real title, description, URL) */
function pageMeta(tokens: DesignTokens) {
  const m = tokens.meta
  if (!m || (!m.title && !m.description)) return "  (No metadata detected)"
  return [
    m.title       ? `  Site Title:       ${m.title}` : null,
    m.description ? `  Meta Description: ${m.description}` : null,
    m.url         ? `  Source URL:       ${m.url}` : null,
  ].filter(Boolean).join("\n")
}

/** Actual headings found in the page — real content to use */
function realHeadings(tokens: DesignTokens) {
  const h = tokens.headings ?? []
  if (h.length === 0) return "  (No headings detected — infer from section names)"
  return h.slice(0, 20).map((t, i) => `  ${i + 1}. "${t}"`).join("\n")
}

/** Image pattern line */
function imagePatterns(analysis: GeminiAnalysis) {
  if (!analysis.imagePatterns?.length) return "  - None detected"
  return analysis.imagePatterns.map((p) => `  - ${p}`).join("\n")
}

/** Component tree block */
function componentTreeBlock(analysis: GeminiAnalysis) {
  if (!analysis.componentTree?.length) return "  (Auto-detect from section list)"
  return analysis.componentTree.map((c) => `  ${c}`).join("\n")
}

/** Strict visual layout rules to prevent AI hallucination */
function strictRules(tokens: DesignTokens, analysis: GeminiAnalysis) {
  const heroType    = analysis.heroType    ?? tokens.visualPatterns?.heroType
  const galleryType = analysis.galleryType ?? tokens.visualPatterns?.galleryType
  const footerType  = analysis.footerType  ?? tokens.visualPatterns?.footerType
  const rules: string[] = []

  if (heroType === "static-image") {
    rules.push("  ✗ Hero uses ONE static image — DO NOT create a carousel or auto-slider.")
  } else if (heroType === "carousel") {
    rules.push("  ✓ Hero IS a carousel/slider — build an auto-playing image carousel.")
  } else if (heroType === "text-only") {
    rules.push("  ✗ Hero is text-only — DO NOT add a hero background image or video.")
  }

  if (galleryType === "single-column-stacked") {
    rules.push("  ✗ Gallery MUST be full-width single-column stacked cards — DO NOT create a 2/3-column grid.")
  } else if (galleryType === "multi-column-grid") {
    rules.push("  ✓ Gallery is a multi-column grid — use CSS Grid with equal-size image tiles.")
  } else if (galleryType === "masonry") {
    rules.push("  ✓ Gallery is a masonry layout — use variable-height image cards.")
  }

  if (footerType === "minimal-seal") {
    rules.push("  ✗ Footer is a minimal centered emblem/seal — DO NOT add multi-column navigation links.")
  } else if (footerType === "multi-column-nav") {
    rules.push("  ✓ Footer has multiple navigation columns — build a full multi-column footer.")
  }

  if (analysis.responsiveHints) {
    rules.push(`  ✓ Responsive note: ${analysis.responsiveHints}`)
  }

  return rules.length > 0 ? rules.join("\n") : "  - Reproduce detected layout exactly as described."
}

/** Full CSS design token block for copy-pasting */
function cssTokenBlock(tokens: DesignTokens) {
  return `:root {
  /* Colors */
  --color-primary:    ${tokens.colors.primary};
  --color-secondary:  ${tokens.colors.secondary};
  --color-accent:     ${tokens.colors.accent};
  --color-bg:         ${tokens.colors.background};
  --color-bg-2:       ${tokens.colors.backgroundSecondary ?? tokens.colors.background};
  --color-text:       ${tokens.colors.text};

  /* Typography */
  --font-heading:     '${tokens.typography.headingFont}', sans-serif;
  --font-body:        '${tokens.typography.bodyFont}', sans-serif;
  --text-hero:        ${heroSize(tokens)};
  --text-section:     ${sectionSize(tokens)};
  --text-body:        ${bodySize(tokens)};
  --font-weight-heading: ${tokens.typography.headingWeight ?? "700"};
  --font-weight-body:    ${tokens.typography.bodyWeight ?? "400"};
  --line-height:      ${tokens.typography.lineHeight ?? "1.6"};

  /* Spacing */
  --section-gap:      ${tokens.spacing.sectionGap};
  --container-pad:    ${tokens.spacing.containerPadding};

  /* Shape */
  --radius-card:      ${cardRadius(tokens)};
  --radius-button:    ${buttonRadius(tokens)};
  --radius-input:     ${inputRadius(tokens)};
}`
}

// ─────────────────────────────────────────────
// V0 Prompt (Next.js + shadcn/ui, Vercel-optimized)
// ─────────────────────────────────────────────

function buildV0Prompt(tokens: DesignTokens, analysis: GeminiAnalysis): string {
  return `# Role
You are an expert senior frontend engineer specializing in Next.js 14 App Router and shadcn/ui. Your task is to recreate a real website with pixel-perfect visual fidelity based on the structured analysis below.

# Source Website Information
${pageMeta(tokens)}

# Design System (Extracted directly from CSS — do not change these values)

## Color Palette
  Primary:            ${tokens.colors.primary}
  Secondary:          ${tokens.colors.secondary}
  Accent:             ${tokens.colors.accent}
  Background:         ${tokens.colors.background}
  Background Alt:     ${tokens.colors.backgroundSecondary ?? tokens.colors.background}
  Body Text:          ${tokens.colors.text}
  All Raw Colors:     ${rawColors(tokens)}

## Typography
  Heading Font:       ${tokens.typography.headingFont}
  Body Font:          ${tokens.typography.bodyFont}
  Hero Heading Size:  ${heroSize(tokens)} / weight ${tokens.typography.headingWeight ?? "700"}
  Section Heading:    ${sectionSize(tokens)}
  Body Text:          ${bodySize(tokens)} / weight ${tokens.typography.bodyWeight ?? "400"}
  Line Height:        ${tokens.typography.lineHeight ?? "1.6"}

## Spacing & Shape
  Section Gap:        ${tokens.spacing.sectionGap}
  Container Padding:  ${tokens.spacing.containerPadding}
  Card Radius:        ${cardRadius(tokens)}
  Button Radius:      ${buttonRadius(tokens)}
  Input Radius:       ${inputRadius(tokens)}

# AI Visual Analysis
  Design Style:       ${analysis.designStyle}
  Color Mood:         ${analysis.colorMood}
  Layout:             ${analysis.layoutStyle}
  Navigation:         ${analysis.navigationStyle}

# Real Page Headings (Use these as the EXACT text content — do not invent text)
${realHeadings(tokens)}

# Page Sections — Build in This Order
${numbered(analysis.sections)}

# Section-by-Section Build Instructions
${sectionDetails(analysis)}

# Key UI Components to Include
${list(analysis.keyComponents)}

# Image & Media Patterns
${imagePatterns(analysis)}

# Unique Design Patterns to Reproduce
${list(analysis.uniquePatterns)}

# Component Tree
${componentTreeBlock(analysis)}

# STRICT LAYOUT RULES (Read carefully — violating these is wrong)
${strictRules(tokens, analysis)}

# Tech Stack (for v0)
  - Next.js 14 App Router (app/page.tsx, app/layout.tsx, app/globals.css)
  - TypeScript strict mode
  - Tailwind CSS — configure the exact colors above in tailwind.config.ts
  - shadcn/ui components (Button, Card, Badge, NavigationMenu, Accordion, Carousel as needed)
  - Google Fonts import for ${tokens.typography.headingFont} and ${tokens.typography.bodyFont}
  - next/image for all images

# tailwind.config.ts colors to add
  colors: {
    primary:    "${tokens.colors.primary}",
    secondary:  "${tokens.colors.secondary}",
    accent:     "${tokens.colors.accent}",
    background: "${tokens.colors.background}",
    foreground: "${tokens.colors.text}",
  },

# Deliverable Requirements
  1. Fully responsive — mobile (375px), tablet (768px), desktop (1280px+)
  2. Sticky/fixed navbar with correct background color and links
  3. All section headings must use the EXACT text from the "Real Page Headings" list above
  4. Every section uses the correct colors and spacing from the Design System
  5. Hover states, focus rings, and smooth CSS transitions on interactive elements
  6. Semantic HTML5 elements (header, main, section, footer, nav, article)
  7. No placeholder "Lorem ipsum" — use real content from the headings list`
}

// ─────────────────────────────────────────────
// Lovable Prompt (Vite + React, full app)
// ─────────────────────────────────────────────

function buildLovablePrompt(tokens: DesignTokens, analysis: GeminiAnalysis): string {
  return `# Role
You are a product engineer building a complete React web app in Lovable. Recreate this website as a fully functional multi-page application with pixel-accurate design.

# Source Website Information
${pageMeta(tokens)}

# Design System
Apply these extracted values across ALL pages and components — never use default values.

## Colors (apply exactly)
  --primary:    ${tokens.colors.primary}
  --secondary:  ${tokens.colors.secondary}
  --accent:     ${tokens.colors.accent}
  --bg:         ${tokens.colors.background}
  --bg-alt:     ${tokens.colors.backgroundSecondary ?? tokens.colors.background}
  --text:       ${tokens.colors.text}

## Typography (import from Google Fonts if not system font)
  Heading: ${tokens.typography.headingFont} — ${heroSize(tokens)}, weight ${tokens.typography.headingWeight ?? "700"}
  Section: ${tokens.typography.headingFont} — ${sectionSize(tokens)}
  Body:    ${tokens.typography.bodyFont}    — ${bodySize(tokens)}, weight ${tokens.typography.bodyWeight ?? "400"}
  Line height: ${tokens.typography.lineHeight ?? "1.6"}

## Layout
  Max container width: 1280px, centered, padding: ${tokens.spacing.containerPadding} on sides
  Section vertical gap: ${tokens.spacing.sectionGap}
  Card border-radius: ${cardRadius(tokens)}
  Button border-radius: ${buttonRadius(tokens)}

# Visual Analysis
  Style: ${analysis.designStyle} | Mood: ${analysis.colorMood}
  Layout: ${analysis.layoutStyle}
  Navigation: ${analysis.navigationStyle}

# Real Page Content — Use These Exact Headings and Text
${realHeadings(tokens)}

# Application Pages to Create
  1. Home (all sections below)
  2. About
  3. Services / Programs (based on detected components)
  4. Gallery (if gallery detected)
  5. Contact

# Home Page Sections (in order)
${numbered(analysis.sections)}

# Section Detail Instructions
${sectionDetails(analysis)}

# Components to Build
${list(analysis.keyComponents)}

# Image Patterns
${imagePatterns(analysis)}

# Unique Patterns to Match
${list(analysis.uniquePatterns)}

# STRICT RULES
${strictRules(tokens, analysis)}

# Tech Stack
  - React 18 + TypeScript
  - Vite bundler
  - Tailwind CSS (configure colors above in tailwind.config.js)
  - React Router v6 for navigation
  - Framer Motion for section fade-in animations
  - Lucide React for icons

# Build Requirements
  1. All colors MUST match the Design System exactly — use CSS custom properties
  2. Navigation must be sticky, responsive, with a mobile hamburger menu
  3. Use the REAL headings from the content list — no invented text
  4. Each section must have hover effects and smooth scroll behavior
  5. Images: use aspect-ratio-correct placeholder images matching the detected gallery layout
  6. Footer must match detected type: ${analysis.footerType ?? tokens.visualPatterns?.footerType ?? "unknown"}
  7. All pages must share the same design system and navigation component`
}

// ─────────────────────────────────────────────
// Cursor Prompt (Detailed file-by-file spec)
// ─────────────────────────────────────────────

function buildCursorPrompt(tokens: DesignTokens, analysis: GeminiAnalysis): string {
  const detectedComponents = analysis.keyComponents.length > 0
    ? analysis.keyComponents
    : ["Navbar", "Hero", "Content", "Footer"]

  const componentFiles = [...new Set([
    "Navbar.tsx",
    "Hero.tsx",
    ...detectedComponents.map((c) =>
      c.replace(/[^a-zA-Z0-9]/g, "").replace(/^./, (m) => m.toUpperCase()) + ".tsx"
    ),
    "Footer.tsx",
  ])]

  return `# Role
You are a senior full-stack engineer. Build a production-grade website using the exact specifications below. Every value is extracted from a real website via CSS analysis and AI vision.

# Source Website Information
${pageMeta(tokens)}

# Tech Stack
  - Framework:  Next.js 14 App Router
  - Language:   TypeScript (strict: true)
  - Styling:    Tailwind CSS v3 with custom design tokens
  - Components: shadcn/ui
  - Images:     next/image
  - Fonts:      next/font/google
  - Icons:      lucide-react

# Exact Folder Structure to Generate
  app/
  ├── layout.tsx          ← Root layout with fonts, metadata, navbar
  ├── page.tsx            ← Home page — assembles all section components
  └── globals.css         ← CSS custom properties and base styles

  components/
${componentFiles.map((f) => `  ├── ${f}`).join("\n")}

  lib/
  └── utils.ts            ← cn() helper and any shared utilities

# globals.css — Copy this EXACTLY
\`\`\`css
${cssTokenBlock(tokens)}
\`\`\`

# tailwind.config.ts — Extend with these tokens
\`\`\`ts
theme: {
  extend: {
    colors: {
      primary:    "${tokens.colors.primary}",
      secondary:  "${tokens.colors.secondary}",
      accent:     "${tokens.colors.accent}",
      background: "${tokens.colors.background}",
      bgAlt:      "${tokens.colors.backgroundSecondary ?? tokens.colors.background}",
      foreground: "${tokens.colors.text}",
    },
    fontFamily: {
      heading: ["${tokens.typography.headingFont}", "sans-serif"],
      body:    ["${tokens.typography.bodyFont}", "sans-serif"],
    },
    borderRadius: {
      card:   "${cardRadius(tokens)}",
      btn:    "${buttonRadius(tokens)}",
      input:  "${inputRadius(tokens)}",
    },
    spacing: {
      section: "${tokens.spacing.sectionGap}",
    },
  },
},
\`\`\`

# Design Tokens Reference
  Visual Style:    ${analysis.designStyle}
  Color Mood:      ${analysis.colorMood}
  Layout Pattern:  ${analysis.layoutStyle}
  Navigation:      ${analysis.navigationStyle}

# Real Page Content — Use Exactly as Section Headings and Copy
${realHeadings(tokens)}

# Page Sections — Build in This Order
${numbered(analysis.sections)}

# Section-by-Section Implementation Guide
${sectionDetails(analysis)}

# Each Component Specification
${list(analysis.keyComponents)}

# Image & Media Implementation
${imagePatterns(analysis)}

# Unique Patterns — Must Reproduce
${list(analysis.uniquePatterns)}

# Component Tree
${componentTreeBlock(analysis)}

# STRICT LAYOUT RULES
${strictRules(tokens, analysis)}

# Navbar.tsx Requirements
  - Background: ${tokens.colors.background} (or transparent over hero, solidifies on scroll)
  - Text/link color: ${tokens.colors.text}
  - Accent/active color: ${tokens.colors.primary}
  - Sticky (position: sticky; top: 0; z-index: 50)
  - Mobile hamburger below 768px
  - Smooth open/close animation

# Footer Requirements
  - Type detected: ${analysis.footerType ?? tokens.visualPatterns?.footerType ?? "unknown"}
  - Background: use secondary or dark variant of ${tokens.colors.background}
  - Reproduce exactly — do not add columns if type is minimal-seal

# Accessibility & Performance Requirements
  - Semantic HTML (header, main, section, footer, article, nav)
  - aria-label on icon-only buttons
  - focus-visible rings using accent color ${tokens.colors.accent}
  - All images have alt text
  - Lazy-load images below the fold
  - Google Lighthouse target: 90+ Performance, 100 Accessibility

# Output
Generate ALL files in the folder structure above. Each file should be complete and production-ready. Do not use Lorem ipsum — use the real headings from the content list.`
}

// ─────────────────────────────────────────────
// Universal Prompt (Framework-agnostic, any AI tool)
// ─────────────────────────────────────────────

function buildUniversalPrompt(tokens: DesignTokens, analysis: GeminiAnalysis): string {
  return `# Role
You are an expert UI/UX engineer. Recreate the following website with maximum visual and content fidelity. This specification was generated by analyzing the real CSS, DOM, and visual layout of a live website.

# Source Website
${pageMeta(tokens)}

════════════════════════════════════════════
 DESIGN SYSTEM — DO NOT MODIFY THESE VALUES
════════════════════════════════════════════

## Colors
  Primary color:        ${tokens.colors.primary}
  Secondary color:      ${tokens.colors.secondary}
  Accent/CTA color:     ${tokens.colors.accent}
  Page background:      ${tokens.colors.background}
  Alt background:       ${tokens.colors.backgroundSecondary ?? tokens.colors.background}
  Body text:            ${tokens.colors.text}
  All palette colors:   ${rawColors(tokens)}

## Typography
  Heading font family:  ${tokens.typography.headingFont}
  Body font family:     ${tokens.typography.bodyFont}
  Hero heading size:    ${heroSize(tokens)}
  Section heading size: ${sectionSize(tokens)}
  Body text size:       ${bodySize(tokens)}
  Heading weight:       ${tokens.typography.headingWeight ?? "700"}
  Body weight:          ${tokens.typography.bodyWeight ?? "400"}
  Line height:          ${tokens.typography.lineHeight ?? "1.6"}

## Layout & Spacing
  Container max-width:  1280px (centered)
  Container padding:    ${tokens.spacing.containerPadding} (left/right)
  Section gap:          ${tokens.spacing.sectionGap} (vertical space between sections)

## Shape
  Card border-radius:   ${cardRadius(tokens)}
  Button border-radius: ${buttonRadius(tokens)}
  Input border-radius:  ${inputRadius(tokens)}

## CSS Custom Properties (copy into your stylesheet)
${cssTokenBlock(tokens)}

════════════════════════════════════════════
 REAL PAGE CONTENT
════════════════════════════════════════════

## Actual Headings Found on Page (use as real text content)
${realHeadings(tokens)}

════════════════════════════════════════════
 LAYOUT SPECIFICATION
════════════════════════════════════════════

## Page Layout Style
  ${analysis.layoutStyle}

## Navigation
  ${analysis.navigationStyle}
  → Must be sticky/fixed at top
  → Mobile: collapse to hamburger menu at 768px

## Sections (build in this exact order)
${numbered(analysis.sections)}

## Section-by-Section Details
${sectionDetails(analysis)}

## Key UI Components
${list(analysis.keyComponents)}

## Image & Media Patterns
${imagePatterns(analysis)}

## Unique Design Patterns to Match
${list(analysis.uniquePatterns)}

## Component Hierarchy
${componentTreeBlock(analysis)}

════════════════════════════════════════════
 CRITICAL RULES — READ BEFORE BUILDING
════════════════════════════════════════════

${strictRules(tokens, analysis)}

  ✗ DO NOT use Lorem ipsum — use the real headings from the content list above
  ✗ DO NOT change any color values from the Design System
  ✗ DO NOT add sections or components that are not in the list above
  ✓ DO import ${tokens.typography.headingFont} and ${tokens.typography.bodyFont} from Google Fonts
  ✓ DO use the exact font sizes and weights from the Design System
  ✓ DO add smooth hover effects and CSS transitions (200–300ms ease)
  ✓ DO make it fully responsive: 375px → 768px → 1280px+

════════════════════════════════════════════
 ANIMATIONS & INTERACTIONS
════════════════════════════════════════════
  - Fade-in + slide-up on section scroll-into-view (opacity 0→1, translateY 20px→0)
  - Hover: buttons lift with box-shadow, links underline, cards scale(1.02)
  - Nav: background becomes solid (${tokens.colors.background}) on scroll past hero
  - Transition speed: 200ms ease for micro-interactions, 400ms for sections

════════════════════════════════════════════
 OUTPUT
════════════════════════════════════════════
Produce a complete, production-ready implementation using modern web best practices. Every visual detail must match the Design System above.`
}

// ─────────────────────────────────────────────
// Color Palette Export
// ─────────────────────────────────────────────

function buildColorPalette(tokens: DesignTokens): string {
  const { colors } = tokens
  return `# Color Palette — Extracted from Live Website
${tokens.meta?.url ? `Source: ${tokens.meta.url}` : ""}

## Named Colors
  Primary:    ${colors.primary}
  Secondary:  ${colors.secondary}
  Accent:     ${colors.accent}
  Background: ${colors.background}
  Alt BG:     ${colors.backgroundSecondary ?? colors.background}
  Text:       ${colors.text}
  Full Palette: ${rawColors(tokens)}

## CSS Custom Properties
${cssTokenBlock(tokens)}

## Tailwind Config
\`\`\`ts
// tailwind.config.ts
colors: {
  primary:    "${colors.primary}",
  secondary:  "${colors.secondary}",
  accent:     "${colors.accent}",
  background: "${colors.background}",
  bgAlt:      "${colors.backgroundSecondary ?? colors.background}",
  foreground: "${colors.text}",
},
\`\`\`

## Figma / Design Tokens (JSON)
\`\`\`json
{
  "colors": {
    "primary":    { "value": "${colors.primary}" },
    "secondary":  { "value": "${colors.secondary}" },
    "accent":     { "value": "${colors.accent}" },
    "background": { "value": "${colors.background}" },
    "text":       { "value": "${colors.text}" }
  },
  "typography": {
    "headingFont": "${tokens.typography.headingFont}",
    "bodyFont":    "${tokens.typography.bodyFont}",
    "heroSize":    "${heroSize(tokens)}",
    "sectionSize": "${sectionSize(tokens)}",
    "bodySize":    "${bodySize(tokens)}"
  },
  "spacing": {
    "sectionGap":       "${tokens.spacing.sectionGap}",
    "containerPadding": "${tokens.spacing.containerPadding}"
  },
  "radii": {
    "card":   "${cardRadius(tokens)}",
    "button": "${buttonRadius(tokens)}",
    "input":  "${inputRadius(tokens)}"
  }
}
\`\`\``
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

export function buildPromptExports(result: ScanResult): PromptExports {
  const { tokens, analysis } = result

  return {
    v0:           buildV0Prompt(tokens, analysis),
    lovable:      buildLovablePrompt(tokens, analysis),
    cursor:       buildCursorPrompt(tokens, analysis),
    universal:    buildUniversalPrompt(tokens, analysis),
    colorPalette: buildColorPalette(tokens),
  }
}
