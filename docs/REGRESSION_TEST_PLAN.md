## Regression Test Plan (tvOS)

### Home

- Launch app and verify hero renders without crashes.
- Open at least 3 cards from different rows and confirm detail screen opens.

### Detail

- Verify `View Options` scrolls down to `Where to Watch`.
- Verify `Add to List` and `Remove from List` toggle state correctly.
- Verify `Back to Browse` returns to previous screen.

### Search

- Enter query, verify results appear.
- Open a search result and return.

### Watchlist

- Add two items from Home/Detail.
- Confirm they appear on watchlist screen.
- Remove one item and relaunch app; confirm persisted state.

### App Store Readiness

- Archive Release for tvOS.
- Confirm Brand Assets still pass validation.
- Check upload warnings for dSYM frameworks and note status.

