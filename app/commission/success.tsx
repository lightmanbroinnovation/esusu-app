import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

const { width, height } = Dimensions.get('window');

export default function WithdrawalSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [networkAvailable, setNetworkAvailable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const handleGoToDashboard = () => {
    router.replace('/dashboard');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
      {/* Confetti background as image */}
      <Image
        source={require('../assets/images/success.png')}
        style={styles.confettiBg}
        resizeMode="cover"
      />
      {/* Checkmark in green circle as image */}
      <View style={styles.checkContainer}>
        <Image
          source={require('../assets/images/check.png')}
          style={styles.checkImage}
          resizeMode="contain"
        />
      </View>
      {/* Title */}
      <Text style={styles.successTitle}>Withdrawal Successful!</Text>
      {/* Subtitle */}
      <Text style={styles.successSubtitle}>
        Your commission has been sent to your bank account.
      </Text>
      {!networkAvailable && (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>
          You are offline. Some features may be unavailable.
        </Text>
      )}
      {/* Go to Dashboard Button */}
      <TouchableOpacity style={styles.button} onPress={handleGoToDashboard}>
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  confettiBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 0,
  },
  checkContainer: {
    marginTop: 120,
    marginBottom: 32,
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  checkImage: {
    width: 140,
    height: 140,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0A369D',
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 12,
    zIndex: 2,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#22223B',
    textAlign: 'center',
    marginHorizontal: 24,
    marginBottom: 40,
    fontWeight: '400',
    zIndex: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '85%',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 32,
    position: 'absolute',
    bottom: 40,
    left: '7.5%',
    zIndex: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 