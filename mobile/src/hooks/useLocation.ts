import { useState, useEffect, useCallback } from 'react';
import { locationService } from '../services/location';
import { LocationData } from '../types';
import * as Location from 'expo-location';
import { mockDataGenerator, testScenarios } from '../services/mockData';

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export interface UseLocationOptions {
  enabled?: boolean;
  accuracy?: Location.LocationAccuracy;
  distanceInterval?: number;
  timeInterval?: number;
  mockMode?: boolean;
  mockScenario?: keyof typeof testScenarios;
}

export interface UseLocationReturn {
  location: LocationData | null;
  hasPermission: boolean;
  isTracking: boolean;
  error: string | null;
  totalDistance: number;
  requestPermission: () => Promise<boolean>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  clearHistory: () => void;
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const {
    enabled = false,
    accuracy = Location.Accuracy.High,
    distanceInterval = 10,
    timeInterval = 1000,
    mockMode = false,
    mockScenario = 'mixedConditions',
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [mockInterval, setMockInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastMockLocation, setLastMockLocation] = useState<LocationData | null>(null);

  // Request location permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (mockMode) {
      // In mock mode, permission is always granted
      setHasPermission(true);
      return true;
    }

    try {
      const granted = await locationService.requestPermissions();
      setHasPermission(granted);

      if (!granted) {
        setError('Location permission denied');
      } else {
        setError(null);
      }

      return granted;
    } catch (err) {
      setError('Failed to request location permission');
      console.error('Location permission error:', err);
      return false;
    }
  }, [mockMode]);

  // Start tracking location
  const startTracking = useCallback(async () => {
    try {
      setError(null);
      
      if (mockMode) {
        // Use mock data generator
        const scenario = testScenarios[mockScenario as keyof typeof testScenarios] || testScenarios.mixedConditions;
        console.log('🚗 Starting mock location with pattern:', scenario.pattern, 'scenario:', mockScenario);
        mockDataGenerator.reset();
        
        // Enable variable mode if using variable road scenario
        mockDataGenerator.setVariableMode(scenario.quality === 'variable');
        
        let previousLocation: LocationData | null = null;
        
        const interval = setInterval(() => {
          const mockLoc = mockDataGenerator.generateLocation(scenario.pattern);
          const locationData: LocationData = {
            latitude: mockLoc.latitude,
            longitude: mockLoc.longitude,
            altitude: mockLoc.altitude,
            speed: mockLoc.speed,
            heading: mockLoc.heading,
            accuracy: 10,
            timestamp: mockLoc.timestamp,
          };
          
          // Calculate distance if we have a previous location
          if (previousLocation) {
            const dist = calculateDistance(
              previousLocation.latitude,
              previousLocation.longitude,
              locationData.latitude,
              locationData.longitude
            );
            setTotalDistance(prev => prev + dist);
          }
          
          previousLocation = locationData;
          setLocation(locationData);
        }, timeInterval);
        
        setMockInterval(interval);
        setIsTracking(true);
      } else {
        // Use real location service
        const success = await locationService.startTracking(
          (loc) => {
            setLocation(loc);
            setTotalDistance(locationService.getTotalDistance());
          },
          {
            accuracy,
            distanceInterval,
            timeInterval,
          }
        );

        if (success) {
          setIsTracking(true);
        } else {
          setError('Failed to start location tracking');
        }
      }
    } catch (err) {
      setError('Failed to start location tracking');
      console.error('Location tracking error:', err);
    }
  }, [mockMode, mockScenario, timeInterval, accuracy, distanceInterval]);

  // Stop tracking location
  const stopTracking = useCallback(() => {
    if (mockInterval) {
      clearInterval(mockInterval);
      setMockInterval(null);
    }
    locationService.stopTracking();
    setIsTracking(false);
  }, [mockInterval]);

  // Clear location history
  const clearHistory = useCallback(() => {
    locationService.clearHistory();
    setTotalDistance(0);
    setLastMockLocation(null);
  }, []);

  // Check permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const servicesEnabled = await locationService.isLocationEnabled();
      if (!servicesEnabled) {
        setError('Location services are disabled');
      }
    };

    checkPermission();
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (enabled && hasPermission && !isTracking) {
      startTracking();
    }

    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [enabled, hasPermission, isTracking, startTracking, stopTracking]);

  return {
    location,
    hasPermission,
    isTracking,
    error,
    totalDistance,
    requestPermission,
    startTracking,
    stopTracking,
    clearHistory,
  };
}
