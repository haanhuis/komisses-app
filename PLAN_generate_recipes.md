# Plan: Generate week menu feature

## Goal
When the user taps "Generate week menu" in the empty state of the week menu tab, the app searches the web for real recipes matching the selected parameters and populates the week menu, with each recipe assigned to a day of the week starting from today.

## The problem
The Anthropic API doesn't allow direct browser calls (no CORS), so we need a small backend proxy.

## Implementation plan

### 1. `netlify.toml`
Tells Netlify where to find the functions, so the static site + serverless function live in the same repo/deploy.

### 2. `netlify/functions/generate-recipes.js`
A serverless function that:
- Receives recipe parameters (count, dietary preference, cuisine styles, restrictions, etc.)
- Calls Claude API with the `web_search` tool so it actually crawls the web for real recipes
- Returns a clean JSON array: `[{ name, description, prepTime, url }]`
- Reads `ANTHROPIC_API_KEY` from a Netlify environment variable (set once in Netlify dashboard)

### 3. `index.html` — update `sendPrompt()`
- Close the generator sheet and show a loading state ("Recepten zoeken...")
- POST to `/.netlify/functions/generate-recipes`
- On success: write each recipe to Firebase as a weekmenu entry, days assigned starting from today (recipe 1 → today, recipe 2 → tomorrow, wrapping after Sunday)
- Re-render the week menu tab with the results

## Hosting requirement
The app needs to be **hosted on Netlify** for the serverless function to work.

### Options considered
| Option | Pros | Cons |
|---|---|---|
| **Move to Netlify** ✅ | Same GitHub push workflow, functions built-in, free tier sufficient | Need to migrate hosting |
| Separate backend (Render/Railway) | Keep current host | Extra complexity, separate deploy |
| Browser-callable recipe API (TheMealDB etc.) | No backend needed | Fixed database, limited filtering |

**Recommended:** Netlify. ~5 min setup, deploy workflow stays the same (push to GitHub → auto-deploy). Add `ANTHROPIC_API_KEY` once in the Netlify dashboard.

## One-time setup steps (when ready)
1. Go to [netlify.com](https://netlify.com) and connect the GitHub repo
2. Set build settings: no build command, publish directory = `.` (root)
3. Add environment variable `ANTHROPIC_API_KEY` in Site settings → Environment variables
4. Point the custom domain (if any) to Netlify
