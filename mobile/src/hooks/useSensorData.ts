import { useState, useEffect, useCallback } from 'react';
import { sensorService, SensorData } from '../services/sensors';

export interface UseSensorDataOptions {
  enabled?: boolean;
  sampleRateMs?: number;
  bufferDurationMs?: number;
}

export interface UseSensorDataReturn {
  data: SensorData | null;
  isAvailable: boolean;
  isCollecting: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  clearBuffer: () => void;
}

export function useSensorData(
  options: UseSensorDataOptions = {}
): UseSensorDataReturn {
  const {
    enabled = false,
    sampleRateMs = 100,
    bufferDurationMs = 5000,
  } = options;

  const [data, setData] = useState<SensorData | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check sensor availability on mount
  useEffect(() => {
    const checkSensors = async () => {
      try {
        const availability = await sensorService.checkAvailability();
        const available = availability.accelerometer && availability.gyroscope;
        setIsAvailable(available);

        if (!available) {
          setError('Required sensors not available on this device');
        }
      } catch (err) {
        setError('Failed to check sensor availability');
        console.error('Sensor availability check error:', err);
      }
    };

    checkSensors();
  }, []);

  // Start collecting data
  const start = useCallback(async () => {
    if (!isAvailable) {
      setError('Sensors not available');
      return;
    }

    try {
      setError(null);
      await sensorService.start((sensorData) => {
        setData(sensorData);
      });
      setIsCollecting(true);
    } catch (err) {
      setError('Failed to start sensor collection');
      console.error('Sensor start error:', err);
    }
  }, [isAvailable]);

  // Stop collecting data
  const stop = useCallback(() => {
    sensorService.stop();
    setIsCollecting(false);
    setData(null);
  }, []);

  // Clear buffer
  const clearBuffer = useCallback(() => {
    sensorService.clearBuffers();
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (enabled && isAvailable && !isCollecting) {
      start();
    }

    return () => {
      if (isCollecting) {
        stop();
      }
    };
  }, [enabled, isAvailable, isCollecting, start, stop]);

  // Periodically trim buffers to manage memory
  useEffect(() => {
    if (!isCollecting) return;

    const interval = setInterval(() => {
      sensorService.trimBuffers(bufferDurationMs);
    }, bufferDurationMs);

    return () => clearInterval(interval);
  }, [isCollecting, bufferDurationMs]);

  return {
    data,
    isAvailable,
    isCollecting,
    error,
    start,
    stop,
    clearBuffer,
  };
}
