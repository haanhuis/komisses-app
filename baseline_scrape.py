import json
import os
import time
from playwright.sync_api import sync_playwright

# Configuration
TARGET_URL = "https://dagelijksekost.vrt.be/gerechten/zoeken?course=main&trait=vis&region=Italiaans"
FILE_NAME = "full_recipes_merged.json"

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

def scrape_vrt_special():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1280, 'height': 1000})
        page = context.new_page()

        print(f"🌐 Navigating to: {TARGET_URL}")
        page.goto(TARGET_URL, wait_until="domcontentloaded")
        
        try:
            page.get_by_role("button", name="Alle cookies aanvaarden").click(timeout=5000)
        except: pass

        scroll_to_bottom(page)
        results = get_grid_data(page)
        browser.close()
        return results

def update_property(existing_val, new_val):
    """Helper to merge comma-separated strings without duplicates."""
    if not existing_val or existing_val == "none":
        return new_val
    
    existing_list = [i.strip() for i in str(existing_val).split(",")]
    if new_val not in existing_list:
        existing_list.append(new_val)
    
    return ", ".join(existing_list)

if __name__ == "__main__":
    # 1. Scrape the specific list
    scraped_recipes = scrape_vrt_special()
    
    # 2. Load existing data
    existing_data = []
    if os.path.exists(FILE_NAME):
        with open(FILE_NAME, "r", encoding='utf-8') as f:
            existing_data = json.load(f)
    
    # Create a map for easy lookup by URL
    recipe_map = {r['url']: r for r in existing_data}
    
    new_count = 0
    updated_count = 0

    # 3. Smart Merge Logic
    for scraped in scraped_recipes:
        url = scraped['url']
        
        if url in recipe_map:
            # UPDATE EXISTING
            recipe = recipe_map[url]
            
            # Update Trait (e.g., "pasta" -> "pasta, vis")
            old_trait = recipe.get('trait', 'none')
            recipe['trait'] = update_property(old_trait, "vis")
            
            # Update Region (e.g., "none" -> "Italiaans")
            old_region = recipe.get('region', 'none')
            recipe['region'] = update_property(old_region, "Italiaans")
            
            updated_count += 1
        else:
            # ADD NEW
            new_recipe = {
                "title": scraped['title'],
                "url": scraped['url'],
                "image_url": scraped['image_url'],
                "trait": "vis",
                "region": "Italiaans",
                "diet": "none"
            }
            existing_data.append(new_recipe)
            recipe_map[url] = new_recipe
            new_count += 1

    # 4. Save
    with open(FILE_NAME, "w", encoding='utf-8') as f:
        json.dump(existing_data, f, indent=4, ensure_ascii=False)
    
    print(f"\n✅ Merge Complete!")
    print(f"✨ New recipes added: {new_count}")
    print(f"🔄 Existing recipes updated: {updated_count}")
    print(f"📊 Total recipes in {FILE_NAME}: {len(existing_data)}")