import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getCachedData, invalidateCache } from '../../utils/dataCaching';
import { fetchMerchantDashboardAccount } from '../../../services/api';
import EsusuLoader from '../../components/EsusuLoader';
import { useDataFetchGuard, useRenderGuard } from '../../utils/dataFetchGuard';
import { useBackButtonHandler } from '../../utils/backButtonHandler';


export default function BankDepositScreen() {
  const router = useRouter();
  
  // Use back button handler for bank deposit page
  useBackButtonHandler('/deposit/subpages/bank-deposit');
  
  const [merchantData, setMerchantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  // Add data fetch guard and render guard
  const fetchGuard = useDataFetchGuard(3, 3000);
  const renderGuard = useRenderGuard('BankDepositScreen', 15);

  const params = useLocalSearchParams();

    const handlePreviousPage = () => {
        router.back()
    }

    const handleNextPage = () => {
        router.push('/deposit/subpages/success')
    }

  const fetchData = async (fromRefresh = false) => {
    // Check if we can fetch data
    if (!fromRefresh && !fetchGuard.canFetch()) {
      console.log('🚨 Data fetch blocked by guard');
      return;
    }

    // Check render guard
    if (!renderGuard.checkRender()) {
      console.log('🚨 Render blocked by guard');
      return;
    }

    setLoading(true);
    setError(null);
    let cacheData = null;
    
    try {
      const cached = await AsyncStorage.getItem('merchant_dashboard');
      if (cached) {
        cacheData = JSON.parse(cached);
        setMerchantData(cacheData);
      }
    } catch {}
    
    if (!networkAvailable && cacheData) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    if (fromRefresh) {
      await invalidateCache('merchant_dashboard');
    }
    
    try {
      // Record the fetch attempt
      fetchGuard.recordFetch();
      
      const data = await getCachedData('merchant_dashboard', fetchMerchantDashboardAccount);
      setMerchantData(data);
    } catch (err) {
      if (!cacheData) {
        setError('Failed to load merchant data');
        setMerchantData(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Only fetch data once on mount
    if (!fetchGuard.isInitialized()) {
      fetchData();
    }
  }, []);

    return (
        <ScrollView className="flex-1 bg-white px-4 pt-10">
            {/* Header */}
            <View className="flex-row items-center gap-[110px] mt-[2rem]">
                <TouchableOpacity onPress={handlePreviousPage} className='bg-[#F2F8FF] h-8 w-8 rounded-full flex items-center justify-center p-3'>
                    <Image
                        source={require('../../assets/images/back-arrow.png')}
                    />
                </TouchableOpacity>
                <Text className="text-lg font-semibold">Deposit</Text>
            </View>

            <View className='h-screen flex flex-col'>
                {/*we woild fetch from the BE later for this deposit-bank card */}
                <View className='card px-[1rem] pt-5'>
                    <View className='flex flex-col gap-2'>
                        <Text className='text-[#0074ff] text-[28px] font-semibold'>Make your Deposit</Text>
                        <Text className='text-[#272636]'>Transfer the amount before the timer runs out. A new account will be generated if time expires.</Text>
                    </View>


                    <View>
                        <Text className='text-[#272636] font-semibold mt-8'>Account Details</Text>

                        <View className='flex flex-col gap-6 bg-[#0074FF] py-10 px-4 rounded-xl mt-4'>
                            <View className='bank flex flex-row items-center justify-between'>
                                <Text className='capitalize font-medium text-white'>bank:</Text>
                                <Text className='text-white'>XYZ Bank</Text>
                            </View>
                            <View className='bank flex flex-row items-center justify-between'>
                                <Text className='capitalize font-medium text-white'>account:</Text>
                                <Text className='text-white'>1234567890</Text>
                            </View>
                            <View className='bank flex flex-row items-center justify-between'>
                                <Text className='capitalize font-medium text-white'>account name</Text>
                                <Text className='text-white'>AjoMarket Temporary Account</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <TouchableOpacity className='bg-[#0074FF] w-full flex items-center rounded-xl justify-center py-4 absolute bottom-0' onPress={handleNextPage}>
                    <Text className='text-white text-base font-bold'>I've paid</Text>
                </TouchableOpacity>
            </View>


        </ScrollView>
    );
}

