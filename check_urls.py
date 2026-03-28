#!/usr/bin/env python3
"""
URL Checker for AGI Progress Tracker
Checks all URLs in data files for accessibility
"""

import json
import ssl
import time
import urllib.request
from urllib.error import HTTPError, URLError
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict

# Configuration
DATA_DIR = Path("/home/immortal/code/agi-progress/data")
DELAY_SECONDS = 0.5
TIMEOUT_SECONDS = 15

# SSL context to handle certificate issues
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE


def extract_urls_from_json(file_path: Path) -> List[Tuple[str, str]]:
    """Extract URLs and their source titles from a JSON file."""
    urls = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if "sources" in data and isinstance(data["sources"], list):
            for source in data["sources"]:
                if "url" in source and source["url"]:
                    title = source.get("title", "No title")
                    urls.append((source["url"], title))
    except Exception as e:
        print(f"  Error reading {file_path}: {e}")

    return urls


def check_url(url: str) -> Tuple[str, int, str]:
    """
    Check a URL and return (status, code, details).
    Status: 'working', 'redirected', 'broken', 'error'
    """
    try:
        req = urllib.request.Request(
            url,
            method="HEAD",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
        )

        with urllib.request.urlopen(req, context=ssl_context, timeout=TIMEOUT_SECONDS) as response:
            code = response.getcode()
            final_url = response.geturl()

            if 200 <= code < 300:
                if final_url != url:
                    return ("redirected", code, f"Redirected to: {final_url}")
                return ("working", code, "OK")
            elif 300 <= code < 400:
                return ("redirected", code, f"Redirect: {final_url}")
            else:
                return ("broken", code, f"HTTP {code}")

    except HTTPError as e:
        if 400 <= e.code < 500:
            return ("broken", e.code, f"Client error: {e.reason}")
        elif 500 <= e.code < 600:
            return ("broken", e.code, f"Server error: {e.reason}")
        else:
            return ("error", e.code, f"HTTP Error: {e.reason}")
    except URLError as e:
        return ("error", 0, f"URL Error: {e.reason}")
    except Exception as e:
        return ("error", 0, f"Exception: {str(e)}")


def main():
    print("=" * 80)
    print("AGI PROGRESS TRACKER - URL ACCESSIBILITY CHECK")
    print("=" * 80)
    print()

    # Find all JSON files
    json_files = sorted(DATA_DIR.rglob("*.json"))
    print(f"Found {len(json_files)} JSON files")
    print()

    # Collect all URLs
    all_urls = []  # List of (file_path, url, title)
    for file_path in json_files:
        urls = extract_urls_from_json(file_path)
        for url, title in urls:
            all_urls.append((file_path, url, title))

    print(f"Found {len(all_urls)} URLs to check")
    print(f"Delay between requests: {DELAY_SECONDS}s")
    print()

    # Check all URLs
    results = {"working": [], "redirected": [], "broken": [], "error": []}

    for i, (file_path, url, title) in enumerate(all_urls, 1):
        print(f"[{i}/{len(all_urls)}] Checking: {url[:70]}...")

        status, code, details = check_url(url)
        results[status].append(
            {"file": str(file_path), "url": url, "title": title, "code": code, "details": details}
        )

        # Respectful delay
        if i < len(all_urls):
            time.sleep(DELAY_SECONDS)

    print()
    print("=" * 80)
    print("RESULTS SUMMARY")
    print("=" * 80)
    print()

    # Summary statistics
    total = len(all_urls)
    working_count = len(results["working"])
    redirected_count = len(results["redirected"])
    broken_count = len(results["broken"])
    error_count = len(results["error"])

    print(f"Total URLs checked:     {total}")
    print(f"Working (2xx):          {working_count} ({working_count / total * 100:.1f}%)")
    print(f"Redirected (3xx):       {redirected_count} ({redirected_count / total * 100:.1f}%)")
    print(f"Broken (4xx/5xx):       {broken_count} ({broken_count / total * 100:.1f}%)")
    print(f"Errors/Timeouts:        {error_count} ({error_count / total * 100:.1f}%)")
    print()

    # Detailed broken/error reports
    if results["broken"]:
        print("=" * 80)
        print("BROKEN URLs (HTTP 4xx/5xx)")
        print("=" * 80)
        print()
        for item in results["broken"]:
            print(f"File: {item['file']}")
            print(f"URL:  {item['url']}")
            print(f"Title: {item['title']}")
            print(f"Status: HTTP {item['code']} - {item['details']}")
            print()

    if results["error"]:
        print("=" * 80)
        print("ERRORS / TIMEOUTS / CONNECTION ISSUES")
        print("=" * 80)
        print()
        for item in results["error"]:
            print(f"File: {item['file']}")
            print(f"URL:  {item['url']}")
            print(f"Title: {item['title']}")
            print(f"Error: {item['details']}")
            print()

    if results["redirected"]:
        print("=" * 80)
        print("REDIRECTED URLs (May need updating)")
        print("=" * 80)
        print()
        for item in results["redirected"]:
            print(f"File: {item['file']}")
            print(f"URL:  {item['url']}")
            print(f"Title: {item['title']}")
            print(f"Status: HTTP {item['code']} - {item['details']}")
            print()

    # Recommendations
    print("=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)
    print()

    if broken_count == 0 and error_count == 0:
        print("✓ All URLs are accessible!")
    else:
        print(f"⚠ Found {broken_count + error_count} URLs that need attention:")
        print()

        # Group by issue type
        broken_404 = [i for i in results["broken"] if i["code"] == 404]
        broken_403 = [i for i in results["broken"] if i["code"] == 403]
        broken_other = [i for i in results["broken"] if i["code"] not in [403, 404]]

        if broken_404:
            print(f"  • {len(broken_404)} URLs return 404 Not Found - These need replacement")
        if broken_403:
            print(
                f"  • {len(broken_403)} URLs return 403 Forbidden - May need authentication or different approach"
            )
        if broken_other:
            print(f"  • {len(broken_other)} URLs return other error codes - Check individually")
        if results["error"]:
            print(f"  • {len(results['error'])} URLs have connection issues - Check manually")

        print()
        print("Next steps:")
        print("  1. Review broken URLs above and find suitable replacements")
        print("  2. Update the JSON files with new URLs")
        print("  3. Re-run this script to verify fixes")
        print("  4. Consider using archive.org links for permanently broken URLs")

    if redirected_count > 0:
        print()
        print(f"ℹ {redirected_count} URLs redirect to new locations:")
        print("  Consider updating these to the final URLs for better performance")

    print()
    print("=" * 80)
    print("Check complete!")
    print("=" * 80)


if __name__ == "__main__":
    main()
