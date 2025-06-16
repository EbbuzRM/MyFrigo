# MyFrigo - Smart Food Manager 🍏

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

### 5. Creare una Build Standalone

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
MIT License

Copyright (c) [2025] [Ebbuz RM]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
