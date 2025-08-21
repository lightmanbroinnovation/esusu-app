import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import TransactionsScreen from '../components/TransactionsScreen';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { View, Text } from 'react-native';

export type { Transaction } from '../components/types';

export default function TransactionsIndex() {
  const params = useLocalSearchParams();
  const transactionHistory = params.transactionHistory ? JSON.parse(params.transactionHistory as string) : null;
  const [loading, setLoading] = React.useState(true);
  const [networkAvailable, setNetworkAvailable] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Simulate network call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <EsusuLoader />;
  }

  if (!networkAvailable && !transactionHistory) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No network. Please connect to the internet to load transactions.</Text>
      </View>
    );
  }

  return <TransactionsScreen initialTransactionHistory={transactionHistory} />;
} 