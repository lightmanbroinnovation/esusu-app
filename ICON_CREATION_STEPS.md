# Icon Creation Instructions

## Current State
Your `icons.png` file is 482KB which is very large. You currently have `icon.png` (2.8KB) which is better but likely too small.

## Required Icons

Create these 4 icon files from your original design:

### 1. app-icon.png
- **Size**: 1024x1024 pixels
- **Purpose**: Main app icon (iOS App Store, Google Play, Android Launcher)
- **Format**: PNG with transparency
- **Used in**: `app.json` → `icon`, `android.icon`

### 2. adaptive-icon.png  
- **Size**: 1024x1024 pixels
- **Purpose**: Android adaptive icon (foreground layer)
- **Format**: PNG with transparency
- **Used in**: `app.json` → `android.adaptiveIcon.foregroundImage`
- **Note**: Should have padding (safe zone: 108px from edges)

### 3. favicon.png
- **Size**: 48x48 or 32x32 pixels
- **Purpose**: Website favicon (web browser tab icon)
- **Format**: PNG or ICO
- **Used in**: `app.json` → `web.favicon`

### 4. notification-icon.png
- **Size**: 96x96 pixels (24x24dp * 4 for xxxhdpi)
- **Purpose**: Android push notification icon
- **Format**: PNG with transparency
- **Used in**: `app.json` → `plugins[expo-notifications].icon`
- **Note**: Should be white/transparent monochrome for Android

### 5. splash-icon.png
- **Size**: 1024x1024 pixels minimum
- **Purpose**: Splash screen logo
- **Format**: PNG with transparency
- **Used in**: `app.json` → `plugins[expo-splash-screen].image`

## Quick Method: Use Online Tools

### Option A: Figma (Recommended - Free)
1. Go to https://figma.com
2. Create a free account
3. Create new file
4. Import your source icon image
5. For each required size:
   - Create a frame with exact dimensions (e.g., 1024x1024)
   - Place your icon in the frame
   - Export as PNG

### Option B: Canva (Easy - Free)
1. Go to https://canva.com
2. Select "Custom dimensions"
3. Enter 1024x1024 for app icons
4. Upload your source icon
5. Resize to fit
6. Download as PNG

### Option C: ImageMagick (Command Line)
If you have ImageMagick installed locally:

\`\`\`bash
# Navigate to assets/images directory
cd assets/images

# Create app-icon.png (1024x1024)
magick icon.png -resize 1024x1024 app-icon.png

# Create adaptive-icon.png (1024x1024)  
magick icon.png -resize 1024x1024 adaptive-icon.png

# Create favicon.png (48x48)
magick icon.png -resize 48x48 favicon.png

# Create notification-icon.png (96x96)
magick icon.png -resize 96x96 notification-icon.png

# Create splash-icon.png (1024x1024)
magick icon.png -resize 1024x1024 splash-icon.png
\`\`\`

## What I've Done

✅ Updated `app.json` to reference the new standardized icon names:
- `app-icon.png` → Main app icon
- `adaptive-icon.png` → Android adaptive icon
- `favicon.png` → Web favicon (already exists)
- `notification-icon.png` → Notification icon
- `splash-icon.png` → Splash screen icon

## Next Steps

1. **Create the icons** using one of the methods above
2. **Save them** to `assets/images/` with the exact names above
3. **Test the app** - Run `npx expo prebuild --clean` to regenerate native projects
4. **Optional**: Delete the old `icons.png` (482KB) to save space

## Tips

- **Maintain aspect ratio**: Your icon should be centered with padding
- **Use vector source**: If you have an SVG or AI file, that's better than PNG
- **Check contrast**: Test on both light and dark backgrounds
- **Android adaptive**: Leave 108px safe zone from edges for adaptive icons
- **Notification icon**: Should be simple, monochrome (white on transparent)

## File Checklist

Once created, verify you have all these files:
- [ ] `assets/images/app-icon.png` (1024x1024)
- [ ] `assets/images/adaptive-icon.png` (1024x1024)
- [ ] `assets/images/favicon.png` (48x48) - already exists
- [ ] `assets/images/notification-icon.png` (96x96)
- [ ] `assets/images/splash-icon.png` (1024x1024)
