# Frontend UI/UX Reference Guide

> **Purpose:** Practical UI/UX patterns for building polished hackathon demo apps fast.
>
> **Adapted from:** [Badminton Warriors UI/UX Research](https://github.com/badmintonwarriors/core/blob/d13f04d88c7761cda9b30d6dd17761e9b47e3679/docs/frontend-uiux-research.md)
>
> **Date:** 2026-03-28

---

## Table of Contents

1. [Design Systems & Principles](#1-design-systems--principles)
2. [Mobile-First & Responsive Patterns](#2-mobile-first--responsive-patterns)
3. [Accessibility Essentials](#3-accessibility-essentials)
4. [Performance & Perceived Speed](#4-performance--perceived-speed)
5. [Micro-interactions & Delight](#5-micro-interactions--delight)
6. [Color & Typography](#6-color--typography)
7. [Component Priority for Demos](#7-component-priority-for-demos)

---

## 1. Design Systems & Principles

### Key Principles

- **Material Design 3 Expressive** (2025) replaces duration-based easing with physics-driven spring motion — animations that bounce, stretch, and respond to touch organically. Backed by 46 research studies with 18,000+ participants.
- **Shopify Polaris** pillars: usability (clear affordances, minimal cognitive load), consistency (shared patterns reduce decision fatigue), accessibility (baked in, not bolted on), and scalability.
- **Apple HIG** core triad: Clarity (legible, precise), Deference (UI focuses on content), Depth (visual layers convey hierarchy).
- **M3 Expressive** added 35 new shape tokens. Shape as information hierarchy (rounder = friendlier, sharper = transactional/data).

### 2025-2026 Trends

- **Functional motion** as gold standard: Linear, Notion, Arc Browser lead with minimal, context-driven interactions. Decorative animation is out; purposeful animation is in.
- **Design tokens over hardcoded values**: Semantic naming enables theming and consistency.
- **Emotional resonance over strict consistency**: M3 Expressive prioritizes creativity and emotional resonance within a unified system.

### Patterns to Adopt

| Pattern | Source | Use Case |
|---------|--------|----------|
| Spring-based motion physics | M3 Expressive | State transitions, loading animations |
| Density toggle (condensed/regular) | IBM Carbon | Data-heavy views vs. casual browsing |
| Semantic design tokens | Polaris, M3 | All styling — enforce from day one |
| Contextual side panels | Atlassian | Detail views on desktop |
| Shape as hierarchy | M3 Expressive | `rounded-full` for avatars; `rounded-md` for cards |

### Patterns to Avoid

| Pattern | Why |
|---------|-----|
| Over-animated interfaces | 73% of users associate smooth animations with trust, but excessive motion causes fatigue. Stick to 250-400ms transitions |
| AI-driven dynamic color | Dilutes brand identity; keep your palette stable |
| Web Components in React projects | React ecosystem has better tooling with Radix/shadcn |

### Sources

- [Material 3 Expressive](https://supercharge.design/blog/material-3-expressive)
- [Shopify Polaris](https://polaris-react.shopify.com/design)
- [IBM Carbon Design System](https://carbondesignsystem.com/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

## 2. Mobile-First & Responsive Patterns

### Key Principles

- **Bottom tab navigation is gold standard** for mobile. 4-5 items max. 40% faster task completion vs. hamburger menus.
- **Thumb zone design**: Most frequent actions in the lower half of the screen. Bottom nav bars increase daily active users by 65-70%.
- **Tablet is its own breakpoint**, not "big mobile." 2-column grids + side panels.

### Responsive Layout Strategy

| Breakpoint | Layout |
|-----------|--------|
| < 640px (Mobile) | Single column. Touch targets 48x48px min. Bottom tab bar. Full-width cards |
| 640-767px (Large mobile) | Same as mobile, wider padding |
| 768-1023px (Tablet) | 2-column grids. Side panels for detail views |
| 1024-1279px (Desktop) | Sidebar nav (collapsible). 2-3 column content |
| >= 1280px (Wide desktop) | Sidebar expanded. Content max-width 960-1120px centered |

### Navigation Patterns

| Pattern | When to Use |
|---------|-------------|
| **Bottom tab bar** | Primary mobile nav (3-5 items) |
| **Bottom sheet** | Secondary nav, "More" menus, modals |
| **Slide-in sidebar** | Desktop/tablet primary nav |
| **Floating action button** | Single primary creation action (mobile only) |

### Patterns to Avoid

| Pattern | Why |
|---------|-----|
| Hamburger menu as primary nav | 40% slower task completion. Hides navigation from users |
| Identical mobile/desktop layouts | Mobile needs different information hierarchy |
| Relying on hover states for mobile | No hover on touch devices |
| Complex multi-finger gestures | Low accuracy; always provide button alternatives |

### Sources

- [Mobile Navigation UX 2026](https://www.designstudiouiux.com/blog/mobile-navigation-ux/)
- [Responsive Design Best Practices 2025](https://www.adicator.com/post/responsive-design-best-practices)
- [Mobile-First Design - Figma](https://www.figma.com/resource-library/mobile-first-design/)

---

## 3. Accessibility Essentials

### Key Principles

- **WCAG 2.2 AA** is the target. European Accessibility Act in force since June 2025.
- **POUR principles**: Perceivable, Operable, Understandable, Robust.
- **Automated tools catch only ~40% of issues.** Manual testing with screen readers and keyboard is essential.

### Quick Checklist for Demo Apps

**Semantic HTML:**
- Use `<header>`, `<nav>`, `<main>`, `<footer>` — not generic divs
- Heading hierarchy: H1 → H2 → H3 without skipping
- Every page has exactly one `<main>` landmark

**Focus Management (Critical for SPAs):**
- After route changes, focus the main content container
- Skip links: "Skip to main content"
- Tab order follows visual order. Never use positive `tabindex`

**Forms:**
- Every input has a visible `<label>` with matching `htmlFor`/`id`
- Error messages use `role="alert"` + `aria-live="assertive"`
- Focus first error field on failed validation

**Dynamic Content:**
- Loading states: `role="status"` with `aria-live="polite"`
- Search results: announce count changes

**Color & Contrast:**
- Minimum 4.5:1 contrast ratio for normal text, 3:1 for large text
- Never rely on color alone to convey information — use icons/text too
- Test with colorblindness simulators

**Touch Targets:**
- Minimum 48x48px for all interactive elements

### Sources

- [React Accessibility Best Practices - AllAccessible](https://www.allaccessible.org/blog/react-accessibility-best-practices-guide)
- [WCAG 2.2 Complete Guide 2025](https://www.allaccessible.org/blog/wcag-22-complete-guide-2025)

---

## 4. Performance & Perceived Speed

### Key Principles

- **Perceived speed > actual speed.** Skeleton screens are perceived as 30% faster than spinners.
- **Core Web Vitals targets:** LCP < 2.5s, INP < 200ms, CLS < 0.1.
- **A one-second delay reduces conversions by 7%.**

### Skeleton Loading

- Match skeleton shape to actual content dimensions
- Animate with shimmer effect (left-to-right gradient pulse)
- Disappear progressively as content loads
- Use for all async data fetches — never a full-page spinner

### Optimistic UI Updates

| Action Type | Optimistic? | Reasoning |
|------------|-------------|-----------|
| Like, follow, mark read | Yes | Low risk, frequent, reversible |
| Submit form, API call | No | Server must confirm |
| Send message | Yes | Show as "sending..." then confirm |

### Image Performance

- Lazy load all images below the fold (`loading="lazy"`)
- Use WebP/AVIF format with JPEG fallback (25-35% smaller)
- Always specify width/height on images to prevent CLS
- Responsive images with `srcset` and `sizes`

### Bundle Targets

| Segment | Target |
|---------|--------|
| Initial shell (nav + layout) | < 100KB gzipped |
| Route-specific code | < 50KB gzipped per route |
| Heavy features (charts, editors) | Loaded on demand |
| Images | < 200KB per above-the-fold image |

### Patterns to Avoid

| Pattern | Why |
|---------|-----|
| Full-page loading spinners | Skeleton screens are 30% perceived faster |
| Loading all data upfront | Fetch only what's visible, lazy load the rest |
| Unoptimized images | Single largest cause of slow LCP |
| Layout shifts from dynamic content | Always reserve space for dynamic elements |

### Sources

- [Skeleton Screens vs Spinners](https://ui-deploy.com/blog/skeleton-screens-vs-spinners-optimizing-perceived-performance)
- [Core Web Vitals 2025](https://www.enfuse-solutions.com/core-web-vitals-2025-new-benchmarks-and-how-to-pass-every-test/)
- [Uber Web Booking Flow](https://www.uber.com/blog/web-booking-flow/)

---

## 5. Micro-interactions & Delight

### Animation Budget

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Button press | 150ms | ease-out |
| Card hover (desktop) | 250ms | ease-out |
| Page transition | 300-400ms | ease-out-expo |
| Bottom sheet open | 400ms | ease-out-expo |
| Bottom sheet close | 300ms | ease-in |
| Toast appear | 300ms | ease-out-back |
| Toast dismiss | 250ms | ease-in |
| Celebration moment | 800ms | ease-out-back |
| Skeleton shimmer | 1500ms loop | linear |

### Empty State Design

Every empty state must guide toward the first meaningful action.

**Rules:**
- Always provide at least one actionable CTA
- Tone: encouraging, not apologetic. "Ready to start?" not "Sorry, nothing found"
- Use illustrations sparingly (one per state)
- On mobile, keep compact

### Error State Design

- **Inline errors** near the problem, not in a separate summary
- **Actionable messages**: "This failed. Try X." not "Error 500"
- **Toast errors** for background operations with "Retry" button
- **Full-page errors** only for catastrophic failures
- **Never show raw error codes or stack traces**

### Patterns to Avoid

| Pattern | Why |
|---------|-----|
| Animation on every state change | Motion fatigue |
| Bounce/rubber-band on every button | Feels juvenile. Reserve bouncy easing for celebrations |
| Loading animations that block interaction | Use skeletons that allow scrolling |
| Aggressive onboarding tours | Users skip them. Use contextual tooltips |

### Sources

- [Motion UI Trends 2025](https://www.betasofttechnology.com/motion-ui-trends-and-micro-interactions/)
- [Framer Motion Micro-Interactions](https://siadesign.ee/en/blog/micro-interactions-framer-motion/)

---

## 6. Color & Typography

### Color Application Principles

- **High saturation for interactive elements**: CTAs, status indicators, active states
- **Low saturation for backgrounds and containers**: Barely tinted, enough to add warmth without competing
- **Never rely on color alone**: Always pair with icons/text for state

### Color Psychology by Demo Type

| Demo Type | Suggested Palette | Psychology |
|-----------|------------------|------------|
| Creative/generative (image, art) | Vibrant purples, magentas | Creativity, imagination |
| Voice/speech | Warm blues, teals | Communication, trust |
| Video generation | Deep indigos, cinematic dark tones | Immersion, storytelling |
| Music | Rich oranges, warm tones | Energy, emotion |
| Multi-modal | Neutral dark + accent per mode | Focus on content, not chrome |

### Typography

- **Data-dense views**: Tighter line heights (1.2-1.3), monospace for numbers
- **Content-rich views**: Generous line heights (1.5-1.6), body text >= 15px
- **Mobile**: Never below 14px for body text
- **Hierarchy through weight**: Bold (600-700) for headings, regular (400) for body

### Dark Mode (Recommended for AI Demos)

- Use dark gray (`#121212`) instead of pure black — saves 67% power on OLED, reduces eye strain
- Maintain 4.5:1 contrast for all text
- Surface hierarchy: base dark gray, raised slightly lighter
- AI-generated content stands out better on dark backgrounds

### Sources

- [Psychology of Color in UX - Smashing](https://www.smashingmagazine.com/2025/08/psychology-color-ux-design-digital-products/)
- [Dark Mode UX 2025](https://www.influencers-time.com/dark-mode-ux-in-2025-design-tips-for-comfort-and-control/)

---

## 7. Component Priority for Demos

### Must-Have (Every Demo)

| Component | Notes |
|-----------|-------|
| Button (primary, secondary, disabled) | Consistent across all demos |
| Input / Textarea | For prompts and text entry |
| Loading skeleton / shimmer | For all async API calls |
| Error state | Inline + toast |
| Empty state | "Enter a prompt to get started" |
| Responsive layout | Works on phone and laptop |

### Should-Have (Polish)

| Component | Notes |
|-----------|-------|
| Toast notifications | Success/error feedback |
| Card component | For displaying results |
| Modal / Bottom sheet | For settings, details |
| Progress indicator | For long-running generation tasks |
| Copy-to-clipboard button | For sharing results |

### Nice-to-Have (Wow Factor)

| Component | Notes |
|-----------|-------|
| Spring animations (Framer Motion) | For results appearing |
| Before/after slider | For image comparison demos |
| Audio waveform visualizer | For speech/music demos |
| Gallery / carousel | For batch generation results |
| Share button (copy link, download) | For demo output sharing |

---

## Appendix: Data-Dense Interface Patterns

For demos that display structured output (tables, dashboards, analytics):

### KPI Card Pattern

```
+------------------+
| Primary Metric   |  <- Large bold number
| $1,234 (+12%)    |  <- Trend indicator (green/red)
| [sparkline]      |  <- Tiny inline chart
| vs. last week    |  <- Context label
+------------------+
```

### Data Table Best Practices

- Left-align text, right-align numbers
- Monospace fonts for numeric columns
- Row density: 40px condensed, 48px regular, 56px relaxed
- Max 3 quick filters visible, "+ More" for the rest
- Always show "last updated" timestamp for real-time data

### Chart Selection Guide

| Question | Chart Type |
|----------|-----------|
| "How is X trending?" | Line chart |
| "What's the distribution?" | Bar chart |
| "Proportion breakdown?" | Stacked bar (not pie chart for >5 segments) |
| "Utilization over time?" | Heatmap |
| "Progress toward goal?" | Progress bar / gauge |

### Sources

- [Dashboard Design Principles 2025](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [Data Table UX Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables)
- [Essential Chart Types - Atlassian](https://www.atlassian.com/data/charts/essential-chart-types-for-data-visualization)
