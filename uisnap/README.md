<div align="center">

<!-- Banner -->
<img src="assets/icon.png" alt="UISnap Logo" width="120" />

# 🎯 UISnap — Reverse Engineer Any UI in One Click

**Scan any website → Extract its exact design system → Generate AI-ready rebuild prompts**

[![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/Darshan3690/UI_snap)
[![Plasmo](https://img.shields.io/badge/Built%20With-Plasmo-8B5CF6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvc3ZnPg==)](https://www.plasmo.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)

---

**🎬 See UISnap in Action**

<!-- Replace with your actual demo GIF -->
<!-- ![UISnap Demo](assets/demo.gif) -->

*👆 Click "Scan This Page" → Watch colors, fonts, and layout get extracted in real time → Copy the AI-optimized prompt → Paste into v0, Lovable, or Cursor → Get a pixel-perfect clone*

[Try it Now](#-installation) · [Report Bug](https://github.com/Darshan3690/UI_snap/issues) · [Request Feature](https://github.com/Darshan3690/UI_snap/issues)

</div>

---

## 📸 Screenshots

<div align="center">

<!-- Replace with your actual screenshots -->
<!-- 
| Scan Tab | History Tab | Settings Tab |
|:---:|:---:|:---:|
| ![Scan](assets/screenshots/scan.png) | ![History](assets/screenshots/history.png) | ![Settings](assets/screenshots/settings.png) |
-->

*Screenshots coming soon — scan any website and see the magic!*

</div>

---

## 📖 About

**UISnap** is a Chrome extension that performs **UI reverse engineering**. Point it at any website, click "Scan", and it will:

1. **Extract the exact design system** — real hex colors, font families, font sizes, spacing, border-radius values — all read directly from the live CSS, not guessed by AI.
2. **Capture full-page screenshots** — automatically scrolls the page and captures every viewport, with duplicate detection to avoid redundant frames.
3. **Analyze the layout with Gemini AI** — sends the screenshots + extracted tokens to Google's Gemini 1.5 Flash model to understand the page structure, section hierarchy, hero types, gallery patterns, and navigation style.
4. **Generate platform-specific rebuild prompts** — produces 4 highly detailed, expert-level prompts optimized for **v0**, **Lovable**, **Cursor**, and a **Universal** format that works with any AI tool.

The output isn't a generic "build me a landing page" prompt — it includes **your exact colors, your exact fonts, your exact spacing, your real page headings, and section-by-section build instructions** so the AI coding tool can produce a near-pixel-perfect clone.

---

## 💡 Why I Built UISnap

As developers, we often see a beautiful website and think: *"I want to build something like this."* But recreating a UI from scratch is tedious:

- Manually inspecting colors in DevTools? Slow.
- Guessing font sizes? Inaccurate.
- Describing layout to an AI? Vague.

**UISnap bridges the gap.** It automates the entire "reverse engineering" step — from CSS inspection to AI analysis — and hands you a ready-to-paste prompt that actually produces results. No more 20-minute DevTools sessions. No more generic prompts. Scan → Copy → Paste → Build.

---

## ✨ Features

### 🔬 Live DOM Design Token Extraction
- Reads **actual CSS values** via `getComputedStyle` — not screenshots, not guesses
- Extracts: primary/secondary/accent colors, background, text color, all raw palette colors
- Detects heading & body fonts, sizes, weights, and line heights
- Measures section gaps, container padding, border-radius per element type (card, button, input)
- Parses `:root` CSS custom properties for full design system coverage

### 📷 Intelligent Full-Page Screenshot Capture
- Auto-scrolls the entire page from top to bottom
- Captures each viewport as a high-quality screenshot
- Uses **image hashing** to detect duplicate frames (sticky footers, fixed backgrounds)
- Sends up to 6 representative screenshots to the AI for analysis

### 🧠 Gemini AI Visual Analysis
- Identifies: layout style, navigation pattern, design aesthetic, color mood
- Maps every section (Hero, Features, Pricing, Testimonials, Footer, etc.)
- Detects: hero type (static/carousel/text-only), gallery type (grid/masonry/stacked), footer type (minimal/multi-column)
- Provides section-by-section descriptions for precise reconstruction

### 📝 Expert-Level, Platform-Specific Prompts
| Prompt | Optimized For | Tech Stack |
|--------|--------------|------------|
| **V0 Prompt** | Vercel v0 | Next.js 14, Tailwind CSS, shadcn/ui |
| **Lovable Prompt** | Lovable.dev | Vite, React 18, React Router, Framer Motion |
| **Cursor Prompt** | Cursor IDE | Next.js 14, file-by-file spec with folder structure |
| **Universal Prompt** | Any AI tool | Framework-agnostic, works with ChatGPT/Claude/etc. |
| **Color Palette** | Designers | CSS vars, Tailwind config, Figma Design Tokens JSON |

### 🕘 Scan History
- Saves your last **10 scans** automatically to `chrome.storage.local`
- Click any past scan to reload its full results — no need to re-scan
- Shows URL, timestamp, and screenshot count for each entry

### ⚡ Live Progress Preview
- Shows **real-time color swatches** as they're extracted from the page
- Displays a **live screenshot counter** as the page scrolls
- Dynamic status updates: "Extracting tokens..." → "Capturing (3)..." → "Analyzing with Gemini..."

### 🔑 Bring Your Own Key (BYOK)
- Save your own Gemini API key in the Settings tab
- Key is stored in `chrome.storage.local` and **never displayed after saving**
- Bypasses the Cloudflare proxy for direct, faster API calls
- Remove your key anytime with one click

### 🔗 Deep Links
- **V0 Prompt**: Copies prompt + opens `v0.dev/chat` in a new tab
- **Lovable Prompt**: Copies prompt + opens `lovable.dev` in a new tab
- Other prompts: Copy to clipboard with visual confirmation

### ⚠️ Fallback Handling
- If the content script can't read a heavily obfuscated page, tokens are marked as `isFallback`
- A warning banner appears: *"We had trouble reading this site's exact code. The AI will rely mostly on visual screenshots."*
- The scan still completes using AI vision as the primary data source

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHROME BROWSER                           │
│                                                                 │
│  ┌──────────────┐    messages     ┌──────────────────────────┐  │
│  │   Popup UI   │ ◄────────────► │   Background Service     │  │
│  │  (popup.tsx)  │                │   Worker (background.ts) │  │
│  │              │                │                          │  │
│  │  • Scan Tab  │                │  • Orchestrates scan     │  │
│  │  • History   │                │  • Takes screenshots     │  │
│  │  • Settings  │                │  • Calls Gemini API      │  │
│  └──────────────┘                │  • Saves history         │  │
│                                  └──────────┬───────────────┘  │
│                                             │                   │
│                                    messages │                   │
│                                             ▼                   │
│                                  ┌──────────────────────┐      │
│                                  │   Content Script     │      │
│                                  │   (content.ts)       │      │
│                                  │                      │      │
│                                  │  • Reads DOM/CSS     │      │
│                                  │  • Scrolls page      │      │
│                                  │  • Extracts tokens   │      │
│                                  └──────────────────────┘      │
│                                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                   HTTPS    │
                            ▼
              ┌──────────────────────────┐
              │   Cloudflare Worker      │
              │   (worker/index.js)      │         ┌──────────────┐
              │                          │ ──────► │ Google Gemini │
              │  • Hides API key         │         │ 1.5 Flash    │
              │  • Proxies requests      │ ◄────── │              │
              │  • CORS handling         │         └──────────────┘
              └──────────────────────────┘
                            │
                     OR (BYOK mode)
                            │
              User's own API key ──────────────────► Google Gemini
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | [Plasmo](https://www.plasmo.com/) v0.90.5 | Chrome extension framework with React support |
| **UI** | React 18.2 + TypeScript 5.3 | Popup interface with tabs and live preview |
| **AI** | Google Gemini 1.5 Flash | Visual layout analysis from screenshots |
| **Proxy** | Cloudflare Workers | Secure API key proxy (zero-cost serverless) |
| **Storage** | `chrome.storage.local` | Scan history, API key, session data |
| **Screenshot** | `chrome.tabs.captureVisibleTab` | Native Chrome screenshot API |
| **CSS Analysis** | `getComputedStyle` + DOM traversal | Direct CSS token extraction |

---

## 📁 Project Structure

```
uisnap/
├── popup.tsx                    # Main popup UI — tabs, live preview, settings
├── background.ts                # Service worker — scan orchestrator
├── content.ts                   # Content script — injected into web pages
│
├── components/
│   ├── ScanButton.tsx           # Animated scan trigger button
│   ├── ResultPanel.tsx          # Design tokens + analysis display
│   └── ExportButtons.tsx        # Platform prompt buttons with deep links
│
├── lib/
│   ├── types.ts                 # TypeScript interfaces (DesignTokens, ScanResult, etc.)
│   ├── extract.ts               # DOM/CSS design token extraction engine
│   ├── capture.ts               # Full-page screenshot capture with dedup
│   ├── gemini.ts                # Gemini API client (proxy + BYOK support)
│   ├── prompt-builder.ts        # Platform-specific prompt generators
│   └── crawler.ts               # Multi-page link discovery (experimental)
│
├── worker/
│   └── index.js                 # Cloudflare Worker — secure Gemini API proxy
│
├── assets/
│   └── icon.png                 # Extension icon
│
├── package.json                 # Dependencies and manifest config
├── tsconfig.json                # TypeScript configuration
└── .prettierrc.mjs              # Code formatting rules
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Google Chrome** browser

### Chrome Extension Setup

```bash
# 1. Clone the repository
git clone https://github.com/Darshan3690/UI_snap.git
cd UI_snap/uisnap

# 2. Install dependencies
npm install

# 3. Build for production
npm run build
```

### Load into Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `uisnap/build/chrome-mv3-prod` folder
5. Pin the UISnap extension from the puzzle piece icon

### Gemini API Setup (Optional — BYOK)

By default, UISnap uses a shared Cloudflare Worker proxy. For better performance and no rate limits, use your own key:

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key (free tier available)
3. Open UISnap → **Settings** tab
4. Paste your key and click **Save API Key**
5. Your key is stored securely in `chrome.storage.local` and hidden from the UI

---

## ▶️ Running the Project

### Development Mode (with hot reload)

```bash
cd uisnap
npm run dev
```

This starts Plasmo's dev server. Load the extension from `uisnap/build/chrome-mv3-dev` in Chrome. Changes to your source files will automatically reload the extension.

### Production Build

```bash
npm run build
```

Output goes to `uisnap/build/chrome-mv3-prod`. Load this folder in Chrome for the optimized build.

### Package for Distribution

```bash
npm run package
```

Creates a `.zip` file ready for Chrome Web Store submission.

---

## 📖 How to Use

### Step 1: Scan a Website
1. Navigate to any website in Chrome
2. Click the UISnap extension icon
3. Click **"Scan This Page"**
4. Watch the live preview as tokens are extracted and screenshots are captured

### Step 2: Review Results
- **Color swatches** — see the exact hex codes extracted from CSS
- **Typography** — heading and body font families with sizes
- **Analysis** — AI-detected layout style, sections, and patterns
- **Prompt preview** — a snippet of the generated prompt

### Step 3: Copy & Build
- Click **"V0 Prompt"** → Prompt copied + v0.dev opens automatically
- Click **"Lovable Prompt"** → Prompt copied + lovable.dev opens automatically
- Click **"Cursor Prompt"** → Copy and paste into Cursor IDE
- Click **"Universal Prompt"** → Works with ChatGPT, Claude, or any AI

### Step 4: Reload from History
- Switch to the **History** tab to see your last 10 scans
- Click any entry to instantly reload its results

---

## 📝 Prompt Types — What Makes Them Different

### 🔵 V0 Prompt (Vercel)
- **Tech**: Next.js 14 App Router + Tailwind CSS + shadcn/ui
- **Includes**: Tailwind config color block, real page headings, section-by-section instructions
- **Best for**: Quick, beautiful single-page prototypes

### 🟣 Lovable Prompt
- **Tech**: Vite + React 18 + React Router + Framer Motion
- **Includes**: Multi-page app structure (Home, About, Services, Gallery, Contact)
- **Best for**: Full multi-page web applications

### 🟠 Cursor Prompt
- **Tech**: Next.js 14 + TypeScript + shadcn/ui
- **Includes**: Exact folder structure, file-by-file spec, `globals.css` with CSS variables, `tailwind.config.ts` ready to copy
- **Best for**: Developers who want a complete, production-grade codebase

### ⚪ Universal Prompt
- **Tech**: Framework-agnostic
- **Includes**: Full design system with CSS custom properties, strict ✓/✗ rules, animation specs
- **Best for**: Any AI tool (ChatGPT, Claude, Copilot, etc.)

### 🎨 Color Palette
- **Includes**: Named colors, CSS `:root` variables, Tailwind config, Figma Design Tokens JSON
- **Best for**: Designers importing into Figma or building a design system

---

## 🔄 Workflow

```
  ┌─────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
  │  Visit   │────►│  Click   │────►│  UISnap   │────►│  Copy    │
  │  Website │     │  Scan    │     │  Analyzes │     │  Prompt  │
  └─────────┘     └──────────┘     └───────────┘     └────┬─────┘
                                                          │
                  ┌──────────┐     ┌───────────┐          │
                  │  Pixel-  │◄────│  Paste in │◄─────────┘
                  │  Perfect │     │  v0 / AI  │
                  │  Clone!  │     │  Tool     │
                  └──────────┘     └───────────┘
```

---

## 🗺️ Roadmap

- [x] Core scan engine (DOM extraction + screenshots + Gemini)
- [x] Platform-specific prompts (v0, Lovable, Cursor, Universal)
- [x] Scan History (last 10 scans)
- [x] Live progress preview (color swatches + screenshot counter)
- [x] BYOK — Bring Your Own Gemini API Key
- [x] Deep links (auto-open v0.dev / lovable.dev)
- [x] Fallback handling for obfuscated sites
- [ ] **Multi-page crawl** — scan linked pages automatically
- [ ] **Side-by-side comparison** — original vs. generated UI
- [ ] **Export to Figma** — generate a Figma file from tokens
- [ ] **Support OpenAI / Anthropic models** — choose your AI provider
- [ ] **Chrome Web Store listing** — one-click install
- [ ] **Firefox / Edge support** — cross-browser extension
- [ ] **Team sharing** — share scan results via link

---

## 🤝 Contributing

Contributions make open source amazing! Here's how you can help:

### Quick Start

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/UI_snap.git
cd UI_snap/uisnap
npm install
npm run dev
```

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Contribution Ideas

| Area | Ideas |
|------|-------|
| 🎨 UI/UX | Dark/light theme toggle, responsive popup redesign |
| 🧠 AI | Support for OpenAI GPT-4o, Anthropic Claude |
| 📝 Prompts | New prompt templates for Bolt, Replit, WindSurf |
| 🔬 Extraction | Better color ranking, CSS animation detection |
| 🌐 Browser | Firefox WebExtension port, Edge support |
| 📚 Docs | Video tutorials, example scan outputs |

---

## ❓ FAQ

<details>
<summary><b>Is UISnap free?</b></summary>

Yes! UISnap is 100% free and open source. The default mode uses a shared Cloudflare Worker proxy with a free-tier Gemini API key. For unlimited usage, you can add your own free Gemini API key in Settings.
</details>

<details>
<summary><b>Does it work on any website?</b></summary>

It works on most websites. Some heavily obfuscated sites (canvas-based rendering, heavy JavaScript frameworks) may not yield perfect CSS extraction — in those cases, UISnap falls back to AI visual analysis and shows a warning banner.
</details>

<details>
<summary><b>Is my API key safe?</b></summary>

Yes. Your API key is stored locally in `chrome.storage.local` — it never leaves your browser except when making direct API calls to Google. It is never sent to our proxy server. After saving, the key is completely hidden from the UI.
</details>

<details>
<summary><b>Can I use it with ChatGPT or Claude instead of v0?</b></summary>

Absolutely! Use the **Universal Prompt** — it's framework-agnostic and works with any AI coding tool, including ChatGPT, Claude, Copilot, and more.
</details>

<details>
<summary><b>How accurate are the extracted colors?</b></summary>

Colors are read directly from the page's computed CSS via `getComputedStyle` — they are the **exact** hex/rgb values the browser renders, not AI-guessed approximations.
</details>

<details>
<summary><b>Why do I see "Scan failed" on some pages?</b></summary>

This usually happens on:
- `chrome://` internal pages (extensions can't access these)
- Pages that block content scripts via CSP
- PDF viewers or non-HTML content

Try scanning a regular website like `stripe.com` or `apple.com`.
</details>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this project. Attribution is appreciated but not required.

---

## 💬 Support

Having issues or questions?

- 🐛 **Bug Reports**: [Open an issue](https://github.com/Darshan3690/UI_snap/issues/new?template=bug_report.md)
- 💡 **Feature Requests**: [Open an issue](https://github.com/Darshan3690/UI_snap/issues/new?template=feature_request.md)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Darshan3690/UI_snap/discussions)

---

<div align="center">

## ⭐ Star This Repository

If UISnap helped you build something awesome, consider giving it a star!

**Every star motivates me to keep improving UISnap** 🚀

[![Star on GitHub](https://img.shields.io/github/stars/Darshan3690/UI_snap?style=for-the-badge&logo=github&label=Star%20UISnap&color=yellow)](https://github.com/Darshan3690/UI_snap)

---

**Built with ❤️ by [Darshan](https://github.com/Darshan3690)**

*Scan. Copy. Build. Ship.*

</div>
