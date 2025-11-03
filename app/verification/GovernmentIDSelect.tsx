import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GovernmentIDSelectProps {
  onClose: () => void;
  onSelectIDType: (type: string) => void;
}

const GovernmentIDSelect = ({ onClose, onSelectIDType }: GovernmentIDSelectProps) => {
  const handleSelect = (type: string) => {
    onSelectIDType(type);
  };

  return (
    <SafeAreaView style={styles.container}> 
      <ScrollView style={styles.scroll}>
        <View style={styles.contentWrap}>
          <TouchableOpacity 
            style={styles.closeBtn}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>

          <View style={styles.headerBlock}>
            <Text style={styles.headerTitle}>
              Verify Business
            </Text>
            <Text style={styles.headerSubtitle}>
              Complete your KYB verification to start managing contributions securely.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Which photo ID would you like to use
            </Text>

            <TouchableOpacity 
              style={styles.listItem}
              onPress={() => handleSelect('drivers_license')}
            >
              <Text style={styles.listItemText}>Driver's License</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.listItem}
              onPress={() => handleSelect('national_id')}
            >
              <Text style={styles.listItemText}>National Identity Card (NIN)</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.listItem}
              onPress={() => handleSelect('passport')}
            >
              <Text style={styles.listItemText}>Passport</Text>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GovernmentIDSelect; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  contentWrap: {
    padding: 24,
  },
  closeBtn: {
    position: 'absolute',
    right: 24,
    top: 24,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 999,
    zIndex: 10,
  },
  headerBlock: {
    marginTop: 64,
    marginBottom: 24,
  },
  headerTitle: {
    color: '#0052CC',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#4B5563',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  listItemText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
});