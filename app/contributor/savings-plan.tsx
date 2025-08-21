import React, { useState, useEffect } from 'react';
import SavingsPlanSetup from '../components/SavingsPlanSetup';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { useRouter } from 'expo-router';
import { useBackButtonHandler } from '../utils/backButtonHandler';

export default function SavingsPlanScreen() {
  const [loading, setLoading] = useState(false); // Set to true if you have async logic
  const [networkAvailable, setNetworkAvailable] = useState(true);
  const router = useRouter();

  // Use back button handler for contributor savings plan page
  useBackButtonHandler('/contributor/savings-plan');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <EsusuLoader />;
  }

  // If you want to show a message when offline and no data, add logic here

  return (
    <SavingsPlanSetup />
  );
} 