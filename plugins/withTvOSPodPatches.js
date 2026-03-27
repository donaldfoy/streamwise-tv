/**
 * withTvOSPodPatches — no-op stub.
 *
 * tvOS pod compatibility is handled entirely by withNilSafeNativeComponents.js
 * which injects EXCLUDED_SOURCE_FILE_NAMES build settings for ExpoGlassEffect
 * inside the existing CocoaPods post_install hook.
 *
 * This file is kept only so app.json does not need to be changed.
 * It does nothing and produces no side effects.
 */

/** @type {import('@expo/config-plugins').ConfigPlugin} */
module.exports = function withTvOSPodPatches(config) {
  return config;
};
