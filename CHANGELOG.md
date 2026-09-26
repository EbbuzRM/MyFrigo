# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.7] - 2026-09-26

### Added

- Italian and British English localization across app screens, accessibility, settings, diagnostics, and product flows.
- Locale-aware date, calendar, and quantity formatting, with Android locale declarations for Italian and English.
- Push subscription registration with language metadata and notification routing support.
- Bilingual Italian/English versions of all seven Supabase Auth email templates.

### Changed

- Updated the app version and Android runtime to `1.0.7`; the EAS `preview` profile targets the `preview` channel so OTA updates remain runtime-compatible with each binary.
- OCR fallback tries the active language first and uses the other supported language only when the first attempt finds no valid expiry date.

### Fixed

- Made OneSignal logout attempt device and push-subscription cleanup independently, while guarding account switches from stale logout work.
- Localized results from asynchronous barcode lookups and kept the Open Food Facts cache separated by language.
- Improved barcode product-image loading and persistence of photos captured for products.
- Replaced deprecated React Native safe-area usage in the app and hCaptcha patch.
- Corrected expiry-day calculations around daylight-saving transitions.

## [1.0.6] - 2026-08-30

### Changed

- Upgraded Expo SDK from 54 to 57 (React Native 0.86.3, React 19.2.3) for improved performance and stability. ([`13d267d`](https://github.com/EbbuzRM/MyFrigo/commit/13d267d))
- Migrated navigation imports to expo-router fork (React Navigation decoupled in SDK 56+). ([`492f832`](https://github.com/EbbuzRM/MyFrigo/commit/492f832))
- Upgraded TypeScript to 6.0.3, removed deprecated `baseUrl` from tsconfig.json. ([`b055ea9`](https://github.com/EbbuzRM/MyFrigo/commit/b055ea9))

### Security

- Added hCaptcha integration to login, signup, and forgot-password forms to prevent automated attacks. ([`13d267d`](https://github.com/EbbuzRM/MyFrigo/commit/13d267d))
- Migrated token storage from AsyncStorage to expo-secure-store (encrypted) for enhanced security. ([`13d267d`](https://github.com/EbbuzRM/MyFrigo/commit/13d267d))
- Implemented brute force protection with rate limiting (5 attempts/15 minutes) on login, signup, and password reset. ([`13d267d`](https://github.com/EbbuzRM/MyFrigo/commit/13d267d))

### Fixed

- Updated React Native 0.86 internal paths for DevMenu and AppState mocks in test suite. ([`64b4279`](https://github.com/EbbuzRM/MyFrigo/commit/64b4279))
- Regenerated native Android directory for Expo SDK 57 compatibility. ([`c4baa37`](https://github.com/EbbuzRM/MyFrigo/commit/c4baa37))

### Technical

- Installed `@react-native/jest-preset@0.86.3` (required peer for jest-expo 57). ([`0cb4f97`](https://github.com/EbbuzRM/MyFrigo/commit/0cb4f97))
- Added `@expo/vector-icons` as direct dependency (no longer declared by expo 57). ([`56fa8f9`](https://github.com/EbbuzRM/MyFrigo/commit/56fa8f9))
- Fixed `StyleSheet.absoluteFillObject` → `absoluteFill` (RN 0.86 breaking change). ([`56fa8f9`](https://github.com/EbbuzRM/MyFrigo/commit/56fa8f9))
- Added `expo-splash-screen` plugin with explicit props to prevent crashes on `SplashScreen.preventAutoHideAsync()`. ([`13d267d`](https://github.com/EbbuzRM/MyFrigo/commit/13d267d))
- Bumped runtimeVersion to 1.0.6 (native runtime changed, OTA updates incompatible). ([`13d267d`](https://github.com/EbbuzRM/MyFrigo/commit/13d267d))
- Updated EAS Build Node.js version to 22.18.0 (SDK 57 requires ≥22.13). ([`e0efd91`](https://github.com/EbbuzRM/MyFrigo/commit/e0efd91))
- Removed dead dependencies: `react-native-sound`, `patch-package`. ([`e0efd91`](https://github.com/EbbuzRM/MyFrigo/commit/e0efd91))

**Baseline**: 129 test suites / 2284 tests passed / 0 failed / 5 skipped / 0 TypeScript errors.
