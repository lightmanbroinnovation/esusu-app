# Android Development Setup

## Quick Setup

The Android SDK path is configured automatically per developer using `android/local.properties`. This file is git-ignored so each developer can have their own SDK path without conflicts.

### Automatic Setup (Recommended)

Run the setup script to auto-detect your Android SDK:

```bash
npm run setup:android
```

This script will:
- Automatically detect your Android SDK from common locations
- Create `android/local.properties` with the correct SDK path
- Work seamlessly for all developers without manual configuration

### Manual Setup

If automatic detection fails, manually create `android/local.properties`:

```properties
sdk.dir=/path/to/your/android/sdk
```

Common SDK locations:
- **macOS**: `~/Library/Android/sdk`
- **Linux**: `~/Android/Sdk` or `/opt/android-sdk`
- **Windows**: `%LOCALAPPDATA%\Android\Sdk`

## Environment Variables (Optional)

You can also set these environment variables in your shell profile:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
```

The setup script will automatically use these if available.

## Verifying Setup

After setup, verify everything works:

```bash
# Check Gradle can find the SDK
cd android && ./gradlew --version

# Run the app
npm run android
```

## Troubleshooting

### "SDK not found" Error

1. Run `npm run setup:android` to regenerate `local.properties`
2. Verify your SDK path exists: `ls -la $ANDROID_HOME/platform-tools`
3. If using a custom SDK location, manually edit `android/local.properties`

### Build Errors

1. Clean the project: `cd android && ./gradlew clean`
2. Clear Expo cache: `npx expo start --clear`
3. Regenerate native projects: `npx expo prebuild --clean`

