import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, Modal, ScrollView, SafeAreaView } from 'react-native';
import RoadMapView, { RoadSegment } from '../../components/RoadMapView';
import ScanControls from '../../components/ScanControls';
import ScanStats from '../../components/ScanStats';
import { useSensorData } from '../../hooks/useSensorData';
import { useLocation } from '../../hooks/useLocation';
import { useRoughness } from '../../hooks/useRoughness';
import { useMockMode } from '../../hooks/useMockMode';
import { roughnessCalculator } from '../../services/roughness';
import { syncService } from '../../services/sync';
import { LocationData } from '../../types';
import { Colors } from '../../constants';
import { testScenarios } from '../../services/mockData';

type ScanState = 'idle' | 'scanning' | 'paused';

export default function ScanScreen() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [scanStartTime, setScanStartTime] = useState<number>(0);
  const [scanDuration, setScanDuration] = useState<number>(0);
  const [lastSegmentLocation, setLastSegmentLocation] = useState<LocationData | null>(
    null
  );
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [allRoughnessScores, setAllRoughnessScores] = useState<number[]>([]);
  const [showDevMenu, setShowDevMenu] = useState(false);

  // Mock mode hook
  const { isMockMode, mockScenario, toggleMockMode, setScenario } = useMockMode();

  // Initialize hooks with mock mode support
  const {
    data: sensorData,
    isAvailable: sensorsAvailable,
    start: startSensors,
    stop: stopSensors,
  } = useSensorData({ 
    enabled: scanState === 'scanning',
    mockMode: isMockMode,
    mockScenario: mockScenario as any,
  });

  const {
    location,
    hasPermission,
    totalDistance,
    requestPermission,
    startTracking,
    stopTracking,
    clearHistory,
  } = useLocation({ 
    enabled: scanState === 'scanning',
    mockMode: isMockMode,
    mockScenario: mockScenario as any,
  });

  const { currentRoughness } = useRoughness({
    enabled: scanState === 'scanning',
    speed: location?.speed,
  });

  // Update scan duration
  useEffect(() => {
    if (scanState !== 'scanning') return;

    const interval = setInterval(() => {
      setScanDuration(Math.floor((Date.now() - scanStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [scanState, scanStartTime]);

  // Initialize first location when tracking starts
  useEffect(() => {
    if (scanState === 'scanning' && location && !lastSegmentLocation) {
      setLastSegmentLocation(location);
    }
  }, [scanState, location, lastSegmentLocation]);

  // Create new segment when roughness is calculated
  useEffect(() => {
    if (
      scanState === 'scanning' &&
      currentRoughness &&
      location &&
      lastSegmentLocation &&
      currentSessionId
    ) {
      const newSegment: RoadSegment = {
        coordinates: [
          {
            latitude: lastSegmentLocation.latitude,
            longitude: lastSegmentLocation.longitude,
          },
          {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        ],
        roughnessScore: currentRoughness.score,
        color: roughnessCalculator.getColor(currentRoughness.score),
      };

      setSegments((prev) => [...prev, newSegment]);
      setAllRoughnessScores((prev) => [...prev, currentRoughness.score]);
      setLastSegmentLocation(location);

      // Save segment to database
      syncService.saveScanSegment({
        session_id: currentSessionId,
        start_lat: lastSegmentLocation.latitude,
        start_lng: lastSegmentLocation.longitude,
        end_lat: location.latitude,
        end_lng: location.longitude,
        average_roughness: currentRoughness.score,
        segment_duration_seconds: 5,
      });
    }
  }, [currentRoughness, location, lastSegmentLocation, scanState, currentSessionId]);

  // Handle start scan
  const handleStart = useCallback(async () => {
    // Check sensors
    if (!sensorsAvailable) {
      Alert.alert(
        'Sensors Unavailable',
        'This device does not have the required sensors for road scanning.'
      );
      return;
    }

    // Check/request location permission
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Location permission is required to scan roads. Please enable it in your device settings.'
        );
        return;
      }
    }

    // Create new session in database
    const sessionId = await syncService.saveScanSession({
      started_at: new Date().toISOString(),
      status: 'active',
    });

    if (!sessionId) {
      Alert.alert('Error', 'Failed to start scan session');
      return;
    }

    // Start tracking
    setScanState('scanning');
    setCurrentSessionId(sessionId);
    setScanStartTime(Date.now());
    setScanDuration(0);
    setSegments([]);
    setAllRoughnessScores([]);
    setLastSegmentLocation(null);
    clearHistory();
    
    await startTracking();
    startSensors();
  }, [
    sensorsAvailable,
    hasPermission,
    location,
    requestPermission,
    startTracking,
    startSensors,
    clearHistory,
  ]);

  // Handle pause scan
  const handlePause = useCallback(() => {
    setScanState('paused');
    stopTracking();
    stopSensors();
  }, [stopTracking, stopSensors]);

  // Handle resume scan
  const handleResume = useCallback(async () => {
    setScanState('scanning');
    setLastSegmentLocation(location);
    await startTracking();
    startSensors();
  }, [location, startTracking, startSensors]);

  // Handle stop scan
  const handleStop = useCallback(() => {
    Alert.alert('Save Scan?', 'Would you like to save this scan session?', [
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          if (currentSessionId) {
            await syncService.deleteScanSession(currentSessionId);
          }
          setScanState('idle');
          setCurrentSessionId(null);
          setScanDuration(0);
          stopTracking();
          stopSensors();
          clearHistory();
          // Note: segments remain visible for inspection
        },
      },
      {
        text: 'Save',
        onPress: async () => {
          if (currentSessionId) {
            // Calculate average roughness
            const avgRoughness =
              allRoughnessScores.length > 0
                ? allRoughnessScores.reduce((a, b) => a + b, 0) / allRoughnessScores.length
                : 0;

            // End the session
            await syncService.endScanSession(
              currentSessionId,
              totalDistance,
              avgRoughness
            );
          }

          setScanState('idle');
          setCurrentSessionId(null);
          setScanDuration(0);
          stopTracking();
          stopSensors();
          
          Alert.alert('Success', 'Scan saved successfully!', [
            {
              text: 'OK',
              onPress: () => {
                clearHistory();
                // Note: segments remain visible for inspection
              },
            },
          ]);
        },
      },
    ]);
  }, [currentSessionId, totalDistance, allRoughnessScores, stopTracking, stopSensors, clearHistory]);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Stats display */}
        <ScanStats
          roughness={currentRoughness}
          distance={totalDistance}
          speed={location?.speed}
          duration={scanDuration}
        />

        {/* Map */}
        <RoadMapView
          currentLocation={location}
          segments={segments}
          followUser={scanState === 'scanning'}
        />
      </View>

      {/* Controls - positioned at bottom */}
      <View style={styles.controlsContainer}>
        <ScanControls
          isScanning={scanState !== 'idle'}
          isPaused={scanState === 'paused'}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          disabled={!sensorsAvailable}
        />
      </View>

      {/* Dev Mode Button */}
      <TouchableOpacity
        style={styles.devButton}
        onPress={() => setShowDevMenu(true)}
        onLongPress={async () => {
          const newMode = await toggleMockMode();
          Alert.alert(
            'Dev Mode',
            newMode ? 'Mock mode enabled' : 'Mock mode disabled'
          );
        }}
      >
        <Text style={styles.devButtonText}>
          {isMockMode ? '🧪 DEV' : '⚙️'}
        </Text>
      </TouchableOpacity>

      {/* Dev Menu Modal */}
      <Modal
        visible={showDevMenu}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDevMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Development Mode</Text>

            <View style={styles.devSection}>
              <Text style={styles.sectionTitle}>Mode</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  isMockMode && styles.toggleButtonActive,
                ]}
                onPress={async () => {
                  const newMode = await toggleMockMode();
                  Alert.alert(
                    'Dev Mode',
                    newMode
                      ? 'Mock mode enabled - using simulated data'
                      : 'Mock mode disabled - using real sensors'
                  );
                }}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    isMockMode && styles.toggleButtonTextActive,
                  ]}
                >
                  {isMockMode ? '✓ Mock Mode Active' : 'Real Sensors'}
                </Text>
              </TouchableOpacity>
            </View>

            {isMockMode && (
              <View style={styles.devSection}>
                <Text style={styles.sectionTitle}>Test Scenarios</Text>
                <ScrollView style={styles.scenarioList}>
                  {Object.entries(testScenarios).map(([key, scenario]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.scenarioButton,
                        mockScenario === key && styles.scenarioButtonActive,
                      ]}
                      onPress={() => setScenario(key)}
                    >
                      <Text style={styles.scenarioName}>{scenario.name}</Text>
                      <Text style={styles.scenarioDescription}>
                        {scenario.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDevMenu(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
  },
  devButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  devButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  devSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  toggleButton: {
    backgroundColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  scenarioList: {
    maxHeight: 300,
  },
  scenarioButton: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scenarioButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  scenarioName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  scenarioDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
