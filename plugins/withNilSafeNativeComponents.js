/**
 * Expo config plugin: Nil-safe native component registration
 *
 * React Native's generated RCTThirdPartyFabricComponentsProvider.mm uses a
 * literal NSDictionary for third-party component registration. If any class
 * is absent (e.g. a module not linked for tvOS), NSClassFromString() returns
 * nil and inserting nil into an NSDictionary literal crashes at startup.
 *
 * FIX: Inject Ruby patch code INSIDE the existing post_install block that
 * Expo already generates — after react_native_post_install(installer, ...).
 * CocoaPods only allows ONE post_install block, so we must merge, not append.
 *
 * The patch finds the generated .mm file after pod install and rewrites:
 *   thirdPartyComponents = @{ @"Foo": NSClassFromString(@"Foo"), ... };
 * into nil-safe guarded insertions that skip missing classes silently.
 */

const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "# [withNilSafeNativeComponents]";

// Ruby code to inject INSIDE the existing post_install block.
// Uses prefixed variable names (__ns_*) to avoid colliding with anything
// the existing block declares.
const PATCH_BODY = `
  ${MARKER} nil-safe patch — injected by withNilSafeNativeComponents plugin
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
      puts "[withNilSafeNativeComponents] Patched #{File.basename(__ns_file)} — nil classes will be skipped"
    end
  end`;

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

      let podfile = fs.readFileSync(podfilePath, "utf8");

      // Already patched — skip.
      if (podfile.includes(MARKER)) {
        return config;
      }

      // ── Strategy 1: inject after react_native_post_install(installer…) ──
      // Expo's generated Podfile has a post_install block containing a call
      // like: react_native_post_install(installer, ...) or
      //        react_native_post_install(installer)
      // We insert our Ruby block on the very next line after that call.
      const rnPostInstallRe = /([ \t]*react_native_post_install\s*\([^)]*\)[ \t]*\n)/;
      if (rnPostInstallRe.test(podfile)) {
        podfile = podfile.replace(rnPostInstallRe, `$1${PATCH_BODY}\n`);
        fs.writeFileSync(podfilePath, podfile);
        console.log(
          "[withNilSafeNativeComponents] Injected nil-safe patch inside existing post_install block (after react_native_post_install)"
        );
        return config;
      }

      // ── Strategy 2: inject before the closing `end` of post_install ──
      // Fallback: find `post_install do |installer|` block and insert before
      // its final `end`. This works when the exact anchor above isn't present.
      const postInstallRe = /(post_install do \|installer\|)([\s\S]*?)(^end\b)/m;
      if (postInstallRe.test(podfile)) {
        podfile = podfile.replace(
          postInstallRe,
          (_, open, body, close) => `${open}${body}${PATCH_BODY}\n${close}`
        );
        fs.writeFileSync(podfilePath, podfile);
        console.log(
          "[withNilSafeNativeComponents] Injected nil-safe patch inside existing post_install block (before closing end)"
        );
        return config;
      }

      // ── Strategy 3: no existing post_install — create one ──
      // Last resort only. CocoaPods allows exactly one, and Expo always
      // generates one, so this branch should rarely if ever trigger.
      const standalone = `\npost_install do |installer|\n${PATCH_BODY}\nend\n`;
      podfile = podfile.trimEnd() + standalone;
      fs.writeFileSync(podfilePath, podfile);
      console.log(
        "[withNilSafeNativeComponents] No existing post_install found — created new block (verify no duplicate post_install warnings)"
      );

      return config;
    },
  ]);
};
