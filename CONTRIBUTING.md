# Contributing to AGI Progress Tracker

Thank you for your interest in contributing! This guide will help you add new milestones to the timeline.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Data Format](#data-format)
- [File Naming](#file-naming)
- [Validation](#validation)
- [Tag Guidelines](#tag-guidelines)
- [Example Entries](#example-entries)
- [Pull Request Process](#pull-request-process)

## 🚀 Getting Started

### Prerequisites

- **UV** - Python package manager ([Install UV](https://docs.astral.sh/uv/))
- Python 3.11+ (UV will handle this)
- Basic understanding of JSON
- Git and GitHub account

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/agi-progress-tracker.git
   cd agi-progress-tracker
   ```
3. Setup UV environment:
   ```bash
   uv venv              # Create virtual environment (one-time)
   ```

### Development Workflow

We provide a convenient `run.sh` script:

```bash
./run.sh dev          # Build and serve the site
./run.sh watch        # Watch mode: auto-rebuild on changes
./run.sh build        # Build once
./run.sh serve        # Serve on port 8000
./run.sh validate     # Validate data
./run.sh lint         # Run ruff and black linters
./run.sh new          # Scaffold a new milestone from template
./run.sh help         # Show all commands
```

Or use UV directly:
```bash
uv run python scripts/validate.py   # Validate data
uv run python scripts/build.py      # Build site
uv run python -m http.server 8000   # Serve (from dist/)
```

## 📝 Data Format

Each milestone is stored as a JSON file with the following schema:

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Format: `YYYY-MM-DD` |
| `title` | string | Clear, descriptive title |
| `organization` | string | Must be from approved list |
| `level` | string | `"high"` or `"low"` |
| `tags` | array | Array of tag strings |
| `description` | string | Detailed description (min 10 chars) |
| `sources` | array | Minimum 1 source required |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `highlights` | array | Key bullet points about the milestone |

### Level Guidelines

- **High**: Major product launches, significant model releases, groundbreaking research, industry-shifting events
  - Examples: GPT-4, ChatGPT, AlphaGo, Transformer paper
  
- **Low**: Technical improvements, API updates, incremental releases, minor features
  - Examples: Context window increases, pricing changes, minor model updates

## 📁 File Naming

Format: `data/{year}/{descriptive-slug}.json`

### Rules

- **Slug format**: `kebab-case-description.json`
- **Descriptive**: Should indicate what the milestone is
- **Unique**: Must be unique within the year folder
- **No date in slug**: The date is in the JSON, not the filename

### Examples

✅ **Good**:
- `gpt-4-launch.json`
- `transformer-attention-is-all-you-need.json`
- `alphago-lee-sedol.json`
- `claude-3-5-sonnet.json`

❌ **Bad**:
- `2023-03-gpt4.json` (contains date)
- `event.json` (too generic)
- `new-model.json` (not descriptive)

## ✅ Validation

Always validate your changes before submitting:

```bash
./run.sh validate
# or
uv run python scripts/validate.py
```

### IDE Support

A JSON Schema is available at `milestone.schema.json` for autocomplete and inline validation. VS Code users can add this to `.vscode/settings.json`:

```json
{
  "json.schemas": [{
    "fileMatch": ["data/**/*.json"],
    "url": "./milestone.schema.json"
  }]
}
```

This checks:
- JSON syntax
- Required fields
- Date format (YYYY-MM-DD)
- Organization validity
- Tag validation
- Source requirements
- Description length

## 🏷️ Tag Guidelines

Tags are defined in `VALID_TAGS` in `scripts/validate.py`. Common examples by category:

- **Models**: gpt, claude, gemini, llama, mistral, deepseek, o1, o3
- **Categories**: model-release, product-launch, research-paper, benchmark, open-source
- **Capabilities**: llm, vision, multimodal, reasoning, coding, agent, image-generation
- **Topics**: transformer, diffusion, rlhf, scaling, safety, alignment

See `scripts/validate.py` for the full canonical list (60+ tags).

### Tag Tips

- Use 2-5 tags per milestone
- Always include organization tag
- Include model name tag if applicable
- Use specific tags over general ones

## 📖 Example Entries

### High-Level Example (Product Launch)

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

### Low-Level Example (API Update)

```json
{
  "date": "2023-02-01",
  "title": "ChatGPT Plus Launched",
  "organization": "OpenAI",
  "level": "low",
  "tags": ["openai", "product-launch", "chatgpt", "monetization"],
  "description": "OpenAI launched ChatGPT Plus, a $20/month subscription offering faster response times, priority access during peak times, and early access to new features.",
  "highlights": [
    "$20/month subscription",
    "Faster response times",
    "Priority access during peak hours"
  ],
  "sources": [
    {
      "title": "ChatGPT Plus",
      "url": "https://openai.com/blog/chatgpt-plus"
    }
  ]
}
```

## 🔀 Pull Request Process

### Before Submitting

1. **Validate your changes**
   ```bash
   ./run.sh validate
   ```

2. **Build and test locally**
   ```bash
   ./run.sh watch     # Watch mode, or
   ./run.sh build && ./run.sh serve
   # Check http://localhost:8000
   ```

3. **Review your files**
   - Dates are correct
   - URLs are accessible
   - Descriptions are accurate and objective
   - Tags are appropriate

### PR Template

Use this format for your pull request:

```markdown
## Description
Brief description of the milestone(s) being added.

## Changes Made
- List of files added/modified
- Summary of changes

## Validation
- [ ] Ran `./run.sh validate` - all checks passed
- [ ] Built locally with `./run.sh build` and tested
- [ ] Verified all URLs are accessible

## Milestones Added
| Date | Title | Organization | Level |
|------|-------|--------------|-------|
| YYYY-MM-DD | Title | Org | high/low |

## Sources
- Primary source: [Title](URL)
- Additional context: [Title](URL) (optional)
```

### Review Process

1. PR submitted → CI runs validation
2. Maintainers review for:
   - Data accuracy
   - Proper categorization
   - Tag appropriateness
   - Source quality
3. Feedback provided (if needed)
4. Approved and merged → Auto-deployed to GitHub Pages

## 📚 Style Guide

### Writing Descriptions

- **Be factual**: Stick to facts, avoid speculation
- **Be specific**: Include concrete numbers, dates, metrics when available
- **Be objective**: Avoid hype words ("revolutionary", "game-changing")
- **Be clear**: Write for a technical but general audience
- **Be concise**: 2-4 sentences typically sufficient

### Highlights

- Use bullet points for key facts
- 3-5 highlights per high-level milestone
- 1-3 highlights per low-level milestone
- Include metrics when available

### Sources

- **Required**: At least 1 source
- **Preferred**: Official announcements, research papers, reputable news
- **Avoid**: Rumors, speculation, unverified claims
- **Format**: Always include both title and URL

## 🐛 Reporting Issues

If you find errors in existing data:

1. **Data errors**: Submit a PR with correction
2. **Missing milestones**: Submit a PR adding them
3. **Technical issues**: Open a GitHub issue

## 💡 Tips

- Check if a similar milestone already exists
- Search closed PRs for examples
- Ask questions in issues if unsure
- Keep commits focused (one milestone per commit if possible)

## 📞 Questions?

- Open an issue for questions
- Check existing data files for examples
- Review this guide thoroughly

---

Thank you for helping track AGI progress! 🚀
