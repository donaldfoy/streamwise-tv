## StreamWiseTV Improvement Backlog

### P0 (Ship Blockers)

- Verify App Store upload produces no validation errors for tvOS assets and bundle settings.
- Confirm no critical runtime regressions on Apple TV hardware (home, detail, search, watchlist).
- Resolve React/Hermes dSYM warnings as far as current RN/tvOS toolchain allows.

### P1 (Stability)

- Add API-level fallback for detail route by `id` so deep links/cold starts do not rely only on in-memory store.
- Add structured error logging for network and storage failures.
- Add one command for release readiness checks (`typecheck`, prebuild verify, pod install sanity).

### P2 (Quality)

- Reduce dependency surface for unused mobile-only modules.
- Add basic test coverage for watchlist persistence and detail route behavior.
- Improve TV focus QA matrix for all screens and remote navigation loops.

### Risks To Watch

- Xcode sandboxing changes can break RN script phases in future Xcode versions.
- tvOS App Store validation can fail if brand assets are changed and required slots are left empty.
- Bundle ID/version mismatches between Expo config and Xcode settings can cause signing issues.

