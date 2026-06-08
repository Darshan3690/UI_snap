export type ScanStatus =
  | "idle"
  | "capturing"
  | "extracting"
  | "analyzing"
  | "building"
  | "done"
  | "error"

export interface DesignTokens {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    backgroundSecondary?: string | null
    raw?: string[]
  }
  typography: {
    headingFont: string
    bodyFont: string
    headingSizes: string[]
    bodySize: string
    allDeclaredFonts?: string[]
    heroFontSize?: string
    sectionFontSize?: string
    bodyFontSize?: string
    headingWeight?: string
    bodyWeight?: string
    lineHeight?: string
  }
  spacing: {
    sectionGap: string
    containerPadding: string
  }
  borderRadius: string
  borderRadiusByType?: {
    card?: string
    button?: string
    input?: string
    image?: string
  }
  components: string[]
  headings?: string[]
  meta?: {
    title: string
    description: string
    pageHeight: number
    viewportHeight: number
    scrollSteps: number
    url: string
  }
  rootVars?: Record<string, string>
}

export interface GeminiAnalysis {
  layoutStyle: string
  navigationStyle: string
  sections: string[]
  designStyle: string
  colorMood: string
  keyComponents: string[]
  uniquePatterns: string[]
  sectionDetails?: Record<string, string>
  imagePatterns?: string[]
  responsiveHints?: string
  componentTree?: string[]
}

export interface PromptExports {
  v0: string
  lovable: string
  cursor: string
  universal: string
  colorPalette: string
}

export interface ScanResult {
  screenshots: string[]
  screenshotCount: number
  pageHeight: number
  scrollSteps: number
  tokens: DesignTokens
  analysis: GeminiAnalysis
  prompts: PromptExports
}
