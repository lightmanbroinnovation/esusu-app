/**
 * Utility functions for handling account-related operations
 */

/**
 * Check if user has valid merchant account details
 * @param accountData - The account data from merchant dashboard API
 * @returns boolean - true if user has valid merchant account details, false otherwise
 */
export const hasMerchantAccount = (accountData: any): boolean => {
  if (!accountData) {
    return false;
  }

  // Check if accountData has the main merchant account details
  const accountName = accountData.accountName;
  const accountNumber = accountData.accountNumber;

  // Merchant account is considered valid if both accountName and accountNumber exist
  return !!(accountName && accountNumber);
};

/**
 * Check if user has valid settlement accounts
 * @param accountData - The account data from merchant dashboard API
 * @returns boolean - true if user has valid settlement accounts, false otherwise
 */
export const hasSettlementAccounts = (accountData: any): boolean => {
  if (!accountData) {
    return false;
  }

  // Check if accountData has settlementAccounts array and it has valid accounts
  if (Array.isArray(accountData.settlementAccounts) && accountData.settlementAccounts.length > 0) {
    // Find if there's at least one valid settlement account with both accountName and accountNumber
    const primaryAccount = accountData.settlementAccounts.find(
      (acc: any) => acc && acc.accountName && acc.accountNumber
    );
    return !!primaryAccount;
  }

  return false;
};

/**
 * Get the primary settlement account from account data
 * @param accountData - The account data from merchant dashboard API
 * @returns The primary settlement account or null if none found
 */
export const getPrimarySettlementAccount = (accountData: any): any => {
  if (!accountData || !Array.isArray(accountData.settlementAccounts)) {
    return null;
  }

  // First try to find an account marked as primary
  let primaryAccount = accountData.settlementAccounts.find(
    (acc: any) => acc && acc.isPrimary && acc.accountName && acc.accountNumber
  );

  // If no primary account found, find the first valid account
  if (!primaryAccount) {
    primaryAccount = accountData.settlementAccounts.find(
      (acc: any) => acc && acc.accountName && acc.accountNumber
    );
  }

  return primaryAccount || null;
};
