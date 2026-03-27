/**
 * Expo config plugin: Nil-safe native component registration
 *
 * Injects Ruby patch code INSIDE the existing post_install block by tracking
 * parenthesis/block depth line-by-line — not with regex — so it works
 * correctly with multi-line react_native_post_install(...) calls.
 *
 * CocoaPods only allows ONE post_install block. This plugin NEVER adds a
 * second one; it only inserts lines inside the existing block.
 */

const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "[withNilSafeNativeComponents]";

// Ruby lines to inject (installer is in scope, prefixed vars avoid collisions)
const PATCH_LINES = `
  # ${MARKER} nil-safe patch — auto-injected, do not edit manually
  __ns_files = Dir.glob([
    "#{installer.sandbox.root}/**/RCTThirdPartyFabricComponentsProvider.mm",
    "#{installer.sandbox.root}/**/*ThirdParty*ComponentsProvider.mm",
  ]).uniq
  __ns_files.each do |__ns_file|
    __ns_content = File.read(__ns_file)
    next unless __ns_content.include?("thirdPartyComponents = @{")
    __ns_pairs = __ns_content.scan(/@"(\\w+)"\\s*:\\s*NSClassFromString\\(@"(\\w+)"\\)/)
    next if __ns_pairs.empty?
    __ns_guards = __ns_pairs.map do |__ns_key, __ns_cls|
      "    { Class _c = NSClassFromString(@\\"#{__ns_cls}\\"); if (_c) [(NSMutableDictionary *)thirdPartyComponents setObject:_c forKey:@\\"#{__ns_key}\\"]; }"
    end.join("\\n")
    __ns_replacement = [
      "thirdPartyComponents = [NSMutableDictionary dictionary];",
      __ns_guards,
      "    thirdPartyComponents = [(NSMutableDictionary *)thirdPartyComponents copy];",
    ].join("\\n")
    __ns_patched = __ns_content.gsub(/thirdPartyComponents = @\\{[\\s\\S]*?\\};/, __ns_replacement)
    if __ns_patched != __ns_content
      File.write(__ns_file, __ns_patched)
      puts "${MARKER} Patched #{File.basename(__ns_file)} — nil classes will be skipped safely"
    end
  end

  # ${MARKER} ExpoGlassEffect tvOS exclusion
  # GlassContainer.swift and GlassView.swift override Fabric methods
  # (mountChildComponentView / unmountChildComponentView) that don't exist
  # in the ExpoView superclass on tvOS. Exclude all Swift source from the
  # ExpoGlassEffect pod when building for Apple TV SDKs.
  installer.pods_project.targets.each do |__eg_target|
    next unless __eg_target.name == 'ExpoGlassEffect'
    __eg_target.build_configurations.each do |__eg_config|
      __eg_config.build_settings['EXCLUDED_SOURCE_FILE_NAMES[sdk=appletvos*]']        = '*.swift'
      __eg_config.build_settings['EXCLUDED_SOURCE_FILE_NAMES[sdk=appletvsimulator*]'] = '*.swift'
    end
    puts "${MARKER} Excluded ExpoGlassEffect Swift files from tvOS/tvSimulator builds"
  end`;

/**
 * Find where react_native_post_install(...) ends by tracking paren depth.
 * Returns the 0-based line index of the closing ')' line, or -1 if not found.
 */
function findReactNativePostInstallEnd(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes("react_native_post_install(")) continue;
    // Found the opening line — track parenthesis depth from here
    let depth = 0;
    for (let j = i; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === "(") depth++;
        else if (ch === ")") depth--;
      }
      if (depth === 0) return j; // closing paren is on line j
    }
  }
  return -1;
}

/**
 * Find the line index of the closing `end` for the `post_install do |installer|`
 * block by tracking Ruby block-opening keywords vs `end` at the same indent.
 * Returns -1 if not found.
 */
function findPostInstallEnd(lines) {
  // Keywords that open a new block (and therefore need a matching `end`)
  const OPENERS = /\b(do|begin|def|class|module|if|unless|case|while|until|for)\b/;

  for (let i = 0; i < lines.length; i++) {
    if (!/post_install\s+do\s+\|installer\|/.test(lines[i])) continue;

    // The indent of the `post_install` line itself
    const indent = lines[i].match(/^(\s*)/)[1].length;
    let depth = 1; // we're already inside this block

    for (let j = i + 1; j < lines.length; j++) {
      const trimmed = lines[j].trim();

      // Skip blank lines and comments
      if (trimmed === "" || trimmed.startsWith("#")) continue;

      // Count block openers on this line (do, if, def, etc.)
      // Use a simple heuristic: count `do` / block keywords that add depth
      const openerMatches = trimmed.match(/\bdo\b|\bbegin\b|\bdef\b|\bclass\b|\bmodule\b/g);
      if (openerMatches) depth += openerMatches.length;

      // An `end` at the same or lesser indentation closes our target block
      if (/^\s*end\s*$/.test(lines[j])) {
        const endIndent = lines[j].match(/^(\s*)/)[1].length;
        if (endIndent <= indent) {
          return j; // this is the matching `end` for our post_install block
        }
        depth--;
        if (depth <= 0) return j;
      }
    }
  }
  return -1;
}

/** @type {import('@expo/config-plugins').ConfigPlugin} */
module.exports = function withNilSafeNativeComponents(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      const raw = fs.readFileSync(podfilePath, "utf8");

      // Already patched — skip.
      if (raw.includes(MARKER)) {
        return config;
      }

      const lines = raw.split("\n");

      // ── Strategy 1: after react_native_post_install(…) closing paren ──────
      const rniEnd = findReactNativePostInstallEnd(lines);
      if (rniEnd >= 0) {
        lines.splice(rniEnd + 1, 0, PATCH_LINES);
        fs.writeFileSync(podfilePath, lines.join("\n"));
        console.log(
          `[withNilSafeNativeComponents] Injected nil-safe patch after react_native_post_install (line ${rniEnd + 1})`
        );
        return config;
      }

      // ── Strategy 2: before the closing `end` of post_install block ────────
      const postInstallEndLine = findPostInstallEnd(lines);
      if (postInstallEndLine >= 0) {
        lines.splice(postInstallEndLine, 0, PATCH_LINES);
        fs.writeFileSync(podfilePath, lines.join("\n"));
        console.log(
          `[withNilSafeNativeComponents] Injected nil-safe patch before post_install closing end (line ${postInstallEndLine})`
        );
        return config;
      }

      // ── Strategy 3: no post_install at all — create one ──────────────────
      // This should never happen with Expo-generated Podfiles.
      const standalone =
        `\npost_install do |installer|\n${PATCH_LINES}\nend\n`;
      fs.writeFileSync(podfilePath, raw.trimEnd() + standalone);
      console.log(
        "[withNilSafeNativeComponents] No post_install block found — created standalone block"
      );

      return config;
    },
  ]);
};
