# Data Storyteller

Your spreadsheet has a story to tell.

Upload a CSV and watch it become a scroll-driven narrative — insights written by AI, charts that animate, numbers that matter.

## Quick Start

```bash
npm install
npm start
```

Opens at `http://localhost:3000`.

## How It Works

1. **Upload** — drag a CSV or click to browse
2. **Analysis** — columns are profiled (date, number, category), aggregates computed, trends detected
3. **Narrative** — Claude AI receives the pre-computed facts and writes a journalist-style scroll story
4. **Fallback** — if the AI call fails, a deterministic engine generates the story locally — the demo never breaks

## Stack

- React 18
- Recharts (animated charts)
- PapaParse (CSV parsing)
- Anthropic API (Claude Sonnet 4.6 for narrative generation)

## Features

- Scroll-driven storytelling (Spotify Wrapped style)
- Progress spine with animated chapter markers
- Animated count-up numbers (Fraunces serif)
- Area, bar, and donut charts with enter animations
- Dark mode first (Editorial Night palette)
- `prefers-reduced-motion` respected
- Keyboard accessible
- Responsive down to mobile
- Copy summary to clipboard
- Sample dataset included (European e-commerce sales)

## Portfolio

Built by Marcos Apolo Milhomem — [modointeligenteai.com.br](https://modointeligenteai.com.br)
