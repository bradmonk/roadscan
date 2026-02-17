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

// Color palette for app UI
export const Colors = {
  primary: '#eb5160', // lobster pink
  secondary: '#9ab8b2', // ash grey
  success: '#9ab8b2', // ash grey
  warning: '#dfd0c1', // almond cream
  error: '#eb5160', // lobster pink
  background: '#dfe2e2', // alabaster grey
  surface: '#ffffff', // white
  border: '#dfd0c1', // almond cream
  text: '#071013', // ink black
  textSecondary: '#9ab8b2', // ash grey
  
  // Roughness colors using Inferno colormap (perceptually uniform)
  // https://github.com/BIDS/colormap
  roughness: {
    excellent: '#440154', // 0-20: deep purple (inferno low)
    good: '#31688e', // 20-40: blue-purple
    fair: '#35b779', // 40-60: teal-green
    poor: '#fde724', // 60-80: yellow
    veryPoor: '#fde724', // 80-100: bright yellow (inferno high)
  },
};

/**
 * Get color from Inferno colormap based on roughness score (0-100)
 * Uses pre-computed lookup table for efficiency
 */
export function getRoughnessColor(score: number): string {
  // Inferno colormap lookup table (101 colors from 0-100)
  const INFERNO_COLORMAP: string[] = [
    '#000004', '#010005', '#010106', '#010108', '#020109', '#02020b', '#02020d', '#03030f', '#030312', '#040414',
    '#050416', '#060518', '#06051a', '#07061c', '#08071e', '#090720', '#0a0822', '#0b0924', '#0c0926', '#0d0a29',
    '#0e0b2b', '#100b2d', '#110c2f', '#120d31', '#140d33', '#150e36', '#160e38', '#180f3a', '#19103c', '#1b103e',
    '#1c1141', '#1e1143', '#1f1245', '#211247', '#221349', '#24134b', '#25144d', '#271450', '#291552', '#2a1554',
    '#2c1656', '#2e1658', '#2f175b', '#31175d', '#33185f', '#341861', '#361963', '#381965', '#391a68', '#3b1a6a',
    '#3d1b6c', '#3e1c6e', '#401c70', '#421d72', '#431d74', '#451e76', '#471e78', '#481f7a', '#4a1f7c', '#4c207e',
    '#4d2080', '#4f2181', '#512183', '#522285', '#542287', '#552389', '#57238b', '#59248c', '#5a258e', '#5c2590',
    '#5e2692', '#5f2694', '#612795', '#632897', '#642899', '#66299a', '#68299c', '#692a9d', '#6b2a9f', '#6d2ba0',
    '#6e2ba2', '#702ca3', '#722ca5', '#732da6', '#752da8', '#772ea9', '#782eab', '#7a2fac', '#7c2fae', '#7d30af',
    '#7f30b0', '#8031b2', '#8231b3', '#8432b5', '#8632b6', '#8733b8', '#8933b9', '#8b34ba', '#8c34bc', '#8e35bd',
    '#9035be'
  ];
  
  // Clamp score to 0-100 and round to nearest integer
  const index = Math.round(Math.max(0, Math.min(100, score)));
  return INFERNO_COLORMAP[index];
}


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
