import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 999,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  progressStep: {
    flex: 1,
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#2563EB',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#6B7280',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#374151',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  paymentMethodButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  paymentMethodButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  paymentMethodButtonUnselected: {
    borderColor: '#D1D5DB',
  },
  paymentMethodText: {
    marginTop: 4,
  },
  paymentMethodTextSelected: {
    color: '#2563EB',
  },
  paymentMethodTextUnselected: {
    color: '#6B7280',
  },
  infoBox: {
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  infoTitle: {
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    color: '#1E40AF',
  },
  receiptOptionsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  receiptButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  receiptButtonText: {
    color: '#6B7280',
    marginLeft: 8,
  },
  bottomAction: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  completeButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
});

const InitialDeposit = () => {
  const router = useRouter();
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const navigateBack = () => {
    router.back();
  };

  const handleCompleteRegistration = () => {
    if (!depositAmount.trim()) {
      Alert.alert('Required Field', 'Please enter a deposit amount');
      return;
    }

    // Show success and navigate to dashboard or contributor list
    Alert.alert(
      'Success!',
      'Contributor has been added successfully.',
      [
        {
          text: 'OK',
          onPress: () => router.push('/dashboard')
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={navigateBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Initial Deposit</Text>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <View style={styles.progressCircle}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </View>
              <Text style={styles.progressLabel}>Personal Info</Text>
            </View>
            <View style={styles.progressStep}>
              <View style={styles.progressCircle}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </View>
              <Text style={styles.progressLabel}>Savings Plan</Text>
            </View>
            <View style={styles.progressStep}>
              <View style={styles.progressCircle}>
                <Text style={styles.progressCircleText}>3</Text>
              </View>
              <Text style={styles.progressLabel}>Initial Deposit</Text>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collect Initial Deposit</Text>
            <Text style={styles.sectionSubtitle}>
              Collect the first deposit from the contributor to activate their account
            </Text>
            
            {/* Deposit Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deposit Amount (₦)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={depositAmount}
                onChangeText={setDepositAmount}
              />
            </View>
            
            {/* Payment Method */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.paymentMethodsRow}>
                <TouchableOpacity 
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'cash' ? styles.paymentMethodButtonSelected : styles.paymentMethodButtonUnselected
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Ionicons name="cash-outline" size={24} color={paymentMethod === 'cash' ? '#0072CE' : '#666'} />
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === 'cash' ? styles.paymentMethodTextSelected : styles.paymentMethodTextUnselected
                  ]}>Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'transfer' ? styles.paymentMethodButtonSelected : styles.paymentMethodButtonUnselected
                  ]}
                  onPress={() => setPaymentMethod('transfer')}
                >
                  <Ionicons name="card-outline" size={24} color={paymentMethod === 'transfer' ? '#0072CE' : '#666'} />
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === 'transfer' ? styles.paymentMethodTextSelected : styles.paymentMethodTextUnselected
                  ]}>Transfer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'pos' ? styles.paymentMethodButtonSelected : styles.paymentMethodButtonUnselected
                  ]}
                  onPress={() => setPaymentMethod('pos')}
                >
                  <Ionicons name="card" size={24} color={paymentMethod === 'pos' ? '#0072CE' : '#666'} />
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === 'pos' ? styles.paymentMethodTextSelected : styles.paymentMethodTextUnselected
                  ]}>POS</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Confirmation */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                <Ionicons name="information-circle" size={18} /> Important
              </Text>
              <Text style={styles.infoText}>
                Please ensure you've collected the payment before confirming. 
                This will activate the contributor's account and create their first transaction.
              </Text>
            </View>

            {/* Receipt Options */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Receipt Options</Text>
              <View style={styles.receiptOptionsRow}>
                <TouchableOpacity style={styles.receiptButton}>
                  <Ionicons name="print-outline" size={20} color="#666" />
                  <Text style={styles.receiptButtonText}>Print</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.receiptButton}>
                  <Ionicons name="share-social-outline" size={20} color="#666" />
                  <Text style={styles.receiptButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Bottom Action Button */}
        <View style={styles.bottomAction}>
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={handleCompleteRegistration}
          >
            <Text style={styles.completeButtonText}>Complete Registration</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default InitialDeposit; 