import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
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
  <View style={[styles.tierCard, isCurrent && styles.tierCardCurrent]}>
    <View style={styles.tierCardHeader}>
      <Text style={styles.tierCardTitle}>{title}</Text>
      {isCurrent && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>Current Tier</Text>
        </View>
      )}
    </View>
    <Text style={styles.tierCardDescription}>{description}</Text>
    <Text style={styles.tierCardDetail}>
      <Text style={styles.tierCardLabel}>Requirement:</Text> {requirement}
    </Text>
    <Text style={styles.tierCardDetail}>
      <Text style={styles.tierCardLabel}>Commission:</Text> {commission}
    </Text>
    <Text style={styles.tierCardDetail}>
      <Text style={styles.tierCardLabel}>Bonus Access:</Text> {bonusAccess}
    </Text>
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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tier</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Your Operator Tier</Text>
          <Text style={styles.subtitle}>Track your progress, grow your customer base, and earn more with every tier.</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  titleContainer: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0052CC',
    marginBottom: 8,
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 16,
  },
  tierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tierCardCurrent: {
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  tierCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  currentBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  currentBadgeText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
  },
  tierCardDescription: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 12,
  },
  tierCardDetail: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 4,
  },
  tierCardLabel: {
    fontWeight: '600',
  },
}); 