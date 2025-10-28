import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';

const ICON = require('../assets/images/icon.png');
const { height } = Dimensions.get('window');

export default function EsusuLoader() {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  return (
    <View style={styles.screen}>
      <View style={styles.row}>
        <Animated.Image
          source={ICON}
          style={[styles.icon, { transform: [{ scale: scaleAnim }] }]}
          resizeMode="contain"
        />
        {/* <Animated.Text style={[styles.text, { transform: [{ scale: scaleAnim }] }]}></Animated.Text> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eaf3fc',
    alignItems: 'center',
    justifyContent: 'center',
    height: height,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 80,
    height: 80,
    // marginRight: 16,
  },
  text: {
    fontSize: 40,
    fontWeight: '600',
    color: '#232733',
    letterSpacing: 1,
    fontFamily: 'Poppins-Bold', // If available, else remove this line
    textTransform: 'lowercase',
  },
}); 