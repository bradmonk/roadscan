import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface ScanControlsProps {
  isScanning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export default function ScanControls({
  isScanning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false,
}: ScanControlsProps) {
  return (
    <View style={styles.container}>
      {!isScanning ? (
        <TouchableOpacity
          style={[styles.button, styles.startButton, disabled && styles.disabled]}
          onPress={onStart}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>Start Scan</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.controlGroup}>
          {!isPaused ? (
            <TouchableOpacity
              style={[styles.button, styles.pauseButton]}
              onPress={onPause}
            >
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.resumeButton]}
              onPress={onResume}
            >
              <Text style={styles.buttonText}>Resume</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={onStop}
          >
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  controlGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButton: {
    backgroundColor: '#3b82f6',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  resumeButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  disabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
