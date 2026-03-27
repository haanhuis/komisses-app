# iOS Keyboard Accessory Bar — Research & Attempts

The accessory bar is the native toolbar that appears above the iOS keyboard in Safari, containing ‹ › navigation arrows and a Done/✓ button.

## Goal
Hide or suppress the accessory bar entirely when the fab search modal is open.

## Attempts

### 1. `<form>` wrapper with single input + hidden submit button
Wrapped the search input in a `<form action="javascript:void(0)">` with a `<button type="submit" hidden>`. The idea: a form with a single input and no visible navigation targets suppresses the ‹ › arrows.
- **Result:** Arrows were suppressed. The bar itself still showed.

### 2. `enterkeyhint="done"` on the input
Sets the keyboard return key label to "Done" instead of "Return", giving a visual hint to the user.
- **Result:** Cosmetic only. Bar still shows.

### 3. `inputmode="search"` on the input
Changes the keyboard type to the search variant.
- **Result:** No effect on the accessory bar.

### 4. `onkeyup` / `onkeydown` Enter key handlers
Added `onkeyup="if(event.key==='Enter') closeFabSearch()"` to close the modal when the keyboard's Done key is pressed.
- **Result:** Works for the keyboard's return/done key. Does NOT catch the accessory bar ✓ button, which fires `blur` instead of a key event.

### 5. `onblur` handler with 150ms delay
Added `onblur="setTimeout(function(){ if (!modal.contains(document.activeElement)) closeFabSearch(); }, 150)"`. Closes the modal when focus leaves the input entirely (accessory bar Done tapped), but ignores blur if focus moved to a search result inside the modal.
- **Result:** Successfully closes the modal when the accessory bar ✓ is tapped. The bar itself still cannot be hidden.

## Conclusion
The iOS Safari accessory bar **cannot be hidden from a web app**. It is native browser chrome with no web API to control it. The ‹ › arrows can be suppressed with the `<form>` trick. The ✓ Done button can be handled via `onblur`. But the bar itself always renders.

This limitation does not exist in a native app or a PWA running in standalone mode (added to home screen), where the bar behaviour is slightly more controllable.
