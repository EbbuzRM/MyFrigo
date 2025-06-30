import 'react-native-url-polyfill/auto';
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  reactNativeLocalCache,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAgSoTYNlDvqRRKpJPRntdFb2-tPk792TM",
  authDomain: "myfrigo-8f400.firebaseapp.com",
  projectId: "myfrigo-8f400",
  storageBucket: "myfrigo-8f400.firebasestorage.app",
  messagingSenderId: "849503699357",
  appId: "1:849503699357:android:fe88f201b7d9f01a402f74",
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let firestoreDB;
try {
  firestoreDB = initializeFirestore(app, {
    localCache: reactNativeLocalCache(),
  });
} catch (e) {
  firestoreDB = getFirestore(app);
}

export { app, firestoreDB };
