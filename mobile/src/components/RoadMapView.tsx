import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline, Region, PROVIDER_DEFAULT } from 'react-native-maps';
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

  // Update map region when location changes
  React.useEffect(() => {
    if (followUser && currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [currentLocation, followUser]);

  // Default region (if no location yet)
  const initialRegion: Region = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
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
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        onRegionChangeComplete={onRegionChange}
      >
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
});
