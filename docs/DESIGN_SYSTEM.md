# 💎 HuMob Design System & AI Compliance Specification

> **Platform**: HuMob (Personal Performance Rating Platform)  
> **Status**: Strict Specification & Source of Truth  
> **Target Aesthetics**: Linear / Vercel / Raycast / Apple Level (Bespoke, High-Contrast, Tactile, Anti-Slop)

---

## 📌 MANDATORY RULES FOR ALL AI AGENTS & DEVELOPERS

Any code changes targeting HuMob's UI/UX MUST strictly enforce the specification outlined in this document.
DO NOT use generic AI templates, purple/blue neon gradients, heavy dark shadows, or rigid 2px bright solid borders.

---

## 🎨 1. Theme Concepts & Color Palettes

HuMob supports **Light Mode & Dark Mode** natively via `next-themes`.

### A. Dark Mode: *"Obsidian Prism"* (Default Theme)
- **Canvas / Background**: Deep Obsidian (`#09090B` / `var(--background)`)
- **Card Surfaces**: Glassmorphic Zinc (`#18181B` / `var(--card)` with `backdrop-blur-md` & 60% opacity)
- **Primary Text**: Porcelain White (`#F4F4F5` / `var(--foreground)`)
- **Muted Text**: Zinc Muted (`#A1A1AA` / `var(--muted-foreground)`)
- **Border Specular**: 1px Subtle Line (`#27272A` / `rgba(255, 255, 255, 0.08)`)

### B. Light Mode: *"Alpine Slate"*
- **Canvas / Background**: Pure Porcelain White (`#FFFFFF` / `var(--background)`)
- **Card Surfaces**: Crisp Neutral (`#FFFFFF` / `var(--card)`)
- **Primary Text**: Obsidian Dark (`#09090B` / `var(--foreground)`)
- **Muted Text**: Slate Muted (`#71717A` / `var(--muted-foreground)`)
- **Border Specular**: 1px Crisp Neutral (`#E4E4E7` / `rgba(0, 0, 0, 0.08)`)

---

## ✒️ 2. Typography System & Three-Tier Hierarchy

All pages MUST utilize the following 3 Google Fonts configured via `next/font/google` in `src/app/layout.tsx`:

1. **Heading / Titles (`font-heading`)**: `Plus Jakarta Sans` (`--font-plus-jakarta`)
   - Mandatory for all `h1`, `h2`, `h3`, `h4`, `h5`, `h6` and display titles.
   - Styling: `font-heading tracking-tight font-semibold`
2. **Body Text / UI Content (`font-sans`)**: `Inter` (`--font-inter`)
   - Mandatory for descriptions, paragraph text, form labels, and UI controls.
   - Styling: `font-sans text-muted-foreground antialiased`
3. **Metrics / Scores / Timers (`font-mono`)**: `JetBrains Mono` (`--font-mono`)
   - Mandatory for all numerical scores (`9.4 / 10.0`), dimension ratings, timers, and streak metrics.
   - Styling: `font-mono tabular-nums tracking-tight` (Prevents layout shift on dynamic updates).

---

## 🎯 3. Performance Rating Score Color Coding

Color indicators MUST dynamically respond to the user's numerical performance score:

| Rating Range | Tier Label | Color | HSL Code | Accent Effect |
| :--- | :--- | :--- | :--- | :--- |
| **9.0 – 10.0** | Perfect / Elite | Sky Cyan | `#06B6D4` / `#38BDF8` | Confetti explosion & Cyan Glow |
| **7.5 – 8.9** | Excellent / Good | Emerald Spark | `#10B981` | Emerald Glow |
| **5.0 – 7.4** | Average / Fair | Warm Amber | `#F59E0B` | Warm Amber Highlight |
| **< 5.0** | Critical / Low | Rose Red | `#EF4444` | Subtle Rose Border |

---

## 💫 4. Pseudo-Classes & Micro-Interaction Standards

### A. Hover State (`:hover`)
- Cards MUST NOT expand with jarring 3D rotation or excessive scaling.
- Apply micro-lift: `hover:-translate-y-0.5 transition-all duration-200`
- Apply subtle border illumination: `hover:border-emerald-500/30`

### B. Active Click State (`:active`)
- Buttons and clickable cards MUST provide physical tactile feedback:
  `active:scale-[0.985] transition-transform duration-100 ease-out`

### C. Precision Focus State (`:focus-visible`)
- NEVER use standard browser outlines.
- Apply precision Emerald ring:
  `focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none`

---

## 🖼️ 5. Glassmorphism & Specular Highlights

### Top-Edge Inner Specular Highlight Line
Instead of heavy solid borders, all cards MUST utilize a top-edge inner specular highlight:
- Dark Mode: `border-t border-white/15`
- Light Mode: `border-t border-black/10`

### Glass Utility Classes
- `.glass-card`: `backdrop-blur-md bg-card/60 border border-border/50`
- `.glass-header`: `backdrop-blur-lg bg-background/80 border-b border-border/40 sticky top-0 z-50`

---

## 🚫 6. STRICTLY FORBIDDEN PATTERNS (Anti-AI Slop Enforcement)

1. ❌ **NO Generic Purple/Blue Neon Gradients**: Do not wrap card borders or buttons in `#8B5CF6` to `#3B82F6` gradients.
2. ❌ **NO Heavy Muddy Shadows**: Do not use `shadow-2xl` with `rgba(0,0,0,0.8)`. Use diffused ambient blurs `shadow-[0_8px_30px_rgb(0,0,0,0.12)]`.
3. ❌ **NO 2px Solid Bright Borders**: Do not use thick neon border lines.
4. ❌ **NO Un-Isolated Heavy Packages in Dashboard**: `@splinetool/react-spline` and `gsap` MUST be isolated to Landing Page (`/`) components via `next/dynamic` with `ssr: false`.
