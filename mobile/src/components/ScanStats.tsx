import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RoughnessResult } from '../services/roughness';

interface ScanStatsProps {
  roughness: RoughnessResult | null;
  distance: number;
  speed?: number;
  duration: number;
}

export default function ScanStats({
  roughness,
  distance,
  speed,
  duration,
}: ScanStatsProps) {
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (mps?: number): string => {
    if (!mps) return '--';
    const kmh = mps * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  };

  const getRoughnessColor = (category?: string): string => {
    switch (category) {
      case 'smooth':
        return '#22c55e';
      case 'moderate':
        return '#eab308';
      case 'rough':
        return '#f97316';
      case 'very_rough':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Roughness</Text>
          <View style={styles.roughnessContainer}>
            <View
              style={[
                styles.roughnessIndicator,
                { backgroundColor: getRoughnessColor(roughness?.category) },
              ]}
            />
            <Text style={styles.statValue}>
              {roughness ? `${roughness.score.toFixed(0)}/100` : '--'}
            </Text>
          </View>
          {roughness && (
            <Text style={styles.statSubtext}>
              {roughness.category.replace('_', ' ')}
            </Text>
          )}
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>{formatDistance(distance)}</Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Speed</Text>
          <Text style={styles.statValue}>{formatSpeed(speed)}</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>{formatDuration(duration)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  statSubtext: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  roughnessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roughnessIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
