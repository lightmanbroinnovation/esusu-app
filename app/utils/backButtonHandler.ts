import { BackHandler, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

// Pages where back button should exit the app
const EXIT_APP_PAGES = [
  '/',
  '/dashboard',
  '/dashboard/',
  '/index',
  '/index/'
];

// Pages where back button should be disabled (like locked screens)
const DISABLE_BACK_PAGES = [
  '/login/passcode',
  '/signup/passcode'
];

export const useBackButtonHandler = (currentRoute?: string, isFromLock: boolean = false) => {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    console.log('🔧 Setting up back button handler for route:', currentRoute);

    const handleBackPress = () => {
      console.log('🔙 Hardware back button pressed on route:', currentRoute);
      
      // If from lock screen, prevent back navigation
      if (isFromLock) {
        console.log('🔒 Lock screen detected, preventing back navigation');
        return true; // Prevent default behavior
      }

      // If on exit app pages, show confirmation
      if (currentRoute && EXIT_APP_PAGES.includes(currentRoute)) {
        console.log('🚪 Exit app page detected, showing confirmation');
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit the app?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Exit',
              style: 'destructive',
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );
        return true; // Prevent default behavior
      }

      // If on disable back pages, prevent back navigation
      if (currentRoute && DISABLE_BACK_PAGES.includes(currentRoute)) {
        console.log('🚫 Back navigation disabled for this page');
        return true; // Prevent default behavior
      }

      // Default behavior - go back
      console.log('🔙 Back button pressed on route:', currentRoute);
      
      // For contributor pages, provide intelligent navigation
      if (currentRoute && currentRoute.startsWith('/contributor/')) {
        console.log('✅ Contributor page detected, using intelligent navigation');
        
        // For specific contributor pages that are typically accessed from dashboard
        if (currentRoute === '/contributor/add' || 
            currentRoute === '/contributor/savings-plan' || 
            currentRoute === '/contributor/photo-quality' || 
            currentRoute === '/contributor/initial-deposit' || 
            currentRoute === '/contributor/agent-verification') {
          console.log('🔄 Add contributor flow page, going to dashboard');
          router.replace('/dashboard');
        } else if (currentRoute === '/contributor/success') {
          console.log('🔄 Success page, going to dashboard');
          router.replace('/dashboard');
        } else if (currentRoute === '/contributor/profile' || currentRoute === '/contributor/transactions') {
          // For profile and transactions, try to go back first
          console.log('⬅️ Profile/transactions page, attempting back navigation');
          router.back();
        } else {
          // For any other contributor pages, default to dashboard
          console.log('🔄 Unknown contributor page, going to dashboard');
          router.replace('/dashboard');
        }
      } else {
        // For other pages, just go back
        console.log('⬅️ Regular page, going back');
        router.back();
      }
      return true; // Prevent default behavior
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [currentRoute, isFromLock, router]);
};

// Hook for pages that should exit app on back press
export const useExitAppBackHandler = () => {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let backPressCount = 0;
    let backPressTimer: NodeJS.Timeout | null = null;

    const handleBackPress = () => {
      if (backPressCount === 0) {
        Alert.alert(
          'Exit App',
          'Press back again to exit the app',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                backPressCount = 0;
                if (backPressTimer) clearTimeout(backPressTimer);
              },
            },
          ]
        );
        backPressCount = 1;
        backPressTimer = setTimeout(() => {
          backPressCount = 0;
        }, 2000);
        return true;
      } else {
        if (backPressTimer) clearTimeout(backPressTimer);
        BackHandler.exitApp();
        return true;
      }
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
      if (backPressTimer) clearTimeout(backPressTimer);
    };
  }, [router]);
};

// Hook for pages that should disable back navigation
export const useDisableBackHandler = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handleBackPress = () => {
      return true; // Prevent default behavior
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, []);
};

// Hook for custom back navigation
export const useCustomBackHandler = (onBackPress: () => void) => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handleBackPress = () => {
      onBackPress();
      return true; // Prevent default behavior
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [onBackPress]);
}; 