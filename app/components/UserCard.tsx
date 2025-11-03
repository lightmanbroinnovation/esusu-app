import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, ActivityIndicator, Alert, Clipboard, Dimensions, StyleSheet } from 'react-native';
import { MaterialIcons, Ionicons } from "@expo/vector-icons"; // Import icons from @expo/vector-icons
import { useRouter } from 'expo-router';
// import { getBankAccount } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../context/NotificationContext';

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
  const { unreadCount } = useNotifications();

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

  const handleNotificationPress = () => {
    router.push('/notifications');
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

  const styles = StyleSheet.create({
    cardContainer: {
      backgroundColor: '#0052CC',
      borderRadius: 16,
      paddingHorizontal: getResponsiveSize(16),
      paddingVertical: 20,
      marginTop: 16,
      position: 'relative',
      overflow: 'hidden',
    },
    backgroundImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      opacity: 0.3,
      borderRadius: getResponsiveSize(16),
    },
    content: {
      zIndex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    userInfo: {
      flex: 1,
    },
    greeting: {
      color: '#FFFFFF',
    },
    userName: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    notificationBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: '#EF4444',
      borderRadius: 999,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    notificationBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    balanceSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    balanceItem: {
      flex: 1,
    },
    balanceItemRight: {
      alignItems: 'flex-end',
    },
    balanceLabel: {
      color: '#FFFFFF',
      marginBottom: 8,
    },
    balanceValue: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    commissionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    commissionText: {
      color: '#16A34A',
      fontWeight: 'bold',
      marginLeft: 4,
    },
    accountSection: {
      marginTop: 16,
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    accountLabel: {
      color: '#FFFFFF',
    },
    accountValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    accountValue: {
      color: '#FFFFFF',
      marginRight: 8,
    },
    actionButtonsRow: {
      flexDirection: 'row',
      marginTop: 16,
    },
    depositButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000000',
      borderRadius: 8,
    },
    withdrawButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#00B0FF',
      borderRadius: 8,
      marginLeft: getResponsiveSize(8),
    },
    buttonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#0072CE',
      marginBottom: 16,
    },
    modalDivider: {
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      marginBottom: 16,
    },
    modalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalRowLast: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalIconContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    modalFieldContainer: {
      flex: 1,
    },
    modalFieldLabel: {
      color: '#6B7280',
    },
    modalFieldValue: {
      color: '#111827',
      fontWeight: '600',
    },
    modalCloseButton: {
      marginTop: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      backgroundColor: '#2563EB',
      paddingVertical: 12,
      borderRadius: 16,
    },
    closeButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      textAlign: 'center',
      width: '100%',
    },
  });

  return (
    <>
      <View style={[styles.cardContainer, { paddingHorizontal: getResponsiveSize(16) }]}>
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
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
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
              <View style={styles.userInfo}>
                <Text style={[styles.greeting, { fontSize: getResponsiveSize(18) }]}>Hi, 👋</Text>
                <Text style={[styles.userName, { fontSize: getResponsiveSize(24) }]} numberOfLines={1} ellipsizeMode="tail">
                  {user.firstname}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={handleNotificationPress} style={{ position: 'relative' }}>
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
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Balance Section */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { fontSize: getResponsiveSize(12) }]}>Total Balance</Text>
              <Text style={[styles.balanceValue, { fontSize: getResponsiveSize(28) }]} numberOfLines={1}>
                {balance ? `₦${balance}` : ''}
              </Text>
            </View>
            <View style={[styles.balanceItem, styles.balanceItemRight]}>
              <Text style={[styles.balanceLabel, { fontSize: getResponsiveSize(12) }]}>Commission</Text>
              <View style={styles.commissionBadge}>
                <Ionicons name="arrow-up" size={getResponsiveSize(14)} color="green" />
                <Text style={[styles.commissionText, { fontSize: getResponsiveSize(12) }]}>
                  {commission ? `₦${commission}` : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Account Number Section */}
          <View style={styles.accountSection}>
            <View style={styles.accountRow}>
              <Text style={[styles.accountLabel, { fontSize: getResponsiveSize(14) }]}>Account Number</Text>
              <TouchableOpacity 
                onPress={handleShowAccountDetails}
                style={styles.accountValueRow}
              >
                <Text style={[styles.accountValue, { fontSize: getResponsiveSize(14) }]} numberOfLines={1}>
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
          <View style={[styles.actionButtonsRow, { gap: getResponsiveSize(8) }]}>
            <TouchableOpacity 
              style={[
                styles.depositButton,
                { 
                  paddingVertical: getResponsiveSize(12),
                  opacity: disabled ? 0.5 : 1
                }
              ]}
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
              <Text style={[styles.buttonText, { fontSize: getResponsiveSize(16) }]}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.withdrawButton,
                { 
                  paddingVertical: getResponsiveSize(12),
                  opacity: disabled ? 0.5 : 1
                }
              ]}
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
              <Text style={[styles.buttonText, { fontSize: getResponsiveSize(16) }]}>Withdraw</Text>
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
            width: width * 0.9,
            maxWidth: 400,
            padding: getResponsiveSize(24)
          }]}>
            <Text style={[styles.modalTitle, { fontSize: getResponsiveSize(24) }]}>Account Details</Text>
            <View style={styles.modalDivider}></View>

            <View style={styles.modalRow}>
              <View style={[styles.modalIconContainer, {
                width: getResponsiveSize(40),
                height: getResponsiveSize(40),
                borderRadius: getResponsiveSize(20),
                backgroundColor: '#E3F2FD',
              }]}>
                <Ionicons name="business" size={getResponsiveSize(24)} color="#0072CE" />
              </View>
              <View style={styles.modalFieldContainer}>
                <Text style={[styles.modalFieldLabel, { fontSize: getResponsiveSize(14) }]}>Bank Name</Text>
                <Text style={[styles.modalFieldValue, { fontSize: getResponsiveSize(18) }]} numberOfLines={1}>
                  {bankName}
                </Text>
              </View>
              <TouchableOpacity 
                style={{ marginLeft: 'auto' }}
                onPress={() => copyToClipboard(bankName)}
              >
                <Ionicons name="copy-outline" size={getResponsiveSize(20)} color="#9B9B9B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalRow}>
              <View style={[styles.modalIconContainer, {
                width: getResponsiveSize(40),
                height: getResponsiveSize(40),
                borderRadius: getResponsiveSize(20),
                backgroundColor: '#E3F2FD',
              }]}>
                <Ionicons name="keypad-outline" size={getResponsiveSize(24)} color="#0072CE" />
              </View>
              <View style={styles.modalFieldContainer}>
                <Text style={[styles.modalFieldLabel, { fontSize: getResponsiveSize(14) }]}>Account Number</Text>
                <Text style={[styles.modalFieldValue, { fontSize: getResponsiveSize(18) }]} numberOfLines={1}>
                  {accountNumber}
                </Text>
              </View>
              <TouchableOpacity 
                style={{ marginLeft: 'auto' }}
                onPress={() => copyToClipboard(accountNumber)}
              >
                <Ionicons name="copy-outline" size={getResponsiveSize(20)} color="#9B9B9B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalRowLast}>
              <View style={[styles.modalIconContainer, {
                width: getResponsiveSize(40),
                height: getResponsiveSize(40),
                borderRadius: getResponsiveSize(20),
                backgroundColor: '#E3F2FD',
              }]}>
                <Ionicons name="person" size={getResponsiveSize(24)} color="#0072CE" />
              </View>
              <View style={styles.modalFieldContainer}>
                <Text style={[styles.modalFieldLabel, { fontSize: getResponsiveSize(14) }]}>Account Name</Text>
                <Text style={[styles.modalFieldValue, { 
                  fontSize: getResponsiveSize(18),
                  flexShrink: 1
                }]} numberOfLines={2}>
                  {accountName}
                </Text>
              </View>
              <TouchableOpacity 
                style={{ marginLeft: 'auto' }}
                onPress={() => copyToClipboard(accountName)}
              >
                <Ionicons name="copy-outline" size={getResponsiveSize(20)} color="#9B9B9B" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalCloseButton}>
              <TouchableOpacity
                style={[styles.closeButton, {
                  paddingVertical: getResponsiveSize(12),
                  width: '40%',
                }]}
                onPress={() => setShowAccountDetailsModal(false)}
              >
                <Text style={[styles.closeButtonText, { fontSize: getResponsiveSize(18) }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default UserCard;
