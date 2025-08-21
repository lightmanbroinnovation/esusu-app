import React from 'react';
import InitialDeposit from '../components/InitialDeposit';
import { useBackButtonHandler } from '../utils/backButtonHandler';

export default function InitialDepositScreen() {
  // Use back button handler for contributor initial deposit page
  useBackButtonHandler('/contributor/initial-deposit');
  
  return <InitialDeposit />;
} 