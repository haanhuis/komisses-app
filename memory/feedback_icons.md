---
name: feedback_icons
description: Do not use lni (LineIcons) for new icons — use inline Heroicons SVGs
type: feedback
---

Never use `lni` (LineIcons) classes for new or changed icons. Always use inline Heroicons SVGs instead.

**Why:** The project switched icon fonts to Heroicons (inline SVG). lni was the old system and should not be used for anything new.

**How to apply:** When adding or changing any icon, find the appropriate Heroicons SVG (solid/filled preferred) and paste it inline. Do not add `<i class="lni ...">` tags.
