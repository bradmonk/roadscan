// User types
export interface User {
  id: string;
  email: string;
  phone_model?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  created_at: string;
  updated_at: string;
}

// Scan session types
export interface ScanSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  total_distance_km?: number;
  average_roughness?: number;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
}

// Sensor data point
export interface SensorDataPoint {
  id: string;
  session_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  acceleration_x: number;
  acceleration_y: number;
  acceleration_z: number;
  gyro_x?: number;
  gyro_y?: number;
  gyro_z?: number;
  roughness_score: number;
}

// Scan segment for visualization
export interface ScanSegment {
  id: string;
  session_id: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  average_roughness: number;
  segment_duration_seconds: number;
  created_at: string;
}

// Location data
export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

// Sensor reading
export interface SensorReading {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Scan: undefined;
  History: undefined;
  Graphs: undefined;
  Resources: undefined;
  Help: undefined;
  Account: undefined;
};
