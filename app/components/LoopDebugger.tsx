import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { getAllLoopDetectorStatuses, resetAllLoopDetectors } from '../utils/loopDetector';

interface LoopDebuggerProps {
  visible?: boolean;
}

export const LoopDebugger: React.FC<LoopDebuggerProps> = ({ visible = false }) => {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      const currentStatuses = getAllLoopDetectorStatuses();
      setStatuses(currentStatuses);
      setLastUpdate(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleResetAll = () => {
    resetAllLoopDetectors();
    setStatuses([]);
    setLastUpdate(Date.now());
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔄 Loop Debugger</Text>
        <TouchableOpacity onPress={handleResetAll} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>Last Update: {new Date(lastUpdate).toLocaleTimeString()}</Text>
        
        {statuses.length === 0 ? (
          <Text style={styles.noData}>No loop detectors active</Text>
        ) : (
          statuses.map((status, index) => (
            <View key={index} style={styles.statusItem}>
              <Text style={styles.componentName}>{status.componentName}</Text>
              <Text style={styles.statusText}>
                Calls: {status.callCount}/{status.maxCalls}
              </Text>
              <Text style={styles.statusText}>
                Blocked: {status.isBlocked ? 'Yes' : 'No'}
              </Text>
              {status.isBlocked && (
                <Text style={styles.statusText}>
                  Block Time: {Math.round(status.timeSinceBlock / 1000)}s
                </Text>
              )}
              <Text style={styles.statusText}>
                Time Window: {status.timeWindow / 1000}s
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    width: 300,
    maxHeight: 400,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    padding: 12,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  subtitle: {
    color: '#cccccc',
    fontSize: 12,
    marginBottom: 8,
  },
  noData: {
    color: '#888888',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  statusItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  componentName: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
});

export default LoopDebugger;
