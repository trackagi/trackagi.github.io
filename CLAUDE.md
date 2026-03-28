# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AGI Progress Tracker — a static site timeline of AI milestones (2010–present). Hand-maintained JSON data files are validated, aggregated, and built into a static site deployed on GitHub Pages.

**Tech**: Python 3.11+ (zero external deps), vanilla JS + CSS, UV package manager, GitHub Actions CI/CD.

## Commands

```bash
./run.sh dev          # Build and serve (http://localhost:8000)
./run.sh build        # Build once → dist/
./run.sh serve        # Serve existing dist/
./run.sh watch        # Auto-rebuild on data/ and static/ changes
./run.sh validate     # Validate all JSON data files
./run.sh lint         # Run ruff + black on scripts/
./run.sh new          # Scaffold a new milestone JSON file
```

Or directly: `uv run python scripts/build.py`, `uv run python scripts/validate.py`

## Path Resolution

Both scripts use `REPO_ROOT = Path(__file__).resolve().parent.parent` — they work from any working directory.

## Code Architecture

### Build Pipeline (`scripts/build.py`, 286 lines)

1. `validate_data_directory()` — stops on errors
2. `load_milestones()` — reads `data/{year}/*.json`, sorted by date
3. `generate_indexes()` — creates lookup tables (by_year, by_month, by_organization, by_tag)
4. `generate_data_json()` — assembles milestones + metadata + indexes
5. `generate_html()` — creates `index.html` with `window.AGI_DATA` embedded
6. `copy_static_files()` — copies CSS/JS from `static/` to `dist/`

### Validation (`scripts/validate.py`, 306 lines)

- `VALID_ORGANIZATIONS` (37 orgs) — unknown org = hard error
- `VALID_TAGS` (60+ tags) — unknown tag = warning only
- `validate_milestone()` — checks required fields, date format, org, level, tags, sources, description length
- `validate_data_directory()` — walks `data/{year}/*.json`

To add a new organization: add to `VALID_ORGANIZATIONS` in `validate.py`.
To add a new canonical tag: add to `VALID_TAGS` in `validate.py`.

### Frontend (`static/js/app.js`, 444 lines)

State object with filters: `timeView` (year/month/all), `level`, `organization`, `search`, `tags` (Set).

Key functions: `init()`, `populateFilters()`, `bindEvents()`, `getFilteredMilestones()`, `groupMilestones()`, `render()`, `createMilestoneCard()`, `setupIntersectionObserver()`

Data flow: `window.AGI_DATA` (embedded by build.py) → JS filters client-side → HTML generated dynamically → IntersectionObserver triggers scroll animations.

### Styling (`static/css/main.css`, 825 lines)

Clean white/gray palette (#fafafa). Organization-colored timeline dots. Responsive breakpoints at 768px and 480px. Minimal animations: fade-in on scroll, smooth expand/collapse.

## Data Schema

Files go in `data/{year}/{descriptive-slug}.json` (kebab-case, no date in filename).

See `CONTRIBUTING.md` for full schema docs, examples, and the `milestone.schema.json` for IDE autocomplete.

Required: `date`, `title`, `organization`, `level`, `tags`, `description`, `sources` (array of `{title, url}`).
Optional: `highlights` (array of strings).

## Key Rules

- **Never edit `dist/`** — it's generated and git-ignored
- Edit source in `data/`, `static/`, `scripts/` — then rebuild
- Validate before building: `./run.sh validate`
- `level` uses a 4-tier system: `landmark` (paradigm shifts), `major` (significant releases), `notable` (worth tracking), `minor` (incremental updates)
- Unknown organization = validation failure; unknown tag = warning only

## CI/CD (`.github/workflows/deploy.yml`)

Two parallel jobs (`lint` + `build`), then `deploy` (main branch only). Uses `astral-sh/setup-uv`. Docs-only changes are skipped via `paths-ignore`.

## Debugging

| Symptom | Fix |
|---------|-----|
| "Unknown organization" | Add to `VALID_ORGANIZATIONS` in `validate.py` |
| "New tag" warnings | Add to `VALID_TAGS` in `validate.py` if canonical |
| Build works but site looks wrong | Check `static/` source files, rebuild, clear browser cache |
| "entr not found" in watch mode | `apt-get install entr` (Linux) or `brew install entr` (macOS) |
