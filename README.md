<div align="center">
  <a href="#-italiano">Italiano</a> •
  <a href="#-english">English</a>
</div>

# MyFrigo - Smart Food Manager 🍏

---

## 🇮🇹 Italiano

MyFrigo è un'applicazione mobile cross-platform che aiuta a gestire l'inventario alimentare domestico. Traccia le date di scadenza, invia notifiche locali per i prodotti in avvicinamento alla scadenza e fornisce statistiche sui consumi per minimizzare gli sprechi.

L'app è costruita utilizzando React Native ed Expo, con un backend completamente basato su **Supabase** per il database PostgreSQL, l'autenticazione e le funzioni serverless.

### ✨ Caratteristiche principali

-   **Inventario Prodotti**: Tieni traccia di tutti i tuoi prodotti alimentari con dettagli su quantità, marca e date.
-   **Notifiche Locali Affidabili**: Ricevi avvisi push personalizzabili prima che i prodotti scadano, gestiti localmente per la massima affidabilità.
-   **Aggiunta Rapida**: Inserisci i prodotti manualmente, tramite scansione del codice a barre o scattando una foto con OCR per la data di scadenza.
-   **Backend Supabase**: Tutti i dati sono sincronizzati in tempo reale su un database PostgreSQL, con autenticazione sicura e Row Level Security.
-   **Statistiche di Consumo**: Visualizza report sui prodotti consumati e scaduti per migliorare le tue abitudini di acquisto.
-   **Tema Chiaro/Scuro**: Interfaccia utente adattabile alle preferenze di sistema o manuali.

### 🛠️ Stack Tecnologico

-   **Framework**: React Native con Expo
-   **Linguaggio**: TypeScript
-   **Backend**: Supabase (PostgreSQL, Auth, Storage)
-   **Notifiche Push**: OneSignal (per notifiche remote, es. marketing)
-   **Notifiche Locali**: Expo Notifications
-   **Navigazione**: Expo Router
-   **UI**: Componenti personalizzati

### 🚀 Installazione e Avvio

Per eseguire il progetto in locale, segui questi passaggi.

#### Prerequisiti

-   [Node.js](https://nodejs.org/) (versione LTS raccomandata)
-   [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
-   [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
-   [EAS CLI](https://docs.expo.dev/get-started/installation/): `npm install -g eas-cli`
-   App [Expo Go](https://expo.dev/go) installata sul tuo dispositivo mobile (iOS o Android).

#### 1. Clonazione del Repository

```bash
git clone https://github.com/EbbuzRM/myfrigo.git
cd myfrigo
```

#### 2. Installazione delle Dipendenze

```bash
npm install
```

#### 3. Configurazione delle Variabili d'Ambiente

1.  Crea un file chiamato `.env` nella directory principale del progetto.
2.  Copia il contenuto del file `.env.example` (se presente) o aggiungi le seguenti variabili:

    ```env
    EXPO_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
    EXPO_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    EXPO_PUBLIC_ONESIGNAL_APP_ID="YOUR_ONESIGNAL_APP_ID"
    ```

    Puoi trovare i valori di URL e ANON KEY nella dashboard del tuo progetto Supabase in `Project Settings > API`.

#### 4. Avvio del Server di Sviluppo

```bash
npx expo start
```

Scansiona il QR code generato dal terminale con l'app Expo Go sul tuo telefono per avviare l'applicazione.

#### 5. Script Utili

-   `npm run test`: Esegue la suite di test con Jest.
-   `npm run lint`: Analizza il codice con ESLint per trovare errori e problemi di stile.

#### 6. Creare una Build Standalone

Per creare un file `.apk` o `.ipa` installabile:

```bash
# Configura il progetto (se non già fatto)
eas build:configure --platform all

# Avvia la build per Android
eas build -p android --profile preview

# Avvia la build per iOS
eas build -p ios --profile preview
```

---

## 🇬🇧 English

MyFrigo is a cross-platform mobile application that helps manage home food inventory. It tracks expiration dates, sends local notifications for products nearing their expiration, and provides consumption statistics to minimize waste.

The app is built using React Native and Expo, with a backend fully powered by **Supabase** for the PostgreSQL database, authentication, and serverless functions.

### ✨ Key Features

-   **Product Inventory**: Keep track of all your food items with details on quantity, brand, and dates.
-   **Reliable Local Notifications**: Receive customizable push alerts before products expire, managed locally for maximum reliability.
-   **Quick Add**: Add products manually, by scanning a barcode, or by taking a photo with OCR for the expiration date.
-   **Supabase Backend**: All data is synchronized in real-time on a PostgreSQL database, with secure authentication and Row Level Security.
-   **Consumption Statistics**: View reports on consumed and expired products to improve your shopping habits.
-   **Light/Dark Theme**: UI adaptable to system or manual preferences.

### 🛠️ Tech Stack

-   **Framework**: React Native with Expo
-   **Language**: TypeScript
-   **Backend**: Supabase (PostgreSQL, Auth, Storage)
-   **Push Notifications**: OneSignal (for remote notifications, e.g., marketing)
-   **Local Notifications**: Expo Notifications
-   **Navigation**: Expo Router
-   **UI**: Custom Components

### 🚀 Installation and Setup

To run the project locally, follow these steps.

#### Prerequisites

-   [Node.js](https://nodejs.org/) (LTS version recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
-   [EAS CLI](https://docs.expo.dev/get-started/installation/): `npm install -g eas-cli`
-   [Expo Go](https://expo.dev/go) app installed on your mobile device (iOS or Android).

#### 1. Clone the Repository

```bash
git clone https://github.com/EbbuzRM/myfrigo.git
cd myfrigo
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

1.  Create a file named `.env` in the project's root directory.
2.  Copy the contents of the `.env.example` file (if present) or add the following variables:

    ```env
    EXPO_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
    EXPO_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    EXPO_PUBLIC_ONESIGNAL_APP_ID="YOUR_ONESIGNAL_APP_ID"
    ```

    You can find the URL and ANON KEY values in your Supabase project dashboard under `Project Settings > API`.

#### 4. Start the Development Server

```bash
npx expo start
```

Scan the QR code generated in the terminal with the Expo Go app on your phone to launch the application.

#### 5. Useful Scripts

-   `npm run test`: Runs the test suite with Jest.
-   `npm run lint`: Lints the code with ESLint to find errors and style issues.

#### 6. Create a Standalone Build

To create an installable `.apk` or `.ipa` file:

```bash
# Configure the project (if not already done)
eas build:configure --platform all

# Start the build for Android
eas build -p android --profile preview

# Start the build for iOS
eas build -p ios --profile preview
```

---

## 🤝 Contributing

Contributions are always welcome! If you want to contribute to the project, please follow these steps:

1.  **Fork** the repository.
2.  Create a new **branch** for your feature (`git checkout -b feature/feature-name`).
3.  **Commit** your changes (`git commit -am 'Add new feature'`).
4.  **Push** to your branch (`git push origin feature/feature-name`).
5.  Open a **Pull Request**.

---

## 📄 License

This project is released under the **MIT License**. See the `LICENSE` file for more details.
