/**
 * Mock Data Generator for Development/Testing
 * Generates realistic GPS paths and sensor data for testing scan functionality
 */

export interface MockSensorData {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
}

export interface MockLocationData {
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  timestamp: number;
}

class MockDataGenerator {
  private startLat: number = 37.7749; // San Francisco start
  private startLng: number = -122.4194;
  private currentLat: number = this.startLat;
  private currentLng: number = this.startLng;
  private currentHeading: number = 0;
  private currentSpeed: number = 0;
  private currentAltitude: number = 50;
  private distance: number = 0;
  private pathIndex: number = 0;
  
  // Driving simulation state
  private segmentStartTime: number = Date.now();
  private segmentDuration: number = 30; // seconds - initial straight segment
  private targetHeading: number = Math.random() * 360; // Initial random direction
  private currentQuality: 'smooth' | 'fair' | 'rough' = 'fair';
  private isVariableMode: boolean = false;

  // Predefined path types
  private pathPatterns = {
    // Realistic driving pattern - straight lines with turns
    driving: (index: number) => {
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - this.segmentStartTime) / 1000;
      
      // Check if it's time to turn
      if (elapsedSeconds >= this.segmentDuration) {
        // Make a turn - set new target heading
        const turnAngle = (Math.random() - 0.5) * 120; // Turn between -60° and +60°
        this.targetHeading = (this.targetHeading + turnAngle + 360) % 360;
        this.currentHeading = this.targetHeading; // Immediately set to new heading (instant turn)
        
        // Set duration for next straight segment (20-40 seconds)
        this.segmentDuration = 20 + Math.random() * 20;
        this.segmentStartTime = currentTime;
        
        // Change road quality if in variable mode
        if (this.isVariableMode) {
          const qualities: ('smooth' | 'fair' | 'rough')[] = ['smooth', 'fair', 'rough'];
          this.currentQuality = qualities[Math.floor(Math.random() * qualities.length)];
          console.log(`🔄 Turn complete - new heading: ${this.targetHeading.toFixed(1)}°, quality: ${this.currentQuality}, next segment: ${this.segmentDuration.toFixed(1)}s`);
        } else {
          console.log(`🔄 Turn complete - new heading: ${this.targetHeading.toFixed(1)}°, next segment: ${this.segmentDuration.toFixed(1)}s`);
        }
      }
      
      // Move forward in current direction (no interpolation - straight line)
      // Speed of ~40 km/h = ~11 m/s, update every second = ~11m per step
      // 1 degree latitude ≈ 111km, so 11m ≈ 0.0001 degrees
      const stepSize = 0.0001; // Roughly 11 meters
      const headingRad = (this.currentHeading * Math.PI) / 180;
      
      return {
        lat: this.currentLat + stepSize * Math.cos(headingRad),
        lng: this.currentLng + stepSize * Math.sin(headingRad),
      };
    },
    // Circular route (kept for backwards compatibility)
    circle: (index: number) => {
      const radius = 0.002; // ~200m
      const angle = (index * 2) % 360;
      const rad = (angle * Math.PI) / 180;
      return {
        lat: this.startLat + radius * Math.cos(rad),
        lng: this.startLng + radius * Math.sin(rad),
      };
    },
    // Figure-8 route
    figure8: (index: number) => {
      const t = (index * 0.1) % (2 * Math.PI);
      const scale = 0.002;
      return {
        lat: this.startLat + scale * Math.sin(t),
        lng: this.startLng + scale * Math.sin(2 * t),
      };
    },
    // Grid pattern
    grid: (index: number) => {
      const gridSize = 0.001;
      const gridPoints = 10;
      const x = (index % gridPoints) * gridSize;
      const y = Math.floor(index / gridPoints) * gridSize;
      return {
        lat: this.startLat + y,
        lng: this.startLng + x,
      };
    },
    // Random walk
    random: (index: number) => {
      const stepSize = 0.0001;
      const prevLat = this.currentLat;
      const prevLng = this.currentLng;
      return {
        lat: prevLat + (Math.random() - 0.5) * stepSize,
        lng: prevLng + (Math.random() - 0.5) * stepSize,
      };
    },
  };

  /**
   * Generate mock location data
   */
  generateLocation(pattern: keyof typeof this.pathPatterns = 'driving'): MockLocationData {
    this.pathIndex++;

    // Get next position based on pattern
    const pos = this.pathPatterns[pattern](this.pathIndex);
    
    // Calculate heading (direction of movement) for non-driving patterns
    if (pattern !== 'driving') {
      const dLat = pos.lat - this.currentLat;
      const dLng = pos.lng - this.currentLng;
      this.currentHeading = (Math.atan2(dLng, dLat) * 180) / Math.PI;
    }
    // For driving pattern, heading is already updated in the pattern function

    // Calculate speed (30-50 km/h with variation for realistic city driving)
    const baseSpeed = 40 + Math.sin(this.pathIndex * 0.05) * 10;
    const speedVariation = (Math.random() - 0.5) * 5;
    this.currentSpeed = Math.max(25, Math.min(55, baseSpeed + speedVariation));

    // Update altitude with some variation
    this.currentAltitude += (Math.random() - 0.5) * 2;

    // Update position
    this.currentLat = pos.lat;
    this.currentLng = pos.lng;

    return {
      latitude: this.currentLat,
      longitude: this.currentLng,
      altitude: this.currentAltitude,
      speed: this.currentSpeed / 3.6, // Convert km/h to m/s
      heading: this.currentHeading,
      timestamp: Date.now(),
    };
  }

  /**
   * Generate mock sensor data with varying roughness
   * @param roadQuality - 'smooth', 'fair', 'rough', 'variable', 'random'
   */
  generateSensorData(roadQuality: 'smooth' | 'fair' | 'rough' | 'variable' | 'random' = 'random'): MockSensorData {
    // Determine roughness level
    let roughnessLevel: number;
    if (roadQuality === 'random') {
      roughnessLevel = Math.random();
    } else if (roadQuality === 'variable') {
      // Use current quality that changes on turns
      const levels = {
        smooth: 0.1,
        fair: 0.3,
        rough: 0.6,
      };
      roughnessLevel = levels[this.currentQuality];
    } else {
      const levels = {
        smooth: 0.1,
        fair: 0.3,
        rough: 0.6,
      };
      roughnessLevel = levels[roadQuality];
    }

    // Base acceleration (gravity + vehicle motion)
    const baseAccel = {
      x: (Math.random() - 0.5) * 0.5,
      y: (Math.random() - 0.5) * 0.5,
      z: 9.8 + (Math.random() - 0.5) * 0.3, // Gravity + small variation
    };

    // Add road roughness (vibrations)
    const roughnessIntensity = roughnessLevel * 3; // 0-3 m/s²
    const frequency = 5 + Math.random() * 10; // 5-15 Hz
    const time = Date.now() / 1000;
    
    const vibration = {
      x: Math.sin(time * frequency) * roughnessIntensity * 0.3,
      y: Math.sin(time * frequency * 1.3) * roughnessIntensity * 0.2,
      z: Math.sin(time * frequency * 0.7) * roughnessIntensity,
    };

    // Speed bumps/potholes (random spikes)
    const spike = Math.random() < 0.05 ? roughnessLevel * 5 : 0;

    // Gyroscope (rotation rate in rad/s)
    const baseGyro = {
      x: (Math.random() - 0.5) * 0.1, // Roll
      y: (Math.random() - 0.5) * 0.1, // Pitch
      z: (Math.random() - 0.5) * 0.05, // Yaw
    };

    const gyroVibration = {
      x: Math.sin(time * frequency * 0.5) * roughnessLevel * 0.5,
      y: Math.sin(time * frequency * 0.8) * roughnessLevel * 0.5,
      z: Math.sin(time * frequency * 1.2) * roughnessLevel * 0.2,
    };

    return {
      accelerometer: {
        x: baseAccel.x + vibration.x + (Math.random() - 0.5) * spike,
        y: baseAccel.y + vibration.y + (Math.random() - 0.5) * spike,
        z: baseAccel.z + vibration.z + spike,
      },
      gyroscope: {
        x: baseGyro.x + gyroVibration.x,
        y: baseGyro.y + gyroVibration.y,
        z: baseGyro.z + gyroVibration.z,
      },
    };
  }

  /**
   * Generate a series of locations for a complete route
   * @param points - Number of points to generate
   * @param pattern - Route pattern to follow
   */
  generateRoute(
    points: number = 100,
    pattern: keyof typeof this.pathPatterns = 'circle'
  ): MockLocationData[] {
    const route: MockLocationData[] = [];
    for (let i = 0; i < points; i++) {
      route.push(this.generateLocation(pattern));
    }
    return route;
  }

  /**
   * Reset to start position
   */
  reset(startLat?: number, startLng?: number) {
    if (startLat !== undefined) this.startLat = startLat;
    if (startLng !== undefined) this.startLng = startLng;
    this.currentLat = this.startLat;
    this.currentLng = this.startLng;
    this.currentHeading = 0;
    this.currentSpeed = 0;
    this.currentAltitude = 50;
    this.distance = 0;
    this.pathIndex = 0;
    
    // Reset driving simulation state
    this.segmentStartTime = Date.now();
    this.segmentDuration = 30;
    this.targetHeading = Math.random() * 360;
    this.currentQuality = 'fair';
    this.isVariableMode = false;
  }

  /**
   * Get current position
   */
  getCurrentPosition() {
    return {
      latitude: this.currentLat,
      longitude: this.currentLng,
    };
  }

  /**
   * Set start position
   */
  setStartPosition(lat: number, lng: number) {
    this.startLat = lat;
    this.startLng = lng;
    this.reset();
  }

  /**
   * Enable variable road quality mode
   */
  setVariableMode(enabled: boolean) {
    this.isVariableMode = enabled;
    if (enabled) {
      const qualities: ('smooth' | 'fair' | 'rough')[] = ['smooth', 'fair', 'rough'];
      this.currentQuality = qualities[Math.floor(Math.random() * qualities.length)];
    }
  }
}

// Singleton instance
export const mockDataGenerator = new MockDataGenerator();

// Predefined test scenarios
export const testScenarios = {
  smoothRoad: {
    name: 'Smooth Road',
    description: 'Newly paved highway, excellent condition',
    pattern: 'driving' as const,
    quality: 'smooth' as const,
  },
  fairRoad: {
    name: 'Fair Road',
    description: 'Standard city street, minor imperfections',
    pattern: 'driving' as const,
    quality: 'fair' as const,
  },
  roughRoad: {
    name: 'Rough Road',
    description: 'Damaged road with potholes',
    pattern: 'driving' as const,
    quality: 'rough' as const,
  },
  variableRoad: {
    name: 'Variable Road',
    description: 'Road quality changes with each turn',
    pattern: 'driving' as const,
    quality: 'variable' as const,
  },
  mixedConditions: {
    name: 'Mixed Conditions',
    description: 'Varying road quality, realistic scenario',
    pattern: 'driving' as const,
    quality: 'random' as const,
  },
};
