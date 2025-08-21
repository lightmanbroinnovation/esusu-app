import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import EsusuLoader from '../../components/EsusuLoader';
import { useBackButtonHandler } from '../../utils/backButtonHandler';

const { width, height } = Dimensions.get('window');

export default function DepositSuccessScreen() {
  const router = useRouter();
  
  // Use back button handler for deposit success page
  useBackButtonHandler('/deposit/subpages/success');
  
  const insets = useSafeAreaInsets();
  const [depositAmount, setDepositAmount] = useState('0');
  const [contributorName, setContributorName] = useState('');
  const [networkAvailable, setNetworkAvailable] = useState(true);
  const [loading, setLoading] = useState(false); // Set to true if you want a loading state
  
  useEffect(() => {
    const getDepositData = async () => {
      try {
        // Get deposit amount from AsyncStorage
        const amount = await AsyncStorage.getItem('depositAmount');
        if (amount) {
          setDepositAmount(amount);
        }
        // Get contributor data for name
        const contributorDataString = await AsyncStorage.getItem('depositContributorData');
        if (contributorDataString) {
          const contributorData = JSON.parse(contributorDataString);
          const firstName = contributorData.firstname || contributorData.firstName || '';
          const lastName = contributorData.lastname || contributorData.lastName || '';
          setContributorName(`${firstName} ${lastName}`.trim());
        }
      } catch (error) {
        console.error('Error getting deposit data:', error);
      }
    };
    getDepositData();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkAvailable(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);
  
  const handleGoBack = () => {
    router.back();
  };
  
  if (loading) {
    return <EsusuLoader />;
  }

  if (!networkAvailable && !depositAmount && !contributorName) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <Text>No network. Please connect to the internet to load deposit data.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
      {/* Confetti background as image */}
      <Image
        source={require('../../assets/images/success.png')}
        style={styles.confettiBg}
        resizeMode="contain"
      />
      {/* Checkmark in green circle as image */}
      <View style={styles.checkContainer}>
        <Image
          source={require('../../assets/images/check.png')}
          style={styles.checkImage}
          resizeMode="contain"
        />
      </View>
      {/* Title */}
      <Text style={styles.successTitle}>Successful!</Text>
      {/* Subtitle (dynamic) */}
      <Text style={styles.successSubtitle}>
        ₦{Number(depositAmount).toLocaleString()} has been successfully deposited for {contributorName || "[Contributor's Name]"}. The contributor has been notified.
      </Text>
      {/* Go Back Button */}
      <TouchableOpacity style={styles.button} onPress={handleGoBack}>
        <Text style={styles.buttonText}>Go Back</Text>
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