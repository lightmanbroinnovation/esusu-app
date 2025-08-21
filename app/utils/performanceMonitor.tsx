import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { InteractionManager } from 'react-native';

// Interface for performance metrics
interface PerformanceMetrics {
  fps: number;
  memoryUsage: number; // Approximation based on component re-renders
  renderTime: number;
  networkLatency: number;
  startupTime: number;
  optimizationScore: number;
}

// Default metrics
const defaultMetrics: PerformanceMetrics = {
  fps: 0,
  memoryUsage: 0,
  renderTime: 0,
  networkLatency: 0,
  startupTime: 0,
  optimizationScore: 0
};

// Global variable to track app startup time
let APP_START_TIME = Date.now();

// Component to monitor and display performance metrics
export const PerformanceMonitor: React.FC<{ visible?: boolean }> = () => null;

// Utility function to get color based on optimization score
const getOptimizationColor = (score: number) => {
  if (score >= 80) return '#4CAF50'; // Green for good
  if (score >= 60) return '#FFC107'; // Yellow for medium
  return '#F44336'; // Red for poor
};

// Utility to track API call times
export const trackApiCall = (startTime: number) => {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Keep only the last 10 API calls for a rolling average
  if (!PerformanceMonitor) return;
  
  const instance = (PerformanceMonitor as any);
  if (instance.apiCallTimes && instance.apiCallTimes.current) {
    instance.apiCallTimes.current.push(duration);
    if (instance.apiCallTimes.current.length > 10) {
      instance.apiCallTimes.current.shift();
    }
  }
};

// Utility to track component mounts
export const trackComponentMount = (componentName: string) => {
  if (!PerformanceMonitor) return;
  
  const instance = (PerformanceMonitor as any);
  if (instance.componentMounts && instance.componentMounts.current) {
    if (instance.componentMounts.current[componentName]) {
      instance.componentMounts.current[componentName]++;
    } else {
      instance.componentMounts.current[componentName] = 1;
    }
  }
};

// Utility to track component unmounts
export const trackComponentUnmount = (componentName: string) => {
  if (!PerformanceMonitor) return;
  
  const instance = (PerformanceMonitor as any);
  if (instance.componentMounts && instance.componentMounts.current) {
    if (instance.componentMounts.current[componentName]) {
      instance.componentMounts.current[componentName]--;
      if (instance.componentMounts.current[componentName] <= 0) {
        delete instance.componentMounts.current[componentName];
      }
    }
  }
};

// Utility to reset performance metrics
export const resetPerformanceMetrics = () => {
  APP_START_TIME = Date.now();
};

// Utility to get current optimization score
export const getOptimizationScore = (): number => {
  if (!PerformanceMonitor) return 0;
  
  const instance = (PerformanceMonitor as any);
  return instance.metrics ? instance.metrics.optimizationScore : 0;
};

// Utility to detect and prevent infinite loops
export const useLoopPrevention = (callback: () => void, dependencies: any[], maxCalls: number = 10) => {
  const callCount = useRef(0);
  const lastCallTime = useRef(0);
  
  useEffect(() => {
    const now = Date.now();
    
    // Prevent excessive calls in short time
    if (now - lastCallTime.current < 100) { // 100ms minimum interval
      return;
    }
    
    // Prevent too many calls
    if (callCount.current >= maxCalls) {
      console.warn('Loop prevention: Maximum calls reached for this effect');
      return;
    }
    
    callCount.current++;
    lastCallTime.current = now;
    
    callback();
  }, dependencies);
  
  // Reset counter when dependencies change significantly
  useEffect(() => {
    callCount.current = 0;
  }, [JSON.stringify(dependencies)]);
};

// Styles for the monitor
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    right: 10,
    zIndex: 9999,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  details: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  detailText: {
    color: 'white',
    fontSize: 10,
    marginBottom: 3,
  }
}); 