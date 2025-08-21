import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { fetchUser } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import { useBackButtonHandler } from '../utils/backButtonHandler';

interface UserDetails {
  accountTier?: string;
  contributorCount?: number;
}

interface TierCardProps {
  title: string;
  description: string;
  requirement: string;
  commission: string;
  bonusAccess: string;
  isCurrent?: boolean;
}

const TierCard: React.FC<TierCardProps> = ({
  title,
  description,
  requirement,
  commission,
  bonusAccess,
  isCurrent = false,
}) => (
  <View
    className={`bg-white rounded-xl p-5 mb-4 shadow-sm ${isCurrent ? 'border-2 border-green-600' : ''}`}
  >
    <View className="flex-row justify-between items-center mb-2">
      <Text className="text-xl font-bold text-gray-800">{title}</Text>
      {isCurrent && (
        <View className="bg-green-100 rounded-full px-3 py-1">
          <Text className="text-green-800 text-xs font-semibold">Current Tier</Text>
        </View>
      )}
    </View>
    <Text className="text-gray-500 text-sm mb-3">{description}</Text>
    <Text className="text-gray-700 text-sm mb-1"><Text className="font-semibold">Requirement:</Text> {requirement}</Text>
    <Text className="text-gray-700 text-sm mb-1"><Text className="font-semibold">Commission:</Text> {commission}</Text>
    <Text className="text-gray-700 text-sm"><Text className="font-semibold">Bonus Access:</Text> {bonusAccess}</Text>
  </View>
);

const fetchTierData = async () => {
  const response = await fetchUser();
  if (response.status === 'Success' && response.data?.user) {
    return response.data.user;
  } else {
    throw new Error('Failed to fetch user data');
  }
};

export default function TierScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Use back button handler for tier page
  useBackButtonHandler('/Tier');
  
  const [networkAvailable, setNetworkAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    let cacheData = null;
    try {
      const cached = await AsyncStorage.getItem('tier_user');
      if (cached) {
        cacheData = JSON.parse(cached);
        setUserDetails(cacheData);
      }
    } catch {}
    if (!networkAvailable && cacheData) {
      setLoading(false);
      return;
    }
    try {
      const data = await getCachedData('tier_user', fetchTierData);
      setUserDetails(data);
    } catch (err) {
      if (!cacheData) {
        setError('Failed to load user data');
        setUserDetails(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map accountTier to tier level
  const getCurrentTier = (accountTier?: string) => {
    switch (accountTier) {
      case 'tier1':
        return 'Entry Tier';
      case 'tier2':
        return 'Bronze Tier';
      case 'tier3':
        return 'Silver Tier';
      case 'tier4':
        return 'Gold Tier';
      case 'tier5':
        return 'Platinum Tier';
      default:
        return 'Entry Tier';
    }
  };

  if (loading) {
    return <EsusuLoader />;
  }

  const currentTier = getCurrentTier(userDetails?.accountTier);

  return (
    <View className="flex-1 bg-gray-100">
      <View
        className="flex-row items-center bg-white px-4 pb-4 pt-6"
        style={{ paddingTop: insets.top }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-gray-800">Tier</Text>
        <View className="w-8" />{/* Spacer for alignment */}
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-[#0052CC] mb-2">Your Operator Tier</Text>
          <Text className="text-gray-600 text-base">Track your progress, grow your customer base, and earn more with every tier.</Text>
        </View>

        <TierCard
          title="Entry Tier"
          description="You're just getting started! Build trust and grow your network to unlock higher commissions."
          requirement="1–9 customers"
          commission="50%"
          bonusAccess="None"
          isCurrent={currentTier === 'Entry Tier'}
        />

        <TierCard
          title="Bronze Tier"
          description="Nice work! You've begun building consistency. Stay active and keep your customers saving regularly."
          requirement="10–19 customers"
          commission="60%"
          bonusAccess="Quarterly Loyalty Bonus"
          isCurrent={currentTier === 'Bronze Tier'}
        />

        <TierCard
          title="Silver Tier"
          description="You're climbing fast! You're now eligible for referral rewards and loyalty bonuses — invite and earn more."
          requirement="20–34 customers"
          commission="70%"
          bonusAccess="Referral + Loyalty Bonuses"
          isCurrent={currentTier === 'Silver Tier'}
        />

        <TierCard
          title="Gold Tier"
          description="You're a top performer! Enjoy premium earnings and early access to new tools and features on Esusu."
          requirement="35–49 customers"
          commission="80%"
          bonusAccess="All Tier Rewards + Early Access to New Features"
          isCurrent={currentTier === 'Gold Tier'}
        />

        <TierCard
          title="Platinum Tier"
          description="You're a community leader! Unlock full earning potential and gain recognition as one of Esusu's elite operators."
          requirement="50+ customers"
          commission="90%"
          bonusAccess="Full Access + Community Leadership Benefits"
          isCurrent={currentTier === 'Platinum Tier'}
        />
      </ScrollView>
    </View>
  );
} 