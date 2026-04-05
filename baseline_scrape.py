import json
import os
import time
from playwright.sync_api import sync_playwright

FILE_NAME = "full_recipes_merged.json"

# Each job: (url, tags to apply/merge)
SCRAPE_JOBS = [
    (
        "https://dagelijksekost.vrt.be/gerechten/zoeken?course=main&trait=ovenschotel&diet=Vegetarian&region=Belgisch",
        {"trait": "ovenschotel", "region": "Belgisch", "diet": "vegetarian"},
    ),
]


def scroll_to_bottom(page):
    print("⏳ Scrolling to load all recipes and images...")
    last_height = page.evaluate("document.body.scrollHeight")
    while True:
        page.mouse.wheel(0, 1500)
        time.sleep(2.5)
        new_height = page.evaluate("document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height


def get_grid_data(page):
    return page.evaluate("""() => {
        const cards = Array.from(document.querySelectorAll('a[href*="/gerechten/"]'));
        return cards.map(card => {
            const img = card.querySelector('img[data-testid="ui-image"]');
            return {
                title: card.innerText.split('\\n')[0].trim(),
                url: card.href,
                image_url: img ? img.src : null
            };
        }).filter(item => item.title.length > 2 && !item.url.includes('/zoeken'));
    }""")


def scrape_url(browser, url):
    context = browser.new_context(viewport={'width': 1280, 'height': 1000})
    page = context.new_page()
    print(f"\n🌐 Navigating to: {url}")
    page.goto(url, wait_until="domcontentloaded")
    try:
        page.get_by_role("button", name="Alle cookies aanvaarden").click(timeout=5000)
    except:
        pass
    scroll_to_bottom(page)
    results = get_grid_data(page)
    context.close()
    return results


def update_property(existing_val, new_val):
    """Merge comma-separated strings without duplicates."""
    if not existing_val or existing_val == "none":
        return new_val
    existing_list = [i.strip() for i in str(existing_val).split(",")]
    if new_val not in existing_list:
        existing_list.append(new_val)
    return ", ".join(existing_list)


if __name__ == "__main__":
    # Load existing data
    existing_data = []
    if os.path.exists(FILE_NAME):
        with open(FILE_NAME, "r", encoding='utf-8') as f:
            existing_data = json.load(f)

    recipe_map = {r['url']: r for r in existing_data}
    total_new = 0
    total_updated = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)

        for url, tags in SCRAPE_JOBS:
            scraped = scrape_url(browser, url)
            new_count = 0
            updated_count = 0

            for item in scraped:
                item_url = item['url']

                if item_url in recipe_map:
                    recipe = recipe_map[item_url]
                    for key, val in tags.items():
                        if key in ('trait', 'region'):
                            recipe[key] = update_property(recipe.get(key, 'none'), val)
                        else:
                            recipe[key] = val  # diet: overwrite directly
                    updated_count += 1
                else:
                    new_recipe = {
                        "title": item['title'],
                        "url": item_url,
                        "image_url": item['image_url'],
                        "trait": tags.get('trait', None),
                        "region": tags.get('region', None),
                        "diet": tags.get('diet', 'none'),
                    }
                    existing_data.append(new_recipe)
                    recipe_map[item_url] = new_recipe
                    new_count += 1

            print(f"  ✨ New: {new_count}  🔄 Updated: {updated_count}")
            total_new += new_count
            total_updated += updated_count

        browser.close()

    with open(FILE_NAME, "w", encoding='utf-8') as f:
        json.dump(existing_data, f, indent=4, ensure_ascii=False)

    print(f"\n✅ Merge Complete!")
    print(f"✨ Total new recipes added: {total_new}")
    print(f"🔄 Total existing recipes updated: {total_updated}")
    print(f"📊 Total recipes in {FILE_NAME}: {len(existing_data)}")
