# Vito deck — Excalidraw slides

The full pitch deck, built as Excalidraw slides (16:9). Each slide is a `.excalidraw` source + a rendered `.png`. The presentable deck is `../vito-deck.md` (Marp), which displays these PNGs full-bleed.

| # | Slide | Source |
|---|-------|--------|
| 1 | Title — "Bring Your Own AI" | `01-title.excalidraw` |
| 2 | The shift (chatbot → app-in-assistant) | `02-shift.excalidraw` |
| 3 | How it works (architecture) | `03-architecture.excalidraw` |
| 4 | One experience, by role | `04-by-role.excalidraw` |
| 5 | Why this wins | `05-why-wins.excalidraw` |
| 6 | Proven — not a concept | `06-proven.excalidraw` |
| 7 | Where this goes (vision) | `07-vision.excalidraw` |

## Editing / re-rendering

Edit a `.excalidraw` (or open it at [excalidraw.com](https://excalidraw.com)), then re-render to PNG:

```bash
cd ../../.claude/skills/excalidraw/references
uv run python render_excalidraw.py ../../../../docs/slides/03-architecture.excalidraw
```

Exec-facing wording is intentionally **timeline-free** (see `../call-notes.md`). Talking points + objection handling live in `../pitch.md`; the prose exec summary is `../executive-summary.md`.
