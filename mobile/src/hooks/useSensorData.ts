import { useState, useEffect, useCallback } from 'react';
import { sensorService, SensorData } from '../services/sensors';
import { mockDataGenerator, testScenarios } from '../services/mockData';

export interface UseSensorDataOptions {
  enabled?: boolean;
  sampleRateMs?: number;
  bufferDurationMs?: number;
  mockMode?: boolean;
  mockScenario?: keyof typeof testScenarios;
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
    mockMode = false,
    mockScenario = 'mixedConditions',
  } = options;

  const [data, setData] = useState<SensorData | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockInterval, setMockInterval] = useState<NodeJS.Timeout | null>(null);

  // Check sensor availability on mount
  useEffect(() => {
    const checkSensors = async () => {
      if (mockMode) {
        // In mock mode, sensors are always "available"
        setIsAvailable(true);
        return;
      }

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
  }, [mockMode]);

  // Start collecting data
  const start = useCallback(async () => {
    if (!isAvailable) {
      setError('Sensors not available');
      return;
    }

    try {
      setError(null);
      
      if (mockMode) {
        // Use mock data generator
        const scenario = testScenarios[mockScenario as keyof typeof testScenarios] || testScenarios.mixedConditions;
        console.log('🎯 Starting mock sensors with quality:', scenario.quality);
        
        const interval = setInterval(() => {
          const mockData = mockDataGenerator.generateSensorData(scenario.quality);
          const timestamp = Date.now();
          const sensorData: SensorData = {
            accelerometer: { ...mockData.accelerometer, timestamp },
            gyroscope: { ...mockData.gyroscope, timestamp },
          };
          
          // Store in sensor service buffer for roughness calculation
          sensorService.storeMockData(sensorData);
          
          // Update state for display
          setData(sensorData);
        }, sampleRateMs);
        setMockInterval(interval);
        setIsCollecting(true);
      } else {
        // Use real sensors
        await sensorService.start((sensorData) => {
          setData(sensorData);
        });
        setIsCollecting(true);
      }
    } catch (err) {
      setError('Failed to start sensor collection');
      console.error('Sensor start error:', err);
    }
  }, [isAvailable, mockMode, mockScenario, sampleRateMs]);

  // Stop collecting data
  const stop = useCallback(() => {
    if (mockInterval) {
      clearInterval(mockInterval);
      setMockInterval(null);
    }
    sensorService.stop();
    setIsCollecting(false);
    setData(null);
  }, [mockInterval]);

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
