import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import type { Bank as BankType } from '../types';

interface Bank extends BankType {
  bankCode?: string;
}

interface BankCardProps {
  bank: Bank;
  isPrimary?: boolean;
  onPress: () => void;
}

export default function BankCard({ bank, isPrimary, onPress }: { bank: Bank; isPrimary?: boolean; onPress: () => void }) {
  // Helper function to get bank logo based on bank name
  const getBankLogo = (bankName: string) => {
    const name = bankName?.toLowerCase() || '';
    // Using project's asset images for common banks
    if (name.includes('first bank') || name.includes('firstbank')) {
      return require('../../assets/images/icon.png'); // Replace with actual First Bank logo
    } else if (name.includes('uba')) {
      return require('../../assets/images/icon.png'); // Replace with actual UBA logo
    } else if (name.includes('zenith')) {
      return require('../../assets/images/icon.png'); // Replace with actual Zenith Bank logo
    } else if (name.includes('gtb') || name.includes('guaranty')) {
      return require('../../assets/images/icon.png'); // Replace with actual GTBank logo
    } else {
      // Default bank icon
      return require('../../assets/images/icon.png');
    }
  };

  // Format account number to display only last 4 digits if needed
  const formatAccountNumber = (accNum: string) => {
    if (accNum && accNum.length >= 10) {
      return accNum;
    }
    return accNum;
  };

  return (
    <Pressable 
      onPress={onPress} 
      style={styles.container}
    >
      {/* Bank Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={getBankLogo(bank.bankName || bank.bankCode || 'Unknown Bank')}
          style={styles.logo}
          resizeMode="cover"
        />
      </View>
      {/* Bank Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.bankName}>{bank.bankName || bank.bankCode || 'Unknown Bank'}</Text>
        <Text style={styles.accountNumber}>{bank.accountNumber || 'N/A'}</Text>
        <Text style={styles.accountName}>{bank.accountName || 'N/A'}</Text>
      </View>
      {/* Default Badge */}
      {isPrimary && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>Default</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  logo: {
    width: 56,
    height: 56,
  },
  infoContainer: {
    flex: 1,
  },
  bankName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#111827',
    marginBottom: 4,
  },
  accountNumber: {
    color: '#374151',
    fontSize: 16,
    marginBottom: 4,
    letterSpacing: 1.5,
  },
  accountName: {
    color: '#6B7280',
    fontSize: 16,
  },
  defaultBadge: {
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: '#0074FF',
    fontSize: 12,
    fontWeight: '600',
  },
});
