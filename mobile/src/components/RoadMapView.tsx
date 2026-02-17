import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline, Marker, Region, PROVIDER_DEFAULT } from 'react-native-maps';
import { LocationData } from '../types';
import { roughnessCalculator } from '../services/roughness';

export interface RoadSegment {
  coordinates: { latitude: number; longitude: number }[];
  roughnessScore: number;
  color: string;
}

interface RoadMapViewProps {
  currentLocation: LocationData | null;
  segments: RoadSegment[];
  followUser?: boolean;
  onRegionChange?: (region: Region) => void;
}

export default function RoadMapView({
  currentLocation,
  segments,
  followUser = true,
  onRegionChange,
}: RoadMapViewProps) {
  const mapRef = React.useRef<MapView>(null);
  const [hasAnimated, setHasAnimated] = React.useState(false);

  // Update map region when location changes
  React.useEffect(() => {
    if (followUser && currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
      setHasAnimated(true);
    }
  }, [currentLocation, followUser]);

  // Default region (if no location yet)
  const initialRegion: Region = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
    : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        followsUserLocation={false}
        zoomEnabled={true}
        scrollEnabled={!followUser}
        pitchEnabled={false}
        rotateEnabled={false}
        onRegionChangeComplete={onRegionChange}
      >
        {/* Current location marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={currentLocation.heading || 0}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerDot} />
              {currentLocation.heading !== undefined && (
                <View style={[styles.userMarkerDirection, { 
                  transform: [{ rotate: `${currentLocation.heading}deg` }] 
                }]} />
              )}
            </View>
          </Marker>
        )}

        {/* Render road segments with color-coded roughness */}
        {segments.map((segment, index) => (
          <Polyline
            key={`segment-${index}`}
            coordinates={segment.coordinates}
            strokeColor={segment.color}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  userMarker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  userMarkerDirection: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4A90E2',
    top: -8,
  },
});
