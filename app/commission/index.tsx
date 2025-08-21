import React from 'react';
import CommissionScreen from '../components/CommissionScreen';

export default function CommissionIndex() {
  // Always render the main layout, even if CommissionScreen has no data
  return (
    <React.Fragment>
      <CommissionScreen />
    </React.Fragment>
  );
} 