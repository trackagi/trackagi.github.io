# AGI Progress Tracker - AGENTS.md

A comprehensive, open-source timeline tracking Artificial General Intelligence (AGI) progress from 2013 to present. This is a static site project with hand-maintained JSON data files, built with Python scripts and vanilla JavaScript.

## Quick Project Overview

**What it is**: A timeline of 72 AI milestones across 13 years, tracking major releases, research breakthroughs, and product launches from leading AI organizations.

**Tech Stack**: 
- Data: JSON files organized by year
- Build: Python 3.11+ (no external dependencies)
- Frontend: Vanilla JavaScript + CSS (no frameworks)
- Deployment: Static site on GitHub Pages (GitHub Actions CI/CD)
- Package Manager: UV

**Key Metrics**:
- 72 total milestones (data/2013-2025/)
- 13 organizations tracked (OpenAI, Google, Anthropic, Meta, Microsoft, etc.)
- 60+ unique tags for filtering
- Fully responsive design (mobile, tablet, desktop)

---

## Directory Structure

```
agi-progress/
├── data/                          # Source data - JSON milestones organized by year
│   ├── 2013/                      # Word2Vec, AlexNet
│   ├── 2014/                      # GANs, VGGNet
│   ├── 2015/                      # TensorFlow, ResNet, AlphaGo training
│   ├── 2016/                      # AlphaGo vs Lee Sedol match
│   ├── 2017/                      # Transformer paper
│   ├── 2018/                      # GPT-1, BERT
│   ├── 2019/                      # GPT-2, RoBERTa, T5
│   ├── 2020/                      # GPT-3, AlphaFold2
│   ├── 2021/                      # GitHub Copilot, DALL-E
│   ├── 2022/                      # ChatGPT, Stable Diffusion
│   ├── 2023/                      # GPT-4, Codex 2, Llama 2
│   ├── 2024/                      # GPT-4o, Codex 3, o1, Devin
│   └── 2025/                      # DeepSeek-R1, o3-mini, Codex 3.7 Sonnet
│
├── scripts/                       # Build and validation logic (Python)
│   ├── build.py                   # Main build script - aggregates JSON, generates site
│   └── validate.py                # Validation script - schema, field, and data checks
│
├── static/                        # Frontend source code (generated files in dist/)
│   ├── css/
│   │   └── main.css               # Styles (825 lines) - dark theme, animations, responsive
│   └── js/
│       └── app.js                 # Interactive timeline (444 lines) - filtering, animations
│
├── dist/                          # Generated static site (do NOT edit manually, git ignored)
│   ├── index.html                 # Generated HTML with embedded data
│   ├── data.json                  # Aggregated milestone data + indexes
│   ├── css/main.css               # Copied from static/
│   ├── js/app.js                  # Copied from static/
│   └── index.html                 # Entry point
│
├── .github/
│   └── workflows/
│       └── deploy.yml             # GitHub Actions CI/CD pipeline
│
├── pyproject.toml                 # Project config, dependencies, tool config
├── uv.lock                        # UV lock file (dependencies frozen)
├── run.sh                         # Convenient bash wrapper for common commands
├── README.md                      # User-facing project documentation
├── CONTRIBUTING.md                # Contribution guidelines, schema, tag list
├── DEPLOYMENT.md                  # GitHub Pages deployment guide
├── Agents.md                      # Rules and workflow for AI agents
└── AGENTS.md                      # This file

```

---

## Data Format & Schema

Each milestone is a separate JSON file in `data/{year}/{descriptive-slug}.json`.

### Required Fields

```json
{
  "date": "2023-03-14",              // YYYY-MM-DD format
  "title": "Event Title",             // Clear, descriptive
  "organization": "Organization",     // Must match VALID_ORGANIZATIONS
  "level": "high",                    // "high" or "low"
  "tags": ["tag1", "tag2"],           // Array of tags from VALID_TAGS
  "description": "...",               // Detailed description (min 10 chars)
  "sources": [
    {
      "title": "Source Title",
      "url": "https://..."
    }
  ]
}
```

### Optional Fields

```json
{
  "highlights": ["Key point 1", "Key point 2"]  // 1-5 bullet points
}
```

### Level Guidelines

- **high**: Major product launches, significant model releases, groundbreaking research
  - Examples: GPT-4, ChatGPT, AlphaGo, Transformer paper
- **low**: Technical improvements, API updates, incremental releases, minor features
  - Examples: Context window increases, pricing changes, minor model updates

### File Naming Rules

- Format: `data/{year}/{descriptive-slug}.json`
- Use kebab-case for slugs
- Be descriptive (e.g., `gpt-4-launch.json`, not `event.json`)
- Don't include date in filename (it's in the JSON)
- Must be unique within the year folder

### Example Entry

```json
{
  "date": "2022-11-30",
  "title": "ChatGPT Launch",
  "organization": "OpenAI",
  "level": "high",
  "tags": ["openai", "product-launch", "chatgpt", "gpt", "llm"],
  "description": "OpenAI launched ChatGPT, a conversational AI based on GPT-3.5 fine-tuned with RLHF. The product gained 1 million users in 5 days and 100 million in 2 months, becoming the fastest-growing consumer application in history.",
  "highlights": [
    "1 million users in 5 days",
    "100 million users in 2 months",
    "Fastest-growing consumer app ever"
  ],
  "sources": [
    {
      "title": "ChatGPT Blog Post",
      "url": "https://openai.com/blog/chatgpt/"
    }
  ]
}
```

---

## Build System & Development Workflow

### Using run.sh (Recommended)

The project includes a convenient bash wrapper:

```bash
./run.sh build        # Build site once
./run.sh serve        # Serve dist/ on port 8000 (or custom port)
./run.sh watch        # Watch mode - auto-rebuild on data changes (requires 'entr')
./run.sh validate     # Validate all data files
./run.sh help         # Show all commands
```

### Using UV Directly

```bash
uv venv                           # Create virtual environment (one-time)
uv run python scripts/validate.py # Validate data
uv run python scripts/build.py    # Build site
uv run python -m http.server 8000 # Serve (from dist/)
```

### Build Process (scripts/build.py)

1. **Validate** data files (stops if errors)
2. **Load** all milestone JSON files from data/{year}/ (sorted by year, then filename)
3. **Generate indexes** by year, month, organization, and tag
4. **Create data.json** with milestones + metadata + indexes
5. **Generate index.html** with embedded data (window.AGI_DATA)
6. **Copy static assets** (CSS and JS)

Output: `dist/index.html`, `dist/data.json`, `dist/css/main.css`, `dist/js/app.js`

### Validation (scripts/validate.py)

Checks all JSON files for:
- Required fields present
- Date format (YYYY-MM-DD)
- Valid organization (VALID_ORGANIZATIONS list)
- Valid level ("high" or "low")
- Tags from VALID_TAGS (warns on unknown)
- At least 1 source with title + url
- Description at least 10 characters
- Highlights array if present

**Important**: Run from repository root, not from scripts/ directory.

---

## Code Architecture

### Frontend (static/js/app.js, static/css/main.css)

**State Management** (JavaScript):
- Global `state` object with filters, data, and UI references
- Filters: timeView (year/month/all), level, organization, search, tags

**Key Functions**:
- `init()` - Initialization on page load
- `populateFilters()` - Populate dropdowns from data metadata
- `bindEvents()` - Attach event listeners to filters
- `getFilteredMilestones()` - Apply all filters
- `groupMilestones()` - Group by year/month
- `render()` - Generate and insert HTML
- `setupIntersectionObserver()` - Scroll animations
- `createMilestoneCard()` - HTML template for each card

**Styling** (CSS):
- CSS variables for colors, spacing, fonts
- Organization-specific gradient colors
- Dark theme (#0f0f0f background)
- Animations: scroll progress bar, fade-in on scroll, parallax, ripple effects
- Responsive breakpoints for mobile, tablet, desktop
- 825 lines total

**Data Flow**:
1. `window.AGI_DATA` embedded in HTML from build.py
2. JavaScript filters based on user input
3. HTML generated dynamically (no virtual DOM)
4. Intersection Observer triggers animations as cards come into view

### Backend (scripts/build.py, scripts/validate.py)

**build.py** (286 lines):
- `load_milestones()` - Load all JSON files
- `generate_indexes()` - Create lookup tables for frontend filtering
- `generate_data_json()` - Build final data structure
- `generate_html()` - Create index.html with embedded data
- `copy_static_files()` - Copy CSS/JS to dist/
- `build()` - Main orchestration

**validate.py** (306 lines):
- `validate_milestone()` - Check single milestone JSON
- `validate_data_directory()` - Walk all year folders
- `validate_date()` - Check YYYY-MM-DD format
- Configuration lists: VALID_ORGANIZATIONS, VALID_TAGS, VALID_LEVELS

### Data & Configuration (pyproject.toml)

```toml
[project]
name = "agi-progress-tracker"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = []  # No external dependencies!

[project.optional-dependencies]
dev = ["black>=23.0", "ruff>=0.1.0", "mypy>=1.7.0"]

[tool.ruff]
target-version = "py311"
line-length = 100
select = ["E", "F", "I", "N", "W", "UP", "B", "C4", "SIM"]

[tool.black]
target-version = ["py311"]
line-length = 100

[tool.mypy]
python_version = "3.11"
```

---

## CI/CD Pipeline (.github/workflows/deploy.yml)

GitHub Actions workflow runs on push to main/master or pull requests:

**Validate Job**:
- Checkout code
- Setup Python 3.11
- Run validation (cd scripts && python validate.py)

**Build Job** (depends on validate):
- Checkout
- Setup Python 3.11
- Run build (cd scripts && python build.py)
- Upload dist/ as artifact

**Deploy Job** (depends on build, main branch only):
- Deploy artifact to GitHub Pages
- Site goes live at https://YOUR_USERNAME.github.io/agi-progress-tracker

**Permissions**: read contents, write pages, write id-token
**Concurrency**: Only one deployment at a time (cancel in-progress)

---

## Valid Organizations & Tags

### Organizations (scripts/validate.py)

42 total organizations including:
- OpenAI, Google, Google DeepMind, Anthropic, Meta AI, Microsoft
- Mistral AI, Stability AI, DeepSeek, xAI, Cohere, AI21 Labs
- Midjourney, Character.AI, NVIDIA, EleutherAI, Allen Institute
- Cognition Labs, Databricks, Carnegie Mellon, Berkeley, Stanford
- Apple, Amazon, Baidu, Alibaba, Tencent, Yandex, Naver
- And more... (update VALID_ORGANIZATIONS in validate.py)

### Tags (scripts/validate.py)

60+ tags organized by category:

**Models**: gpt, Codex, gemini, llama, palm, mistral, deepseek, o1, o3, grok, bard, dalle

**Categories**: model-release, product-launch, research-paper, benchmark, open-source, api-release, acquisition, partnership, regulation, monetization

**Capabilities**: llm, vision, multimodal, reasoning, coding, math, speech, image-generation, video-generation, agent, memory, long-context, computer-use

**Topics**: transformer, attention, diffusion, rlhf, scaling, safety, alignment, interpretability, reinforcement-learning, pre-training, game-playing, nlp, deep-learning, gan, cnn, word-embeddings, framework

**Domain-specific**: alphafold, stable-diffusion, devin, notebooklm, Codex, science, productivity, search

---

## Important Notes & Quirks

### Working from Repository Root

**Critical**: Always run commands from the repository root, NOT from scripts/ directory.

- Works: `uv run python scripts/validate.py`
- Fails: `cd scripts && python validate.py` (paths break)

Scripts resolve `data/` and `dist/` relative to current working directory.

### Git Ignores

- `dist/` - Entire generated folder (do NOT commit)
- `__pycache__/`, `*.pyc` - Python cache
- `.venv/` - Virtual environment
- `uv.lock` - Dependencies lock (ignored but useful)
- `.vscode/`, `.idea/` - IDE files
- `.env`, `.env.local` - Environment variables

### Do's and Don'ts

**DO**:
- Edit files in `data/`, `static/` (source directories)
- Run build after adding/editing data or frontend code
- Validate data before building
- Use descriptive file names in kebab-case
- Add new organizations/tags to validate.py VALID_ lists

**DON'T**:
- Edit dist/ files directly (they're generated)
- Run scripts from scripts/ directory (use repo root)
- Commit dist/ folder to git
- Use relative paths in imports
- Hardcode milestone data in HTML/JavaScript

### Environment

- Python 3.11+ required (UV manages this)
- No external Python dependencies (pure standard library)
- Optional dev dependencies: black, ruff, mypy (for linting/formatting)
- Browser support: All modern browsers (ES6+ JavaScript)

---

## Filtering System

The frontend implements multi-faceted filtering:

**Time View**: 
- Year (group by YYYY)
- Month (group by YYYY-MM)
- All (no grouping)

**Level**: All / High / Low

**Organization**: All or specific organization

**Tags**: Multi-select (AND logic - shows milestones matching ANY selected tag)

**Search**: Full-text search on title + organization

All filters apply simultaneously (client-side, instant).

---

## Key Entry Points

### For Users
- `dist/index.html` - Live site

### For Developers
- `scripts/build.py` - Start here to understand build process
- `scripts/validate.py` - Understand data schema
- `static/js/app.js` - Understand frontend interactivity
- `static/css/main.css` - Understand styling
- `CONTRIBUTING.md` - Understand contribution workflow
- `Agents.md` - Rules for AI agents working on this repo

### For Adding Data
- Create new file: `data/{year}/{slug}.json`
- Follow schema in Contributing.md
- Run `./run.sh validate` to check
- Run `./run.sh build` to rebuild
- Run `./run.sh serve` to preview

---

## Common Tasks

### Add a New Milestone
```bash
# 1. Create the file
# data/2025/my-event.json

# 2. Validate
./run.sh validate

# 3. Build
./run.sh build

# 4. Preview
./run.sh serve
# Open http://localhost:8000
```

### Add New Organization or Tag
1. Edit `scripts/validate.py`
2. Add to `VALID_ORGANIZATIONS` or `VALID_TAGS`
3. Validate: `./run.sh validate`
4. Build: `./run.sh build`

### Deploy to GitHub Pages
1. Push to main branch
2. GitHub Actions runs automatically
3. Check Actions tab for progress
4. Site updates at https://YOUR_USERNAME.github.io/agi-progress-tracker

### Local Development with Auto-Rebuild
```bash
./run.sh watch
# Auto-rebuilds on changes to data/ files
# Requires 'entr' installed (brew install entr on macOS)
```

---

## Testing & Validation

**Before committing**:
```bash
./run.sh validate   # Check data integrity
./run.sh build      # Generate site
./run.sh serve      # Preview
# Check http://localhost:8000 for visual correctness
```

**CI/CD handles**:
- Automatic validation on push
- Automatic build on push
- Automatic GitHub Pages deploy on main branch

---

## Documentation Files

- **README.md** - User documentation, quick start
- **CONTRIBUTING.md** - Contribution guidelines, schema details, examples
- **DEPLOYMENT.md** - GitHub Pages setup and deployment
- **Agents.md** - Rules and workflow for AI agents
- **AGENTS.md** - This file, comprehensive architecture guide

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Runtime | Python 3.11+ (no external deps) |
| Package Manager | UV |
| Data | JSON files (72 total) |
| Build | Python scripts (build.py, validate.py) |
| Frontend | Vanilla JavaScript + CSS (no frameworks) |
| Styling | CSS3 with CSS variables, animations |
| Deployment | GitHub Pages + GitHub Actions |
| Data Format | JSON with strict schema |
| Version Control | Git (dist/ ignored) |

---

## Performance Characteristics

- **Build time**: < 1 second (simple aggregation)
- **Site load**: Instant (all data embedded)
- **Filtering**: Instant (client-side, 72 milestones)
- **Size**: ~100KB gzipped total
- **Browser support**: All modern browsers
- **Accessibility**: Semantic HTML, color contrast WCAG AA

---

## Future Enhancement Areas

- Additional filtering dimensions
- Timeline search/sort improvements
- Export functionality (CSV, JSON)
- Contribution stats
- Archive/historical views
- Advanced visualization options

---

## Questions & Debugging

**"Data directory not found"**
- Make sure you're in repo root, not scripts/

**"ValidationError: Unknown tag"**
- New tags generate warnings but don't fail
- Add to VALID_TAGS in validate.py if canonical

**"Unknown organization"**
- Add to VALID_ORGANIZATIONS in validate.py
- Validation will fail until fixed

**"Build succeeds but site looks wrong"**
- Check static/ source files
- Rebuild: `./run.sh build`
- Clear browser cache

**"entr not found" in watch mode**
- Install: `brew install entr` (macOS) or `apt-get install entr` (Linux)
- Or just use `./run.sh build` and `./run.sh serve` separately
