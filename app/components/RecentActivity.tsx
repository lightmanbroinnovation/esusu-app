import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';

interface RecentActivityProps {
  onVerifyNow?: () => void;
  onViewAllActivity?: () => void;
  transactionHistory?: any[];
  hideKybBanner?: boolean;
  showVerificationNotification?: boolean;
}

const RecentActivity = ({ onVerifyNow, onViewAllActivity, transactionHistory = [], hideKybBanner, showVerificationNotification }: RecentActivityProps) => {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      {/* KYB Banner */}
      {!hideKybBanner && (
        <View style={styles.bannerContainer}>
          <View style={styles.kybBanner}>
            {/* Decorative elements */}
            <View style={styles.decorativeElement1}>
              <FontAwesome name="circle-thin" size={8} color="#444" />
            </View>
            <View style={styles.decorativeElement2}>
              <FontAwesome name="circle-thin" size={12} color="#444" />
            </View>
            <View style={styles.decorativeElement3}>
              <View style={{width: 8, height: 8, backgroundColor: '#444', transform: [{rotate: '45deg'}]}} />
            </View>
            <View style={styles.decorativeElement4}>
              <View style={{width: 12, height: 2, backgroundColor: '#444'}} />
            </View>
            <View style={styles.decorativeElement5}>
              <View style={{width: 6, height: 6, borderRadius: 3, backgroundColor: '#444'}} />
            </View>

            <View style={styles.kybBannerContent}>
              <Text style={styles.kybBannerTitle}>Complete Your Verification</Text>
              <Text style={styles.kybBannerText}>
                Ensure you verify your business and identity. This ensures security and trust for all contributors.
              </Text>
              <TouchableOpacity 
                style={styles.verifyButton}
                onPress={() => {
                  if (onVerifyNow) {
                    onVerifyNow();
                  }
                }}
              >
                <Text style={styles.verifyButtonText}>Verify Now</Text>
              </TouchableOpacity>
            </View>
            
            {/* Green checkmark */}
            <View style={styles.checkmarkContainer}>
              <FontAwesome name="check" size={30} color="white" />
            </View>
          </View>
        </View>
      )}

      {/* Verification Required Notification */}
      {showVerificationNotification && (
        <View style={styles.bannerContainer}>
          <View style={styles.verificationBanner}>
            {/* Decorative elements */}
            <View style={styles.decorativeElement1}>
              <FontAwesome name="exclamation-triangle" size={8} color="#fff" />
            </View>
            <View style={styles.decorativeElement2}>
              <FontAwesome name="exclamation-triangle" size={12} color="#fff" />
            </View>

            <View style={styles.kybBannerContent}>
              <Text style={styles.kybBannerTitle}>Verification Required</Text>
              <Text style={styles.verificationBannerText}>
                You must verify your personal information before you can continue. Please complete your verification to access all features.
              </Text>
              <TouchableOpacity 
                style={styles.verifyButton}
                onPress={() => {
                  if (onVerifyNow) {
                    onVerifyNow();
                  }
                }}
              >
                <Text style={styles.verifyButtonText}>Verify Now</Text>
              </TouchableOpacity>
            </View>
            
            {/* Warning icon */}
            <View style={styles.warningIconContainer}>
              <FontAwesome name="exclamation-triangle" size={30} color="#f97316" />
            </View>
          </View>
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.transactionsContainer}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Recent Activity</Text>
          <TouchableOpacity 
            onPress={onViewAllActivity}
            disabled={showVerificationNotification}
            style={{ opacity: showVerificationNotification ? 0.5 : 1 }}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {transactionHistory.length > 0 ? (
          <View>
            {transactionHistory.map((transaction, index) => {
              // Format the date properly
              const transactionDate = transaction.date ? new Date(transaction.date) : new Date();
              const formattedDate = transactionDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
              
              // Determine transaction type and icon
              const isDeposit = transaction.type === 'deposit' || transaction.type === 'commission';
              const iconName = isDeposit ? 'arrow-down' : 'arrow-up';
              const amountColor = isDeposit ? '#16A34A' : '#DC2626';
              const amountPrefix = isDeposit ? '+' : '-';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.transactionItem, index > 0 && { marginTop: 12 }]}
                  onPress={() => {
                    // Navigate to receipt page with transaction data
                    router.push({
                      pathname: '/receipt',
                      params: {
                        transaction: JSON.stringify(transaction),
                      },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionContent}>
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: isDeposit ? '#10B981' : '#EF4444' }
                    ]}>
                      <Ionicons 
                        name={iconName} 
                        size={20} 
                        color="white" 
                      />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionName} numberOfLines={1} ellipsizeMode="tail">
                        {transaction.name && transaction.name.length > 20 
                          ? `${transaction.name.substring(0, 20)}...` 
                          : transaction.name || 'Transaction'
                        }
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formattedDate}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.transactionAmount, { color: amountColor }]}>
                    {amountPrefix}₦{Number(Math.abs(transaction.amount || 0)).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyTransactions}>
            <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTransactionsText}>No recent transactions</Text>
          </View>
        )}
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  bannerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  kybBanner: {
    backgroundColor: '#000000',
    padding: 24,
    position: 'relative',
  },
  decorativeElement1: {
    position: 'absolute',
    top: 12,
    right: 40,
  },
  decorativeElement2: {
    position: 'absolute',
    top: 32,
    right: 16,
  },
  decorativeElement3: {
    position: 'absolute',
    top: 16,
    right: 80,
  },
  decorativeElement4: {
    position: 'absolute',
    bottom: 40,
    right: 112,
  },
  decorativeElement5: {
    position: 'absolute',
    bottom: 80,
    right: 40,
  },
  kybBannerContent: {
    flex: 1,
    paddingRight: 80,
  },
  kybBannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kybBannerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  verificationBannerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  verifyButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#10B981',
    borderRadius: 999,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  verificationBanner: {
    backgroundColor: '#F97316',
    padding: 24,
    position: 'relative',
  },
  warningIconContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  transactionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewAllText: {
    color: '#0052CC',
    fontWeight: '500',
  },
  transactionsList: {
    // Gap will be handled by marginBottom on items
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontWeight: '500',
    color: '#111827',
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionAmount: {
    fontWeight: 'bold',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTransactionsText: {
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default RecentActivity;
