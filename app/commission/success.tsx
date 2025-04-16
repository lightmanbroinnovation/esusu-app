import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
  StyleSheet,
  ImageBackground,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WithdrawalSuccessScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [withdrawAmount, setWithdrawAmount] = useState<string>('0');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
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
  
  const handleGoToDashboard = () => {
    setLoading(true);
    router.push('/dashboard' as any);
  };
  
  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom }
      ]}
    >
      <View style={styles.flex1}>
        <ImageBackground
          source={require("../assets/images/success.png")}
          style={styles.imageBg}
          resizeMode="contain"
        >
          <Image
            source={require("../assets/images/check.png")}
            style={styles.checkImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>
            Withdrawal Successful!
          </Text>
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
        </ImageBackground>
      </View>
      
      {loading ? (
        <View style={styles.loadingButton}>
          <ActivityIndicator color="white" size="small" />
          <Text style={[styles.buttonText, styles.loadingText]}>
            Navigating to Dashboard...
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={handleGoToDashboard}
        >
          <Text style={styles.buttonText}>
            Go to Dashboard
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16
  },
  flex1: {
    flex: 1,
    alignItems: 'center'
  },
  imageBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 460
  },
  checkImage: {
    width: 112,
    height: 112,
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0072CE',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4B5563',
    marginBottom: 24,
    paddingHorizontal: 16
  },
  detailsCard: {
    width: '90%',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    marginTop: 8
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusText: {
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  button: {
    backgroundColor: '#0072CE',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24
  },
  loadingButton: {
    backgroundColor: '#0072CE',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  loadingText: {
    marginLeft: 8
  }
});

export default WithdrawalSuccessScreen; 