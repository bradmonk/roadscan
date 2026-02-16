import { useState, useEffect, useCallback, useRef } from 'react';
import { sensorService } from '../services/sensors';
import { roughnessCalculator, RoughnessResult } from '../services/roughness';
import { SEGMENT_DURATION } from '../constants';

export interface UseRoughnessOptions {
  enabled?: boolean;
  segmentDurationMs?: number;
  speed?: number;
}

export interface UseRoughnessReturn {
  currentRoughness: RoughnessResult | null;
  isCalculating: boolean;
  error: string | null;
}

export function useRoughness(
  options: UseRoughnessOptions = {}
): UseRoughnessReturn {
  const { enabled = false, segmentDurationMs = SEGMENT_DURATION, speed } = options;

  const [currentRoughness, setCurrentRoughness] = useState<RoughnessResult | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calculationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate roughness periodically
  const calculateRoughness = useCallback(() => {
    try {
      setIsCalculating(true);
      setError(null);

      // Get recent sensor data
      const recentData = sensorService.getRecentData(segmentDurationMs);

      if (recentData.accelerometer.length < 10) {
        // Not enough data yet
        setCurrentRoughness(null);
        return;
      }

      // Calculate roughness
      const result = roughnessCalculator.calculateRoughness(
        recentData.accelerometer,
        speed
      );

      setCurrentRoughness(result);
    } catch (err) {
      setError('Failed to calculate roughness');
      console.error('Roughness calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [segmentDurationMs, speed]);

  // Set up periodic calculation
  useEffect(() => {
    if (!enabled) {
      if (calculationIntervalRef.current) {
        clearInterval(calculationIntervalRef.current);
        calculationIntervalRef.current = null;
      }
      setCurrentRoughness(null);
      return;
    }

    // Calculate immediately
    calculateRoughness();

    // Then calculate at intervals
    calculationIntervalRef.current = setInterval(
      calculateRoughness,
      segmentDurationMs
    );

    return () => {
      if (calculationIntervalRef.current) {
        clearInterval(calculationIntervalRef.current);
        calculationIntervalRef.current = null;
      }
    };
  }, [enabled, calculateRoughness, segmentDurationMs]);

  return {
    currentRoughness,
    isCalculating,
    error,
  };
}
