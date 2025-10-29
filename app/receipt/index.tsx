import React, { useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Dimensions,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBackButtonHandler } from '../utils/backButtonHandler';
import { Transaction } from '../components/types';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Web-only import for html2canvas
let html2canvas: any = null;
if (typeof window !== 'undefined') {
  import('html2canvas').then((module) => {
    html2canvas = module.default;
  });
}

// Import file system utilities for file validation
let RNFS: any = null;
try {
  RNFS = require('react-native-fs');
} catch (error) {
  console.warn('react-native-fs not available:', error);
}

const { width } = Dimensions.get('window');

export default function TransactionReceipt() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Use back button handler for receipt page
  useBackButtonHandler('/receipt');

  // Helper function to normalize transaction data
  const normalizeTransaction = (data: any): any => {
    if (!data) return null;

    // If it's already in the expected format, return as is
    if (data.id && data.createdAt) return data;

    // Otherwise, normalize from RecentActivity format
    return {
      id: data.reference || data._id || `txn_${Date.now()}_${Math.random()}`,
      name: data.from?.name || data.name || data.description || 'Transaction',
      description: data.description || 'Transaction',
      accountNumber: data.from?.accountNumber,
      type: data.type || 'unknown',
      amount: Number(data.amount || 0),
      timestamp: data.timestamp || data.time || '',
      time: data.time || data.timestamp || '',
      date: data.date || '',
      createdAt: data.createdAt || data.date || new Date().toISOString(),
      status: data.status || 'completed',
      reference: data.reference,
      ...data // Include any additional fields
    };
  };

  const transaction = normalizeTransaction(params.transaction ? JSON.parse(params.transaction as string) : null);

  if (!transaction) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-gray-600 text-center">
            Transaction details not found.{'\n'}Please go back and try again.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Money Received';
      case 'withdrawal':
        return 'Money Sent';
      case 'account_creation':
        return 'Account Created';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const nairaSymbol = '₦';
    const isNegative = type === 'withdrawal';
    return `${isNegative ? '-' : ''}${nairaSymbol}${Math.abs(amount).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString; // Return as is if not a valid date
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber || accountNumber.length < 4) return accountNumber;
    const visibleDigits = 4;
    const maskedLength = accountNumber.length - visibleDigits;
    return 'X'.repeat(maskedLength) + accountNumber.slice(-visibleDigits);
  };

  const formatTransactionReference = (reference: string) => {
    if (!reference) return 'N/A';
    if (reference.length <= 10) return reference;
    return reference.substring(0, 10) + '...';
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      // Check if we're on web
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for React Native
        await Clipboard.setString(text);
      }
      Alert.alert('Copied!', `${label} copied to clipboard`);
    } catch (error) {
      console.error('Copy failed:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const generateReceiptHTML = () => {
    const transactionTypeLabel = getTransactionTypeLabel(transaction.type);
    const amountColor = transaction.type === 'withdrawal' ? '#DC2626' : '#059669';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Transaction Receipt</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
            
              background-color: #F9FAFB;
              color: #111827;
            }
            .container {
              max-width: 350px;
              margin: 0 auto;
              background-color: white;
              border-radius: 16px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              text-align: center;
              padding: 24px;
              background-color: #F8FAFC;
              border-bottom: 1px solid #E5E7EB;
            }
            .logo {
              width: 64px;
              height: 64px;
              background-color: #DBEAFE;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 12px;
            }
            .logo::before {
              content: "🧾";
              font-size: 32px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 4px;
            }
            .subtitle {
              font-size: 14px;
              color: #6B7280;
            }
            .content {
              padding: 24px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid #F3F4F6;
            }
            .row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 500;
              color: #6B7280;
              flex: 1;
            }
            .value {
              font-weight: 600;
              color: #111827;
              text-align: right;
              flex: 1;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: ${amountColor};
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              background-color: #D1FAE5;
              color: #065F46;
              border-radius: 9999px;
              font-size: 14px;
              font-weight: 600;
            }
            .type-badge {
              display: inline-block;
              padding: 4px 12px;
              background-color: ${transaction.type === 'deposit' ? '#D1FAE5' :
                transaction.type === 'withdrawal' ? '#FEE2E2' : '#DBEAFE'};
              color: ${transaction.type === 'deposit' ? '#065F46' :
                transaction.type === 'withdrawal' ? '#991B1B' : '#1E40AF'};
              border-radius: 9999px;
              font-size: 14px;
              font-weight: 600;
            }
            .transaction-id {
              font-family: 'Courier New', monospace;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              padding: 24px;
              color: #9CA3AF;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo"></div>
              <div class="title">Payment Receipt</div>
              <div class="subtitle">Transaction Details</div>
            </div>
            <div class="content">
              <div class="row">
                <div class="label">Transaction Type</div>
                <div class="value">
                  <span class="type-badge">${transactionTypeLabel}</span>
                </div>
              </div>
              <div class="row">
                <div class="label">Description</div>
                <div class="value">${transaction.name}</div>
              </div>
              ${transaction.from?.name ? `
                <div class="row">
                  <div class="label">From</div>
                  <div class="value">${transaction.from.name}</div>
                </div>
              ` : ''}
              ${transaction.from?.accountNumber ? `
                <div class="row">
                  <div class="label">Account Number</div>
                  <div class="value transaction-id">${maskAccountNumber(transaction.from.accountNumber)}</div>
                </div>
              ` : ''}
              <div class="row">
                <div class="label">Amount</div>
                <div class="value amount">${formatAmount(transaction.amount, transaction.type)}</div>
              </div>
              <div class="row">
                <div class="label">Date</div>
                <div class="value">${formatDate(transaction.createdAt)}</div>
              </div>
              <div class="row">
                <div class="label">Time</div>
                <div class="value">${formatTime(transaction.time)}</div>
              </div>
              // <div class="row">
              //   <div class="label">Transaction ID</div>
              //   <div class="value transaction-id">${formatTransactionReference(transaction.reference || transaction.id || transaction._id)}</div>
              // </div>
              <div class="row">
                <div class="label">Status</div>
                <div class="value">
                  <span class="status-badge">${transaction.status || 'Completed'}</span>
                </div>
              </div>
            </div>
            <div class="footer">
              Powered by Esusu
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleShare = async () => {
    try {
      // Generate HTML content for the receipt
      const htmlContent = generateReceiptHTML();

      // Generate PDF from HTML
      console.log('📄 Generating PDF from HTML...');
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      console.log('📄 PDF generated at:', uri);

      // For React Native file sharing, we need to use expo-sharing
      // First, let's check if sharing is available on this platform
      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (!isSharingAvailable) {
        console.warn('⚠️ Sharing not available on this platform');
        // Fallback to text sharing with file info
        const receiptText = `
📄 Esusu Transaction Receipt (PDF Generated)

Transaction Details:
• Type: ${getTransactionTypeLabel(transaction.type)}
• Description: ${transaction.name}
${transaction.from?.name ? `• From: ${transaction.from.name}` : ''}
${transaction.from?.accountNumber ? `• Account: ${maskAccountNumber(transaction.from.accountNumber)}` : ''}
• Amount: ${formatAmount(transaction.amount, transaction.type)}
• Date: ${formatDate(transaction.createdAt)}
• Time: ${formatTime(transaction.time)}
• Transaction ID: ${transaction.reference || transaction.id || transaction._id}
• Status: ${transaction.status || 'Completed'}

PDF saved to: ${uri}
Sharing not available on this device.

Shared from Esusu App
        `.trim();

        await Share.share({
          message: receiptText,
          title: 'Transaction Receipt - PDF Saved',
        });
        return;
      }

      // Try to share the PDF file directly using expo-sharing
      try {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Transaction Receipt from Esusu App',
        });

        console.log('✅ Receipt shared as PDF successfully');
        return;
      } catch (sharingError) {
        console.warn('⚠️ expo-sharing failed:', sharingError);
      }

      // Fallback: Enhanced text sharing with file information
      const receiptText = `
📄 Esusu Transaction Receipt (PDF Generated)

Transaction Details:
• Type: ${getTransactionTypeLabel(transaction.type)}
• Description: ${transaction.name}
${transaction.from?.name ? `• From: ${transaction.from.name}` : ''}
${transaction.from?.accountNumber ? `• Account: ${maskAccountNumber(transaction.from.accountNumber)}` : ''}
• Amount: ${formatAmount(transaction.amount, transaction.type)}
• Date: ${formatDate(transaction.createdAt)}
• Time: ${formatTime(transaction.time)}
• Transaction ID: ${transaction.reference || transaction.id || transaction._id}
• Status: ${transaction.status || 'Completed'}

PDF file saved at: ${uri}
Use a file manager to access and share the PDF.

Shared from Esusu App
      `.trim();

      await Share.share({
        message: receiptText,
        title: 'Transaction Receipt - PDF Generated',
      });

      console.log('✅ Receipt shared as text with PDF file info');
    } catch (error) {
      console.error('❌ Error sharing receipt as PDF:', error);
      Alert.alert('Error', 'Failed to share receipt as PDF. Please try again.');

      // Fallback to text sharing
      try {
        const receiptText = `
Esusu Transaction Receipt

Transaction Type: ${getTransactionTypeLabel(transaction.type)}
Description: ${transaction.name}
${transaction.from?.name ? `From: ${transaction.from.name}` : ''}
${transaction.from?.accountNumber ? `Account Number: ${maskAccountNumber(transaction.from.accountNumber)}` : ''}
Amount: ${formatAmount(transaction.amount, transaction.type)}
Date: ${formatDate(transaction.createdAt)}
Time: ${formatTime(transaction.time)}
Transaction ID: ${transaction.reference || transaction.id}
Status: ${transaction.status || 'Completed'}

Shared from Esusu App
        `.trim();

        await Share.share({
          message: receiptText,
          title: 'Transaction Receipt',
        });
      } catch (fallbackError) {
        console.error('❌ Fallback sharing also failed:', fallbackError);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 pt-16 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Transaction Receipt</Text>
          <TouchableOpacity
            onPress={handleShare}
            className="p-2 rounded-full bg-blue-100"
          >
            <Ionicons name="share-outline" size={24} color="#0052CC" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Receipt Card */}
        <View className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            {/* Receipt Header */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="receipt-outline" size={32} color="#0052CC" />
              </View>
              <Text className="text-xl font-bold text-gray-900">Payment Receipt</Text>
              <Text className="text-gray-500 text-sm mt-1">Transaction Details</Text>
            </View>

            {/* Transaction Details */}
            <View className="space-y-4">
              {/* Transaction Type */}
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">Transaction Type</Text>
                <View className={`px-3 py-1 rounded-full ${
                  transaction.type === 'deposit' ? 'bg-green-100' :
                  transaction.type === 'withdrawal' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <Text className={`text-sm font-semibold ${
                    transaction.type === 'deposit' ? 'text-green-700' :
                    transaction.type === 'withdrawal' ? 'text-red-700' : 'text-blue-700'
                  }`}>
                    {getTransactionTypeLabel(transaction.type)}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <View className="flex-row justify-between items-start py-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">Description</Text>
                <Text className="text-gray-900 font-semibold text-right max-w-[60%]">
                  {transaction.name}
                </Text>
              </View>

              {/* Sender Name */}
              {transaction.from?.name && (
                <View className="flex-row justify-between items-start py-3 border-b border-gray-100">
                  <Text className="text-gray-600 font-medium">From</Text>
                  <Text className="text-gray-900 font-semibold text-right max-w-[60%]">
                    {transaction.from.name}
                  </Text>
                </View>
              )}

              {/* Sender Account Number */}
              {transaction.from?.accountNumber && (
                <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                  <Text className="text-gray-600 font-medium">Account Number</Text>
                  <Text className="text-gray-900 font-semibold font-mono">
                    {maskAccountNumber(transaction.from.accountNumber)}
                  </Text>
                </View>
              )}

              {/* Amount */}
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">Amount</Text>
                <Text className={`text-xl font-bold ${
                  transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatAmount(transaction.amount, transaction.type)}
                </Text>
              </View>

              {/* Date */}
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">Date</Text>
                <Text className="text-gray-900 font-semibold">
                  {formatDate(transaction.createdAt)}
                </Text>
              </View>

              {/* Time */}
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">Time</Text>
                <Text className="text-gray-900 font-semibold">
                  {formatTime(transaction.time)}
                </Text>
              </View>

              {/* Transaction ID */}
              {/* <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">Transaction ID</Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-900 font-semibold font-mono text-sm mr-2">
                    {formatTransactionReference(transaction.reference || transaction.id || transaction._id)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(transaction.reference || transaction.id || transaction._id, 'Transaction ID')}
                    className="p-1"
                  >
                    <Ionicons name="copy-outline" size={16} color="#0052CC" />
                  </TouchableOpacity>
                </View>
              </View> */}

              {/* Status */}
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-gray-600 font-medium">Status</Text>
                <View className="px-3 py-1 bg-green-100 rounded-full">
                  <Text className="text-green-700 text-sm font-semibold">
                    {transaction.status || 'Completed'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

        {/* Share Section */}
        <View className="bg-blue-50 rounded-xl p-4 mb-4">
          <View className="flex-row items-center">
            <Ionicons name="information-circle-outline" size={20} color="#0052CC" />
            <Text className="text-blue-700 font-medium ml-2">
              Share receipt as PDF file
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleShare}
            className="bg-blue-600 rounded-lg py-3 px-4 mt-3 flex-row items-center justify-center"
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text className="text-white font-semibold ml-2">Share as PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="items-center py-6">
          <Text className="text-gray-400 text-sm">
            Powered by Esusu
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
