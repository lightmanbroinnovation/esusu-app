/**
 * User Types
 * TypeScript interfaces for user-related data
 */

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  balance: string;
  weeklyEarnings: string;
  userImg?: string;
  businessLocation?: boolean;
  documentsVerified?: boolean;
  governmentid?: boolean;
  governmentID?: boolean;
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'transfer';
  createdAt: string;
  date: string;
  time: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface AccountData {
  totalContributors: number;
  activeGroups: number;
  totalBalance: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
}

export interface Contributor {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  photoUri?: string;
  imageUrl?: string;
  agentId: string;
  savingsPlan?: SavingsPlan;
  transactions?: Transaction[];
}

export interface SavingsPlan {
  id: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused';
}

export interface VerificationData {
  businessInfo?: any;
  governmentIDType?: string;
  governmentIDImage?: string;
  governmentIDImageUrl?: string;
  locationImages?: string[];
  locationImagesUrls?: string[];
}

export interface NotificationSettings {
  transactionAlerts: boolean;
  securityAlerts: boolean;
  generalUpdates: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  biometricEnabled: boolean;
  offlineMode: boolean;
}
