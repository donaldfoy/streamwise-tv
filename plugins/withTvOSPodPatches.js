/**
 * Expo config plugin: Patch iOS-only native pods for tvOS compatibility.
 *
 * Some CocoaPods packages ship Swift/ObjC code that uses APIs which exist on
 * iOS but not tvOS. This plugin runs during `expo prebuild` and wraps those
 * source files in `#if !os(tvOS)` / `#endif` guards so they compile cleanly
 * on Apple TV without removing the packages from the project.
 *
 * Currently patched:
 *   - expo-glass-effect  (GlassContainer.swift, GlassView.swift)
 *     Overrides UIKit methods absent on tvOS → "Method does not override"
 */

const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const GUARD_OPEN = "// [withTvOSPodPatches] tvOS guard — auto-injected\n#if !os(tvOS)\n";
const GUARD_CLOSE = "\n#endif // [withTvOSPodPatches]\n";
const MARKER = "[withTvOSPodPatches]";

/**
 * Wraps an entire Swift file in #if !os(tvOS) … #endif.
 * Idempotent — skips files already patched.
 */
function guardSwiftFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const original = fs.readFileSync(filePath, "utf8");
  if (original.includes(MARKER)) return; // already patched
  fs.writeFileSync(filePath, GUARD_OPEN + original + GUARD_CLOSE);
  console.log(`[withTvOSPodPatches] Guarded ${path.basename(filePath)} for tvOS`);
}

/** @type {import('@expo/config-plugins').ConfigPlugin} */
module.exports = function withTvOSPodPatches(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      // node_modules is two levels up from the ios/ platform root:
      // <project>/ios/../node_modules
      const projectRoot = config.modRequest.projectRoot;
      const nodeModules = path.join(projectRoot, "node_modules");

      // ── expo-glass-effect ──────────────────────────────────────────────────
      const glassDir = path.join(nodeModules, "expo-glass-effect", "ios");
      for (const file of ["GlassContainer.swift", "GlassView.swift"]) {
        guardSwiftFile(path.join(glassDir, file));
      }

      return config;
    },
  ]);
};
