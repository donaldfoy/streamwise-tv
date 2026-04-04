## StreamWiseTV Code Review Report

### Highest Priority Findings

1. Detail screen had non-functional primary actions (`Play Now`, `Share`), creating UX dead-ends.
2. TypeScript project referenced a missing external path (`../../lib/api-client-react`), breaking local validation.
3. Watchlist persistence swallowed storage parse/write errors, reducing observability during failures.
4. Build/release metadata drift risk between Expo and Xcode versioning/bundle settings.
5. RN framework dSYM warnings persisted during upload; release settings needed explicit dSYM generation.

### Fixes Applied

- Detail screen:
  - `Play Now` changed to `View Options` and now scrolls to provider section.
  - `Share` changed to `Back to Browse` to avoid no-op behavior.
- Typecheck:
  - Removed invalid TS project reference from `tsconfig.json`.
  - Updated style/ref typings for TV wrappers/cards to satisfy strict typing.
  - Adjusted `expo-image` usage to avoid unsupported prop.
- Persistence:
  - Added warning logs for watchlist parse and save failures.
- Release config:
  - Added Release `dwarf-with-dsym` configuration for Pods in `ios/Podfile`.
  - Aligned Xcode bundle ID/version/build with Expo config.
- Cleanup:
  - Standardized local `dev` script; removed legacy hosted-dev npm scripts.
  - Removed third-party router-origin plugin option from `app.json`.

### Recommended Next Improvements

- Add API fallback by content id in detail route for cold launch/deep-link reliability.
- Add automated release check script combining `typecheck`, pod install, and tvOS prebuild verification.
- Prune truly unused mobile-only dependencies after confirming feature scope.

