/* Firebase Messaging Service Worker */

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// TODO: Replace with your actual Firebase web config values
const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_WEB_APP_ID',
  measurementId: 'YOUR_MEASUREMENT_ID',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const title = payload?.notification?.title || 'New Notification';
  const options = {
    body: payload?.notification?.body || '',
    data: payload?.data || {},
    // icon: '/icons/icon-192.png', // Optional, set if you have one
  };

  self.registration.showNotification(title, options);
});
