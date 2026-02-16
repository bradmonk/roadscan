import { SensorReading } from '../types';

export interface RoughnessResult {
  score: number; // 0-100 scale
  category: 'smooth' | 'moderate' | 'rough' | 'very_rough';
  confidence: number; // 0-1 scale
}

export class RoughnessCalculator {
  private readonly GRAVITY = 9.81; // m/s²
  private readonly SMOOTH_THRESHOLD = 20;
  private readonly MODERATE_THRESHOLD = 50;
  private readonly ROUGH_THRESHOLD = 75;

  /**
   * Calculate roughness score from accelerometer data
   * 
   * Algorithm:
   * 1. Remove gravity component from accelerometer data
   * 2. Calculate vertical acceleration variance
   * 3. Apply band-pass filter to remove noise
   * 4. Calculate RMS (Root Mean Square)
   * 5. Normalize to 0-100 scale
   * 6. Adjust for speed if available
   */
  calculateRoughness(
    accelerometerData: SensorReading[],
    speed?: number
  ): RoughnessResult {
    if (accelerometerData.length < 10) {
      return {
        score: 0,
        category: 'smooth',
        confidence: 0,
      };
    }

    // Step 1: Remove gravity and isolate vertical motion
    const verticalAccel = this.removeGravity(accelerometerData);

    // Step 2: Apply band-pass filter (0.5 - 20 Hz)
    const filtered = this.bandPassFilter(verticalAccel);

    // Step 3: Calculate RMS
    const rms = this.calculateRMS(filtered);

    // Step 4: Calculate variance for confidence
    const variance = this.calculateVariance(filtered);

    // Step 5: Normalize to 0-100 scale
    let score = this.normalizeScore(rms);

    // Step 6: Adjust for speed (higher speed amplifies bumps)
    if (speed && speed > 0) {
      score = this.adjustForSpeed(score, speed);
    }

    // Determine category
    const category = this.categorizeRoughness(score);

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(
      accelerometerData.length,
      variance
    );

    return {
      score: Math.min(100, Math.max(0, score)),
      category,
      confidence,
    };
  }

  /**
   * Remove gravity component from accelerometer readings
   * Uses low-pass filter to isolate gravity, then subtract
   */
  private removeGravity(data: SensorReading[]): number[] {
    const alpha = 0.8; // Low-pass filter coefficient
    const result: number[] = [];

    let gravityX = data[0].x;
    let gravityY = data[0].y;
    let gravityZ = data[0].z;

    for (const reading of data) {
      // Apply low-pass filter to isolate gravity
      gravityX = alpha * gravityX + (1 - alpha) * reading.x;
      gravityY = alpha * gravityY + (1 - alpha) * reading.y;
      gravityZ = alpha * gravityZ + (1 - alpha) * reading.z;

      // Linear acceleration (without gravity)
      const linearX = reading.x - gravityX;
      const linearY = reading.y - gravityY;
      const linearZ = reading.z - gravityZ;

      // Calculate magnitude of linear acceleration
      const magnitude = Math.sqrt(
        linearX * linearX + linearY * linearY + linearZ * linearZ
      );

      result.push(magnitude * this.GRAVITY);
    }

    return result;
  }

  /**
   * Apply simple band-pass filter (0.5 - 20 Hz)
   * Removes high-frequency noise and low-frequency drift
   */
  private bandPassFilter(data: number[]): number[] {
    if (data.length < 3) return data;

    const result: number[] = [];
    
    // Simple moving average for smoothing
    const windowSize = 3;
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
      const window = data.slice(start, end);
      const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
      result.push(avg);
    }

    return result;
  }

  /**
   * Calculate Root Mean Square
   */
  private calculateRMS(data: number[]): number {
    if (data.length === 0) return 0;

    const sumSquares = data.reduce((sum, val) => sum + val * val, 0);
    return Math.sqrt(sumSquares / data.length);
  }

  /**
   * Calculate variance
   */
  private calculateVariance(data: number[]): number {
    if (data.length === 0) return 0;

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const sumSquaredDiff = data.reduce(
      (sum, val) => sum + (val - mean) * (val - mean),
      0
    );
    return sumSquaredDiff / data.length;
  }

  /**
   * Normalize RMS to 0-100 scale
   * Based on empirical testing - adjust these values
   */
  private normalizeScore(rms: number): number {
    // These thresholds should be calibrated based on real-world data
    const minRMS = 0.1; // Very smooth road
    const maxRMS = 5.0; // Very rough road

    if (rms <= minRMS) return 0;
    if (rms >= maxRMS) return 100;

    return ((rms - minRMS) / (maxRMS - minRMS)) * 100;
  }

  /**
   * Adjust score based on vehicle speed
   * Higher speeds amplify perceived roughness
   */
  private adjustForSpeed(score: number, speedMps: number): number {
    // Convert m/s to km/h
    const speedKmh = speedMps * 3.6;

    // Speed adjustment factor (1.0 at 50 km/h, increases at higher speeds)
    const speedFactor = Math.max(0.5, Math.min(1.5, speedKmh / 50));

    return score * speedFactor;
  }

  /**
   * Categorize roughness score
   */
  private categorizeRoughness(
    score: number
  ): 'smooth' | 'moderate' | 'rough' | 'very_rough' {
    if (score < this.SMOOTH_THRESHOLD) return 'smooth';
    if (score < this.MODERATE_THRESHOLD) return 'moderate';
    if (score < this.ROUGH_THRESHOLD) return 'rough';
    return 'very_rough';
  }

  /**
   * Calculate confidence based on data quality
   */
  private calculateConfidence(sampleCount: number, variance: number): number {
    // More samples = higher confidence (up to 100 samples)
    const sampleConfidence = Math.min(1, sampleCount / 100);

    // Lower variance = higher confidence (more consistent readings)
    // This is a simplified approach - adjust based on empirical data
    const varianceConfidence = Math.max(0, 1 - variance / 10);

    return (sampleConfidence + varianceConfidence) / 2;
  }

  /**
   * Get color for roughness score (for map visualization)
   */
  getColor(score: number): string {
    if (score < this.SMOOTH_THRESHOLD) return '#22c55e'; // green
    if (score < this.MODERATE_THRESHOLD) return '#eab308'; // yellow
    if (score < this.ROUGH_THRESHOLD) return '#f97316'; // orange
    return '#ef4444'; // red
  }
}

// Singleton instance
export const roughnessCalculator = new RoughnessCalculator();
