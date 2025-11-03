import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  name?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  transactionType?: 'all' | 'credit' | 'withdrawn' | 'account_creation' ;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  textInputFlex: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
  },
  amountInputSpacer: {
    marginLeft: 16,
  },
  transactionTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeButton: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  typeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  typeButtonInactive: {
    backgroundColor: '#E5E7EB',
  },
  typeText: {
    color: '#1F2937',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionButtonSpacer: {
    marginLeft: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  clearButtonText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
});

const TransactionFilter: React.FC<FilterProps> = ({ visible, onClose, onApplyFilter }) => {
  // Filter states
  const [name, setName] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'all' | 'credit' | 'withdrawn' | 'account_creation'>('all');

  // Clear all filters
  const clearFilters = () => {
    setName('');
    setMinAmount('');
    setMaxAmount('');
    setTransactionType('all');
  };

  // Apply filters and close modal
  const applyFilters = () => {
    const filters: FilterOptions = {
      transactionType: transactionType !== 'all' ? transactionType : undefined
    };

    if (name) filters.name = name;
    if (minAmount) filters.minAmount = Number(minAmount);
    if (maxAmount) filters.maxAmount = Number(maxAmount);

    onApplyFilter(filters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Transactions</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Name Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Filter by name"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Amount Range Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Amount Range</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={styles.textInputFlex}
                placeholder="Min"
                keyboardType="numeric"
                value={minAmount}
                onChangeText={setMinAmount}
              />
              <TextInput
                style={[styles.textInputFlex, styles.amountInputSpacer]}
                placeholder="Max"
                keyboardType="numeric"
                value={maxAmount}
                onChangeText={setMaxAmount}
              />
            </View>
          </View>

          {/* Transaction Type Filter */}
          <View style={[styles.filterGroup, { marginBottom: 24 }]}>
            <Text style={styles.filterLabel}>Transaction Type</Text>
            <View style={styles.transactionTypeRow}>
              {[
                { label: 'All', value: 'all' },
                { label: 'Credit', value: 'credit' },
                { label: 'Withdrawn', value: 'withdrawn' },
                { label: 'New Accounts', value: 'account_creation' }
              ].map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.typeButton,
                    transactionType === item.value ? styles.typeButtonActive : styles.typeButtonInactive
                  ]}
                  onPress={() => setTransactionType(item.value as any)}
                >
                  <Text
                    style={transactionType === item.value ? styles.typeTextActive : styles.typeText}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, styles.actionButtonSpacer]}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TransactionFilter; 