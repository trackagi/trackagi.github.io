#!/usr/bin/env python3
"""
Build script for AGI Progress Tracker.
Aggregates all JSON data files and generates the static site.
"""

import json
import shutil
from pathlib import Path
from typing import Any

from validate import validate_data_directory

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent


def resolve_repo_path(path: str | Path) -> Path:
    """Resolve relative project paths from the repository root."""
    raw_path = Path(path)
    return raw_path if raw_path.is_absolute() else REPO_ROOT / raw_path


def load_milestones(data_dir: str | Path = "data") -> list[dict[str, Any]]:
    """Load all milestone JSON files from the data directory."""
    milestones: list[dict[str, Any]] = []
    data_path = resolve_repo_path(data_dir)

    for year_dir in sorted(data_path.iterdir()):
        if not year_dir.is_dir():
            continue

        for json_file in sorted(year_dir.glob("*.json")):
            try:
                with json_file.open("r", encoding="utf-8") as handle:
                    data = json.load(handle)
                    data["_file"] = str(json_file.relative_to(REPO_ROOT))
                    milestones.append(data)
            except Exception as exc:  # pragma: no cover - logged for manual diagnosis.
                print(f"  Warning: error loading {json_file}: {exc}")

    milestones.sort(key=lambda milestone: milestone["date"])
    return milestones


def generate_indexes(milestones: list[dict[str, Any]]) -> dict[str, Any]:
    """Generate indexes used by the client-side filtering UI."""
    indexes = {
        "by_year": {},
        "by_month": {},
        "by_organization": {},
        "by_tag": {},
        "organizations": set(),
        "tags": set(),
        "years": set(),
    }

    for milestone in milestones:
        date = milestone["date"]
        year = date[:4]
        month = date[:7]

        indexes["years"].add(int(year))

        indexes["by_year"].setdefault(year, []).append(milestone["date"])
        indexes["by_month"].setdefault(month, []).append(milestone["date"])

        organization = milestone["organization"]
        indexes["organizations"].add(organization)
        indexes["by_organization"].setdefault(organization, []).append(milestone["date"])

        for tag in milestone["tags"]:
            indexes["tags"].add(tag)
            indexes["by_tag"].setdefault(tag, []).append(milestone["date"])

    indexes["organizations"] = sorted(indexes["organizations"])
    indexes["tags"] = sorted(indexes["tags"])
    indexes["years"] = sorted(indexes["years"], reverse=True)
    return indexes


def clean_milestone(milestone: dict[str, Any]) -> dict[str, Any]:
    """Remove internal fields from milestone payloads before output."""
    cleaned = milestone.copy()
    cleaned.pop("_file", None)
    return cleaned


def generate_data_json(milestones: list[dict[str, Any]], indexes: dict[str, Any]) -> dict[str, Any]:
    """Generate the final data.json structure."""
    return {
        "meta": {
            "total_milestones": len(milestones),
            "date_range": {
                "start": milestones[0]["date"] if milestones else None,
                "end": milestones[-1]["date"] if milestones else None,
            },
            "organizations": indexes["organizations"],
            "tags": indexes["tags"],
            "years": indexes["years"],
        },
        "indexes": {
            "by_year": indexes["by_year"],
            "by_month": indexes["by_month"],
            "by_organization": indexes["by_organization"],
            "by_tag": indexes["by_tag"],
        },
        "milestones": [clean_milestone(milestone) for milestone in milestones],
    }


def generate_html(data: dict[str, Any]) -> str:
    """Generate the application shell with embedded data."""
    data_json = json.dumps(data, indent=2, ensure_ascii=False)
    date_range = data["meta"]["date_range"]
    start_year = date_range["start"][:4] if date_range["start"] else "2013"
    end_year = date_range["end"][:4] if date_range["end"] else "Present"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AGI Progress Tracker</title>
    <meta
        name="description"
        content="A readable timeline of AI milestones, model launches, and research breakthroughs from 2013 to today."
    >
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <div class="page-shell">
        <header class="page-header">
            <p class="page-kicker">AI milestones, arranged as a working index</p>
            <div class="page-heading">
                <div class="page-copy">
                    <h1>AGI Progress Tracker</h1>
                    <p class="page-description">
                        A minimal, information-dense timeline of notable model launches, research
                        papers, and products shaping modern AI.
                    </p>
                </div>

                <ul class="page-meta" aria-label="Project overview">
                    <li>
                        <span class="meta-value">{data["meta"]["total_milestones"]}</span>
                        <span class="meta-label">milestones</span>
                    </li>
                    <li>
                        <span class="meta-value">{start_year}-{end_year}</span>
                        <span class="meta-label">range</span>
                    </li>
                    <li>
                        <span class="meta-value">{len(data["meta"]["organizations"])}</span>
                        <span class="meta-label">organizations</span>
                    </li>
                </ul>
            </div>
        </header>

        <section class="controls-shell" aria-label="Timeline controls">
            <div class="controls-bar">
                <label class="search-field" for="search">
                    <span class="field-label">Search</span>
                    <input
                        type="search"
                        id="search"
                        class="search-input"
                        placeholder="Search titles, organizations, tags, or topics"
                    >
                </label>

                <button
                    id="filters-toggle"
                    class="filters-toggle"
                    type="button"
                    aria-expanded="false"
                    aria-controls="filters-panel"
                >
                    Filters
                </button>
            </div>

            <section class="filters-panel" id="filters-panel" aria-label="Feed filters">
                <div class="filter-grid">
                    <label class="filter-control" for="time-view">
                        <span class="field-label">Grouping</span>
                        <select id="time-view" class="filter-select">
                            <option value="year">Year</option>
                            <option value="month">Month</option>
                            <option value="all">Continuous</option>
                        </select>
                    </label>

                    <label class="filter-control" for="level-filter">
                        <span class="field-label">Signal</span>
                        <select id="level-filter" class="filter-select">
                            <option value="all">All milestones</option>
                            <option value="high">High signal only</option>
                            <option value="low">Supporting only</option>
                        </select>
                    </label>

                    <label class="filter-control" for="org-filter">
                        <span class="field-label">Organization</span>
                        <select id="org-filter" class="filter-select">
                            <option value="all">All organizations</option>
                        </select>
                    </label>
                </div>

                <div class="tag-filter-group">
                    <span class="field-label">Popular tags</span>
                    <div class="tag-list" id="tag-list"></div>
                </div>
            </section>

            <div class="results-bar">
                <p id="results-summary" class="results-summary"></p>
                <button id="clear-filters" class="clear-filters" type="button" hidden>
                    Clear filters
                </button>
            </div>
        </section>

        <main class="feed-shell">
            <div id="timeline" class="timeline-root"></div>
        </main>
    </div>

    <script>
        window.AGI_DATA = {data_json};
    </script>
    <script src="js/app.js"></script>
</body>
</html>"""


def copy_static_files(dist_dir: str | Path = "dist") -> None:
    """Copy CSS and JavaScript assets into the build output directory."""
    dist_path = resolve_repo_path(dist_dir)
    css_source = REPO_ROOT / "static" / "css" / "main.css"
    js_source = REPO_ROOT / "static" / "js" / "app.js"

    css_dest = dist_path / "css" / "main.css"
    js_dest = dist_path / "js" / "app.js"

    css_dest.parent.mkdir(parents=True, exist_ok=True)
    js_dest.parent.mkdir(parents=True, exist_ok=True)

    if css_source.exists():
        shutil.copy2(css_source, css_dest)

    if js_source.exists():
        shutil.copy2(js_source, js_dest)


def build(dist_dir: str | Path = "dist", data_dir: str | Path = "data") -> bool:
    """Run validation, aggregate milestone data, and produce the static site."""
    print("Building AGI Progress Tracker...\n")

    print("Validating data files...")
    errors, total_files = validate_data_directory(data_dir)
    if errors:
        print(f"\nValidation failed with {len(errors)} error(s):\n")
        for error in errors:
            print(f"  {error}")
        return False

    print(f"Validated {total_files} files\n")

    print("Loading milestones...")
    milestones = load_milestones(data_dir)
    print(f"Loaded {len(milestones)} milestones\n")

    print("Generating indexes...")
    indexes = generate_indexes(milestones)
    print(
        "Generated indexes for "
        f"{len(indexes['years'])} years, {len(indexes['organizations'])} orgs, {len(indexes['tags'])} tags\n"
    )

    print("Generating data.json...")
    data = generate_data_json(milestones, indexes)

    dist_path = resolve_repo_path(dist_dir)
    dist_path.mkdir(parents=True, exist_ok=True)

    with (dist_path / "data.json").open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
    print(f"Generated {dist_path / 'data.json'}\n")

    print("Generating index.html...")
    with (dist_path / "index.html").open("w", encoding="utf-8") as handle:
        handle.write(generate_html(data))
    print(f"Generated {dist_path / 'index.html'}\n")

    print("Copying static files...")
    copy_static_files(dist_dir)
    print("Copied static files\n")

    print("=" * 50)
    print("Build completed successfully")
    print(f"Output directory: {dist_path}")
    print(f"Total milestones: {len(milestones)}")
    print(f"Organizations: {len(indexes['organizations'])}")
    print(f"Tags: {len(indexes['tags'])}")
    print(
        "Date range: "
        f"{data['meta']['date_range']['start']} to {data['meta']['date_range']['end']}"
    )
    print("=" * 50)
    return True


def main() -> None:
    """Main entry point."""
    raise SystemExit(0 if build() else 1)


if __name__ == "__main__":
    main()
