import React, { useState, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [visible, setVisible] = useState(false);
  const translateY = new Animated.Value(-50); // Start offscreen

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected !== null ? state.isConnected : true);
      showBanner(state.isConnected !== null ? state.isConnected : true);
    });

    // When component mounts, do an initial check
    const checkInitialConnection = async () => {
      try {
        const state = await NetInfo.fetch();
        setIsConnected(state.isConnected !== null ? state.isConnected : true);
      } catch (error) {
        console.error('Failed to check initial network status:', error);
      }
    };

    checkInitialConnection();

    return () => {
      unsubscribe();
    };
  }, []);

  const showBanner = (isConnected: boolean | null) => {
    // Only show banner on connection changes
    if (!visible) {
      setVisible(true);
      
      // Animate banner in
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Auto hide after 3 seconds
      setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
        });
      }, 3000);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: isConnected ? '#4CAF50' : '#F44336',
          transform: [{ translateY }] 
        }
      ]}
    >
      <Text style={styles.text}>
        {isConnected ? 'Back Online' : 'No Internet Connection'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    padding: 10,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default ConnectionStatus; 