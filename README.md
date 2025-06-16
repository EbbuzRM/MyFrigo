# MyFrigo - Smart Food Manager 🍏

# ITA

MyFrigo è un'applicazione mobile cross-platform che aiuta a gestire l'inventario alimentare domestico. Traccia le date di scadenza, invia notifiche per i prodotti in avvicinamento alla scadenza e fornisce statistiche sui consumi per minimizzare gli sprechi.

L'app è costruita utilizzando React Native ed Expo, con un backend completamente basato su Firebase (Cloud Firestore per il database in tempo reale e Analytics per le statistiche di utilizzo).

---

## ✨ Caratteristiche principali

-   **Inventario Prodotti**: Tieni traccia di tutti i tuoi prodotti alimentari con dettagli su quantità, marca e date.
-   **Notifiche di Scadenza**: Ricevi avvisi push personalizzabili prima che i prodotti scadano.
-   **Aggiunta Rapida**: Inserisci i prodotti manualmente, tramite scansione del codice a barre o scattando una foto.
-   **Backend Firebase**: Tutti i dati sono sincronizzati in tempo reale su Cloud Firestore, rendendo l'app multi-dispositivo.
-   **Statistiche di Consumo**: Visualizza report sui prodotti consumati e scaduti per migliorare le tue abitudini di acquisto.
-   **Tema Chiaro/Scuro**: Interfaccia utente adattabile alle preferenze di sistema o manuali.

---

## 🛠️ Stack Tecnologico

-   **Framework**: React Native con Expo
-   **Linguaggio**: TypeScript
-   **Backend**: Firebase (Cloud Firestore, Google Analytics)
-   **Navigazione**: Expo Router
-   **UI**: Componenti personalizzati

---

## 🚀 Installazione e Avvio

Per eseguire il progetto in locale, segui questi passaggi.

### Prerequisiti

-   [Node.js](https://nodejs.org/) (versione LTS raccomandata)
-   [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
-   [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
-   [EAS CLI](https://docs.expo.dev/get-started/installation/): `npm install -g eas-cli`
-   App [Expo Go](https://expo.dev/go) installata sul tuo dispositivo mobile (iOS o Android).

### 1. Clonazione del Repository

```bash
git clone https://github.com/tuo-username/myfrigo.git
cd myfrigo
```

### 2. Installazione delle Dipendenze

```bash
npm install
# o
yarn install
```

### 3. Configurazione Firebase

1.  Crea un progetto Firebase su [firebase.google.com](https://firebase.google.com/).
2.  Aggiungi un'app Android al tuo progetto Firebase.
3.  Segui le istruzioni per scaricare il file di configurazione `google-services.json`.
4.  Posiziona il file `google-services.json` nella directory `myfrigo/android/app/`.

### 4. Avvio del Server di Sviluppo

```bash
npx expo start
```

Scansiona il QR code generato dal terminale con l'app Expo Go sul tuo telefono per avviare l'applicazione.

```

---

## 🤝 Contributi

I contributi sono sempre ben accetti! Se vuoi contribuire al progetto, per favore segui questi passaggi:

1.  **Forka** il repository.
2.  Crea un nuovo **branch** per la tua modifica (`git checkout -b feature/nome-feature`).
3.  **Committa** le tue modifiche (`git commit -am 'Aggiunta nuova feature'`).
4.  **Pusha** sul tuo branch (`git push origin feature/nome-feature`).
5.  Apri una **Pull Request**.

---

## 📄 Licenza

Questo progetto è rilasciato sotto la **Licenza MIT**. Vedi il file `LICENSE` per maggiori dettagli.

```

# ENG

MyFrigo is a cross-platform mobile app that helps you manage your home food inventory. It tracks expiration dates, sends notifications for products approaching expiration, and provides consumption statistics to minimize waste.

The app is built using React Native and Expo, with a fully Firebase-based backend (Cloud Firestore for the real-time database and Analytics for usage statistics).

---

## ✨ Key Features

- **Product Inventory**: Track all your food products with details on quantity, brand, and dates.
- **Expiration Notifications**: Get customizable push alerts before products expire.
- **Quick Add**: Add products manually, by scanning the barcode, or by taking a photo.
- **Firebase Backend**: All data is synced in real-time to Cloud Firestore, making the app multi-device.
- **Consumption Statistics**: View reports on consumed and expired products to improve your shopping habits.
- **Light/Dark Theme**: User interface adaptable to system or manual preferences.

---

## 🛠️ Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Firebase (Cloud Firestore, Google Analytics)
- **Navigation**: Expo Router
- **UI**: Custom Components

---

## 🚀 Installation and Startup

To run the project locally, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- [EAS CLI](https://docs.expo.dev/get-started/installation/): `npm install -g eas-cli`
- [Expo Go] app (https://expo.dev/go) installed on your mobile device (iOS or Android).

### 1. Cloning the Repository

```bash
git clone https://github.com/your-username/myfrigo.git
cd myfrigo
```

### 2. Installing Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configuring Firebase

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com/).
2. Add an Android app to your Firebase project.
3. Follow the instructions to download the `google-services.json` configuration file.
4. Place the `google-services.json` file in the `myfrigo/android/app/` directory.

### 4. Starting the Development Server

```bash
npx expo start
```

Scan the QR code generated by the terminal with the Expo Go app on your phone to start the application.

## 🤝 Contributions

Contributions are always welcome! If you want to contribute to the project, please follow these steps:

1. **Fork** the repository.
2. Create a new **branch** for your change (`git checkout -b feature/feature-name`).
3. **Commit** your changes (`git commit -am 'Added new feature'`).
4. **Pull** to your branch (`git push origin feature/feature-name`).
5. Open a **Pull Request**.

---
