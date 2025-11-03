import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Share,
  RefreshControl,
  StyleSheet 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useBackButtonHandler } from '../utils/backButtonHandler';
import { getReferrals, saveReferral, withdrawBonus } from '../../services/api';

interface ReferralActivity {
  _id: string;
  merchant: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  bonusPaid: boolean;
  dateReferred: string;
  
}

export default function ReferralScreen() {
  const router = useRouter();
  const styles = StyleSheet.create({
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    scrollViewContent: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
    },
    
    // Loading State
    loadingContainer: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: '#6B7280',
      marginTop: 16,
    },
    
    // Error State
    errorContainer: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    errorText: {
      color: '#111827',
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: '#0072CE',
      borderRadius: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      marginTop: 16,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontWeight: '500',
    },
    
    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontWeight: '600',
      color: '#111827',
    },
    
    // Stats
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statCard: {
      flex: 1,
      backgroundColor: '#E5F1FF',
      borderRadius: 8,
      padding: 16,
    },
    statLabel: {
      color: '#0072CE',
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },
    statValue: {
      color: '#0072CE',
      fontSize: 24,
      fontWeight: '700',
    },
    
    // Cards
    card: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      padding: 16,
      marginBottom: 24,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 8,
    },
    cardSubtitle: {
      color: '#6B7280',
      fontSize: 12,
      marginTop: 8,
    },
    
    // Referral Code
    referralCodeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#F4F4F5',
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
    },
    referralCodeText: {
      fontSize: 20,
      fontWeight: '700',
      color: '#0072CE',
    },
    
    // Buttons
    shareButton: {
      backgroundColor: '#0072CE',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    shareButtonText: {
      color: '#FFFFFF',
      fontWeight: '500',
    },
    submitButton: {
      backgroundColor: '#0072CE',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontWeight: '500',
    },
    
    // Input
    referralInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    referralInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      backgroundColor: '#F4F4F5',
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      marginRight: 8,
    },
    
    // Withdraw Button
    withdrawContainer: {
      marginBottom: 24,
    },
    withdrawButton: {
      backgroundColor: '#10B981',
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
    },
    withdrawButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 18,
    },
    
    // Activities
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 16,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyStateText: {
      color: '#6B7280',
      textAlign: 'center',
      marginTop: 8,
    },
    emptyStateSubtext: {
      color: '#9CA3AF',
      textAlign: 'center',
      marginTop: 4,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    activityInfo: {
      flex: 1,
    },
    activityName: {
      fontWeight: '500',
      color: '#111827',
      marginBottom: 2,
    },
    activityEmail: {
      color: '#6B7280',
      marginBottom: 2,
    },
    activityDate: {
      color: '#9CA3AF',
    },
    activityMeta: {
      alignItems: 'flex-end',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 4,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '500',
    },
    bonusAmount: {
      color: '#10B981',
      fontWeight: '600',
      marginTop: 4,
    },
  });
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  
  // Responsive sizing based on screen width
  const getResponsiveSize = (baseSize: number) => {
    if (width < 375) {
      return baseSize * 0.9; // Small phones
    } else if (width < 414) {
      return baseSize; // Medium phones
    } else {
      return baseSize * 1.1; // Large phones and tablets
    }
  };

  // Use back button handler
  useBackButtonHandler('/referral');

  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [referralActivities, setReferralActivities] = useState<ReferralActivity[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [hasEnteredReferralCode, setHasEnteredReferralCode] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch referral data on component mount
  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setIsLoadingData(true);
      setError(null);
      
      const referralData = await getReferrals();
      console.log('Referral data fetched:', referralData);
      
      if (referralData && referralData.referredUsers) {
        const { referrals, balance, code } = referralData.referredUsers;
        
        // Set referral code from API response
        if (code) {
          setReferralCode(code);
        }
        
        // Filter out referrals with empty merchant data and set activities
        const validReferrals = referrals?.filter((ref: ReferralActivity) => 
          ref.merchant && 
          ref.merchant.firstName && 
          ref.merchant.lastName && 
          ref.merchant.email
        ) || [];
        
        setReferralActivities(validReferrals);
        setTotalReferrals(validReferrals.length);
        setTotalEarnings(balance || 0);
        
        // Check if user has already entered a referral code
        setHasEnteredReferralCode(validReferrals.length > 0);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      setError('Failed to load referral data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleShareReferralCode = async () => {
    try {
      await Share.share({
        message: `Join Esusu POS and use my referral code: ${referralCode}\n\nEarn money while helping others save! Download the app and use my code to get started.`,
        title: 'Join Esusu POS with my referral code'
      });
    } catch (error) {
      console.error('Error sharing referral code:', error);
    }
  };

  const handleSubmitReferralCode = async () => {
    if (!inputCode.trim()) {
      Alert.alert('Error', 'Please enter a referral code');
      return;
    }

    if (hasEnteredReferralCode) {
      Alert.alert('Error', 'You have already entered a referral code');
      return;
    }

    setLoading(true);
    try {
      const response = await saveReferral(inputCode.trim());
      
      Alert.alert(
        'Success',
        'Referral code submitted successfully! You will receive your bonus once the user completes their registration.',
        [{ text: 'OK', onPress: () => {
          setInputCode('');
          setHasEnteredReferralCode(true);
          // Refresh data to show updated status
          fetchReferralData();
        }}]
      );
    } catch (error: any) {
      console.error('Error submitting referral code:', error);
      Alert.alert('Error', error.message || 'Failed to submit referral code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawBonus = async () => {
    if (totalEarnings <= 0) {
      Alert.alert('No Bonus Available', 'You have no bonus to withdraw at this time.');
      return;
    }

    Alert.alert(
      'Withdraw Bonus',
      `Are you sure you want to withdraw ₦${totalEarnings.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await withdrawBonus();
              
              Alert.alert(
                'Success',
                'Bonus withdrawn successfully!',
                [{ text: 'OK', onPress: () => {
                  // Refresh data to show updated balance
                  fetchReferralData();
                }}]
              );
            } catch (error: any) {
              console.error('Error withdrawing bonus:', error);
              Alert.alert('Error', error.message || 'Failed to withdraw bonus. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (bonusPaid: boolean) => {
    return bonusPaid ? '#10B981' : '#F59E0B';
  };

  const getStatusText = (bonusPaid: boolean) => {
    return bonusPaid ? 'Paid' : 'Pending';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0072CE" />
        <Text style={styles.loadingText}>Loading referral data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={fetchReferralData}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoadingData} onRefresh={fetchReferralData} />
        }
      >
        <View style={[
          styles.container,
          {
            paddingTop: insets.top + getResponsiveSize(16),
            paddingBottom: insets.bottom + getResponsiveSize(16),
            paddingHorizontal: getResponsiveSize(24),
          }
        ]}>
          {/* Header */}
          <View style={[styles.header, { marginBottom: getResponsiveSize(24) }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { padding: getResponsiveSize(8) }]}
            >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontSize: getResponsiveSize(18) }]}>Referral Program</Text>
            <View style={{ width: getResponsiveSize(44) }} />
          </View>

          {/* Stats Cards */}
          <View style={[styles.statsContainer, { marginBottom: getResponsiveSize(24) }]}>
            <View style={[
              styles.statCard,
              { 
                padding: getResponsiveSize(16),
                marginRight: getResponsiveSize(8),
                borderRadius: getResponsiveSize(8)
              }
            ]}>
              <Text style={[
                styles.statLabel,
                { fontSize: getResponsiveSize(14) }
              ]}>
                Total Referrals
              </Text>
              <Text style={[
                styles.statValue,
                { fontSize: getResponsiveSize(24) }
              ]}>
                {totalReferrals}
              </Text>
            </View>
            <View style={[
              styles.statCard,
              { 
                padding: getResponsiveSize(16),
                marginLeft: getResponsiveSize(8),
                borderRadius: getResponsiveSize(8)
              }
            ]}>
              <Text style={[
                styles.statLabel,
                { fontSize: getResponsiveSize(14) }
              ]}>
                Total Earnings
              </Text>
              <Text style={[
                styles.statValue,
                { fontSize: getResponsiveSize(24) }
              ]}>
                ₦{totalEarnings.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Your Referral Code */}
          {referralCode && (
            <View style={[
              styles.card,
              { 
                padding: getResponsiveSize(16),
                marginBottom: getResponsiveSize(24),
                borderRadius: getResponsiveSize(8)
              }
            ]}>
              <Text style={[
                styles.cardTitle,
                { fontSize: getResponsiveSize(18) }
              ]}>
                Your Referral Code
              </Text>
              <View style={[
                styles.referralCodeContainer,
                { 
                  padding: getResponsiveSize(12),
                  borderRadius: getResponsiveSize(8)
                }
              ]}>
                <Text style={[
                  styles.referralCodeText,
                  { fontSize: getResponsiveSize(20) }
                ]}>
                  {referralCode}
                </Text>
                <TouchableOpacity
                  onPress={handleShareReferralCode}
                  style={[
                    styles.shareButton,
                    { 
                      paddingHorizontal: getResponsiveSize(16),
                      paddingVertical: getResponsiveSize(8),
                      borderRadius: getResponsiveSize(8)
                    }
                  ]}
                >
                  <Text style={[
                    styles.shareButtonText,
                    { fontSize: getResponsiveSize(14) }
                  ]}>
                    Share
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[
                styles.cardSubtitle,
                { fontSize: getResponsiveSize(12) }
              ]}>
                Share this code with friends to earn ₦500 for each successful referral
              </Text>
            </View>
          )}

          {/* Enter Referral Code - Only show if user hasn't entered one */}
          {!hasEnteredReferralCode && (
            <View style={[
              styles.card,
              { 
                padding: getResponsiveSize(16),
                marginBottom: getResponsiveSize(24),
                borderRadius: getResponsiveSize(8)
              }
            ]}>
              <Text style={[
                styles.cardTitle,
                { fontSize: getResponsiveSize(18) }
              ]}>
                Enter Referral Code
              </Text>
              <View style={styles.referralInputContainer}>
                <TextInput
                  placeholder="Enter referral code"
                  value={inputCode}
                  onChangeText={setInputCode}
                  style={[
                    styles.referralInput,
                    { 
                      paddingHorizontal: getResponsiveSize(12),
                      paddingVertical: getResponsiveSize(12),
                      borderRadius: getResponsiveSize(8),
                      marginRight: getResponsiveSize(8),
                      fontSize: getResponsiveSize(16)
                    }
                  ]}
                  placeholderTextColor="#BDBDBD"
                />
                <TouchableOpacity
                  onPress={handleSubmitReferralCode}
                  disabled={loading}
                  style={[
                    styles.submitButton,
                    { 
                      paddingHorizontal: getResponsiveSize(16),
                      paddingVertical: getResponsiveSize(12),
                      borderRadius: getResponsiveSize(8),
                      opacity: loading ? 0.7 : 1
                    }
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={[
                      styles.submitButtonText,
                      { fontSize: getResponsiveSize(14) }
                    ]}>
                      Submit
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={[
                styles.cardSubtitle,
                { fontSize: getResponsiveSize(12) }
              ]}>
                Enter a friend's referral code to earn ₦500 bonus
              </Text>
            </View>
          )}

          {/* Withdraw Bonus Button */}
          {totalEarnings > 0 && (
            <View style={[styles.withdrawContainer, { marginBottom: getResponsiveSize(24) }]}>
              <TouchableOpacity
                onPress={handleWithdrawBonus}
                disabled={loading}
                style={[
                  styles.withdrawButton,
                  {
                    paddingVertical: getResponsiveSize(16),
                    borderRadius: getResponsiveSize(8),
                    opacity: loading ? 0.7 : 1
                  }
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[
                    styles.withdrawButtonText,
                    { fontSize: getResponsiveSize(18) }
                  ]}>
                    Withdraw ₦{totalEarnings.toLocaleString()}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Referral Activities */}
          <View style={[
            styles.card,
            { 
              padding: getResponsiveSize(16),
              borderRadius: getResponsiveSize(8)
            }
          ]}>
            <Text style={[
              styles.sectionTitle,
              { 
                fontSize: getResponsiveSize(18),
                marginBottom: getResponsiveSize(16)
              }
            ]}>
              Referral Activities
            </Text>
            
            {referralActivities.length === 0 ? (
              <View style={[
                styles.emptyState,
                { paddingVertical: getResponsiveSize(32) }
              ]}>
                <Ionicons name="people-outline" size={getResponsiveSize(48)} color="#9CA3AF" />
                <Text style={[
                  styles.emptyStateText,
                  { fontSize: getResponsiveSize(14) }
                ]}>
                  No referral activities yet
                </Text>
                <Text style={[
                  styles.emptyStateSubtext,
                  { fontSize: getResponsiveSize(12) }
                ]}>
                  Share your referral code to start earning
                </Text>
              </View>
            ) : (
              <View>
                {referralActivities.map((activity, index) => (
                  <View
                    key={`${activity._id}-${index}`}
                    style={[
                      styles.activityItem,
                      {
                        paddingVertical: getResponsiveSize(12),
                        borderBottomWidth: index !== referralActivities.length - 1 ? 1 : 0,
                        borderBottomColor: '#E5E7EB'
                      }
                    ]}
                  >
                    <View style={styles.activityInfo}>
                      <Text style={[
                        styles.activityName,
                        { fontSize: getResponsiveSize(16) }
                      ]}>
                        {activity.merchant.firstName} {activity.merchant.lastName}
                      </Text>
                      <Text style={[
                        styles.activityEmail,
                        { fontSize: getResponsiveSize(12) }
                      ]}>
                        {activity.merchant.email}
                      </Text>
                      <Text style={[
                        styles.activityDate,
                        { fontSize: getResponsiveSize(10) }
                      ]}>
                        {formatDate(activity.dateReferred)}
                      </Text>
                    </View>
                    <View style={styles.activityMeta}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            paddingHorizontal: getResponsiveSize(8),
                            paddingVertical: getResponsiveSize(4),
                            borderRadius: getResponsiveSize(12),
                            backgroundColor: `${getStatusColor(activity.bonusPaid)}20`
                          }
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              fontSize: getResponsiveSize(10),
                              color: getStatusColor(activity.bonusPaid)
                            }
                          ]}
                        >
                          {getStatusText(activity.bonusPaid)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.bonusAmount,
                        { fontSize: getResponsiveSize(12) }
                      ]}>
                        ₦500
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}