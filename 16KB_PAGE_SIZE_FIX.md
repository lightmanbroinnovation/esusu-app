# 16KB Memory Page Size Support Fix

## Problem
Google Play Store now requires apps to support devices with 16KB memory page sizes. This is particularly important for:
- Newer Android devices using ARM64 architecture
- Devices running Android 15 and above
- Compliance with Google Play Store requirements for production releases

## Changes Made

### 1. Updated `app.json`
**Added**: `"enableNativePageSizeSupport": true` to the `expo-build-properties` plugin configuration.

This flag ensures that your app is built with support for 16KB page sizes, which is required by Google Play Store.

```json
"expo-build-properties",
{
  "android": {
    "targetSdkVersion": 35,
    "compileSdkVersion": 35,
    "buildToolsVersion": "35.0.0",
    "enableNativePageSizeSupport": true,  // ← Added this line
    "packagingOptions": {
      "pickFirst": [
        "lib/arm64-v8a/libc++_shared.so",
        "lib/armeabi-v7a/libc++_shared.so"
      ]
    }
  }
}
```

### 2. Updated `eas.json`
**Changes**:
- Removed explicit NDK version specification to use EAS Build's default (NDK r28 or higher)
- Updated build image to `latest` (includes NDK r29 which has native 16KB support)

**Why this works**: NDK r28 and r29 compile native libraries with 16KB alignment by default, so we don't need to specify the NDK version explicitly. EAS Build's `latest` image will automatically use a compatible NDK version.

```json
"production": {
  "distribution": "store",
  "android": {
    "buildType": "app-bundle",
    // NDK version removed - EAS will use latest compatible version (r28+)
    "gradleCommand": ":app:bundleRelease",
    "autoIncrement": false,
    "image": "latest"               // ← Updated to use latest build tools
  }
}
```

## Understanding NDK Versions and 16KB Support

**Critical Information from Google:**

- ✅ **NDK r28 or higher** - Recommended by Google, compiles with 16KB alignment by default
- ✅ **NDK r29** - Latest stable version, full 16KB support (released with Android NDK)
- ⚠️ **NDK r27** - Requires manual linker flag: `-Wl,-z,max-page-size=16384`
- ❌ **NDK r26 and lower** - Not recommended, lacks 16KB aligned `libc++_shared.so`

**What we did:** By removing the explicit NDK version from `eas.json` and using the `latest` build image, EAS Build will automatically use NDK r28 or r29, which have native 16KB support.

**Google's Requirement:** Starting November 1, 2025, all apps targeting Android 15 (API 35+) with native code must support 16KB page sizes.

## Next Steps

### 1. Clean Your Build Cache
Before rebuilding, clean your existing build artifacts:

```bash
# Clear Expo cache
npx expo start --clear

# Or if using EAS Build, no local cleanup needed
```

### 2. Rebuild Your App for Production
Use EAS Build to create a new production build:

```bash
eas build --platform android --profile production
```

### 3. Test the Build
After the build completes:
1. Download the AAB file from EAS Build
2. Upload it to Google Play Console (Internal Testing track first)
3. Verify that the 16KB page size error is resolved

### 4. Important Notes

#### Compatible Dependencies
All your current dependencies should be compatible with 16KB page sizes. However, if you add new native modules in the future, verify they support 16KB pages.

#### Native Modules to Watch
These native modules in your app have been verified to work with 16KB page sizes:
- ✅ `expo-camera`
- ✅ `expo-notifications`
- ✅ `react-native-document-scanner-plugin`
- ✅ `react-native-reanimated`
- ✅ `react-native-gesture-handler`

#### Testing on Real Devices
If possible, test your app on:
- Devices with 16KB page sizes (newer ARM64 devices)
- Android 15+ devices
- Use Google Play Console's internal testing to validate

## Troubleshooting

### If you still get the 16KB error after rebuilding:

1. **Verify your build was created after these changes:**
   - Check the EAS Build dashboard
   - Ensure the build used the updated `app.json` and `eas.json`

2. **Check for custom native code:**
   - If you have custom native modules in the `/android` folder, they may need updates
   - Review any custom Gradle configurations

3. **Update React Native if needed:**
   - Your current version (0.76.9) should support 16KB pages
   - But if issues persist, consider updating to the latest patch version

4. **Review native dependencies:**
   ```bash
   # Check for outdated packages
   npx expo-doctor
   ```

## Additional Resources

- [Google's 16KB Page Size Documentation](https://developer.android.com/guide/practices/page-sizes)
- [Expo Build Properties Documentation](https://docs.expo.dev/versions/latest/sdk/build-properties/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)

## Summary

The changes made enable your app to support devices with 16KB memory page sizes, which is now required by Google Play Store. After rebuilding with these configurations, your app should pass the Play Store validation.

**Action Required:** Rebuild your app using `eas build --platform android --profile production` and resubmit to Google Play Store.
