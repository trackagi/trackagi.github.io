#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to print header
print_header() {
    echo -e "${BLUE}🚀 AGI Progress Tracker - Local Development${NC}"
    echo ""
}

# Function to check UV
check_uv() {
    if ! command -v uv &> /dev/null; then
        echo -e "${RED}❌ UV is not installed${NC}"
        echo "Install UV: https://docs.astral.sh/uv/"
        echo "Quick install: curl -LsSf https://astral.sh/uv/install.sh | sh"
        exit 1
    fi
    echo -e "${GREEN}✅ UV found${NC}"
}

# Function to setup environment
setup_env() {
    cd "$SCRIPT_DIR"
    
    # Create virtual environment if it doesn't exist
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
        uv venv
    fi
    
    echo -e "${GREEN}✅ Using Python standard library${NC}"
    echo ""
}

# Function to build the site
build_site() {
    cd "$SCRIPT_DIR"
    echo -e "${BLUE}🏗️  Building site...${NC}"
    uv run python scripts/build.py
    echo ""
}

# Function to serve the site
serve_site() {
    local port=${1:-8000}
    cd "$SCRIPT_DIR/dist"
    echo -e "${GREEN}🌐 Starting server on http://localhost:${port}${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    uv run python -m http.server "$port"
}

# Function to validate data
validate_data() {
    cd "$SCRIPT_DIR"
    echo -e "${BLUE}🔍 Validating data...${NC}"
    uv run python scripts/validate.py
}

# Function to build and serve (dev mode)
dev_mode() {
    local port=${1:-8000}
    build_site
    serve_site "$port"
}

# Function to run linters
lint_code() {
    cd "$SCRIPT_DIR"
    echo -e "${BLUE}🔍 Running linters...${NC}"
    uv sync --extra dev --quiet
    uv run ruff check scripts/
    uv run black --check scripts/
    echo -e "${GREEN}✅ All lint checks passed${NC}"
}

# Function to scaffold a new milestone
new_milestone() {
    cd "$SCRIPT_DIR"
    echo -e "${BLUE}📝 Create a new milestone${NC}"
    echo ""

    read -r -p "Year (e.g., 2025): " year
    read -r -p "Slug (kebab-case, e.g., gpt-5-release): " slug

    local dir="data/${year}"
    local filepath="${dir}/${slug}.json"

    if [ -f "$filepath" ]; then
        echo -e "${RED}❌ File already exists: ${filepath}${NC}"
        exit 1
    fi

    mkdir -p "$dir"

    cat > "$filepath" << 'TEMPLATE'
{
  "date": "YYYY-MM-DD",
  "title": "",
  "organization": "",
  "level": "high",
  "tags": [],
  "description": "",
  "highlights": [],
  "sources": [
    {
      "title": "",
      "url": ""
    }
  ]
}
TEMPLATE

    echo -e "${GREEN}✅ Created ${filepath}${NC}"
    echo -e "${YELLOW}Edit the file, then run: ./run.sh validate${NC}"
}

# Function to watch and rebuild
watch_mode() {
    local port=${1:-8000}
    
    # Initial build
    build_site
    
    cd "$SCRIPT_DIR"
    
    # Check if entr is available for watching
    if command -v entr &> /dev/null; then
        echo -e "${BLUE}👁️  Watching for changes in data/ directory...${NC}"
        echo -e "${YELLOW}Auto-rebuild enabled. Press Ctrl+C to stop.${NC}"
        echo ""
        
        # Serve in background
        cd dist && uv run python -m http.server "$port" &
        local server_pid=$!
        
        # Watch for changes and rebuild
        cd "$SCRIPT_DIR"
        while true; do
            find data static \( -name "*.json" -o -name "*.css" -o -name "*.js" \) | entr -r sh -c "cd '$SCRIPT_DIR' && uv run python scripts/build.py" 2>/dev/null || break
        done
        
        # Cleanup
        kill $server_pid 2>/dev/null || true
    else
        echo -e "${YELLOW}⚠️  'entr' not installed. Auto-rebuild disabled.${NC}"
        echo -e "${YELLOW}Install with: brew install entr (macOS) or apt-get install entr (Linux)${NC}"
        echo ""
        
        # Build once and serve
        serve_site "$port"
    fi
}

# Show help
show_help() {
    echo "Usage: ./run.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  build, b       Build the static site (one time)"
    echo "  serve, s       Serve the existing dist/ folder"
    echo "  dev, d         Build and serve the site"
    echo "  watch, w       Build and watch for changes (auto-rebuild)"
    echo "  validate, v    Validate all JSON data files"
    echo "  lint, l        Run ruff and black linters"
    echo "  new, n         Create a new milestone from template"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run.sh build              # Build once"
    echo "  ./run.sh serve              # Serve on port 8000"
    echo "  ./run.sh serve 3000         # Serve on port 3000"
    echo "  ./run.sh watch              # Watch mode with auto-rebuild"
    echo "  ./run.sh validate           # Validate all data"
    echo ""
}

# Main
case "${1:-}" in
    build|b)
        print_header
        check_uv
        setup_env
        build_site
        ;;
    serve|s)
        print_header
        check_uv
        setup_env
        port="${2:-8000}"
        serve_site "$port"
        ;;
    watch|w)
        print_header
        check_uv
        setup_env
        port="${2:-8000}"
        watch_mode "$port"
        ;;
    dev|d)
        print_header
        check_uv
        setup_env
        port="${2:-8000}"
        dev_mode "$port"
        ;;
    validate|v)
        print_header
        check_uv
        setup_env
        validate_data
        ;;
    lint|l)
        print_header
        check_uv
        setup_env
        lint_code
        ;;
    new|n)
        print_header
        check_uv
        setup_env
        new_milestone
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Run './run.sh help' for usage information"
        exit 1
        ;;
esac
