import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  SafeAreaView, 
  Alert, 
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ScrollViewProps
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getCachedData, invalidateCache } from '../../utils/dataCaching';
import { fetchMerchantDashboardAccount } from '../../../services/api';
import EsusuLoader from '../../components/EsusuLoader';
import { useDataFetchGuard, useRenderGuard } from '../../utils/dataFetchGuard';
import { useBackButtonHandler } from '../../utils/backButtonHandler';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 40,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 8,
    },
    backButton: {
        backgroundColor: '#F2F8FF',
        height: 32,
        width: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    backIcon: {
        width: 16,
        height: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 110,
    },
    contentContainer: {
        flex: 1,
        minHeight: '100%',
    },
    card: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    depositInfo: {
        flexDirection: 'column',
        gap: 8,
        marginBottom: 32,
    },
    depositTitle: {
        color: '#0074FF',
        fontSize: 28,
        fontWeight: '600',
    },
    depositDescription: {
        color: '#272636',
        fontSize: 14,
        lineHeight: 20,
    },
    accountSection: {
        marginTop: 32,
    },
    sectionTitle: {
        color: '#272636',
        fontWeight: '600',
        fontSize: 16,
        marginBottom: 16,
    },
    accountDetailsCard: {
        backgroundColor: '#0074FF',
        borderRadius: 12,
        paddingVertical: 40,
        paddingHorizontal: 16,
        gap: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        color: 'white',
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    detailValue: {
        color: 'white',
        fontSize: 14,
    },
    paidButton: {
        backgroundColor: '#0074FF',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
    },
    paidButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});

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
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={handlePreviousPage} 
                    style={styles.backButton}
                >
                    <Image
                        source={require('../../assets/images/back-arrow.png')}
                        style={styles.backIcon}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Deposit</Text>
            </View>

            <View style={styles.contentContainer}>
                {/* We would fetch from the BE later for this deposit-bank card */}
                <View style={styles.card}>
                    <View style={styles.depositInfo}>
                        <Text style={styles.depositTitle}>Make your Deposit</Text>
                        <Text style={styles.depositDescription}>
                            Transfer the amount before the timer runs out. A new account will be generated if time expires.
                        </Text>
                    </View>

                    <View style={styles.accountSection}>
                        <Text style={styles.sectionTitle}>Account Details</Text>

                        <View style={styles.accountDetailsCard}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>bank:</Text>
                                <Text style={styles.detailValue}>XYZ Bank</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>account:</Text>
                                <Text style={styles.detailValue}>1234567890</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>account name</Text>
                                <Text style={styles.detailValue}>AjoMarket Temporary Account</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.paidButton}
                    onPress={handleNextPage}
                >
                    <Text style={styles.paidButtonText}>I've paid</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

