/**
 * Dashboard Header Component
 * Displays user information and account summary
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/user';

interface DashboardHeaderProps {
  user: User;
  accountData: any;
  onRefresh: () => void;
  refreshing: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  accountData,
  onRefresh,
  refreshing
}) => {
  return (
    <View style={styles.container}>
      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.userLeft}>
          {user.userImg ? (
            <Image
              source={{ uri: user.userImg }}
              style={styles.userImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.userImagePlaceholder}>
              <Ionicons name="person" size={24} color="#666" />
            </View>
          )}
          <View>
            <Text style={styles.userName}>
              {user.firstname} {user.lastname}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={onRefresh}
          disabled={refreshing}
          style={styles.refreshButton}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={refreshing ? "#999" : "#0074FF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Account Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text style={styles.summaryValue}>
            ₦{parseFloat(user.balance || '0').toLocaleString()}
          </Text>
        </View>
        
        <View style={[styles.summaryItem, styles.summaryItemRight]}>
          <Text style={styles.summaryLabel}>Weekly Earnings</Text>
          <Text style={styles.summaryValueGreen}>
            ₦{parseFloat(user.weeklyEarnings || '0').toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Account Data */}
      {accountData && (
        <View style={styles.accountDataSection}>
          <View style={styles.accountDataRow}>
            <View style={styles.accountDataItem}>
              <Text style={styles.accountDataLabel}>Total Contributors</Text>
              <Text style={styles.accountDataValue}>
                {accountData.totalContributors || 0}
              </Text>
            </View>
            <View style={[styles.accountDataItem, styles.accountDataItemRight]}>
              <Text style={styles.accountDataLabel}>Active Groups</Text>
              <Text style={styles.accountDataValue}>
                {accountData.activeGroups || 0}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 48,
    height: 48,
    borderRadius: 999,
    marginRight: 12,
  },
  userImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryItemRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryValueGreen: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  accountDataSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  accountDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accountDataItem: {
    flex: 1,
  },
  accountDataItemRight: {
    alignItems: 'flex-end',
  },
  accountDataLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  accountDataValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});

export default DashboardHeader;



