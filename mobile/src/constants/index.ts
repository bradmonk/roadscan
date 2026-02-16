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
