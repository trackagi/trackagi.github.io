# Agents Guide

## Project Summary

This repository builds a static "AGI Progress Tracker" site from hand-maintained JSON milestone files.

- Source data lives in `data/{year}/*.json`.
- Frontend source lives in `static/css/main.css` and `static/js/app.js`.
- Build and validation logic lives in `scripts/build.py` and `scripts/validate.py`.
- `dist/` is generated output and is ignored by git. Do not hand-edit it.

## Working Rules

- Verified working commands:
  - `./run.sh validate`
  - `./run.sh build`
  - `./run.sh serve`
  - `./run.sh dev` (build + serve)
  - `./run.sh lint` (ruff + black)
  - `./run.sh new` (scaffold milestone)
  - `uv run python scripts/validate.py`
  - `uv run python scripts/build.py`
- Both scripts resolve paths via `Path(__file__).resolve().parent.parent` (REPO_ROOT), so they work from any directory.

## Data Changes

When adding or editing milestones:

- Put each milestone in its own file under `data/{year}/{descriptive-slug}.json`.
- Keep the file name descriptive and in kebab-case. Do not put the date in the file name.
- Required fields are:
  - `date`
  - `title`
  - `organization`
  - `level`
  - `tags`
  - `description`
  - `sources`
- Optional field:
  - `highlights`
- Dates must use `YYYY-MM-DD`.
- `level` must be `high` or `low`.
- Keep descriptions factual and specific. Every entry needs at least one source object with `title` and `url`.

## Tag And Organization Maintenance

The validator enforces `VALID_ORGANIZATIONS` and warns on tags not present in `VALID_TAGS` in `scripts/validate.py`.

- If you introduce a genuinely new organization, add it to `VALID_ORGANIZATIONS`.
- If you introduce a new canonical tag, add it to `VALID_TAGS`.
- Current validation passes, but it emits warning-only output for several tags already present in the dataset. Do not confuse those warnings with hard failures.

## Frontend And Build Notes

- `scripts/build.py` validates the dataset, loads all milestone files, builds indexes, writes `dist/data.json`, generates `dist/index.html`, and copies `static/` assets into `dist/`.
- `static/js/app.js` expects `window.AGI_DATA` to be embedded into the generated HTML.
- If you change filtering, rendering, or styling, edit files in `static/` and rebuild. Do not patch `dist/js/app.js`, `dist/css/main.css`, or `dist/index.html` directly.

## Verification Checklist

After making changes:

1. Run `uv run python scripts/validate.py`.
2. Run `uv run python scripts/build.py` if you changed data, frontend assets, or build logic.
3. If you changed UI behavior, preview with `./run.sh serve` or `./run.sh watch`.

## Path Resolution

Both `scripts/build.py` and `scripts/validate.py` resolve all paths relative to `REPO_ROOT = Path(__file__).resolve().parent.parent`. They work correctly from any working directory, including from within `scripts/`.
