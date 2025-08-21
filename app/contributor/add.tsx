import React, { useState, useEffect } from 'react';
import AddContributor from '../components/AddContributor';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { useBackButtonHandler } from '../utils/backButtonHandler';

export default function AddContributorScreen() {
  const [loading, setLoading] = useState(false); // Set to true if you have async logic
  const [networkAvailable, setNetworkAvailable] = useState(true);

  // Use back button handler for contributor add page
  useBackButtonHandler('/contributor/add');

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

  return <AddContributor />;
} 