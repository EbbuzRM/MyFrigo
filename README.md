<div align="center">
  <a href="#-italiano">Italiano</a> ·
  <a href="#-english">English</a>
</div>

# MyFrigo — Smart Food Manager 🍏

---

## 🇮🇹 Italiano

MyFrigo aiuta a gestire le scorte alimentari di casa, tenere sotto controllo le date di scadenza e ridurre gli sprechi.

**Piattaforma supportata in questa versione: Android.** iOS non è attualmente supportato né validato.

### Funzionalità

- Gestione dei prodotti, delle quantità, delle categorie e delle date di scadenza.
- Aggiunta manuale o tramite scansione di codici a barre, con suggerimenti da Open Food Facts.
- Foto dei prodotti e riconoscimento OCR locale delle date, con fallback server quando necessario.
- Notifiche push sulle scadenze tramite OneSignal e una Supabase Edge Function.
- Statistiche sui prodotti consumati e scaduti.
- Interfaccia in italiano e inglese, in base alla lingua del dispositivo.

### Tecnologie

- React Native, Expo e TypeScript.
- Supabase per database, autenticazione, storage e funzioni server.
- OneSignal per le notifiche push.
- Open Food Facts per i dati pubblici dei prodotti.

### Sviluppo Android

#### Requisiti

- Node.js 22.18 o successivo nella serie 22.x e npm.
- Android Studio, Android SDK e ADB.
- Un progetto Supabase e le configurazioni client di OneSignal e hCaptcha.
- Per le build cloud, EAS CLI e accesso al progetto EAS.

#### Installazione

```sh
git clone https://github.com/EbbuzRM/MyFrigo.git
cd MyFrigo
npm ci
```

Crea `.env` copiando `.env.example`:

```sh
cp .env.example .env
```

Imposta in .env le variabili client indicate in .env.example, tra cui:

- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_ONESIGNAL_APP_ID
- EXPO_PUBLIC_HCAPTCHA_SITEKEY

L'URL Supabase e la chiave client pubblica sono disponibili in `Project Settings > API`; recupera l'ID app da OneSignal e il site key dalla dashboard hCaptcha.

Configura lo stesso site key hCaptcha in Supabase Auth e nell'app. Le variabili EXPO_PUBLIC_ vengono incluse nell'app: non inserirvi chiavi server o altri segreti. I segreti delle Edge Function vanno configurati in Supabase.

#### Avvio

```sh
npx expo run:android
```

Questo comando crea e avvia l'app Android locale. Expo Go non è sufficiente perché MyFrigo usa moduli nativi.

Se sul dispositivo è già installata una development build:

```sh
npx expo start --dev-client
```

#### Verifiche

```sh
npm run type-check
npm run lint
npm test
```

#### Build Android Preview

Installa EAS CLI e accedi al progetto:

```sh
npm install --global eas-cli
eas login
```

Avvia la build:

```sh
eas build --platform android --profile preview
```

Il profilo preview genera una build Android a distribuzione interna sul channel EAS preview.

### Versione e aggiornamenti OTA

La build Android Preview 1.0.7 usa il runtime Expo 1.0.7 e il channel EAS preview. Il channel seleziona il branch degli aggiornamenti; runtimeVersion limita la consegna ai binari compatibili. I binari 1.0.6 con runtime 1.0.6 ricevono aggiornamenti compatibili con 1.0.6, mentre il binario 1.0.7 riceve aggiornamenti con runtime 1.0.7.

Prima di pubblicare un OTA, verifica nel progetto EAS il collegamento tra channel e branch e controlla il runtime dell'aggiornamento. Il profilo production non dichiara un channel in eas.json: assegnalo e verifica il relativo branch prima di creare una build production o pubblicarvi OTA. EAS gestisce versionCode da remoto; controlla il valore assegnato prima della release Android.

---

## 🇬🇧 English

MyFrigo helps you manage your household food inventory, track expiry dates and reduce food waste.

**Platform supported in this version: Android.** iOS is not currently supported or validated.

### Features

- Manage products, quantities, categories and expiry dates.
- Add products manually or scan barcodes, with suggestions from Open Food Facts.
- Take product photos and recognise expiry dates with on-device OCR, using a server fallback when needed.
- Receive expiry push notifications through OneSignal and a Supabase Edge Function.
- View statistics for consumed and expired products.
- The interface follows the device language (Italian or English).

### Technology

- React Native, Expo and TypeScript.
- Supabase for the database, authentication, storage and server functions.
- OneSignal for push notifications.
- Open Food Facts for public product information.

### Android development

#### Requirements

- Node.js 22.18 or later in the 22.x series and npm.
- Android Studio, the Android SDK and ADB.
- A Supabase project and client configuration for OneSignal and hCaptcha.
- For cloud builds, EAS CLI and access to the EAS project.

#### Installation

```sh
git clone https://github.com/EbbuzRM/MyFrigo.git
cd MyFrigo
npm ci
```

Create `.env` by copying `.env.example`:

```sh
cp .env.example .env
```

Set the client variables listed in .env.example, including:

- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_ONESIGNAL_APP_ID
- EXPO_PUBLIC_HCAPTCHA_SITEKEY

Find the Supabase URL and public client key under `Project Settings > API`; get the app ID from OneSignal and the site key from the hCaptcha dashboard.

Configure the same hCaptcha site key in Supabase Auth and in the app. EXPO_PUBLIC_ variables are bundled into the app. Do not put server keys or other secrets in them. Configure Edge Function secrets in Supabase.

#### Run on Android

```sh
npx expo run:android
```

This builds and launches the local Android app. Expo Go is not sufficient because MyFrigo uses native modules.

If a development build is already installed on the device:

```sh
npx expo start --dev-client
```

#### Checks

```sh
npm run type-check
npm run lint
npm test
```

#### Android Preview build

Install EAS CLI and sign in to the project:

```sh
npm install --global eas-cli
eas login
```

Start the build:

```sh
eas build --platform android --profile preview
```

The preview profile creates an Android build for internal distribution on the EAS preview channel.

### Version and OTA updates

The Android 1.0.7 Preview build uses Expo runtime 1.0.7 and the EAS preview channel. The channel selects the update branch; runtimeVersion limits delivery to compatible binaries. Binaries on runtime 1.0.6 receive updates compatible with 1.0.6, while the 1.0.7 binary receives updates with runtime 1.0.7.

Before publishing an OTA update, check the channel-to-branch mapping in the EAS project and confirm the update runtime. The production profile does not declare a channel in eas.json: assign one and verify its branch before creating a production build or publishing production updates. EAS manages versionCode remotely; check the assigned value before an Android release.

---

## 🤝 Contributing

Contributions are welcome. Fork the repository, create a feature branch, commit your changes, push the branch and open a pull request.

## 📄 License

MyFrigo is released under the MIT License. See the LICENSE file for details.
