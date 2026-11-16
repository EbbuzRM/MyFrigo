import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// 1.0.8 ships JavaScript only, so it must keep running on the 1.0.7 native runtime.
const APP_VERSION = '1.0.8';
const OTA_RUNTIME_VERSION = '1.0.7';

it('keeps the app version and the pinned Android OTA runtime consistent', () => {
  const root = join(__dirname, '..');
  const expoConfig = readFileSync(join(root, 'app.config.js'), 'utf8');
  const androidStrings = readFileSync(join(root, 'android/app/src/main/res/values/strings.xml'), 'utf8');
  const androidGradle = readFileSync(join(root, 'android/app/build.gradle'), 'utf8');
  const androidManifest = readFileSync(join(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const packageLock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
  const eas = JSON.parse(readFileSync(join(root, 'eas.json'), 'utf8'));
  const configVersion = expoConfig.match(/\bversion:\s*"([^"]+)"/)?.[1];
  const configRuntime = expoConfig.match(/runtimeVersion:\s*"([^"]+)"/)?.[1];
  const nativeRuntime = androidStrings.match(/<string name="expo_runtime_version">([^<]+)<\/string>/)?.[1];
  const nativeVersion = androidGradle.match(/versionName\s+"([^"]+)"/)?.[1];

  expect(configVersion).toBe(APP_VERSION);
  expect(packageJson.version).toBe(configVersion);
  expect(packageLock.version).toBe(configVersion);
  expect(packageLock.packages[''].version).toBe(configVersion);
  expect(nativeVersion).toBe(configVersion);
  // The OTA runtime stays on the binary already installed in the field.
  expect(configRuntime).toBe(OTA_RUNTIME_VERSION);
  expect(nativeRuntime).toBe(configRuntime);
  expect(androidManifest).toContain('android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="@string/expo_runtime_version"');
  expect(eas.build.preview.channel).toBe('preview');
  expect(eas.cli.appVersionSource).toBe('remote');
});
