import { useState, useEffect, useCallback } from 'react';
import { locationService } from '../services/location';
import { LocationData } from '../types';
import * as Location from 'expo-location';

export interface UseLocationOptions {
  enabled?: boolean;
  accuracy?: Location.LocationAccuracy;
  distanceInterval?: number;
  timeInterval?: number;
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
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);

  // Request location permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
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
  }, []);

  // Start tracking location
  const startTracking = useCallback(async () => {
    try {
      setError(null);
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
    } catch (err) {
      setError('Error starting location tracking');
      console.error('Location tracking error:', err);
    }
  }, [accuracy, distanceInterval, timeInterval]);

  // Stop tracking location
  const stopTracking = useCallback(() => {
    locationService.stopTracking();
    setIsTracking(false);
  }, []);

  // Clear location history
  const clearHistory = useCallback(() => {
    locationService.clearHistory();
    setTotalDistance(0);
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
