// Sensor configuration
export const SENSOR_SAMPLE_RATE = 100; // ms - 10Hz sample rate
export const GPS_SAMPLE_RATE = 1000; // ms - 1Hz for GPS
export const SEGMENT_DURATION = 5000; // 5 seconds

// Roughness calculation
export const ROUGHNESS_THRESHOLD_SMOOTH = 20;
export const ROUGHNESS_THRESHOLD_MODERATE = 50;
export const ROUGHNESS_THRESHOLD_ROUGH = 75;

// Map colors for roughness visualization
export const ROUGHNESS_COLORS = {
  SMOOTH: '#22c55e', // green
  MODERATE: '#eab308', // yellow
  ROUGH: '#f97316', // orange
  VERY_ROUGH: '#ef4444', // red
};

// Color palette
export const Colors = {
  primary: '#3b82f6', // blue
  secondary: '#8b5cf6', // purple
  success: '#22c55e', // green
  warning: '#eab308', // yellow
  error: '#ef4444', // red
  background: '#f9fafb', // light gray
  surface: '#ffffff', // white
  border: '#e5e7eb', // gray
  text: '#1f2937', // dark gray
  textSecondary: '#6b7280', // medium gray
  
  // Roughness colors
  roughness: {
    excellent: '#22c55e', // green - 0-20
    good: '#84cc16', // lime - 20-40
    fair: '#eab308', // yellow - 40-60
    poor: '#f97316', // orange - 60-80
    veryPoor: '#ef4444', // red - 80-100
  },
};


// Data retention
export const LOCAL_DATA_RETENTION_HOURS = 24;

// App configuration
export const APP_NAME = 'RoadScan';
export const APP_VERSION = '1.0.0';

// Storage keys
export const STORAGE_KEYS = {
  USER_PROFILE: '@roadscan:user_profile',
  ONBOARDING_COMPLETE: '@roadscan:onboarding_complete',
  SCAN_SESSIONS: '@roadscan:scan_sessions',
  PREFERENCES: '@roadscan:preferences',
};
