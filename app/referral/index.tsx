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
  RefreshControl
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
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0072CE" />
        <Text className="text-gray-500 mt-4">Loading referral data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-gray-900 text-lg font-semibold mt-4 text-center">{error}</Text>
        <TouchableOpacity
          onPress={fetchReferralData}
          className="bg-[#0072CE] rounded-lg px-6 py-3 mt-4"
        >
          <Text className="text-white font-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoadingData} onRefresh={fetchReferralData} />
        }
      >
        <View
          className="flex-1"
          style={{
            paddingTop: insets.top + getResponsiveSize(16),
            paddingBottom: insets.bottom + getResponsiveSize(16),
            paddingHorizontal: getResponsiveSize(24),
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center" style={{ marginBottom: getResponsiveSize(24) }}>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.back()}
              style={{ padding: getResponsiveSize(8) }}
            >
              <Ionicons name="arrow-back" size={getResponsiveSize(28)} />
            </TouchableOpacity>
            <Text className="font-semibold" style={{ fontSize: getResponsiveSize(18) }}>Referral Program</Text>
            <View style={{ width: getResponsiveSize(44) }} />
          </View>

          {/* Stats Cards */}
          <View className="flex-row justify-between mb-6" style={{ marginBottom: getResponsiveSize(24) }}>
            <View className="flex-1 bg-[#E5F1FF] rounded-lg p-4 mr-2" style={{
              padding: getResponsiveSize(16),
              marginRight: getResponsiveSize(8),
              borderRadius: getResponsiveSize(8)
            }}>
              <Text className="text-[#0072CE] text-sm font-medium" style={{ fontSize: getResponsiveSize(14) }}>
                Total Referrals
              </Text>
              <Text className="text-[#0072CE] text-2xl font-bold" style={{ fontSize: getResponsiveSize(24) }}>
                {totalReferrals}
              </Text>
            </View>
            <View className="flex-1 bg-[#E5F1FF] rounded-lg p-4 ml-2" style={{
              padding: getResponsiveSize(16),
              marginLeft: getResponsiveSize(8),
              borderRadius: getResponsiveSize(8)
            }}>
              <Text className="text-[#0072CE] text-sm font-medium" style={{ fontSize: getResponsiveSize(14) }}>
                Total Earnings
              </Text>
              <Text className="text-[#0072CE] text-2xl font-bold" style={{ fontSize: getResponsiveSize(24) }}>
                ₦{totalEarnings.toLocaleString()}
              </Text>
            </View>
          </View>

                    {/* Your Referral Code */}
          {referralCode && (
            <View className="bg-white border border-[#E0E0E0] rounded-lg p-4 mb-6" style={{
              padding: getResponsiveSize(16),
              marginBottom: getResponsiveSize(24),
              borderRadius: getResponsiveSize(8)
            }}>
              <Text className="text-lg font-semibold mb-2" style={{ fontSize: getResponsiveSize(18) }}>
                Your Referral Code
              </Text>
              <View className="flex-row items-center justify-between bg-[#F4F4F5] rounded-lg p-3" style={{
                padding: getResponsiveSize(12),
                borderRadius: getResponsiveSize(8)
              }}>
                <Text className="text-xl font-bold text-[#0072CE]" style={{ fontSize: getResponsiveSize(20) }}>
                  {referralCode}
                </Text>
                <TouchableOpacity
                  onPress={handleShareReferralCode}
                  className="bg-[#0072CE] rounded-lg px-4 py-2"
                  style={{
                    paddingHorizontal: getResponsiveSize(16),
                    paddingVertical: getResponsiveSize(8),
                    borderRadius: getResponsiveSize(8)
                  }}
                >
                  <Text className="text-white font-medium" style={{ fontSize: getResponsiveSize(14) }}>
                    Share
                  </Text>
                </TouchableOpacity>
              </View>
              <Text className="text-gray-600 text-sm mt-2" style={{ fontSize: getResponsiveSize(12) }}>
                Share this code with friends to earn ₦500 for each successful referral
              </Text>
            </View>
          )}

          {/* Enter Referral Code - Only show if user hasn't entered one */}
          {!hasEnteredReferralCode && (
            <View className="bg-white border border-[#E0E0E0] rounded-lg p-4 mb-6" style={{
              padding: getResponsiveSize(16),
              marginBottom: getResponsiveSize(24),
              borderRadius: getResponsiveSize(8)
            }}>
              <Text className="text-lg font-semibold mb-2" style={{ fontSize: getResponsiveSize(18) }}>
                Enter Referral Code
              </Text>
              <View className="flex-row items-center">
                <TextInput
                  placeholder="Enter referral code"
                  value={inputCode}
                  onChangeText={setInputCode}
                  className="flex-1 border border-[#E0E0E0] rounded-lg px-3 py-3 bg-[#F4F4F5] mr-2"
                  style={{
                    paddingHorizontal: getResponsiveSize(12),
                    paddingVertical: getResponsiveSize(12),
                    borderRadius: getResponsiveSize(8),
                    marginRight: getResponsiveSize(8),
                    fontSize: getResponsiveSize(16)
                  }}
                  placeholderTextColor="#BDBDBD"
                />
                <TouchableOpacity
                  onPress={handleSubmitReferralCode}
                  disabled={loading}
                  className="bg-[#0072CE] rounded-lg px-4 py-3"
                  style={{
                    paddingHorizontal: getResponsiveSize(16),
                    paddingVertical: getResponsiveSize(12),
                    borderRadius: getResponsiveSize(8),
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium" style={{ fontSize: getResponsiveSize(14) }}>
                      Submit
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text className="text-gray-600 text-sm mt-2" style={{ fontSize: getResponsiveSize(12) }}>
                Enter a friend's referral code to earn ₦500 bonus
              </Text>
            </View>
          )}

          {/* Withdraw Bonus Button */}
          {totalEarnings > 0 && (
            <View className="mb-6" style={{ marginBottom: getResponsiveSize(24) }}>
              <TouchableOpacity
                onPress={handleWithdrawBonus}
                disabled={loading}
                className="bg-[#10B981] rounded-lg py-4 items-center"
                style={{
                  paddingVertical: getResponsiveSize(16),
                  borderRadius: getResponsiveSize(8),
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold text-lg" style={{ fontSize: getResponsiveSize(18) }}>
                    Withdraw ₦{totalEarnings.toLocaleString()}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Referral Activities */}
          <View className="bg-white border border-[#E0E0E0] rounded-lg p-4" style={{
            padding: getResponsiveSize(16),
            borderRadius: getResponsiveSize(8)
          }}>
            <Text className="text-lg font-semibold mb-4" style={{ fontSize: getResponsiveSize(18) }}>
              Referral Activities
            </Text>
            
            {referralActivities.length === 0 ? (
              <View className="items-center py-8" style={{ paddingVertical: getResponsiveSize(32) }}>
                <Ionicons name="people-outline" size={getResponsiveSize(48)} color="#9CA3AF" />
                <Text className="text-gray-500 text-center mt-2" style={{ fontSize: getResponsiveSize(14) }}>
                  No referral activities yet
                </Text>
                <Text className="text-gray-400 text-center mt-1" style={{ fontSize: getResponsiveSize(12) }}>
                  Share your referral code to start earning
                </Text>
              </View>
            ) : (
              <View>
                {referralActivities.map((activity, index) => (
                  <View
                    key={`${activity._id}-${index}`}
                    className={`flex-row items-center justify-between py-3 ${
                      index !== referralActivities.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                    style={{
                      paddingVertical: getResponsiveSize(12),
                      borderBottomWidth: index !== referralActivities.length - 1 ? 1 : 0,
                      borderBottomColor: '#E5E7EB'
                    }}
                  >
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900" style={{ fontSize: getResponsiveSize(16) }}>
                        {activity.merchant.firstName} {activity.merchant.lastName}
                      </Text>
                      <Text className="text-gray-500 text-sm" style={{ fontSize: getResponsiveSize(12) }}>
                        {activity.merchant.email}
                      </Text>
                      <Text className="text-gray-400 text-xs" style={{ fontSize: getResponsiveSize(10) }}>
                        {formatDate(activity.dateReferred)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{
                          paddingHorizontal: getResponsiveSize(8),
                          paddingVertical: getResponsiveSize(4),
                          borderRadius: getResponsiveSize(12),
                          backgroundColor: `${getStatusColor(activity.bonusPaid)}20`
                        }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{
                            fontSize: getResponsiveSize(10),
                            color: getStatusColor(activity.bonusPaid)
                          }}
                        >
                          {getStatusText(activity.bonusPaid)}
                        </Text>
                      </View>
                      <Text className="text-green-600 font-semibold text-sm mt-1" style={{ fontSize: getResponsiveSize(12) }}>
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