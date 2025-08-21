import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, ErrorBoundaryProps } from 'expo-router';

export default function ErrorScreen(props: ErrorBoundaryProps) {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.subtitle}>
        {props.error?.message || 'An unexpected error occurred'}
      </Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.replace('/')}
      >
        <Text style={styles.buttonText}>Go back to home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#E53935',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    backgroundColor: '#0072CE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 