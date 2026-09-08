# FarmSim Tools

A static, in-browser toolkit for Farming Simulator save files — generate a report
or edit your farm directly. Nothing is uploaded or stored: saves are parsed in
your browser and discarded on refresh.

## Stack

React + Vite + TypeScript + Tailwind (v4), React Router. No backend for v1 — see
[docs/FEATURE_MAP.md](docs/FEATURE_MAP.md) for the full rationale.

## Getting started

```
npm install
npm run dev
```

Opens on http://localhost:5173.

## Project docs

Planning history and reference material live in [docs/](docs):

- [PROJECT_LOG.md](docs/PROJECT_LOG.md) — session-by-session decision log
- [FEATURE_MAP.md](docs/FEATURE_MAP.md) — features, tech stack, visual direction
- [FARMSIM_SAVE_REFERENCE.md](docs/FARMSIM_SAVE_REFERENCE.md) — FS25 save file structure, sourced from real saves
- [PROGRESS_TRACKER.md](docs/PROGRESS_TRACKER.md) — build status
- [OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) — resolved and open planning questions
