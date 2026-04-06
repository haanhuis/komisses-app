import json
import os
import time
from playwright.sync_api import sync_playwright

FILE_NAME = "full_recipes_merged.json"

PINTEREST_BOARDS = [
    "https://www.pinterest.com/annelieslenain/to-eat/",
]


def scroll_to_bottom(page):
    print("⏳ Scrolling to load all pins...")
    last_height = page.evaluate("document.body.scrollHeight")
    while True:
        page.mouse.wheel(0, 1500)
        time.sleep(2.5)
        new_height = page.evaluate("document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height


def get_pinterest_data(page):
    return page.evaluate("""() => {
        const pins = Array.from(document.querySelectorAll('[data-test-id="pin"] a[href*="/pin/"]'));
        const seen = new Set();
        const results = [];
        for (const a of pins) {
            const href = a.href.split('?')[0];
            if (seen.has(href)) continue;
            seen.add(href);
            const img = a.querySelector('img');
            const titleEl = a.querySelector('[data-test-id="pin-visual-title"], [data-test-id="pinTitle"], h3, div[class*="title"]');
            const title = (titleEl?.innerText || img?.alt || '').split('\\n')[0].trim();
            if (!title || title.length < 3) continue;
            results.push({
                title,
                url: href,
                image_url: img ? img.src : null,
            });
        }
        return results;
    }""")


if __name__ == "__main__":
    existing_data = []
    if os.path.exists(FILE_NAME):
        with open(FILE_NAME, "r", encoding="utf-8") as f:
            existing_data = json.load(f)

    recipe_map = {r["url"]: r for r in existing_data}
    total_new = 0

    SESSION_FILE = "pinterest_session.json"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={"width": 1280, "height": 1000},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            storage_state=SESSION_FILE if os.path.exists(SESSION_FILE) else None,
        )

        # Check if already logged in, otherwise ask user to log in
        page = context.new_page()
        page.goto("https://www.pinterest.com", wait_until="domcontentloaded")
        time.sleep(2)
        logged_in = page.query_selector('[data-test-id="header-avatar"]') is not None
        if not logged_in:
            print("\n🔐 Not logged in. Please log in to Pinterest in the browser window.")
            print("   Press ENTER here when you're logged in...")
            input()
            context.storage_state(path=SESSION_FILE)
            print("✅ Session saved for next time.")
        else:
            print("✅ Already logged in.")
        page.close()

        for board_url in PINTEREST_BOARDS:
            page = context.new_page()
            print(f"\n📌 Scraping: {board_url}")
            page.goto(board_url, wait_until="domcontentloaded")
            time.sleep(3)

            # Dismiss any modal/cookie dialogs
            for selector in [
                'button[data-test-id="simple-modal-close"]',
                'button[aria-label="Close"]',
            ]:
                try:
                    page.click(selector, timeout=3000)
                except:
                    pass

            scroll_to_bottom(page)
            pins = get_pinterest_data(page)
            page.close()

            new_count = 0
            for pin in pins:
                if pin["url"] in recipe_map:
                    continue
                new_recipe = {
                    "title": pin["title"],
                    "url": pin["url"],
                    "image_url": pin["image_url"],
                    "trait": None,
                    "region": None,
                    "diet": "none",
                }
                existing_data.append(new_recipe)
                recipe_map[pin["url"]] = new_recipe
                new_count += 1

            print(f"  📌 Found {len(pins)} pins, {new_count} new added")
            total_new += new_count

        context.close()
        browser.close()

    with open(FILE_NAME, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, indent=4, ensure_ascii=False)

    print(f"\n✅ Done! {total_new} new recipes added. Total: {len(existing_data)}")
