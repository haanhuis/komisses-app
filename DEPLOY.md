# How to deploy

## Steps

1. Make your changes
2. Bump `VERSION` in `sw.js` (e.g. `v1` → `v2`)
3. Commit and push to GitHub

## Notes

- Bumping `VERSION` busts the service worker caches so users pick up new CSS/JS/fonts immediately
- It does **not** affect Firebase data — lists are safe across deployments
- HTML is served network-first, so the updated app shell loads on the next visit even without a version bump
- Static assets (CSS, JS, fonts, locale JSON) are cache-first — they only update when the version changes
