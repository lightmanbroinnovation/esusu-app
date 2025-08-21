import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, ActivityIndicator, Alert, Clipboard, Dimensions } from 'react-native';
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icons from @expo/vector-icons
import { useRouter } from 'expo-router';
import { getBankAccount } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  firstname: string;
  email: string;
  id: string;
  userImg?: string; // Add user image property
  balance: string;
  weeklyEarnings: string;
  bankName?: string; // New: Bank Name
  accountNumber?: string; // New: Account Number
  beneficiaryName?: string; // New: Beneficiary Name
}

interface UserCardProps {
  user: User;
  accountData?: any;
  disabled?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ user, accountData, disabled = false }) => {
  const router = useRouter();
  const [showAccountDetailsModal, setShowAccountDetailsModal] = useState(false);
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

  const handleDeposit = () => {
    router.push('/deposit');
  };

  const handleWithdraw = () => {
    router.push('../../withdrawal');
  };

  const handleShowAccountDetails = () => {
    setShowAccountDetailsModal(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert('Copied!', 'Text copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  // Extract account details from accountData (merchant dashboard account)
  let accountName = accountData?.accountName || '';
  let accountNumber = accountData?.accountNumber || '';
  let bankName = accountData?.bankName || 'SafeHaven MFB';
  let balance = accountData?.balance ?? '';
  let commission = accountData?.commission ?? '';

  // Only use settlement accounts if the main account data is missing
  if ((!accountName || !accountNumber) && Array.isArray(accountData?.settlementAccounts) && accountData.settlementAccounts.length > 0) {
    const primaryAccount = accountData.settlementAccounts.find(
      (acc: any) => acc && acc.accountName && acc.accountNumber
    );
    if (primaryAccount) {
      if (!accountName) accountName = primaryAccount.accountName;
      if (!accountNumber) accountNumber = primaryAccount.accountNumber;
      bankName = primaryAccount.bankName || bankName;
    }
  }

  return (
    <>
      <View className="bg-[#0052CC] rounded-2xl px-4 py-[20px] mt-4 relative overflow-hidden" style={{ paddingHorizontal: getResponsiveSize(16) }}>
        {/* Background Image */}
        <Image
          source={require('../assets/images/Onboarding1.png')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            opacity: 0.3,
            borderRadius: getResponsiveSize(16)
          }}
          resizeMode="cover"
        />
        
        {/* Content */}
        <View style={{ zIndex: 1 }}>
          {/* Header Section */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              {user.userImg ? (
                <Image
                  source={{ uri: user.userImg }}
                  style={{ 
                    width: getResponsiveSize(40), 
                    height: getResponsiveSize(40), 
                    borderRadius: getResponsiveSize(20),
                    marginRight: getResponsiveSize(8)
                  }}
                />
              ) : (
                <View style={{
                  width: getResponsiveSize(40),
                  height: getResponsiveSize(40),
                  borderRadius: getResponsiveSize(20),
                  backgroundColor: '#0072CE',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: getResponsiveSize(8)
                }}>
                  <Text style={{
                    fontSize: getResponsiveSize(18),
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    {user.firstname ? user.firstname.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-white" style={{ fontSize: getResponsiveSize(18) }}>Hi, 👋</Text>
                <Text className="text-white font-bold" style={{ fontSize: getResponsiveSize(24) }} numberOfLines={1} ellipsizeMode="tail">
                  {user.firstname}
                </Text>
              </View>
            </View>
            
            <Ionicons
              style={{
                borderWidth: 1,
                borderRadius: getResponsiveSize(12),
                padding: getResponsiveSize(4),
                borderColor: '#fff'
              }}
              name="notifications-outline"
              size={getResponsiveSize(24)}
              color={"#fff"}
            />
          </View>

          {/* Balance Section */}
          <View className="flex-row justify-between mt-4">
            <View className="flex-1">
              <Text className="text-white mb-2" style={{ fontSize: getResponsiveSize(12) }}>Total Balance</Text>
              <Text className="text-white font-bold" style={{ fontSize: getResponsiveSize(28) }} numberOfLines={1}>
                {balance ? `₦${balance}` : ''}
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-white mb-2" style={{ fontSize: getResponsiveSize(12) }}>Commission</Text>
              <View className="flex-row items-center bg-white rounded-full px-2 py-0.5">
                <Ionicons name="arrow-up" size={getResponsiveSize(14)} color="green" />
                <Text className="text-green-600 font-bold ml-1" style={{ fontSize: getResponsiveSize(12) }}>
                  {commission ? `₦${commission}` : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Account Number Section */}
          <View className="mt-4">
            <View className='flex-row items-center justify-between'>
              <Text className='text-white' style={{ fontSize: getResponsiveSize(14) }}>Account Number</Text>
              <TouchableOpacity 
                onPress={handleShowAccountDetails}
                className='flex-row items-center'
              >
                <Text className='text-white mr-2' style={{ fontSize: getResponsiveSize(14) }} numberOfLines={1}>
                  {accountNumber ? `${accountNumber.slice(0, 4)}...${accountNumber.slice(-4)}` : ''}
                </Text>
                <View style={{
                  width: getResponsiveSize(20),
                  height: getResponsiveSize(20),
                  borderRadius: getResponsiveSize(10),
                  borderWidth: 1,
                  borderColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ionicons name='information' size={getResponsiveSize(16)} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row mt-4" style={{ gap: getResponsiveSize(8) }}>
            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center bg-black rounded-lg"
              style={{ 
                paddingVertical: getResponsiveSize(12),
                opacity: disabled ? 0.5 : 1
              }}
              onPress={handleDeposit}
              disabled={disabled}
            >
              <View style={{
                width: getResponsiveSize(24),
                height: getResponsiveSize(24),
                borderRadius: getResponsiveSize(12),
                borderWidth: 1,
                borderColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: getResponsiveSize(8)
              }}>
                <Ionicons name="add" size={getResponsiveSize(20)} color="#fff" />
              </View>
              <Text className="text-white font-semibold" style={{ fontSize: getResponsiveSize(16) }}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center bg-[#00B0FF] rounded-lg"
              style={{ 
                paddingVertical: getResponsiveSize(12),
                opacity: disabled ? 0.5 : 1
              }}
              onPress={handleWithdraw}
              disabled={disabled}
            >
              <View style={{
                width: getResponsiveSize(24),
                height: getResponsiveSize(24),
                borderRadius: getResponsiveSize(12),
                borderWidth: 1,
                borderColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: getResponsiveSize(8)
              }}>
                <Ionicons name="remove" size={getResponsiveSize(20)} color="#fff" />
              </View>
              <Text className="text-white font-semibold" style={{ fontSize: getResponsiveSize(16) }}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Account Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAccountDetailsModal}
        onRequestClose={() => setShowAccountDetailsModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-2xl shadow-lg" style={{ 
            width: width * 0.9,
            maxWidth: 400,
            padding: getResponsiveSize(24)
          }}>
            <Text className="text-2xl font-bold text-[#0072CE] mb-4" style={{ fontSize: getResponsiveSize(24) }}>Account Details</Text>
            <View className="border-b border-gray-200 mb-4"></View>

                <View className="flex-row items-center mb-4">
                  <View style={{
                    width: getResponsiveSize(40),
                    height: getResponsiveSize(40),
                    borderRadius: getResponsiveSize(20),
                    backgroundColor: '#E3F2FD',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: getResponsiveSize(12)
                  }}>
                    <Ionicons name="business" size={getResponsiveSize(24)} color="#0072CE" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500" style={{ fontSize: getResponsiveSize(14) }}>Bank Name</Text>
                    <Text className="text-primaryText font-semibold" style={{ fontSize: getResponsiveSize(18) }} numberOfLines={1}>
                  {bankName}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    className="ml-auto"
                onPress={() => copyToClipboard(bankName)}
                  >
                    <Ionicons name="copy-outline" size={getResponsiveSize(20)} color="#9B9B9B" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center mb-4">
                  <View style={{
                    width: getResponsiveSize(40),
                    height: getResponsiveSize(40),
                    borderRadius: getResponsiveSize(20),
                    backgroundColor: '#E3F2FD',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: getResponsiveSize(12)
                  }}>
                    <Ionicons name="keypad-outline" size={getResponsiveSize(24)} color="#0072CE" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500" style={{ fontSize: getResponsiveSize(14) }}>Account Number</Text>
                    <Text className="text-primaryText font-semibold" style={{ fontSize: getResponsiveSize(18) }} numberOfLines={1}>
                  {accountNumber}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    className="ml-auto"
                onPress={() => copyToClipboard(accountNumber)}
                  >
                    <Ionicons name="copy-outline" size={getResponsiveSize(20)} color="#9B9B9B" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center mb-6">
                  <View style={{
                    width: getResponsiveSize(40),
                    height: getResponsiveSize(40),
                    borderRadius: getResponsiveSize(20),
                    backgroundColor: '#E3F2FD',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: getResponsiveSize(12)
                  }}>
                    <Ionicons name="person" size={getResponsiveSize(24)} color="#0072CE" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500" style={{ fontSize: getResponsiveSize(14) }}>Account Name</Text>
                    <Text className="text-primaryText font-semibold" style={{ 
                      fontSize: getResponsiveSize(18),
                      flexShrink: 1
                    }} numberOfLines={2}>
                  {accountName}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    className="ml-auto"
                onPress={() => copyToClipboard(accountName)}
                  >
                    <Ionicons name="copy-outline" size={getResponsiveSize(20)} color="#9B9B9B" />
                  </TouchableOpacity>
                </View>

            <TouchableOpacity
              className="bg-blue-600 py-3 rounded-2xl absolute -bottom-[16px] left-[30%] w-2/6 text-center"
              style={{ 
                paddingVertical: getResponsiveSize(12),
                width: '40%',
                left: '30%'
              }}
              onPress={() => setShowAccountDetailsModal(false)}
            >
              <Text className="text-white font-semibold text-center w-full" style={{ fontSize: getResponsiveSize(18) }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default UserCard;
