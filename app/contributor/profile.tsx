import React from 'react';
import ContributorProfile from '../components/ContributorProfile';
import { useLocalSearchParams } from 'expo-router';

export default function ContributorProfileScreen() {
  const params = useLocalSearchParams();
  const contributorId = params.contributorId as string;
  
  return <ContributorProfile contributorId={contributorId} />;
} 