# 🔥 Firebase Setup Guide for Esusu App

This guide will help you set up Firebase Cloud Messaging (FCM) for push notifications in your Esusu app.

## 📋 Prerequisites

- Firebase project created
- Expo SDK 52+ 
- React Native app with Expo

## 🚀 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `esusu-app`
4. Enable Google Analytics (optional)
5. Create project

## 🔧 Step 2: Configure Firebase for Web

1. In Firebase Console, click "Add app" → Web app
2. Register app with nickname: `esusu-web`
3. Copy the Firebase configuration object
4. Update your environment variables in `config/environment.ts`:

```typescript
// config/environment.ts
export const ENV = {
  // ... existing config
  FIREBASE_API_KEY: 'your-api-key-here',
  FIREBASE_AUTH_DOMAIN: 'your-project.firebaseapp.com',
  FIREBASE_PROJECT_ID: 'your-project-id',
  FIREBASE_STORAGE_BUCKET: 'your-project.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: '123456789',
  FIREBASE_APP_ID: '1:123456789:web:abcdef',
  FIREBASE_MEASUREMENT_ID: 'G-XXXXXXXXXX',
  FIREBASE_VAPID_KEY: 'your-vapid-key',
};
```

## 📱 Step 3: Configure Firebase for Mobile (iOS/Android)

### For iOS:
1. In Firebase Console, click "Add app" → iOS
2. Enter iOS bundle ID: `com.yourcompany.esusu`
3. Download `GoogleService-Info.plist`
4. Place it in `ios/esusu/` directory

### For Android:
1. In Firebase Console, click "Add app" → Android
2. Enter Android package name: `com.yourcompany.esusu`
3. Download `google-services.json`
4. Place it in `android/app/` directory

## 🔑 Step 4: Generate VAPID Key

1. In Firebase Console, go to Project Settings
2. Click "Cloud Messaging" tab
3. Scroll down to "Web configuration"
4. Click "Generate key pair" under "Web Push certificates"
5. Copy the key and add it to your environment variables

## 🛠️ Step 5: Install Dependencies

The following dependencies are already added to your `package.json`:

```json
{
  "dependencies": {
    "firebase": "^10.7.1",
    "expo-notifications": "~0.29.14"
  }
}
```

## ⚙️ Step 6: Configure Expo Notifications

Create or update `app.json`:

```json
{
  "expo": {
    "name": "Esusu",
    "slug": "esusu-app",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#0074FF",
      "androidMode": "default",
      "androidCollapsedTitle": "#{unread_notifications} new interactions"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#0074FF",
          "defaultChannel": "default"
        }
      ]
    ]
  }
}
```

## 🔧 Step 7: Environment Variables

Create a `.env` file in your project root:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
EXPO_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key

# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://esusu-server.onrender.com/api/merchant
EXPO_PUBLIC_API_TIMEOUT=15000
```

## 🧪 Step 8: Test Firebase Setup

1. Start your development server:
```bash
npm start
```

2. Test FCM token generation:
```javascript
import { FirebaseMessaging } from './config/firebase';

// Test token generation
const token = await FirebaseMessaging.getToken();
console.log('FCM Token:', token);
```

## 📨 Step 9: API Endpoints

Your backend should have these endpoints:

### Save FCM Token
```
POST /api/notifications/save-token
Content-Type: application/json
Authorization: Bearer <token>

{
  "token": "fcm-token-here",
  "device": "android",
  "platform": "ReactNative"
}
```

### Get Notifications
```
GET /api/notifications/merchants
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "_id": "68c5c8c85e6e50bfbd0ab0ee",
      "subject": "Transfer Downtime",
      "text": "There is a transfer downtime for the next 2 hrs",
      "createdAt": "2025-09-13T19:40:56.847Z",
      "isRead": false
    }
  ]
}
```

## 🚀 Step 10: Deploy and Test

1. Build your app:
```bash
# For development
expo start

# For production
expo build:android
expo build:ios
```

2. Test push notifications:
   - Send a test notification from Firebase Console
   - Verify token registration in your backend
   - Test notification handling in foreground/background

## 🔍 Troubleshooting

### Common Issues:

1. **Token not generated**: Check Firebase configuration and permissions
2. **Notifications not received**: Verify FCM token is registered with backend
3. **Permission denied**: Check device notification settings
4. **Web notifications not working**: Ensure HTTPS and valid VAPID key

### Debug Commands:

```bash
# Check Firebase configuration
npx expo install --check

# Clear cache
expo start --clear

# Check logs
expo logs
```

## 📚 Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Firebase](https://rnfirebase.io/)

## 🎯 Next Steps

1. Set up notification categories and channels
2. Implement notification scheduling
3. Add notification analytics
4. Set up A/B testing for notifications
5. Implement notification preferences sync

---

**Note**: Remember to keep your Firebase configuration secure and never commit sensitive keys to version control!
