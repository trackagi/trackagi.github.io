# AGI Progress Tracker

A comprehensive timeline of Artificial General Intelligence progress from 2010 to present. This open-source project tracks major releases, research breakthroughs, and product launches from leading AI organizations.

**[View Live Timeline →](https://trackagi.github.io)**

## 📊 Overview

- **75+ milestones** across 12+ years
- **35+ organizations** tracked (OpenAI, Google, Anthropic, Meta, Microsoft, etc.)
- **Dual granularity**: High-level (major releases) and Low-level (technical details)
- **Multiple views**: Chronological, by year, or by month
- **Tag-based filtering**: Filter by organization, capability, or topic

## 🏗️ Architecture

```
agi-progress-tracker/
├── data/              # JSON files organized by year/{slug}.json
├── static/            # CSS and JavaScript
├── scripts/           # Python build and validation
└── dist/              # Generated static site (GitHub Pages)
```

### Key Features

- **Pure static site** - No backend required, perfect for GitHub Pages
- **JSON data format** - Easy to contribute, validate, and parse
- **Client-side filtering** - Fast, responsive filtering with no server calls
- **Responsive design** - Works perfectly on mobile, tablet, and desktop
- **Clean, minimal UI** - Focus on content, not chrome

## 🚀 Quick Start

### Prerequisites

- **UV** - Python package manager ([Install UV](https://docs.astral.sh/uv/))
- Python 3.11+ (UV will handle this)

### Local Development (Easy Way)

We provide a convenient `run.sh` script for local development:

```bash
cd agi-progress-tracker

# Build and serve the site
./run.sh watch        # Auto-rebuild on changes (recommended)
./run.sh build        # Build once
./run.sh serve        # Serve existing build
./run.sh validate     # Validate data files
./run.sh help         # Show all commands
```

### Manual Setup (Alternative)

If you prefer manual control:

```bash
uv venv                    # Create virtual environment (one-time)
uv run python scripts/build.py      # Build site
uv run python -m http.server 8000  # Serve (from dist/)
```

### Validation

Validate all data files:
```bash
./run.sh validate
# or
uv run python scripts/validate.py
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Contribution Guide

1. **Find or create a JSON file** in `data/{year}/{descriptive-slug}.json`
2. **Follow the schema** (see CONTRIBUTING.md)
3. **Validate your changes**
   ```bash
   ./run.sh validate
   ```
4. **Submit a pull request**

### Data Schema

Each milestone is a JSON file with:
```json
{
  "date": "2023-03-14",
  "title": "Event Title",
  "organization": "Organization Name",
  "level": "high|low",
  "tags": ["tag1", "tag2"],
  "description": "Detailed description",
  "highlights": ["Key point 1", "Key point 2"],
  "sources": [
    {"title": "Source Title", "url": "https://..."}
  ]
}
```

## 🏢 Tracked Organizations

- OpenAI
- Google / Google DeepMind
- Anthropic
- Meta AI
- Microsoft
- Mistral AI
- Stability AI
- DeepSeek
- EleutherAI
- And more...

## 🏷️ Tag Categories

- **Models**: gpt, claude, gemini, llama, palm, mistral, deepseek, o1
- **Categories**: model-release, product-launch, research-paper, benchmark, open-source
- **Capabilities**: llm, vision, multimodal, reasoning, coding, image-generation
- **Topics**: transformer, diffusion, rlhf, scaling, safety, alignment

## 📝 License

This project is open source under the MIT License.

## 🙏 Acknowledgments

- Data compiled from public sources, research papers, and official announcements
- Built with ❤️ by the AI community
- Thanks to all contributors who help track AGI progress

---

**Note**: This is an independent community project tracking publicly available information about AI progress. All trademarks belong to their respective owners.
