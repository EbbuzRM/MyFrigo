// __mocks__/expo-winter.js
//
// Stub per il modulo `expo/src/winter`, referenziato dalla `moduleNameMapper`
// in jest.config.js (v. righe 36-37). Il modulo reale installa polyfill web
// via JSI (non disponibili in jest); qui forniamo un no-op coerente con il
// `jest.doMock('expo/src/winter/FormData', ...)` già eseguito dal preset jest-expo.
// In questo modo `require('expo/src/winter')` si risolve senza errori di config.
module.exports = {};
