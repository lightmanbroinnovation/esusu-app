import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
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
      <View className="flex-1 bg-black bg-opacity-50 justify-end">
        <View className="bg-white rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold">Filter Transactions</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Name Filter */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Name</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3"
              placeholder="Filter by name"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Amount Range Filter */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2">Amount Range</Text>
            <View className="flex-row space-x-4">
              <TextInput
                className="border border-gray-300 rounded-lg p-3 flex-1"
                placeholder="Min"
                keyboardType="numeric"
                value={minAmount}
                onChangeText={setMinAmount}
              />
              <TextInput
                className="border border-gray-300 rounded-lg p-3 flex-1"
                placeholder="Max"
                keyboardType="numeric"
                value={maxAmount}
                onChangeText={setMaxAmount}
              />
            </View>
          </View>

          {/* Transaction Type Filter */}
          <View className="mb-6">
            <Text className="text-gray-700 mb-2">Transaction Type</Text>
            <View className="flex-row flex-wrap">
              {[
                { label: 'All', value: 'all' },
                { label: 'Deposits', value: 'deposit' },
                { label: 'Withdrawals', value: 'withdrawal' },
                { label: 'New Accounts', value: 'account_creation' }
              ].map(item => (
                <TouchableOpacity
                  key={item.value}
                  className={`mr-2 mb-2 px-4 py-2 rounded-full ${
                    transactionType === item.value ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                  onPress={() => setTransactionType(item.value as any)}
                >
                  <Text
                    className={`${
                      transactionType === item.value ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-4">
            <TouchableOpacity
              className="flex-1 py-3 border border-gray-300 rounded-lg"
              onPress={clearFilters}
            >
              <Text className="text-center font-medium">Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 bg-blue-500 rounded-lg"
              onPress={applyFilters}
            >
              <Text className="text-white text-center font-medium">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TransactionFilter; 