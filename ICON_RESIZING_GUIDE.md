# Icon Resizing Plan

## Current State
- Source icon: `assets/images/icon.png` (2,860 bytes, ~100x100px estimated)
- Currently using: `assets/images/icons.png` (482KB - likely very large, potentially 1024x1024)

## Required Sizes for app.json

Based on Expo best practices, we need:

### 1. App Icon (General)
- **File**: `app-icon.png`
- **Size**: 1024x1024px
- **Use**: iOS App Store, Google Play Store
- **app.json reference**: `icon`

### 2. Adaptive Icon (Android)
- **File**: `adaptive-icon.png`
- **Size**: 1024x1024px  
- **Use**: Android adaptive icon (foreground)
- **app.json reference**: `adaptiveIcon.foregroundImage`

### 3. Favicon
- **File**: `favicon.png`
- **Size**: 48x48px or 32x32px
- **Use**: Web browser tab icon
- **app.json reference**: `web.favicon`

### 4. Splash Screen
- **File**: `splash-icon.png`
- **Size**: 1284x2778px or at least 1024x1024
- **Use**: Splash screen display
- **app.json reference**: `splash.image`

### 5. Notification Icon
- **File**: `notification-icon.png`
- **Size**: 96x96px (Android uses 24x24dp = ~96px)
- **Use**: Push notifications
- **app.json reference**: `plugins[expo-notifications].icon`

## Action Plan

Since we don't have image manipulation tools available in the terminal, I'll:

1. **Document the required sizes** in a guide
2. **Provide instructions** for the user to resize using online tools or Photoshop
3. **Update app.json** to reference the new properly-named files

## Recommendation

Use online tools:
- **Figma** (free, web-based)
- **Canva** (free tier available)
- **TinyPNG** + manual resize
- **ImageMagick** (if installed locally)

Or use Expo's asset resizing service (experimental).
