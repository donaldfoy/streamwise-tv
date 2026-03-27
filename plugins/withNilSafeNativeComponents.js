/**
 * Expo config plugin: Nil-safe native component registration
 *
 * React Native's generated RCTThirdPartyFabricComponentsProvider.mm uses a
 * literal NSDictionary for third-party component registration. If any class
 * is absent (e.g. a module not linked for tvOS), NSClassFromString() returns
 * nil and inserting nil into an NSDictionary literal crashes immediately with
 * NSInvalidArgumentException "attempt to insert nil object".
 *
 * This plugin injects a Podfile post_install hook that finds the generated
 * .mm file and rewrites the dictionary construction to guard each insertion:
 *
 *   Class c = NSClassFromString(@"RNCWebView");
 *   if (c) dict[@"RNCWebView"] = c;
 *
 * This is idempotent and safe — entries are only added when the native class
 * actually exists in the binary.
 */

const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "# [withNilSafeNativeComponents] nil-safe patch";

const POST_INSTALL_HOOK = `
${MARKER}
post_install do |installer|
  files = Dir.glob([
    "#{installer.sandbox.root}/**/RCTThirdPartyFabricComponentsProvider.mm",
    "#{installer.sandbox.root}/**/*ThirdParty*ComponentsProvider.mm",
  ]).uniq

  files.each do |file|
    content = File.read(file)
    next unless content.include?("thirdPartyComponents = @{")

    # Extract each key/class pair from the literal dictionary
    pairs = content.scan(/@"(\\w+)"\\s*:\\s*NSClassFromString\\(@"(\\w+)"\\)/)
    next if pairs.empty?

    # Build a nil-safe replacement block
    guard_lines = pairs.map do |key, cls|
      "    { Class _c = NSClassFromString(@\\"#{cls}\\"); if (_c) [(NSMutableDictionary *)thirdPartyComponents setObject:_c forKey:@\\"#{key}\\"]; }"
    end.join("\\n")

    nil_safe_block = <<~OBJC
      thirdPartyComponents = [NSMutableDictionary dictionary];
    #{guard_lines}
      thirdPartyComponents = [(NSMutableDictionary *)thirdPartyComponents copy];
    OBJC

    patched = content.gsub(/thirdPartyComponents = @\\{[\\s\\S]*?\\};/, nil_safe_block.strip)

    if patched != content
      File.write(file, patched)
      puts "[withNilSafeNativeComponents] Patched #{File.basename(file)} — nil-safe component registration applied"
    end
  end
end
`;

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

      if (!podfile.includes(MARKER)) {
        podfile = podfile.trimEnd() + "\n" + POST_INSTALL_HOOK + "\n";
        fs.writeFileSync(podfilePath, podfile);
        console.log(
          "[withNilSafeNativeComponents] Injected nil-safe post_install hook into Podfile"
        );
      }

      return config;
    },
  ]);
};
