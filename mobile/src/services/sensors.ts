import { Accelerometer, Gyroscope } from 'expo-sensors';
import { Subscription } from 'expo-sensors/build/Pedometer';
import { SensorReading } from '../types';

export interface SensorData {
  accelerometer: SensorReading;
  gyroscope: SensorReading;
}

export class SensorService {
  private accelerometerSubscription: Subscription | null = null;
  private gyroscopeSubscription: Subscription | null = null;
  private accelerometerData: SensorReading[] = [];
  private gyroscopeData: SensorReading[] = [];
  private callback: ((data: SensorData) => void) | null = null;
  private sampleRate: number;

  constructor(sampleRateMs: number = 100) {
    this.sampleRate = sampleRateMs;
  }

  /**
   * Check if sensors are available on the device
   */
  async checkAvailability(): Promise<{
    accelerometer: boolean;
    gyroscope: boolean;
  }> {
    const [accelAvailable, gyroAvailable] = await Promise.all([
      Accelerometer.isAvailableAsync(),
      Gyroscope.isAvailableAsync(),
    ]);

    return {
      accelerometer: accelAvailable,
      gyroscope: gyroAvailable,
    };
  }

  /**
   * Start collecting sensor data
   */
  async start(callback: (data: SensorData) => void): Promise<void> {
    this.callback = callback;

    // Set update intervals
    Accelerometer.setUpdateInterval(this.sampleRate);
    Gyroscope.setUpdateInterval(this.sampleRate);

    // Subscribe to accelerometer
    this.accelerometerSubscription = Accelerometer.addListener((data) => {
      const reading: SensorReading = {
        x: data.x,
        y: data.y,
        z: data.z,
        timestamp: Date.now(),
      };
      
      this.accelerometerData.push(reading);
      this.emitData();
    });

    // Subscribe to gyroscope
    this.gyroscopeSubscription = Gyroscope.addListener((data) => {
      const reading: SensorReading = {
        x: data.x,
        y: data.y,
        z: data.z,
        timestamp: Date.now(),
      };
      
      this.gyroscopeData.push(reading);
      this.emitData();
    });
  }

  /**
   * Stop collecting sensor data
   */
  stop(): void {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }

    if (this.gyroscopeSubscription) {
      this.gyroscopeSubscription.remove();
      this.gyroscopeSubscription = null;
    }

    this.callback = null;
    this.clearBuffers();
  }

  /**
   * Get buffered accelerometer data
   */
  getAccelerometerBuffer(): SensorReading[] {
    return [...this.accelerometerData];
  }

  /**
   * Get buffered gyroscope data
   */
  getGyroscopeBuffer(): SensorReading[] {
    return [...this.gyroscopeData];
  }

  /**
   * Clear sensor data buffers
   */
  clearBuffers(): void {
    this.accelerometerData = [];
    this.gyroscopeData = [];
  }

  /**
   * Get buffered data from the last N milliseconds
   */
  getRecentData(durationMs: number): {
    accelerometer: SensorReading[];
    gyroscope: SensorReading[];
  } {
    const now = Date.now();
    const cutoff = now - durationMs;

    return {
      accelerometer: this.accelerometerData.filter((r) => r.timestamp >= cutoff),
      gyroscope: this.gyroscopeData.filter((r) => r.timestamp >= cutoff),
    };
  }

  /**
   * Trim buffers to keep only recent data (memory management)
   */
  trimBuffers(maxAgeMs: number): void {
    const now = Date.now();
    const cutoff = now - maxAgeMs;

    this.accelerometerData = this.accelerometerData.filter(
      (r) => r.timestamp >= cutoff
    );
    this.gyroscopeData = this.gyroscopeData.filter(
      (r) => r.timestamp >= cutoff
    );
  }

  /**
   * Emit data to callback if both sensors have data
   */
  private emitData(): void {
    if (
      this.callback &&
      this.accelerometerData.length > 0 &&
      this.gyroscopeData.length > 0
    ) {
      const latestAccel =
        this.accelerometerData[this.accelerometerData.length - 1];
      const latestGyro = this.gyroscopeData[this.gyroscopeData.length - 1];

      this.callback({
        accelerometer: latestAccel,
        gyroscope: latestGyro,
      });
    }
  }
}

// Singleton instance
export const sensorService = new SensorService();
