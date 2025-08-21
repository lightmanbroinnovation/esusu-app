import { invalidateCache } from './dataCaching';
import { 
  fetchUser, 
  fetchGroupedContributorPhotos, 
  fetchMerchantDashboardAccount,
  fetchSettlementAccounts,
  fetchTransactionHistory,
  fetchAccountCommission
} from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Refresh all user data after login
 * This function invalidates all caches and fetches fresh data
 */
export const refreshAllUserData = async (): Promise<void> => {
  try {
    console.log('🔄 Starting comprehensive data refresh after login...');
    
    // Step 1: Invalidate all relevant caches
    const cacheKeysToInvalidate = [
      'userData',
      'settings_user',
      'contributors_data',
      'contributor_list_daily',
      'contributor_list_weekly',
      'contributor_list_monthly',
      'merchantDashboardAccount',
      'settlementAccounts',
      'transactionHistory',
      'accountCommission',
      'bankAccounts',
      'commissionData'
    ];
    
    console.log('🗑️ Invalidating caches...');
    for (const cacheKey of cacheKeysToInvalidate) {
      try {
        await invalidateCache(cacheKey);
        console.log(`✓ Invalidated cache: ${cacheKey}`);
      } catch (error) {
        console.log(`⚠️ Failed to invalidate cache: ${cacheKey}`, error);
      }
    }
    
    // Step 2: Fetch fresh user data
    console.log('👤 Fetching fresh user data...');
    try {
      const userData = await fetchUser();
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      console.log('✓ User data refreshed');
    } catch (error) {
      console.log('⚠️ Failed to refresh user data:', error);
    }
    
    // Step 3: Fetch fresh contributor data
    console.log('👥 Fetching fresh contributor data...');
    try {
      const contributorData = await fetchGroupedContributorPhotos();
      await AsyncStorage.setItem('contributors_data', JSON.stringify(contributorData));
      console.log('✓ Contributor data refreshed');
    } catch (error) {
      console.log('⚠️ Failed to refresh contributor data:', error);
    }
    
    // Step 4: Fetch fresh dashboard data
    console.log('📊 Fetching fresh dashboard data...');
    try {
      const dashboardData = await fetchMerchantDashboardAccount();
      await AsyncStorage.setItem('merchantDashboardAccount', JSON.stringify(dashboardData));
      console.log('✓ Dashboard data refreshed');
    } catch (error) {
      console.log('⚠️ Failed to refresh dashboard data:', error);
    }
    
    // Step 5: Fetch fresh settlement accounts
    console.log('🏦 Fetching fresh settlement accounts...');
    try {
      const settlementData = await fetchSettlementAccounts();
      await AsyncStorage.setItem('settlementAccounts', JSON.stringify(settlementData));
      console.log('✓ Settlement accounts refreshed');
    } catch (error) {
      console.log('⚠️ Failed to refresh settlement accounts:', error);
    }
    
    // Step 6: Fetch fresh transaction history
    console.log('📈 Fetching fresh transaction history...');
    try {
      const transactionData = await fetchTransactionHistory();
      await AsyncStorage.setItem('transactionHistory', JSON.stringify(transactionData));
      console.log('✓ Transaction history refreshed');
    } catch (error) {
      console.log('⚠️ Failed to refresh transaction history:', error);
    }
    
    // Step 7: Fetch fresh commission data
    console.log('💰 Fetching fresh commission data...');
    try {
      const commissionData = await fetchAccountCommission();
      await AsyncStorage.setItem('accountCommission', JSON.stringify(commissionData));
      console.log('✓ Commission data refreshed');
    } catch (error) {
      console.log('⚠️ Failed to refresh commission data:', error);
    }
    
    console.log('🎉 All user data refreshed successfully!');
    
  } catch (error) {
    console.error('❌ Error during data refresh:', error);
  }
};

/**
 * Refresh specific data types
 * Useful when you only need to refresh certain data
 */
export const refreshSpecificData = async (dataTypes: string[]): Promise<void> => {
  try {
    console.log('🔄 Refreshing specific data types:', dataTypes);
    
    for (const dataType of dataTypes) {
      try {
        switch (dataType) {
          case 'user':
            const userData = await fetchUser();
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            await invalidateCache('userData');
            console.log('✓ User data refreshed');
            break;
            
          case 'contributors':
            const contributorData = await fetchGroupedContributorPhotos();
            await AsyncStorage.setItem('contributors_data', JSON.stringify(contributorData));
            await invalidateCache('contributors_data');
            console.log('✓ Contributor data refreshed');
            break;
            
          case 'dashboard':
            const dashboardData = await fetchMerchantDashboardAccount();
            await AsyncStorage.setItem('merchantDashboardAccount', JSON.stringify(dashboardData));
            await invalidateCache('merchantDashboardAccount');
            console.log('✓ Dashboard data refreshed');
            break;
            
          case 'settlements':
            const settlementData = await fetchSettlementAccounts();
            await AsyncStorage.setItem('settlementAccounts', JSON.stringify(settlementData));
            await invalidateCache('settlementAccounts');
            console.log('✓ Settlement accounts refreshed');
            break;
            
          case 'transactions':
            const transactionData = await fetchTransactionHistory();
            await AsyncStorage.setItem('transactionHistory', JSON.stringify(transactionData));
            await invalidateCache('transactionHistory');
            console.log('✓ Transaction history refreshed');
            break;
            
          case 'commission':
            const commissionData = await fetchAccountCommission();
            await AsyncStorage.setItem('accountCommission', JSON.stringify(commissionData));
            await invalidateCache('accountCommission');
            console.log('✓ Commission data refreshed');
            break;
            
          default:
            console.log(`⚠️ Unknown data type: ${dataType}`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to refresh ${dataType}:`, error);
      }
    }
    
    console.log('✅ Specific data refresh completed');
    
  } catch (error) {
    console.error('❌ Error during specific data refresh:', error);
  }
};

/**
 * Pre-warm caches with fresh data
 * This fetches data and stores it in cache for faster access
 */
export const prewarmCaches = async (): Promise<void> => {
  try {
    console.log('🔥 Pre-warming caches with fresh data...');
    
    // Fetch data in parallel for better performance
    const fetchPromises = [
      fetchUser().then(data => AsyncStorage.setItem('userData', JSON.stringify(data))),
      fetchGroupedContributorPhotos().then(data => AsyncStorage.setItem('contributors_data', JSON.stringify(data))),
      fetchMerchantDashboardAccount().then(data => AsyncStorage.setItem('merchantDashboardAccount', JSON.stringify(data))),
      fetchSettlementAccounts().then(data => AsyncStorage.setItem('settlementAccounts', JSON.stringify(data))),
      fetchTransactionHistory().then(data => AsyncStorage.setItem('transactionHistory', JSON.stringify(data))),
      fetchAccountCommission().then(data => AsyncStorage.setItem('accountCommission', JSON.stringify(data)))
    ];
    
    await Promise.allSettled(fetchPromises);
    console.log('✅ Cache pre-warming completed');
    
  } catch (error) {
    console.error('❌ Error during cache pre-warming:', error);
  }
}; 