# Action Plan: Achieving 16KB Page Size Compliance

## 🚨 Critical Finding

Your app **DOES NOT** currently support 16KB page sizes because:
- Expo SDK 52 with React Native 0.76.9 does NOT have 16KB support
- React Native 0.77+ is REQUIRED

## Required Actions

### 1. Upgrade to Expo SDK 53

This is **mandatory** for 16KB compliance:

```bash
# Step 1: Upgrade Expo SDK (this will also upgrade React Native to 0.77+)
npm install expo@^53.0.0

# Step 2: Fix all dependencies to compatible versions
npx expo install --fix

# Step 3: Clear cache
rm -rf node_modules
npm install
```

### 2. Replace expo-face-detector

`expo-face-detector` is **deprecated** and found in:
- `app/components/PhotoQualityCheck.tsx` (line 19)

**Migration path:**

```bash
# Remove deprecated package
npm uninstall expo-face-detector

# Install recommended alternative
npm install react-native-vision-camera
npx pod-install # if on macOS for iOS
```

**Code changes needed in `PhotoQualityCheck.tsx`:**

```typescript
// OLD (line 19)
import * as FaceDetector from 'expo-face-detector';

// NEW
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
```

### 3. Update react-native-document-scanner-plugin

After upgrading to RN 0.77+:

```bash
npm install react-native-document-scanner-plugin@latest
```

### 4. Rebuild Native Code

```bash
# Clean previous builds
rm -rf android/build
rm -rf android/app/build

# Build for production with EAS
eas build --platform android --profile production
```

### 5. Test on 16KB Emulator

**In Android Studio:**
1. Open SDK Manager
2. Enable "Show Package Details"
3. Find Android 15 (API 35)
4. Download "16KB Page Size Google Play" system image
5. Create new AVD with this image
6. Test your app thoroughly

### 6. Verify Compliance

**After building:**
1. Upload AAB to Google Play Console (internal testing track)
2. Check "App Bundle Explorer"
3. Verify shows: "Memory page size: Supports 16 KB" ✅

## Timeline & Deadlines

| Date | Milestone |
|------|-----------|
| **Now** | Start upgrade process |
| **Dec 2024** | Complete testing |
| **Nov 1, 2025** | Google Play enforcement begins |
| **May 31, 2026** | Extension deadline (if requested) |

## Estimated Effort

| Task | Time Estimate |
|------|---------------|
| SDK upgrade | 1-2 hours |
| Face detector migration | 2-4 hours (depends on usage complexity) |
| Testing | 2-3 hours |
| Build & deploy | 1 hour |
| **Total** | **6-10 hours** |

## Breaking Changes to Watch

When upgrading to Expo SDK 53 / RN 0.77:

1. **Face Detection API**: Complete rewrite needed
2. **New Architecture**: May need to enable/disable based on compatibility
3. **Dependency Updates**: Some packages may have breaking changes

**Recommendation:** Create a new branch for this upgrade:

```bash
git checkout -b feat/16kb-page-size-support
# Do all upgrades on this branch
# Test thoroughly
# Then merge to main
```

## What's Already Correct

✅ `enableNativePageSizeSupport: true` in `app.json`
✅ `image: "latest"` in `eas.json` (will use NDK r28+)
✅ No hardcoded 4096 page size values in code
✅ Targeting Android API 35

## Need Help?

If you encounter issues:

1. **Expo SDK upgrade issues**: `npx expo-doctor`
2. **Dependency conflicts**: Check package changelogs
3. **Face detector migration**: See `react-native-vision-camera` docs
4. **Build failures**: Check EAS Build logs

## Summary

The `enableNativePageSizeSupport` flag we added is **necessary but not sufficient**. The underlying React Native version must be 0.77+ for actual 16KB support. You **must** upgrade to Expo SDK 53 to achieve compliance.
