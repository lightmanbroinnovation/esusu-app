
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const checkAuth = async () => {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      if (!isLoggedIn) {
        router.replace('/login');
      }
    };
    
    checkAuth();
  }, []);

  return <>{children}</>;
};

// Usage in screens:
// import { AuthGuard } from '../components/AuthGuard';
//
// export default function Dashboard() {
//   return (
//     <AuthGuard>
//       {/* Your screen content */}
//     </AuthGuard>
//   );
// }