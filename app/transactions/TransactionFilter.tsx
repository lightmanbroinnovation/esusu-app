import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  TextInputProps,
  TouchableOpacityProps,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filters: FilterOptions) => void;
  activeFilters?: FilterOptions;
}

export interface FilterOptions {
  name?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  transactionType?: 'all' | 'deposit' | 'withdrawal' | 'account_creation';
}

const TransactionFilter: React.FC<FilterProps> = ({ 
  visible, 
  onClose, 
  onApplyFilter, 
  activeFilters = {} 
}) => {
  // Filter states
  const [name, setName] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'all' | 'deposit' | 'withdrawal' | 'account_creation'>('all');

  // Initialize form with active filters
  useEffect(() => {
    if (visible) {
      setName(activeFilters.name || '');
      setMinAmount(activeFilters.minAmount?.toString() || '');
      setMaxAmount(activeFilters.maxAmount?.toString() || '');
      setTransactionType(activeFilters.transactionType || 'all');
    }
  }, [visible, activeFilters]);

  // Clear all filters
  const clearFilters = () => {
    setName('');
    setMinAmount('');
    setMaxAmount('');
    setTransactionType('all');
  };

  // Apply filters and close modal
  const applyFilters = () => {
    const filters: FilterOptions = {};

    if (name.trim()) filters.name = name.trim();
    if (minAmount.trim()) filters.minAmount = Number(minAmount);
    if (maxAmount.trim()) filters.maxAmount = Number(maxAmount);
    if (transactionType !== 'all') filters.transactionType = transactionType;

    console.log('Applying filters:', filters);
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
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter Transactions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Name Filter */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Filter by name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Amount Range Filter */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount Range</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="Min"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={minAmount}
                onChangeText={setMinAmount}
              />
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="Max"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={maxAmount}
                onChangeText={setMaxAmount}
              />
            </View>
          </View>

          {/* Transaction Type Filter */}
          <View style={styles.typeContainer}>
            <Text style={styles.label}>Transaction Type</Text>
            <View style={styles.typeRow}>
              {[
                { label: 'All', value: 'all' },
                { label: 'Deposits', value: 'deposit' },
                { label: 'Withdrawals', value: 'withdrawal' },
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
                    style={[
                      styles.typeButtonText,
                      transactionType === item.value && styles.typeButtonTextActive
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
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

const styles = StyleSheet.create({
  modalContainer: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountInput: {
    flex: 1,
    marginRight: 16,
  },
  typeContainer: {
    marginBottom: 24,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  typeButton: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeButtonInactive: {
    backgroundColor: '#E5E7EB',
  },
  typeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  typeButtonText: {
    color: '#1F2937',
    fontSize: 14,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginRight: 12,
  },
  clearButtonText: {
    textAlign: 'center',
    color: '#1F2937',
    fontWeight: '500',
    fontSize: 16,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  applyButtonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
  },
});

export default TransactionFilter; 