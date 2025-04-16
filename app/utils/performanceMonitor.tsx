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
export const PerformanceMonitor: React.FC<{ visible?: boolean }> = ({ visible = false }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(defaultMetrics);
  const [expanded, setExpanded] = useState(false);
  const frameCount = useRef(0);
  const lastFrameTime = useRef(Date.now());
  const renderCount = useRef(0);
  const apiCallTimes = useRef<number[]>([]);
  const componentMounts = useRef<{[key: string]: number}>({});

  // Track FPS
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastFrameTime.current;
      const fps = frameCount.current / (delta / 1000);
      
      frameCount.current = 0;
      lastFrameTime.current = now;
      
      // Calculate an optimization score based on all metrics
      // This is a simplified score - in a real app you'd need more sophisticated measurement
      const memoryUsage = Object.keys(componentMounts.current).length * 0.5; // Simple approximation
      const renderTime = renderCount.current > 0 ? 1000 / renderCount.current : 0;
      const networkLatency = apiCallTimes.current.length > 0 
        ? apiCallTimes.current.reduce((a, b) => a + b, 0) / apiCallTimes.current.length 
        : 0;
      
      const startupTime = APP_START_TIME > 0 ? Date.now() - APP_START_TIME : 0;
      
      // Calculate optimization score (0-100)
      // These weights would need to be calibrated for a real app
      const fpsScore = Math.min(fps / 60 * 40, 40); // 40% weight, optimal at 60fps
      const memoryScore = Math.max(0, 20 - memoryUsage * 0.1); // 20% weight, lower is better
      const renderScore = Math.max(0, 20 - renderTime * 0.1); // 20% weight, lower is better
      const networkScore = Math.max(0, 20 - networkLatency * 0.05); // 20% weight, lower is better
      
      const optimizationScore = Math.round(fpsScore + memoryScore + renderScore + networkScore);
      
      setMetrics({
        fps: Math.round(fps * 10) / 10,
        memoryUsage: Math.round(memoryUsage * 100) / 100,
        renderTime: Math.round(renderTime * 100) / 100,
        networkLatency: Math.round(networkLatency),
        startupTime: Math.round(startupTime / 100) / 10,
        optimizationScore
      });
      
      // Reset render count after calculating
      renderCount.current = 0;
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Frame counter
  useEffect(() => {
    const intervalId = setInterval(() => {
      frameCount.current++;
      renderCount.current++;
    }, 16.67); // ~60fps
    
    return () => clearInterval(intervalId);
  }, []);
  
  // If the component isn't visible, just return null
  if (!visible) return null;
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: getOptimizationColor(metrics.optimizationScore) }]}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.buttonText}>
          Opt: {metrics.optimizationScore}%
        </Text>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.details}>
          <Text style={styles.detailText}>FPS: {metrics.fps}</Text>
          <Text style={styles.detailText}>Memory Usage: {metrics.memoryUsage}</Text>
          <Text style={styles.detailText}>Render Time: {metrics.renderTime}ms</Text>
          <Text style={styles.detailText}>Network Latency: {metrics.networkLatency}ms</Text>
          <Text style={styles.detailText}>Startup Time: {metrics.startupTime}s</Text>
        </View>
      )}
    </View>
  );
};

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