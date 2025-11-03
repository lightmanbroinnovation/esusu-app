import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity, Modal, TextInput, Alert, SafeAreaView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Contributor } from './ContributorsScreen';
import { fetchGroupedContributors, fetchGroupedContributorPhotos } from '../../services/api';
import StatusBarAdapter from '../components/StatusBarAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
import { getCachedData, invalidateCache } from '../utils/dataCaching';
import EsusuLoader from '../components/EsusuLoader';
import NetInfo from '@react-native-community/netinfo';
import { useDataFetchGuard, useRenderGuard } from '../utils/dataFetchGuard';
import { useBackButtonHandler } from '../utils/backButtonHandler';
// TODO: Replace with Moti Skeleton

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 999,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginLeft: -32,
  },
  helpButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 999,
    marginLeft: 8,
  },
  searchBar: {
    backgroundColor: '#F5F6FA',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    color: '#0074FF',
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginBottom: 18,
  },
  modalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  statusLabel: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 16,
    marginRight: 6,
  },
  statusDescription: {
    color: '#6B7280',
    fontSize: 15,
  },
  modalCloseButton: {
    backgroundColor: '#0074FF',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 18,
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  listEmptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 16,
  },
});

const fetchContributorListData = async (group: string) => {
  const token = await AsyncStorage.getItem('auth_token');
  const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
  const res = await fetch(`https://esusu-server.onrender.com/api/contributor-account/${group}/group/details`, { headers });
  if (!res.ok) throw new Error('Failed to fetch group details');
  const data = await res.json();
  return data.contributorsGroupDetails || [];
};

const ContributorListScreen = () => {
  const router = useRouter();
  
  // Use back button handler for contributor list screen
  useBackButtonHandler('/contributors/list');
  
  const params = useLocalSearchParams();
  const dispatch = useDispatch();
  const group = params.group as string || 'daily';
  const [contributors, setContributors] = useState<any[]>([]);
  const [filteredContributors, setFilteredContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupTitle, setGroupTitle] = useState<string>('');
  const [search, setSearch] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [networkAvailable, setNetworkAvailable] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Add data fetch guard and render guard
  const fetchGuard = useDataFetchGuard(3, 3000);
  const renderGuard = useRenderGuard('ContributorListScreen', 15);

  const navigateBack = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/dashboard');
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

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
    let cacheData: any[] | null = null;
    try {
      const cached = await AsyncStorage.getItem(`contributor_list_${group}`);
      if (cached) {
        cacheData = JSON.parse(cached);
        setContributors(cacheData || []);
        setFilteredContributors(cacheData || []);
      }
    } catch {}
    if (!networkAvailable && cacheData) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (fromRefresh) {
      await invalidateCache(`contributor_list_${group}`);
    }
    try {
      // Record the fetch attempt
      fetchGuard.recordFetch();
      const data = await getCachedData(`contributor_list_${group}`, () => fetchContributorListData(group));
      setContributors(data);
      setFilteredContributors(data);
      setGroupTitle('Commission');
    } catch (err) {
      if (!cacheData) {
        setError('Failed to load contributors');
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

  useEffect(() => {
    if (!search) {
      setFilteredContributors(contributors);
    } else {
      const lower = search.toLowerCase();
      setFilteredContributors(
        contributors.filter(item => {
          const name = item.user?.fullName || ((item.user?.firstName || '') + ' ' + (item.user?.lastName || ''));
          return (name || '').toLowerCase().includes(lower);
        })
      );
    }
  }, [search, contributors]);

  // Helper functions for status pill
  const getStatusColor = (status: string) => {
    if (status === 'Active') return '#D1FADF';
    if (status === 'Pending') return '#FEF6D5';
    if (status === 'Overdue') return '#FEE2E2';
    return '#E5E7EB';
  };
  const getStatusTextColor = (status: string) => {
    if (status === 'Active') return '#039855';
    if (status === 'Pending') return '#F79009';
    if (status === 'Overdue') return '#D92D20';
    return '#6B7280';
  };
  const formatBalance = (bal: number | string) =>
    '₦' + Number(bal || 0).toLocaleString();
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  // Determine status for pill (example logic, adjust as needed)
  const getStatus = (item: any) => {
    if (item.status === 'overdue' || item.isOverdue) return 'Overdue';
    if (item.status === 'pending' || item.isPending) return 'Pending';
    if (item.status === 'active' || item.isActive) return 'Active';
    return 'Pending';
  };

  // Add onRefresh handler before return
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  if (loading) {
    return <EsusuLoader />;
  }

  // Do NOT show a 'no network' error. Always display the contributors list, even if offline.
  // Only show error if there is truly no data to display (e.g., error and no contributors at all)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarAdapter backgroundColor="#FFFFFF" barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contributors</Text>
        <TouchableOpacity onPress={() => setShowStatusModal(true)} style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={22} color="#222" />
        </TouchableOpacity>
      </View>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#A0AEC0" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search by name..."
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#A0AEC0"
          autoCapitalize="none"
          keyboardType="default"
        />
      </View>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            onPress={() => fetchData(true)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredContributors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No contributors found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContributors}
          keyExtractor={item => item.id || item._id || Math.random().toString()}
          renderItem={({ item }) => {
            const status = getStatus(item);
            return (
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => {
                  const contributorId =  item.user._id || item.id || item.user?._id;
                  if (contributorId) {
                    router.push({ pathname: '/contributor/profile', params: { contributorId } });
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  marginBottom: 18,
                  padding: 12,
                  shadowColor: '#000',
                  shadowOpacity: 0.03,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <Image
                  source={{ uri: item.user?.photo || '' }}
                  style={{ width: 56, height: 56, borderRadius: 12, marginRight: 14, backgroundColor: '#F3F4F6' }}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2, color: '#111' }}>
                    {item.user?.fullName || item.user?.firstName + ' ' + item.user?.lastName || 'No Name'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#A0AEC0', fontSize: 12, fontWeight: '500' }}>Balance</Text>
                      <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#111' }}>
                        {formatBalance(item.balance)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#A0AEC0', fontSize: 12, fontWeight: '500' }}>Next Due Date</Text>
                      <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#111' }}>
                        {formatDate(item.nextDepositDate)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={{ color: '#A0AEC0', fontSize: 12, fontWeight: '500' }}>Status</Text>
                      <View
                        style={{
                          backgroundColor: getStatusColor(status),
                          borderRadius: 16,
                          paddingHorizontal: 14,
                          paddingVertical: 4,
                          marginTop: 2,
                        }}
                      >
                        <Text style={{ color: getStatusTextColor(status), fontWeight: 'bold', fontSize: 12 }}>
                          {status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ padding: 14 }}
          ListEmptyComponent={
            <Text style={styles.listEmptyText}>No contributors found.</Text>
          }
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
      {/* Status Modal */}
      <Modal visible={showStatusModal} transparent animationType="fade" onRequestClose={() => setShowStatusModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Coded Status Indicators
            </Text>
            <View style={styles.modalDivider} />
            <View style={{ width: '100%' }}>
              <View style={styles.modalStatusRow}>
                <View style={[styles.statusIndicator, { backgroundColor: '#039855' }]} />
                <Text style={styles.statusLabel}>Active</Text>
                <Text style={styles.statusDescription}>Recently contributed</Text>
              </View>
              <View style={styles.modalStatusRow}>
                <View style={[styles.statusIndicator, { backgroundColor: '#F79009' }]} />
                <Text style={styles.statusLabel}>Pending</Text>
                <Text style={styles.statusDescription}>Due for contribution</Text>
              </View>
              <View style={styles.modalStatusRow}>
                <View style={[styles.statusIndicator, { backgroundColor: '#D92D20' }]} />
                <Text style={styles.statusLabel}>Pending</Text>
                <Text style={styles.statusDescription}>Missed contributions</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowStatusModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ContributorListScreen;