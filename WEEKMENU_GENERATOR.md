# Week Menu Generator — Implementation

The generator is fully implemented using the Spoonacular API (Option B — browser-side, no backend).

## Status: Done

## How it works

`handleGenerate()` maps the UI options to Spoonacular query params and calls `fetchRecipes()`, which hits the Spoonacular `complexSearch` endpoint and writes results to Firebase `weekmenu`.

### Param mapping

| UI option | Spoonacular param |
|---|---|
| Cuisine toggles (Italian, Indian, Chinese…) | `cuisine` (comma-separated) |
| Vegetarisch / Veganistisch (all) | `diet=vegetarian` / `diet=vegan` |
| Veg split (e.g. 2 vegan + 3 regular) | Two parallel API calls, merged |
| Lactose / Gluten / Nuts / Soy | `intolerances` |
| Snel klaar | `maxReadyTime=30` |
| Stew, flemish, comfort food, halal, low carb | `query` (free text) |

### Data flow

```
handleGenerate()
  → fetchRecipes({ count, cuisines, diet, intolerances, maxReadyTime, query, vegSplit, vegType })
    → if no API key: open spoonacularModal, store pending params, return
    → runGenerate(params)
      → doSpoonacularSearch(apiKey, params)
        → GET https://api.spoonacular.com/recipes/complexSearch
        → returns [{ title, sourceUrl }, ...]
      → set(db, lists/{listId}/weekmenu, null)  ← clears old menu
      → for each recipe: set(db, lists/{listId}/weekmenu/{id}, { label, ref })
      → switchTab('weekmenu')
```

### API key storage

- Stored in Firebase at `lists/{listId}/spoonacularApiKey`
- Shared automatically with everyone on the same list — only one person needs to enter it
- Read into the `spoonacularApiKey` JS variable via the existing `onValue` listener in `initList`
- On first use, a modal (`#spoonacularModal`) is shown with:
  - Step-by-step instructions
  - Clickable link to spoonacular.com/food-api
  - Input field for the key
  - Save button (writes to Firebase, then continues generation)
- On 401 (invalid key): clears the Firebase value so the modal re-appears next time

### Error handling

- `401` → clears Firebase key, shows "Ongeldige API-sleutel"
- `402` → shows "Spoonacular daglimiet bereikt" (150 calls/day on free tier)
- Other errors → generic toast

## Setup

1. Get a free API key at spoonacular.com/food-api (150 calls/day free)
2. Open the app, go to Week menu tab, tap Genereer
3. Follow the in-app instructions — enter the key once, it's shared with everyone on the list via Firebase
