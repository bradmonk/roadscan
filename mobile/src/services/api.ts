import { supabase } from './supabase';
import {
  ScanSession,
  SensorDataPoint,
  ScanSegment,
  LocationData,
} from '../types';
import { SensorReading } from '../types';

export class ApiService {
  /**
   * Create a new scan session
   */
  async createScanSession(): Promise<ScanSession | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('scan_sessions')
        .insert({
          user_id: user.id,
          started_at: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data as ScanSession;
    } catch (error) {
      console.error('Error creating scan session:', error);
      return null;
    }
  }

  /**
   * Update scan session
   */
  async updateScanSession(
    sessionId: string,
    updates: Partial<ScanSession>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scan_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating scan session:', error);
      return false;
    }
  }

  /**
   * End a scan session
   */
  async endScanSession(
    sessionId: string,
    totalDistance: number,
    averageRoughness: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scan_sessions')
        .update({
          ended_at: new Date().toISOString(),
          total_distance_km: totalDistance / 1000, // Convert meters to km
          average_roughness: averageRoughness,
          status: 'completed',
        })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error ending scan session:', error);
      return false;
    }
  }

  /**
   * Save a scan segment
   */
  async saveScanSegment(
    sessionId: string,
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    averageRoughness: number,
    durationSeconds: number
  ): Promise<boolean> {
    try {
      // Create WKT LINESTRING for PostGIS
      const linestring = `LINESTRING(${startLng} ${startLat}, ${endLng} ${endLat})`;

      const { error } = await supabase
        .from('scan_segments')
        .insert({
          session_id: sessionId,
          start_lat: startLat,
          start_lng: startLng,
          end_lat: endLat,
          end_lng: endLng,
          geometry: linestring,
          average_roughness: averageRoughness,
          segment_duration_seconds: durationSeconds,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving scan segment:', error);
      return false;
    }
  }

  /**
   * Save sensor data point (optional - can be used for detailed analysis)
   */
  async saveSensorDataPoint(
    sessionId: string,
    location: LocationData,
    accelerometer: SensorReading,
    gyro: SensorReading,
    roughnessScore: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sensor_data_points')
        .insert({
          session_id: sessionId,
          timestamp: new Date(location.timestamp).toISOString(),
          latitude: location.latitude,
          longitude: location.longitude,
          altitude: location.altitude,
          speed: location.speed,
          acceleration_x: accelerometer.x,
          acceleration_y: accelerometer.y,
          acceleration_z: accelerometer.z,
          gyro_x: gyro.x,
          gyro_y: gyro.y,
          gyro_z: gyro.z,
          roughness_score: roughnessScore,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving sensor data point:', error);
      return false;
    }
  }

  /**
   * Get all scan sessions for current user
   */
  async getScanSessions(): Promise<ScanSession[]> {
    try {
      const { data, error } = await supabase
        .from('scan_sessions')
        .select('*')
        .order('started_at', { ascending: false });

      if (error) throw error;
      return (data as ScanSession[]) || [];
    } catch (error) {
      console.error('Error fetching scan sessions:', error);
      return [];
    }
  }

  /**
   * Get a specific scan session
   */
  async getScanSession(sessionId: string): Promise<ScanSession | null> {
    try {
      const { data, error } = await supabase
        .from('scan_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data as ScanSession;
    } catch (error) {
      console.error('Error fetching scan session:', error);
      return null;
    }
  }

  /**
   * Get segments for a scan session
   */
  async getSessionSegments(sessionId: string): Promise<ScanSegment[]> {
    try {
      const { data, error } = await supabase
        .from('scan_segments')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as ScanSegment[]) || [];
    } catch (error) {
      console.error('Error fetching session segments:', error);
      return [];
    }
  }

  /**
   * Delete a scan session
   */
  async deleteScanSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scan_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting scan session:', error);
      return false;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalSessions: number;
    totalDistance: number;
    averageRoughness: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('scan_sessions')
        .select('total_distance_km, average_roughness')
        .eq('status', 'completed');

      if (error) throw error;

      const stats = {
        totalSessions: data?.length || 0,
        totalDistance: data?.reduce((sum, s) => sum + (s.total_distance_km || 0), 0) || 0,
        averageRoughness:
          data?.reduce((sum, s) => sum + (s.average_roughness || 0), 0) / (data?.length || 1) || 0,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: {
    phone_model?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_year?: number;
  }): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
}

// Singleton instance
export const apiService = new ApiService();
