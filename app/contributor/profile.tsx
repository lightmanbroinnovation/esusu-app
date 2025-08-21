import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../components/EsusuLoader';
import { useBackButtonHandler } from '../utils/backButtonHandler';
// @ts-ignore
import { sendNotification, NotificationTemplates } from '../services/notificationService';
// TODO: Replace with Moti Skeleton

export default function ContributorProfileScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Use back button handler for contributor profile
  useBackButtonHandler('/contributor/profile');
  
  const contributorId = params.contributorId as string;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentContributions, setRecentContributions] = useState<any[]>([]);
  const [contributionsPage, setContributionsPage] = useState(1);
  const [contributionsHasMore, setContributionsHasMore] = useState(true);
  const [networkAvailable, setNetworkAvailable] = useState(true);

  // Move fetchProfile outside useEffect so it can be called in onRefresh
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      const res = await fetch(
        `https://esusu-server.onrender.com/api/contributor/${contributorId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error('Failed to fetch contributor profile');
      const json = await res.json();
      console.log(json)
      console.log('[ContributorProfile] Fetched profile response:', JSON.stringify(json, null, 2));
      if (!json || !json.data) {
        setError('No contributor data found.');
        setProfile(null);
      } else {
        setProfile(json.data);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch contributor profile.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all recent contributions (all pages)
  const fetchAllRecentContributions = async (phoneNumber: string) => {
    let allContributions: any[] = [];
    let page = 1;
    let hasMore = true;
    try {
      const token = await AsyncStorage.getItem('auth_token');
      while (hasMore) {
        const res = await fetch(
          `https://esusu-server.onrender.com/api/contributor-account/${phoneNumber}/recent?limit=10&page=${page}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        const data = await res.json();
        if (data && data.data && Array.isArray(data.data.contributions)) {
          allContributions = allContributions.concat(data.data.contributions);
          if (data.data.contributions.length < 10) {
            hasMore = false;
          } else {
            page += 1;
          }
        } else {
          hasMore = false;
        }
      }
      setRecentContributions(allContributions);
      setContributionsHasMore(false);
    } catch (err) {
      console.error('Error fetching all recent contributions:', err);
      setContributionsHasMore(false);
    }
  };

  useEffect(() => {
    if (contributorId) fetchProfile();
  }, [contributorId]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Fetch recent contributions when profile is loaded
  useEffect(() => {
    if (profile && profile.contributor && profile.contributor.phoneNumber) {
      fetchAllRecentContributions(profile.contributor.phoneNumber);
      setContributionsPage(1);
    }
  }, [profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProfile();
      if (profile && profile.contributor && profile.contributor.phoneNumber) {
        await fetchAllRecentContributions(profile.contributor.phoneNumber);
        setContributionsPage(1);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Handler to load more contributions (pagination)
  // Removed fetchRecentContributions (function does not exist)
  // If you want to implement pagination, use fetchAllRecentContributions or implement a paginated fetch.
  // For now, disable the load more button functionality.
  const handleLoadMoreContributions = () => {
    // Pagination not implemented, do nothing
  };

  // Handler for viewing all transactions (pass recentContributions to transactions.tsx)
  const handleViewAllTransactions = () => {
    if (profile && profile.contributor && profile.contributor.phoneNumber) {
      // Pass recentContributions as a param (or use context for larger data)
      router.push({
        pathname: '/contributor/transactions',
        params: {
          contributorId: contributorId,
          contributorName: fullName,
          recentContributions: JSON.stringify(recentContributions)
        }
      });
    }
  };

  if (loading) {
    return <EsusuLoader />;
  }

  if (error && !profile) {
    if (!networkAvailable) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>No network. Please connect to the internet to load this profile.</Text>
        </View>
      );
    } else {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>{error}</Text>
        </View>
      );
    }
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No contributor found.</Text>
      </View>
    );
  }

  // Extract data correctly from structure
  const contributor = profile.contributor || {};
  const account = profile.account || {};
  console.log('profile:', profile);
  console.log('account:', account);
  const photo = contributor.photo || (contributor.photoDetails && contributor.photoDetails.url) || '';
  const fullName = `${contributor.firstName || ''} ${contributor.lastName || ''}`;
  const language = contributor.language || 'N/A';

  // Always use account.contributionCycle for these values
  const contributionCycle = account && account.contributionCycle ? account.contributionCycle : {};
  const depositAmount = account.depositAmount;
  const duration = account.duration;
  const history = account.history || [];

  const frequency = depositAmount && duration
    ? `₦${Number(depositAmount).toLocaleString()} ${duration}`
    : 'N/A';

  const startDate = contributionCycle.cycleStartDate || null;
  const cycleLength = contributionCycle.cycleLength || null;
  const totalContributions = contributionCycle.totalContributions || 0;
  const cycleTarget = contributionCycle.cycleTarget || 0;
  const balance = (account && typeof account.balance === 'number') ? account.balance : 0;

  let endDate = null;
  if (startDate && cycleLength && duration) {
    const start = new Date(startDate);
    if (duration === 'daily') {
      start.setDate(start.getDate() + Number(cycleLength) - 1);
    } else if (duration === 'weekly') {
      start.setDate(start.getDate() + 7 * (Number(cycleLength) - 1));
    } else if (duration === 'monthly') {
      start.setMonth(start.getMonth() + Number(cycleLength) - 1);
    }
    endDate = start.toISOString();
  }

  // Calculate time left based on duration
  let timeLeft = 'N/A';
  let timeLeftLabel = 'Days Left';
  if (endDate) {
    const now = new Date();
    const end = new Date(endDate);
    if (duration === 'daily') {
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      timeLeft = diff > 0 ? diff.toString() : '0';
      timeLeftLabel = 'Days Left';
    } else if (duration === 'weekly') {
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7));
      timeLeft = diff > 0 ? diff.toString() : '0';
      timeLeftLabel = 'Weeks Left';
    } else if (duration === 'monthly') {
      const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
      timeLeft = months > 0 ? months.toString() : '0';
      timeLeftLabel = 'Months Left';
    }
  }
  const recentActivity = Array.isArray(history) ? history.slice(0, 2) : [];

  // Handler for Deposit button
  const handleDeposit = () => {
    // Construct the data object as in amt-deposit.tsx lines 196-204
    const dataToPass = {
      contributorAccount: {
        _id: account._id || account.id,
        balance: account.balance || 0,
        depositAmount: account.depositAmount || 0,
        nextDepositDate: account.nextDepositDate || '',
        id: account._id || account.id,
      },
      contributor: {
        firstName: contributor.firstName || '',
        lastName: contributor.lastName || '',
        email: contributor.email || '',
        phoneNumber: contributor.phoneNumber || contributor.phone || '',
        photo: photo || '',
      },
    };
    // Navigate to amt-deposit.tsx with userDataString param
    window.location.href = `/deposit/subpages/amt-deposit?userDataString=${encodeURIComponent(JSON.stringify(dataToPass))}`;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 44, marginBottom: 8, paddingHorizontal: 16 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{  padding: 8, borderRadius: 100, marginRight: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>{fullName}</Text>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F6FA', marginLeft: 8 }} />
      </View>

      {/* Blue Card */}
      <View style={{ backgroundColor: '#0052CC', borderRadius: 24, margin: 16, padding: 20, alignItems: 'center' }}>
        <Image
          source={{ uri: photo }}
          style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#fff', marginBottom: 10 }}
        />
        <Text style={{ color: '#fff', fontSize: 14, marginBottom: 2 }}>Total Contributions Made</Text>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>
          ₦{Number(balance).toLocaleString()}
        </Text>
        <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'center', marginTop: 8 }}>
          <View style={{ flex: 1, alignItems: 'center', marginRight: 8, backgroundColor: '#F5F6FA', borderRadius: 12, paddingVertical: 16 }}>
            <Text style={{ color: '#98A2B3', fontSize: 13 }}>Contribution Target</Text>
            <Text style={{ color: '#101828', fontWeight: 'bold', fontSize: 18 }}>
              ₦{cycleTarget.toLocaleString()}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', marginLeft: 8, backgroundColor: '#F5F6FA', borderRadius: 12, paddingVertical: 16 }}>
            <Text style={{ color: '#98A2B3', fontSize: 13 }}>Total Contributions</Text>
            <Text style={{ color: '#101828', fontWeight: 'bold', fontSize: 18 }}>
              ₦{totalContributions.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Agent Notice */}
      <View style={{ backgroundColor: '#F5F6FA', borderRadius: 16, marginHorizontal: 16, marginBottom: 16, padding: 16 }}>
        <Text style={{ color: '#0052CC', fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>Important Notice for Agents</Text>
        <Text style={{ color: '#4A90E2', fontSize: 13 }}>
          As an agent, you do not have access to withdraw or control a contributor's funds—only the contributor can initiate payouts securely.
        </Text>
      </View>

      {/* Details Grid */}
      <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
        {/* Row 1: Start Date & End Date */}
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ backgroundColor: '#F8F9FA', borderRadius: 12, paddingVertical: 8, paddingLeft: 16 }}>
              <Text style={{ color: '#98A2B3', fontSize: 13 }}>Start Date</Text>
              <Text style={{ color: '#101828', fontWeight: 'bold', fontSize: 15 }}>
                {startDate ? new Date(startDate).toLocaleDateString('en-GB') : 'N/A'}
              </Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: '#F8F9FA', borderRadius: 12, paddingVertical: 8, paddingLeft: 16 }}>
              <Text style={{ color: '#98A2B3', fontSize: 13 }}>End Date</Text>
              <Text style={{ color: '#101828', fontWeight: 'bold', fontSize: 15 }}>
                {endDate ? new Date(endDate).toLocaleDateString('en-GB') : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
        {/* Row 2: Frequency & Time Left */}
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ backgroundColor: '#F8F9FA',  borderRadius: 12, paddingVertical: 8, paddingLeft: 16 }}>
              <Text style={{ color: '#98A2B3', fontSize: 13 }}>Frequency</Text>
              <Text style={{ color: '#101828', fontWeight: 'bold', fontSize: 15 }}>{frequency}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ backgroundColor: '#F8F9FA',  borderRadius: 12, paddingVertical: 8, paddingLeft: 16 }}>
              <Text style={{ color: '#98A2B3', fontSize: 13 }}>{timeLeftLabel}</Text>
              <Text style={{ color: '#101828', fontWeight: 'bold', fontSize: 15 }}>{timeLeft}</Text>
            </View>
          </View>
        </View>
        {/* Row 3: Language (single box, left-aligned) */}
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ backgroundColor: '#F8F9FA',  borderRadius: 12, paddingVertical: 8, paddingLeft: 16 }}>
              <Text style={{ color: '#98A2B3', fontSize: 13 }}>Language</Text>
              <Text style={{ color: '#101828', fontWeight: 'bold', fontSize: 15 }}>{language}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }} />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Recent Activity</Text>
          <TouchableOpacity onPress={handleViewAllTransactions}><Text style={{ color: '#0052CC', fontSize: 13 }}>View all</Text></TouchableOpacity>
        </View>
        {recentContributions.length === 0 ? (
          <Text style={{ color: '#98A2B3', fontSize: 13 }}>No recent activity.</Text>
        ) : (
          recentContributions.slice(0, 3).map((item: any, idx: number) => (
            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F6FA', borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <View>
                <Text style={{ color: item.type === 'deposit' ? '#039855' : '#D92D20', fontWeight: 'bold', fontSize: 15 }}>
                  {item.type === 'deposit' ? 'Deposited' : 'Withdraw'}
                </Text>
                <Text style={{ color: '#98A2B3', fontSize: 12 }}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  {' '}
                  {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
              <Text style={{ color: item.type === 'deposit' ? '#039855' : '#D92D20', fontWeight: 'bold', fontSize: 15 }}>
                {item.type === 'deposit' ? `₦${Number(item.amount).toLocaleString()}` : `-₦${Number(item.amount).toLocaleString()}`}
              </Text>
            </View>
          ))
        )}
        {contributionsHasMore && (
          <TouchableOpacity onPress={handleLoadMoreContributions} style={{ marginTop: 8, alignSelf: 'center' }}>
            <Text style={{ color: '#0052CC', fontWeight: 'bold' }}>Load More</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Send Reminder Button */}
      <TouchableOpacity
        style={{ backgroundColor: '#0052CC', borderRadius: 10, marginHorizontal: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 24, flexDirection: 'row', justifyContent: 'center' }}
        onPress={async () => {
          setShowReminderModal(true);
          await sendNotification(
            NotificationTemplates.contributor.reminder(fullName).title,
            NotificationTemplates.contributor.reminder(fullName).body,
            NotificationTemplates.contributor.reminder(fullName).type
          );
        }}
      >
        <Ionicons name="notifications-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
          Send Reminder
        </Text>
      </TouchableOpacity>

      {/* Reminder Modal */}
      <Modal visible={showReminderModal} transparent animationType="fade" onRequestClose={() => setShowReminderModal(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 28, width: '88%', maxWidth: 360, alignItems: 'center' }}>
            <Text style={{ color: '#0074FF', fontWeight: 'bold', fontSize: 22, marginBottom: 12, textAlign: 'center' }}>
              Reminder Sent!
            </Text>
            <Text style={{ color: '#222', fontSize: 16, textAlign: 'center', marginBottom: 18 }}>
              A reminder has been sent to <Text style={{ fontWeight: 'bold' }}>{fullName}</Text> via SMS to not forget to contribute today.
            </Text>
            <TouchableOpacity
              onPress={() => setShowReminderModal(false)}
              style={{ backgroundColor: '#0074FF', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 40, marginTop: 8 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
