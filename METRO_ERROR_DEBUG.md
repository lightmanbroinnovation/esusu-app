# Metro Bundler Error: "to" argument undefined

## Error Details
```
TypeError: The "to" argument must be of type string. Received undefined
    at Object.relative (node:path:579:5)
    at @expo/metro-config/src/serializer/fork/js.ts:109:35
```

## Root Cause
This error occurs when Metro's serializer tries to create relative paths but receives `undefined` as one of the path arguments. This is typically caused by:

1. **Corrupted node_modules** - Some packages may have incomplete installations
2. **Windows path issues** - Metro can struggle with Windows-style paths in some configurations
3. **Package version mismatches** - Incompatible versions between @expo/metro-config, metro, and expo-router
4. **Symlink issues** - npm/pnpm symlinks can confuse Metro on Windows

## Attempted Fixes

### ❌ Fix 1: Removed `output: "static"` from app.json web config
- **Result**: Error persisted

### ❌ Fix 2: Removed manual `module-resolver` from babel.config.js
- **Result**: Error persisted  

### ❌ Fix 3: Cleared Metro cache with `npx expo start -c`
- **Result**: Error persisted

### ❌ Fix 4: Commented out tsconfig.json paths (canceled by user)
- **Status**: Not completed

### ✅ Fix 5: Restored babel-plugin-module-resolver
- **Issue**: Path aliases (`@/services/api`) not resolving after removing module-resolver
- **Solution**: Re-added module-resolver to babel.config.js with proper alias configuration
- **Result**: Path resolution works, but Metro error persists

### ✅ Fix 6: Fixed TypeScript configuration
- **Issue**: `moduleResolution` and `module` incompatibility with Expo SDK 53
- **Solution**: Changed `moduleResolution` to "bundler" and `module` to "esnext"
- **Result**: TypeScript errors resolved, but Metro error persists

## Current Status: ALL CONFIG FIXES EXHAUSTED

**The error persists after:**
- ✅ Removing static output
- ✅ Fixing babel configuration
- ✅ Fixing TypeScript configuration
- ✅ Clearing Metro cache multiple times

**Conclusion:** This is a corrupted node_modules issue, not a configuration problem.

## Next Steps: Nuclear Option

Since all configuration fixes have failed, the issue is likely in the node_modules themselves. We need to do a complete clean reinstall:

### Step 1: Clean Everything
```powershell
# Stop the dev server (Ctrl+C)

# Delete all caches and dependencies
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
Remove-Item -Recurse -Force .expo
```

### Step 2: Reinstall
```powershell
npm install --legacy-peer-deps
```

### Step 3: Clear and Start
```powershell
npx expo start -c
```

## Known Issues

- Expo SDK 53 + Metro on Windows has known path resolution bugs
- The `@expo/metro-config` package version may need to match exactly with Expo SDK version
- Some users report success by switching to yarn instead of npm

## Alternative Solutions (if reinstall fails)

### Option A: Downgrade Metro Config
Try pinning an older version of @expo/metro-config:
```json
{
  "devDependencies": {
    "@expo/metro-config": "~0.19.0"
  }
}
```

### Option B: Use Yarn Instead of NPM
```powershell
npm install -g yarn
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
yarn install
yarn expo start -c
```

### Option C: Disable Web Platform Temporarily
If you only need mobile, you can disable web bundling to isolate the issue:
- Remove `"web"` section from app.json
- Run `npx expo start` (without web)

### Option D: Custom Metro Config
Add explicit path resolution to metro.config.js:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Log to debug which module causes the issue
  if (!context.originModulePath) {
    console.warn('No origin module path for:', moduleName);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

## Status: PENDING USER ACTION
Waiting for user to approve complete reinstall.
