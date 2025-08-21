# Loop Prevention Utilities

This directory contains utilities to prevent infinite loops and excessive data fetching in your React Native app.

## 🚨 Problem

Your app was experiencing infinite loops on startup and data fetching loops that prevented users from entering passcodes.

## ✅ Solution

We've implemented comprehensive loop prevention utilities:

### 1. **Data Fetch Guard** (`dataFetchGuard.ts`)
Prevents excessive API calls and data fetching loops.

```typescript
import { useDataFetchGuard } from '../utils/dataFetchGuard';

const MyComponent = () => {
  const fetchGuard = useDataFetchGuard(3, 3000); // Max 3 calls per 3 seconds
  
  const fetchData = async () => {
    if (!fetchGuard.canFetch()) {
      console.log('🚨 Data fetch blocked by guard');
      return;
    }
    
    fetchGuard.recordFetch();
    // ... your fetch logic
  };
};
```

### 2. **Render Guard** (`dataFetchGuard.ts`)
Prevents excessive re-renders that can cause loops.

```typescript
import { useRenderGuard } from '../utils/dataFetchGuard';

const MyComponent = () => {
  const renderGuard = useRenderGuard('MyComponent', 15); // Max 15 renders
  
  useEffect(() => {
    if (!renderGuard.checkRender()) {
      console.log('🚨 Render blocked by guard');
      return;
    }
    // ... your effect logic
  }, []);
};
```

### 3. **Loop Detector** (`loopDetector.ts`)
Advanced loop detection with automatic blocking.

```typescript
import { useLoopDetection } from '../utils/loopDetector';

const MyComponent = () => {
  const loopDetector = useLoopDetection('MyComponent', 5, 5000);
  
  const someFunction = () => {
    if (!loopDetector.canProceed()) {
      console.log('🚨 Loop detected, blocking calls');
      return;
    }
    
    loopDetector.recordCall();
    // ... your function logic
  };
};
```

### 4. **Data Fetch State** (`dataFetchGuard.ts`)
Complete state management with built-in loop prevention.

```typescript
import { useDataFetchState } from '../utils/dataFetchGuard';

const MyComponent = () => {
  const { loading, error, data, fetchData } = useDataFetchState();
  
  useEffect(() => {
    fetchData(async () => {
      // Your fetch logic here
      return await api.getData();
    });
  }, []);
};
```

## 🔧 Usage in Components

### Before (Problematic):
```typescript
useEffect(() => {
  fetchData(); // This could run infinitely
}, []); // Missing dependencies or improper setup
```

### After (Safe):
```typescript
const fetchGuard = useDataFetchGuard(3, 3000);

useEffect(() => {
  if (!fetchGuard.isInitialized()) {
    fetchData();
  }
}, []);
```

## 🚀 Key Features

- **Automatic Loop Detection**: Detects when components are making too many calls
- **Smart Blocking**: Temporarily blocks problematic components
- **Self-Healing**: Automatically unblocks after cooldown period
- **Development Tools**: Loop debugger shows real-time status
- **Performance Monitoring**: Tracks render counts and API calls

## 🛠️ Development Tools

### Loop Debugger
In development mode, you'll see a loop debugger overlay showing:
- Active loop detectors
- Call counts
- Block status
- Time windows

### Console Logs
Look for these emojis in console:
- 🚨 = Loop detected, action blocked
- 🔄 = Loop block expired, allowing calls again
- 📊 = Call recorded
- ✅ = Component marked as initialized

## 📱 Implementation Status

The following components have been updated with loop prevention:

### ✅ **Core App Files:**
- `app/_layout.tsx` - Main layout with startup management
- `app/index.tsx` - App entry point with startup guard
- `app/utils/sessionManager.ts` - Session management
- `services/api.js` - API interceptors with token caching

### ✅ **Main Pages:**
- `app/account/index.tsx` - Account page
- `app/dashboard/index.tsx` - Dashboard
- `app/settings/index.tsx` - Settings
- `app/Tier/index.tsx` - Tier page
- `app/referral/index.tsx` - Referral page

### ✅ **Bank & Commission:**
- `app/link-bank/index.tsx` - Link bank page
- `app/components/CommissionScreen.tsx` - Commission screen
- `app/commission/withdraw.tsx` - Commission withdraw
- `app/commission/CommissionTransactions.tsx` - Commission transactions

### ✅ **Contributors & Deposits:**
- `app/contributors/ContributorsScreen.tsx` - Contributors screen
- `app/contributors/ContributorListScreen.tsx` - Contributor list
- `app/deposit/index.tsx` - Main deposit page
- `app/deposit/subpages/amt-deposit.tsx` - Amount deposit
- `app/deposit/subpages/bank-deposit.tsx` - Bank deposit

### ✅ **Components:**
- `app/components/TransactionsScreen.tsx` - Transactions screen
- `app/components/ContributorProfile.tsx` - Contributor profile
- `app/components/AddContributor.tsx` - Add contributor
- `app/components/AgentVerification.tsx` - Agent verification
- `app/components/PhotoQualityCheck.tsx` - Photo quality check
- `app/components/SavingsPlanSetup.tsx` - Savings plan setup

## 🎯 Next Steps

1. **Test the app** - Loops should now be prevented across all components
2. **Monitor console logs** - Look for loop detection messages
3. **Use loop debugger** - Check component status in development
4. **Apply to remaining components** - Use the same pattern for any new pages

## 🚨 Troubleshooting

### If you still see loops:
1. Check console for loop detection messages
2. Use the loop debugger to identify problematic components
3. Ensure all data fetching uses the guard utilities
4. Check for missing dependencies in useEffect hooks

### If components are blocked:
1. Wait for the cooldown period to expire
2. Check the loop debugger for block status
3. Reset loop detectors if needed (debugger has reset button)
4. Review the component's data fetching logic

## 📚 API Reference

See the individual utility files for complete API documentation:
- `dataFetchGuard.ts` - Main guard utilities
- `loopDetector.ts` - Advanced loop detection
- `startupConfig.ts` - Startup management
- `startupDebug.ts` - Debugging utilities

## 🔍 Loop Prevention Strategy

The system works on multiple levels:

1. **Component Level**: Each component has its own fetch and render guards
2. **Global Level**: Global loop detection for API calls
3. **Startup Level**: Startup state management to prevent initialization loops
4. **Session Level**: Session manager with throttled updates
5. **API Level**: Token caching to reduce AsyncStorage calls

This multi-layered approach ensures that loops are caught and prevented at every level of the application.
