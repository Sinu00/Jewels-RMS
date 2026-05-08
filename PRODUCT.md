# Product

## Register

product

## Users

Two internal roles, both shop staff (never customers):

**Staff** — Counter staff at a physical jewelry shop. Using the app while standing, on a phone, mid-conversation with a customer. They need to find an ornament, create a rental, or process a return in under 30 seconds. Distraction is high. Errors are costly (wrong deposit amount, wrong ornament). They do not manage other accounts or access settings.

**Admin** — Shop owner or manager. Uses a phone or desktop. Needs financial overview, ornament management, and staff control. More deliberate pace than counter staff, but still expects speed.

Each user belongs to one of two physical branches and sees only that branch's data.

## Product Purpose

A digital counter register for a gold and silver ornament rental business in India. Replaces paper notebooks and spreadsheets. Tracks which ornaments are available, who rented what, when items return, and what payments were collected. Sends rental bills and overdue reminders via WhatsApp (wa.me links, no API). Installable on phones as a PWA.

Success looks like: a staff member creates a rental, sends the bill on WhatsApp, and processes the return without ever feeling like they're using software.

## Brand Personality

Clean · Modern · Minimal

Confident and unhurried. Feels like the jewellery itself: precious, considered, nothing wasted. The gold accent is not decoration — it is a signal.

## References

**Linear** — the primary UX reference. Snappy interactions, every tap is immediate. Information that's needed is right there; information that isn't is hidden. Zero loading anxiety. Lists and detail views that feel fast even on slow connections.

## Anti-references

**Tally / legacy ERP / old accounting software** — dense tables, no whitespace, everything is a form field with a label above it, no visual hierarchy. This app should feel nothing like filling out a ledger.

**Loud fintech / crypto dashboards** — neon gradients, glowing accents, aggressive typography, dark mode by default. The anti-pattern of using visual noise as a substitute for clarity.

**Generic SaaS admin panels** — grey sidebars, blue primary buttons, Material or Bootstrap defaults. Should be immediately distinguishable as a purpose-built tool, not a template.

## Design Principles

1. **Speed at the counter.** Every primary action (create rental, process return, search ornament) must complete in two taps or fewer from the screen it starts on. No hunting.

2. **Gold earns its place.** The gold accent marks what matters: active state, primary action, a number that requires attention. It is not used for decoration. If everything is gold, nothing is.

3. **Trust in every number.** Rupee amounts and due dates are never truncated, never ambiguous, never in small text. Financial data is the reason this app exists.

4. **Calm density.** Enough information to act, nothing more. Like Linear's issue list: you can scan it in 2 seconds and know exactly what needs doing.

5. **Mobile is the real product.** Staff stand at the counter with a phone. The mobile layout is the primary design surface. Desktop is a second screen for the owner, not the other way around.

## Accessibility & Inclusion

- All tap targets minimum 44×44px on mobile.
- Sufficient contrast for use in brightly lit shop environments (sunlight on screen).
- No interactions that rely on hover state alone — touch must work for everything.
- Rupee amounts in Indian number formatting (₹1,20,000) — always, no exceptions.
- Phone numbers stored and used with country code 91 for WhatsApp links.
