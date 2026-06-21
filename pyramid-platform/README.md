# Pyramid Backstage — Event Operations Platform

An event-operations platform for **The Pyramid of Tirana**. Built for the
JunctionX Tirana 2026 "Pyramid Backstage" challenge.

It turns an event request into a fully resourced, execution-ready plan — and
answers, instantly, *"can this event happen?"* and *"what's next?"*

---

## What's inside

The app has three connected experiences:

1. **AI Assistant (landing)** — the first thing a planner sees. Describe an event
   in one sentence ("a conference for 180 people on 14 July") and the assistant
   matches a hall, checks the date, lists assets, and prices it. From there you can
   go backstage or tour the building.
2. **Backstage** — the full staff platform: Dashboard, Requests (4-step flow),
   Calendar with conflict detection, Inventory with QR tags, Tasks & Teams, and an
   Activity log.
3. **Floor tour** — a scroll-driven descent through the Pyramid, floor by floor,
   ending at **floor −1** where the four halls (Blue, Orange, Green, Yellow) are
   chosen.

---

## Run it

No build step. It's plain HTML/CSS/JS.

**Option A — just open it**
Double-click `index.html`, or open it in your browser.

**Option B — VS Code Live Server (recommended)**
1. Open this folder in Visual Studio Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` → **Open with Live Server**.

> The AI assistant calls the Anthropic API when available and falls back to a
> built-in local parser otherwise, so it works fully offline for demos.

---

## Files

```
pyramid-platform/
├── index.html      Markup for all three experiences
├── styles.css      All styling (design tokens at the top under :root)
├── app.js          State, AI parsing, views, the tour — all logic
├── README.md       This file
└── docs/
    └── pyramid-platform-design.docx   Full design & architecture document
```

---

## Customising

- **Social links** — edit `buildSocials()` in `app.js`; replace the `#`
  placeholders with the Pyramid's real Instagram / Facebook / X / LinkedIn /
  YouTube URLs.
- **Halls, rates, capacities** — the `SPACES` array at the top of `app.js`.
- **Inventory, teams, seed events** — the `state` object in `app.js`.
- **Colours & type** — the `:root` block at the top of `styles.css`.

---

## Tech

Vanilla HTML, CSS, and JavaScript — no framework, no dependencies, no build.
Fonts load from Google Fonts. Designed to be readable and easy to extend by a
small team, and to scale later.
