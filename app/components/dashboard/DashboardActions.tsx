/**
 * Dashboard Actions Component
 * Displays quick action buttons for the dashboard
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DashboardActionsProps {
  disabled?: boolean;
}

export const DashboardActions: React.FC<DashboardActionsProps> = ({
  disabled = false
}) => {
  const router = useRouter();

  const actions = [
    {
      id: 'add-contributor',
      title: 'Add Contributor',
      icon: 'person-add-outline',
      color: '#0074FF',
      onPress: () => router.push('/contributor/add')
    },
    {
      id: 'view-contributors',
      title: 'View Contributors',
      icon: 'people-outline',
      color: '#28A745',
      onPress: () => router.push('/contributors')
    },
    {
      id: 'transactions',
      title: 'Transactions',
      icon: 'swap-horizontal-outline',
      color: '#FFC107',
      onPress: () => router.push('/transactions')
    },
    {
      id: 'withdraw',
      title: 'Withdraw',
      icon: 'card-outline',
      color: '#DC3545',
      onPress: () => router.push('/withdrawal')
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={action.onPress}
            disabled={disabled}
            style={[
              styles.actionButton,
              { opacity: disabled ? 0.5 : 1 }
            ]}
          >
            <View 
              style={[
                styles.iconContainer,
                { backgroundColor: `${action.color}20` }
              ]}
            >
              <Ionicons 
                name={action.icon as any} 
                size={24} 
                color={action.color} 
              />
            </View>
            <Text style={styles.actionText}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
});

export default DashboardActions;



