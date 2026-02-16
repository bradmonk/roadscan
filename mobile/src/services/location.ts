import * as Location from 'expo-location';
import { LocationData } from '../types';

export interface LocationServiceConfig {
  accuracy: Location.LocationAccuracy;
  distanceInterval?: number;
  timeInterval?: number;
}

export class LocationService {
  private subscription: Location.LocationSubscription | null = null;
  private locationHistory: LocationData[] = [];
  private callback: ((location: LocationData) => void) | null = null;
  private hasPermission: boolean = false;

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.hasPermission = status === 'granted';
      
      if (!this.hasPermission) {
        console.warn('Location permission denied');
      }
      
      return this.hasPermission;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Request background location permissions (for continuous tracking)
   */
  async requestBackgroundPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      const granted = status === 'granted';
      
      if (!granted) {
        console.warn('Background location permission denied');
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting background location permissions:', error);
      return false;
    }
  }

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  /**
   * Get current location once
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return this.formatLocation(location);
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Start tracking location
   */
  async startTracking(
    callback: (location: LocationData) => void,
    config: LocationServiceConfig = {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10, // meters
      timeInterval: 1000, // ms
    }
  ): Promise<boolean> {
    if (!this.hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) return false;
    }

    try {
      this.callback = callback;

      this.subscription = await Location.watchPositionAsync(
        {
          accuracy: config.accuracy,
          distanceInterval: config.distanceInterval,
          timeInterval: config.timeInterval,
        },
        (location) => {
          const formattedLocation = this.formatLocation(location);
          this.locationHistory.push(formattedLocation);
          
          if (this.callback) {
            this.callback(formattedLocation);
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  /**
   * Stop tracking location
   */
  stopTracking(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.callback = null;
  }

  /**
   * Get location history
   */
  getLocationHistory(): LocationData[] {
    return [...this.locationHistory];
  }

  /**
   * Clear location history
   */
  clearHistory(): void {
    this.locationHistory = [];
  }

  /**
   * Get recent location data
   */
  getRecentLocations(durationMs: number): LocationData[] {
    const now = Date.now();
    const cutoff = now - durationMs;
    return this.locationHistory.filter((loc) => loc.timestamp >= cutoff);
  }

  /**
   * Trim location history to save memory
   */
  trimHistory(maxAgeMs: number): void {
    const now = Date.now();
    const cutoff = now - maxAgeMs;
    this.locationHistory = this.locationHistory.filter(
      (loc) => loc.timestamp >= cutoff
    );
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Calculate total distance traveled
   */
  getTotalDistance(): number {
    if (this.locationHistory.length < 2) return 0;

    let total = 0;
    for (let i = 1; i < this.locationHistory.length; i++) {
      const prev = this.locationHistory[i - 1];
      const curr = this.locationHistory[i];
      total += this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
    }

    return total;
  }

  /**
   * Format location object
   */
  private formatLocation(location: Location.LocationObject): LocationData {
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude || undefined,
      accuracy: location.coords.accuracy || undefined,
      speed: location.coords.speed || undefined,
      heading: location.coords.heading || undefined,
      timestamp: location.timestamp,
    };
  }
}

// Singleton instance
export const locationService = new LocationService();
