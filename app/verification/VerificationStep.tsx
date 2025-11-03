import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VerificationStepProps {
  title: string;
  description: string;
  completed: boolean;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const VerificationStep = ({ 
  title, 
  description, 
  completed, 
  selected, 
  onPress, 
  disabled = false
}: VerificationStepProps) => {
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        selected && styles.containerSelected,
        disabled && styles.containerDisabled
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        
        {(completed || disabled) ? (
          <View style={styles.completedIconContainer}>
            <Ionicons name="checkmark" size={24} color="#10B981" />
          </View>
        ) : (
          <View style={styles.addIconContainer}>
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={24} color="#007BFF" />
            </View>
            <Text style={styles.selectText}>Select</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    marginVertical: 8,
    padding: 24,
  },
  containerSelected: {
    borderWidth: 2,
    borderColor: '#007BFF',
  },
  containerDisabled: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
    marginBottom: 8,
  },
  title: {
    color: '#0052CC',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  completedIconContainer: {
    backgroundColor: '#D1FAE5',
    marginTop: 8,
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  addIconCircle: {
    backgroundColor: '#E5F1FF',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  selectText: {
    color: '#007BFF',
    fontSize: 12,
  },
});

export default VerificationStep; 