/**
 * Expo config plugin: tvOS pod compatibility (file restoration only).
 *
 * A previous version of this plugin wrapped Swift files in #if !os(tvOS)
 * guards. That approach caused duplicate-method confusion when pnpm cached
 * a partly-patched file. This version UNDOES those file-level patches so
 * the source files are back to their original state.
 *
 * The actual tvOS fix for expo-glass-effect is now handled by
 * withNilSafeNativeComponents.js, which injects EXCLUDED_SOURCE_FILE_NAMES
 * build settings inside the existing CocoaPods post_install hook. That
 * approach works at the Xcode build-system level and never touches source.
 */

const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const GUARD_OPEN_MARKER = "[withTvOSPodPatches] tvOS guard";

/**
 * If this file was previously wrapped in #if !os(tvOS) by an older version
 * of this plugin, strip that wrapper and restore the original content.
 */
function restoreIfGuarded(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(GUARD_OPEN_MARKER)) return;

  // Strip the guard comment line, the #if !os(tvOS) line, and the trailing #endif line
  const lines = content.split("\n");
  const cleanLines = lines.filter(
    (l) =>
      !l.includes(GUARD_OPEN_MARKER) &&
      l.trim() !== "#if !os(tvOS)" &&
      l.trim() !== "#endif // [withTvOSPodPatches]"
  );

  // Remove a leading blank line that the guard may have left behind
  while (cleanLines.length > 0 && cleanLines[0].trim() === "") {
    cleanLines.shift();
  }

  fs.writeFileSync(filePath, cleanLines.join("\n"));
  console.log(
    `[withTvOSPodPatches] Restored ${path.basename(filePath)} to original (guard removed)`
  );
}

/** @type {import('@expo/config-plugins').ConfigPlugin} */
module.exports = function withTvOSPodPatches(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const nodeModules = path.join(projectRoot, "node_modules");

      // Restore any Swift files previously wrapped by the old guard approach
      const glassDir = path.join(nodeModules, "expo-glass-effect", "ios");
      for (const file of [
        "GlassContainer.swift",
        "GlassView.swift",
        "GlassEffectModule.swift",
        "GlassStyle.swift",
      ]) {
        restoreIfGuarded(path.join(glassDir, file));
      }

      return config;
    },
  ]);
};
