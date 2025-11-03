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
  StyleSheet,
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

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
  },
  
  // Header
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  shareButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
  },
  
  // Receipt Card
  receiptCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    padding: 24,
    marginBottom: 16,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  receiptIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  receiptSubtitle: {
    color: '#6B7280',
    fontSize: 14,
  },
  
  // Transaction Details
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  detailValueRight: {
    textAlign: 'right',
  },
  detailValueMonospace: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  
  // Status Badges
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeDeposit: {
    backgroundColor: '#D1FAE5',
  },
  typeWithdrawal: {
    backgroundColor: '#FEE2E2',
  },
  typeDefault: {
    backgroundColor: '#DBEAFE',
  },
  textDeposit: {
    color: '#065F46',
  },
  textWithdrawal: {
    color: '#991B1B',
  },
  textDefault: {
    color: '#1E40AF',
  },
  
  // Amount
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  amountPositive: {
    color: '#059669',
  },
  amountNegative: {
    color: '#DC2626',
  },
  
  // Share Section
  shareSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  shareInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareIcon: {
    marginRight: 8,
  },
  shareText: {
    color: '#1E40AF',
    fontWeight: '500',
  },
  shareButtonContainer: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Receipt</Text>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareButtonContainer}
          >
            <Ionicons name="share-outline" size={24} color="#ffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Receipt Card */}
        <View style={styles.receiptCard}>
            {/* Receipt Header */}
            <View style={styles.receiptHeader}>
              <View style={styles.receiptIconContainer}>
                <Ionicons name="receipt-outline" size={32} color="#2563EB" />
              </View>
              <Text style={styles.receiptTitle}>Payment Receipt</Text>
              <Text style={styles.receiptSubtitle}>Transaction Details</Text>
            </View>

            {/* Transaction Details */}
            <View>
              {/* Transaction Type */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction Type</Text>
                <View style={[
                  styles.statusBadge,
                  transaction.type === 'deposit' ? styles.typeDeposit :
                  transaction.type === 'withdrawal' ? styles.typeWithdrawal : styles.typeDefault
                ]}>
                  <Text style={[
                    styles.statusText,
                    transaction.type === 'deposit' ? styles.textDeposit :
                    transaction.type === 'withdrawal' ? styles.textWithdrawal : styles.textDefault
                  ]}>
                    {getTransactionTypeLabel(transaction.type)}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={[styles.detailValue, { maxWidth: '60%' }]}>
                  {transaction.name}
                </Text>
              </View>

              {/* Sender Name */}
              {transaction.from?.name && (
                <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                  <Text style={styles.detailLabel}>From</Text>
                  <Text style={[styles.detailValue, { maxWidth: '60%' }]}>
                    {transaction.from.name}
                  </Text>
                </View>
              )}

              {/* Sender Account Number */}
              {transaction.from?.accountNumber && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Number</Text>
                  <Text style={[styles.detailValue, styles.detailValueMonospace]}>
                    {maskAccountNumber(transaction.from.accountNumber)}
                  </Text>
                </View>
              )}

              {/* Amount */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={[
                  styles.amountText,
                  transaction.type === 'withdrawal' ? styles.amountNegative : styles.amountPositive
                ]}>
                  {formatAmount(transaction.amount, transaction.type)}
                </Text>
              </View>

              {/* Date */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(transaction.createdAt)}
                </Text>
              </View>

              {/* Time */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
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
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.statusText, { color: '#065F46' }]}>
                    {transaction.status || 'Completed'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

        {/* Share Section */}
        <View style={styles.shareSection}>
          <View style={styles.shareInfo}>
            <Ionicons name="information-circle-outline" size={20} color="#2563EB" style={styles.shareIcon} />
            <Text style={styles.shareText}>
              Share receipt as PDF file
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareButtonContainer}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text style={styles.shareButtonText}>Share as PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by Esusu
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
