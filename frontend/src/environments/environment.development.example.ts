// Copy this file to environment.development.ts and fill in your Firebase project values.
// Get these from Firebase Console → Project Settings → General → Your apps → Web app
// Get vapidKey from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8082/api',
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
    vapidKey: ''
  }
};
