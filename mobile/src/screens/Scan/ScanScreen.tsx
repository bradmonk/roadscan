import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import RoadMapView, { RoadSegment } from '../../components/RoadMapView';
import ScanControls from '../../components/ScanControls';
import ScanStats from '../../components/ScanStats';
import { useSensorData } from '../../hooks/useSensorData';
import { useLocation } from '../../hooks/useLocation';
import { useRoughness } from '../../hooks/useRoughness';
import { roughnessCalculator } from '../../services/roughness';
import { LocationData } from '../../types';

type ScanState = 'idle' | 'scanning' | 'paused';

export default function ScanScreen() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [scanStartTime, setScanStartTime] = useState<number>(0);
  const [scanDuration, setScanDuration] = useState<number>(0);
  const [lastSegmentLocation, setLastSegmentLocation] = useState<LocationData | null>(
    null
  );

  // Initialize hooks
  const {
    data: sensorData,
    isAvailable: sensorsAvailable,
    start: startSensors,
    stop: stopSensors,
  } = useSensorData({ enabled: scanState === 'scanning' });

  const {
    location,
    hasPermission,
    totalDistance,
    requestPermission,
    startTracking,
    stopTracking,
    clearHistory,
  } = useLocation({ enabled: scanState === 'scanning' });

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

  // Create new segment when roughness is calculated
  useEffect(() => {
    if (
      scanState === 'scanning' &&
      currentRoughness &&
      location &&
      lastSegmentLocation
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
      setLastSegmentLocation(location);
    }
  }, [currentRoughness, location, lastSegmentLocation, scanState]);

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

    // Start tracking
    setScanState('scanning');
    setScanStartTime(Date.now());
    setScanDuration(0);
    setSegments([]);
    setLastSegmentLocation(location);
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
        onPress: () => {
          setScanState('idle');
          setSegments([]);
          setScanDuration(0);
          stopTracking();
          stopSensors();
          clearHistory();
        },
      },
      {
        text: 'Save',
        onPress: () => {
          // TODO: Save to database
          setScanState('idle');
          setScanDuration(0);
          stopTracking();
          stopSensors();
          
          Alert.alert('Success', 'Scan saved successfully!', [
            {
              text: 'OK',
              onPress: () => {
                setSegments([]);
                clearHistory();
              },
            },
          ]);
        },
      },
    ]);
  }, [stopTracking, stopSensors, clearHistory]);

  return (
    <View style={styles.container}>
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

      {/* Controls */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
