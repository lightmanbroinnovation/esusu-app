import React, { useEffect } from 'react';
import ContributorProfile from '../components/ContributorProfile';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ContributorProfileScreen() {
  const params = useLocalSearchParams();
  
  // Extract all parameters from the route
  const contributorId = params.contributorId as string;
  const firstName = params.firstName as string;
  const lastName = params.lastName as string;
  const phoneNumber = params.phoneNumber as string;
  const depositAmount = params.depositAmount as string;
  const frequency = params.frequency as string;
  const photoUri = params.photoUri as string;
  const status = params.status as string;
  
  useEffect(() => {
    // Log the parameters to help with debugging
    console.log('ContributorProfileScreen - Received params:', {
      contributorId,
      firstName,
      lastName,
      photoUri,
      // Don't log all details to keep logs clean
      hasPhoneNumber: !!phoneNumber,
      hasDepositAmount: !!depositAmount,
      hasFrequency: !!frequency,
      hasStatus: !!status
    });
  }, [contributorId, firstName, lastName, phoneNumber, depositAmount, frequency, photoUri, status]);
  
  // Pass all available props to the component
  return <ContributorProfile 
    contributorId={contributorId}
    firstName={firstName}
    lastName={lastName}
    imageUrl={photoUri}
    // We can add additional props here
    phoneNumber={phoneNumber}
    depositAmount={depositAmount}
    frequency={frequency}
    status={status}
  />;
} 