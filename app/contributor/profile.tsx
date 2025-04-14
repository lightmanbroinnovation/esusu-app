import React from 'react';
import ContributorProfile from '../components/ContributorProfile';
import { useLocalSearchParams } from 'expo-router';

export default function ContributorProfileScreen() {
  const params = useLocalSearchParams();
  const contributorId = params.contributorId as string;
  const firstName = params.firstName as string;
  const lastName = params.lastName as string;
  const imageUrl = params.imageUrl as string;
  
  // Pass all available props to the component
  return <ContributorProfile 
    contributorId={contributorId}
    firstName={firstName}
    lastName={lastName}
    imageUrl={imageUrl}
  />;
} 