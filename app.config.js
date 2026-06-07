// app.config.js — app.config module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message:

// Load environment variables from .env file so EAS CLI can access them
// when running `expo config --json` during `eas update`
require('dotenv').config(); 

// TODO(S-18): Certificate pinning non implementato. Per produzione, configurare
// certificate pinning per prevenire attacchi man-in-the-middle. Richiede configurazione
// nativa (Android: network_security_config.xml, iOS: Info.plist con NSPinnedDomains).

module.exports = {
  expo: {
    name: "MyFrigo",
    slug: "myfrigoapp",
    version: "1.0.3",
    runtimeVersion: "1.0.3",
    orientation: "portrait",
    scheme: "myfrigo",
    updates: {
      url: "https://u.expo.dev/6120f00b-d739-4a6d-886f-e96cf23c12fb",
      enabled: true,
      fallbackToCacheTimeout: 0,
      checkAutomatically: "ON_LOAD"
    },
    extra: {
      router: {
        origin: false,
        scheme: "myfrigo"
      },
      googleWebClientId: "849503699357-sauspamk0vl73ofrscs1jnuvsrje9pko.apps.googleusercontent.com",
      eas: {
        "projectId": "6120f00b-d739-4a6d-886f-e96cf23c12fb"
      },
      oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || (() => { throw new Error('EXPO_PUBLIC_ONESIGNAL_APP_ID is required'); })(),
      e2eTestMode: process.env.EXPO_PUBLIC_E2E_TEST_MODE === 'true'
     },
    icon: "./assets/images/icon.png",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "cover",
      backgroundColor: "#ffffff"
    },
    backgroundColor: "#ffffff",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.myfrigo"
    },
    android: {
      allowBackup: false,
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.myfrigo",
      permissions: [
        "RECEIVE_BOOT_COMPLETED",
        "com.google.android.c2dm.permission.RECEIVE",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.READ_EXTERNAL_STORAGE", // Added for gallery access
        "android.permission.READ_MEDIA_IMAGES", // Added for Android 13+ gallery access
        "android.permission.READ_MEDIA_VIDEO" // Added for Android 13+ media access
      ],
      queries: [
        {
          "intent": "android.intent.action.VIEW",
          "data": {
            "scheme": "https"
          }
        },
        {
          "intent": "android.intent.action.VIEW",
          "data": {
            "scheme": "http"
          }
        },
        {
          "intent": "android.intent.category.BROWSABLE",
          "data": {
            "scheme": "https"
          }
        },
        {
          "intent": "android.intent.action.VIEW",
          "data": {
            "scheme": "myfrigo",
            "host": "auth",
            "path": "/reset-password",
            "query": {
              "token_hash": "*",
              "type": "recovery"
            }
          },
          "category": [
            "android.intent.category.DEFAULT",
            "android.intent.category.BROWSABLE"
          ]
        },
        {
          "intent": "android.intent.action.VIEW",
          "data": {
            "scheme": "myfrigo"
            // Query rimane generica per altri possibili deep link futuri
          },
          "category": [
            "android.intent.category.DEFAULT",
            "android.intent.category.BROWSABLE"
          ]
        }
      ]
    },
    web: {
      favicon: "./assets/images/favicon.png",
      index: "./index.html"
    },
    notification: {
      "icon": "./assets/images/notification_icon.png",
      "color": "#ffffff",
      "iosDisplayInForeground": true
    },
    assetBundlePatterns: [
      "**/*",
      "icon_products/*"
    ],
    platforms: [
      "android",
      "ios",
      "web"
    ],
    plugins: [
      "expo-router",
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.849503699357-sauspamk0vl73ofrscs1jnuvsrje9pko"
        }
      ],
      [
        "onesignal-expo-plugin",
        {
          "mode": "development"
        }
      ],
      "expo-notifications",
      "expo-updates",
      "expo-font",
      "expo-web-browser",
      "expo-background-task"
    ],
  }
};
