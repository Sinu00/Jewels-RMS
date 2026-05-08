---
name: Jewelry Rental Manager
description: Internal counter tool for a gold and silver ornament rental business
colors:
  gold-amber: "#B8860B"
  gold-light: "#D4A017"
  gold-deep: "#8B6508"
  warm-ivory: "#FAFAF8"
  paper-white: "#FFFDF7"
  vault-ink: "#1A1A16"
  stone-muted: "#6B6860"
  parchment-border: "#E8E4DC"
  status-green: "#22C55E"
  status-amber: "#F59E0B"
  status-red: "#DC2626"
typography:
  display:
    fontFamily: "DM Serif Display, Georgia, serif"
    fontWeight: 400
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)"
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "DM Sans, sans-serif"
    fontWeight: 600
    fontSize: "1.25rem"
    lineHeight: 1.3
  title:
    fontFamily: "DM Sans, sans-serif"
    fontWeight: 500
    fontSize: "1rem"
    lineHeight: 1.4
  body:
    fontFamily: "DM Sans, sans-serif"
    fontWeight: 400
    fontSize: "0.875rem"
    lineHeight: 1.6
  label:
    fontFamily: "DM Sans, sans-serif"
    fontWeight: 500
    fontSize: "0.75rem"
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.gold-amber}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.gold-deep}"
    textColor: "#FFFFFF"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.vault-ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.stone-muted}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.paper-white}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  badge-active:
    backgroundColor: "#DCFCE7"
    textColor: "#166534"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-overdue:
    backgroundColor: "#FEE2E2"
    textColor: "#991B1B"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-extended:
    backgroundColor: "#FEF3C7"
    textColor: "#92400E"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-returned:
    backgroundColor: "#F3F4F6"
    textColor: "#4B5563"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Jewelry Rental Manager

## 1. Overview

**Creative North Star: "The Vault Door"**

This is a tool that handles other people's gold. The interface must feel like it was made to the same standard as what it manages: minimal weight, maximum trust, nothing ornamental. The vault door aesthetic is not cold or corporate — it is calm confidence. Everything placed with intention. Nothing there by accident.

The gold accent (`#B8860B`) is not decoration. It is the combination. It appears at the active state, the primary action, and the amount that matters. Its rarity is the point. On any given screen, it claims less than 10% of the surface. When a staff member sees gold, they know to pay attention.

This system explicitly rejects three things: the ledger anxiety of Tally-style accounting software (dense tables, no whitespace, every field labeled above it in 9px text), the aggression of fintech dashboards (gradients, glows, dark mode by default, visual noise as a substitute for hierarchy), and the forgettable genericness of SaaS admin panels (grey sidebar, blue primary button, Material defaults). If any element looks like it was designed for a generic product, redesign it.

**Key Characteristics:**
- Flat surfaces with warm tints — depth through tonal contrast, never box-shadows at rest
- Two-font system: DM Serif Display for financial amounts and primary headings; DM Sans for all operational text
- Gold earns every pixel it occupies
- Touch-first sizing — 44×44px minimum tap targets throughout
- Indian rupee formatting (`₹1,20,000`) always; amounts are never small, never truncated

## 2. Colors: The Vault Palette

One accent, one set of warm neutrals, three functional status signals.

### Primary
- **Dark Amber Gold** (`#B8860B`): The sole accent color. Used for: active nav state, primary button fill, focus rings, the item code monospace label, section headers, selected state highlights. Never used purely decoratively. The parchment background makes it feel warm and precious, not corporate.
- **Hovered Amber** (`#D4A017`): Gold hover state only. One step lighter. Signals interactivity without shouting.
- **Deep Amber** (`#8B6508`): Gold active/pressed state. One step darker. Confirms commitment.

### Neutral
- **Warm Ivory** (`#FAFAF8`): App background. Not pure white — a barely-there warm tint that reads as premium against cooler surroundings.
- **Paper White** (`#FFFDF7`): Card and panel surfaces. One step warmer than the background. This is how layers are expressed without shadows.
- **Vault Ink** (`#1A1A16`): Primary text. A near-black with a trace of warm brown. Never `#000000`.
- **Stone Muted** (`#6B6860`): Secondary text, labels, metadata, captions. Enough contrast to read; not enough to compete with primary content.
- **Parchment Border** (`#E8E4DC`): Dividers, card borders, input strokes. Warm, not grey.

### Status (functional only)
- **Available Green** (`#22C55E` dot, `#DCFCE7` / `#166534` badge): Ornament is in stock.
- **Rented Amber** (`#F59E0B` dot, `#FEF3C7` / `#92400E` badge): Out on rental, within due date.
- **Overdue Red** (`#DC2626` dot, `#FEE2E2` / `#991B1B` badge): Past due. Always paired with explicit day count.

**The One Voice Rule.** The gold accent is used on ≤10% of any given screen. If everything is gold, nothing is. Restrained use is what makes the active state feel like a signal.

**The Warm Neutral Rule.** Every surface, every border, every divider must be tinted warm. A cold grey anywhere reads as a foreign element imported from a different system. Reach for `#E8E4DC` not `#E5E7EB`.

## 3. Typography

**Display Font:** DM Serif Display (400 weight only, with Georgia serif fallback)
**Body Font:** DM Sans (300, 400, 500, 600; with system sans fallback)

**Character:** The pairing carries the core product tension. DM Serif Display brings the weight and authority of a ledger entry — it is used for rupee amounts precisely because financial figures deserve typographic gravity. DM Sans is modern, neutral, and effortless at small sizes on phone screens. Together they separate "what the number says" from "what needs to be done about it."

### Hierarchy
- **Display** (Serif, 400, clamp(1.5rem to 2.25rem), 1.1 line-height): Rupee amounts in the deposit refund banner, rental totals, large stat card values. Only used when a number is the primary information on screen.
- **Headline** (DM Sans, 600, 1.25rem, 1.3): Page titles, section headers, modal headers. Not decorative — always functional.
- **Title** (DM Sans, 500, 1rem, 1.4): Card titles, ornament names, customer names, rental numbers in list rows.
- **Body** (DM Sans, 400, 0.875rem, 1.6): All descriptive text, notes, form labels when positioned inline. Max line length 65ch on desktop.
- **Label** (DM Sans, 500, 0.75rem, 0.01em tracking): Form field labels above inputs, metadata captions, badge text, item codes in monospace context. Never smaller than 0.75rem.

**The Serif Amount Rule.** DM Serif Display is reserved for rupee amounts and primary screen headings. It must not appear on labels, buttons, form fields, metadata, or navigation. Its scarcity is what gives financial figures their weight.

**The Mono Code Rule.** Item codes (`NEC0042`, `RNG0003`) are always displayed in a monospace font (system-ui-monospace or `font-mono`) with the gold-amber color. They are identifiers, not text — they need visual separation from ornament names.

## 4. Elevation

This system is flat by default. Surfaces are differentiated through background tints: `#FAFAF8` (app background) → `#FFFDF7` (card surface) → `#FFFFFF` (input field). No box-shadow at rest.

The one exception is hover state on interactive cards and list rows: a single ambient shadow appears on hover to confirm interactivity. It disappears on touch devices where hover does not exist.

### Shadow Vocabulary
- **Hover lift** (`0 2px 8px rgba(26, 26, 22, 0.08)`): Applied on mouse hover to cards and rental list rows only. Signals "this is clickable" without changing layout. Never used on mobile.
- **Floating action** (`0 4px 16px rgba(26, 26, 22, 0.14)`): The floating "New Rental" button on mobile. Must elevate above content without dominating it.

**The Flat-By-Default Rule.** A card at rest has a border (`1px solid #E8E4DC`) and a warm white background. That is all. If you are reaching for `box-shadow` on a resting card, reach for a background tint instead.

## 5. Components

### Buttons
Clean, understated, confident. Buttons do not call attention to themselves until they are the right action to take.

- **Shape:** Gently rounded edges (8px radius). Not pill-shaped — decisive but not aggressive.
- **Primary:** Gold amber fill (`#B8860B`), white text (DM Sans 500, 0.875rem), 10px top/bottom padding, 16px left/right. Hover: `#8B6508`. Active: scale(0.97).
- **Focus ring:** 2px solid `#B8860B`, 2px offset. No box-shadow glow — a precise ring only.
- **Outline:** Transparent fill, `1px solid #E8E4DC` border, ink text. For secondary actions that appear beside a primary. Hover: `#FFFDF7` background.
- **Ghost:** No border, no fill, stone-muted text. For navigation-level actions (Back, Cancel). Hover: `#FAFAF8` background.
- **Destructive:** Red-600 fill (`#DC2626`), white text. Only for irreversible actions. Not styled like a primary button — the color signals the weight.
- **Size — icon-only:** 40×40px, rounded-lg, outline variant. For WhatsApp send, edit, delete in context.

**The No Emoji Button Rule.** Buttons contain text and optionally a Lucide icon. Never emoji in button labels.

### Badges / Status Chips
Pill shape (9999px radius), 0.75rem DM Sans 500, 2px vertical / 10px horizontal padding. Color-coded by rental status:
- ACTIVE: green-100 background, green-800 text
- OVERDUE: red-100 background, red-800 text (always accompanied by a day count)
- EXTENDED: amber-100 background, amber-800 text
- RETURNED: gray-100 background, gray-600 text

**The Badge Never Alone Rule.** OVERDUE badges must always appear with the explicit days-overdue count (`3d overdue`) as separate text alongside. The badge signals urgency; the count quantifies it.

### Cards / Containers
The basic surface unit of the interface.

- **Corner style:** Gently rounded (12px radius). Consistent across all cards.
- **Background:** Paper White (`#FFFDF7`)
- **Border:** `1px solid #E8E4DC` — warm, barely-there
- **Shadow:** None at rest. Hover lift shadow (`0 2px 8px rgba(26,26,22,0.08)`) on desktop only.
- **Internal padding:** 16px uniform for standard cards; 12px for compact list rows.
- **Divided cards** (detail views): use `border-t border-parchment` dividers within a single card, not nested cards.

**The No Nested Cards Rule.** Cards do not contain cards. If content within a card needs visual grouping, use a light background tint (`bg-bg`) or a border-top divider. Never a card inside a card.

### Inputs / Fields
- **Style:** White background, `1px solid #E8E4DC` border, 8px radius, 10px vertical / 12px horizontal padding.
- **Focus:** `ring-2 ring-gold` (2px solid `#B8860B`, 2px offset). Border color does not change — only the focus ring appears.
- **Placeholder:** Stone-muted color (`#6B6860`). Descriptive, not instructional ("Customer name" not "Enter the customer's full name here").
- **Error state:** Red-600 ring, red-50 background tint, error message in red-600 below the field. No icons in the field.
- **Disabled:** 50% opacity. Cursor not-allowed. No background change.

### Navigation
**Mobile (bottom nav):** Fixed bottom bar, 5 icons, warm-ivory background, `1px solid #E8E4DC` top border. Active icon: gold-amber. Inactive: stone-muted. Labels beneath icons at 0.625rem. Safe area inset padding on iPhone. Floating New Rental button (`#B8860B` fill, 56×56px circle, Plus icon, 4px above the nav bar right edge) overlays both nav and content.

**Desktop (sidebar):** 240px fixed left sidebar. Paper-white background, parchment-border right border. Active nav item: gold/10% background tint, gold text, DM Sans 500. Inactive: stone-muted text, transparent background. User avatar + name + role at the bottom, sign-out button as ghost.

**The Mobile-First Navigation Rule.** Every primary action must be reachable without the sidebar. The bottom nav and floating button are the only navigation that matters for counter staff.

### Rupee Amount Display
The signature component. Financial figures use DM Serif Display, sized by context (xl in deposit refund banner, lg in totals, md in line items, sm in metadata).

- Deposit refund amounts: displayed in a gold-tinted panel (`bg-gold/10`, `border-2 border-gold`) with the label "Refund to Customer" above. The amount must be the visually dominant element on the return screen.
- Running totals in wizard: right-aligned, gold color, DM Serif Display.
- Payment records: green for incoming (`+₹X`), red for outgoing (`-₹X`).

**The Amount Visibility Rule.** Rupee amounts are never truncated, never in muted color (except historical metadata), never in body-size text when they are the primary information. If someone needs to act on a number, it must be the largest and most prominent thing on screen.

### Item Codes (monospace identifier)
`font-mono`, gold-amber color (`#B8860B`), 0.75rem, not bold. Always displayed above the ornament name in cards and list rows. A staff member should be able to find NEC0042 by scanning item codes before scanning names.

## 6. Do's and Don'ts

### Do:
- **Do** use DM Serif Display exclusively for rupee amounts and primary page headings. Every other element uses DM Sans.
- **Do** display rupee amounts in Indian number formatting — `₹1,20,000` not `₹120,000`. Always, without exception.
- **Do** show the deposit refund amount in a visually dominant gold-tinted panel on the return screen. It is the most important number in that flow.
- **Do** use warm neutral tints (`#E8E4DC` borders, `#FFFDF7` card backgrounds) throughout. Every divider and border must read warm.
- **Do** accompany every OVERDUE status badge with an explicit day count in text.
- **Do** enforce 44×44px minimum tap targets on all interactive elements.
- **Do** display item codes in monospace gold type above ornament names — they are identifiers, not metadata.
- **Do** keep the gold accent under 10% of any screen's surface area. It signals state, not style.

### Don't:
- **Don't** use `box-shadow` on cards or panels at rest. Depth is conveyed through background tint differences only.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards, callouts, or list items. Prohibited. Rewrite with background tints or full borders.
- **Don't** use gradient text (`background-clip: text` with gradient). All text is a single solid color.
- **Don't** build screens that look like Tally or legacy ERP software: no dense tables without whitespace, no label-above-every-field-in-9px-caps layouts, no information overload.
- **Don't** build screens that resemble fintech or crypto dashboards: no neon gradients, no glowing accents, no aggressive typographic hierarchy, no dark mode applied globally.
- **Don't** use generic SaaS admin panel defaults: no gray sidebar with blue primary buttons, no Material or Bootstrap component defaults unmodified.
- **Don't** truncate rupee amounts. If an amount does not fit, change the layout. The number is the product.
- **Don't** use cold grey anywhere in neutral palette. `#E5E7EB` is foreign. `#E8E4DC` is the border. Every neutral is warm.
- **Don't** nest cards inside cards. Group content within a card using `border-top` dividers or background tints.
- **Don't** display modals for confirmations that can be handled inline or with a bottom sheet. Modals are the last resort.
- **Don't** use emoji in button labels, headings, or navigation. Lucide icons only.
