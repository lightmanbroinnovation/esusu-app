import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Linking,
  Image,
  StyleSheet
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const WithdrawalSuccessScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [withdrawAmount, setWithdrawAmount] = useState<string>('0');
  const [transactionDate, setTransactionDate] = useState<string>('');
  
  useEffect(() => {
    const getWithdrawalAmount = async () => {
      try {
        // Get withdrawal amount from AsyncStorage
        const amount = await AsyncStorage.getItem('withdrawAmount');
        if (amount) {
          setWithdrawAmount(amount);
          // Clear the stored amount after retrieving
          await AsyncStorage.removeItem('withdrawAmount');
        }
        
        // Set current date as transaction date
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        setTransactionDate(formattedDate);
      } catch (error) {
        console.error('Error getting withdrawal data:', error);
      }
    };
    
    getWithdrawalAmount();
  }, []);
  
  const handleGoToCommission = () => {
    router.push('/commission' as any);
  };
  
  const handleGoHome = () => {
    router.push('/dashboard' as any);
  };
  
  return (
    <View 
      style={[
        styles.container, 
        { paddingTop: insets.top, paddingBottom: insets.bottom }
      ]}
    >
      <View style={styles.confettiBackground}>
        {/* Light blue squiggle (top left) */}
        <View style={[styles.confettiItem, styles.squiggle, { top: 20, left: 10 }]} />
        
        {/* Red triangle (center) */}
        <View style={[styles.confettiItem, styles.triangle, { top: '33%', right: '33%' }]} />
        
        {/* Purple dash (top right) */}
        <View style={[styles.confettiItem, styles.dash, { top: '25%', right: 10 }]} />
        
        {/* Green circle (center) */}
        <View style={[styles.confettiItem, styles.circle, { bottom: '33%', left: '25%' }]} />
        
        {/* Yellow dash (bottom) */}
        <View style={[styles.confettiItem, styles.yellowDash, { bottom: '25%', right: '25%' }]} />
      </View>
      
      {/* Success Checkmark */}
      <View style={styles.checkContainer}>
        <MaterialIcons name="check" size={70} color="white" />
      </View>
      
      {/* Success Text */}
      <Text style={styles.title}>Withdrawal Successful!</Text>
      <Text style={styles.subtitle}>
        Your commission has been sent to your bank account.
      </Text>
      
      {/* Transaction Details */}
      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>₦{Number(withdrawAmount).toLocaleString()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{transactionDate}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={[styles.detailValue, styles.statusText]}>Complete</Text>
        </View>
      </View>
      
      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleGoToCommission}
        >
          <Text style={styles.primaryButtonText}>Commission Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleGoHome}
        >
          <Text style={styles.secondaryButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confettiBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiItem: {
    position: 'absolute',
  },
  squiggle: {
    width: 40,
    height: 60,
    backgroundColor: '#BFDBFE', // blue-200
    borderRadius: 30,
    transform: [{ rotate: '45deg' }],
  },
  triangle: {
    width: 32,
    height: 32,
    backgroundColor: '#F87171', // red-400
    transform: [{ rotate: '45deg' }],
  },
  dash: {
    width: 24,
    height: 8,
    backgroundColor: '#D8B4FE', // purple-300
    borderRadius: 4,
  },
  circle: {
    width: 32,
    height: 32,
    backgroundColor: '#A7F3D0', // green-200
    borderRadius: 16,
  },
  yellowDash: {
    width: 16,
    height: 12,
    backgroundColor: '#FDE68A', // yellow-300
    borderRadius: 6,
  },
  checkContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#4ADE80', // green-400
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563EB', // blue-600
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563', // gray-700
    textAlign: 'center',
    marginBottom: 30,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#F3F4F6', // gray-100
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280', // gray-500
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827', // gray-900
  },
  statusText: {
    color: '#10B981', // emerald-500
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB', // gray-200
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB', // blue-600
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
  },
  secondaryButtonText: {
    color: '#4B5563', // gray-700
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WithdrawalSuccessScreen; 