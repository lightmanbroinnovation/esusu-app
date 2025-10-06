// Background message handler for React Native Firebase
import messaging from '@react-native-firebase/messaging';

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);

  // You can show local notifications or perform other background tasks here
  // Note: You cannot use React Native components or context here
});
