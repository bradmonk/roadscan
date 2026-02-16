import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { syncService } from '../../services/sync';
import { ScanSession } from '../../types';
import { Colors } from '../../constants';

const screenWidth = Dimensions.get('window').width;

export default function GraphsScreen() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: [],
  });
  const [roughnessData, setRoughnessData] = useState<{
    labels: string[];
    data: number[];
  }>({
    labels: [],
    data: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await syncService.getScanSessions();
      setSessions(data);
      processWeeklyData(data);
      processRoughnessData(data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process weekly driving distance data
  const processWeeklyData = (data: ScanSession[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const distanceByDay: number[] = [0, 0, 0, 0, 0, 0, 0];
    const countByDay: number[] = [0, 0, 0, 0, 0, 0, 0];

    data.forEach((session) => {
      if (session.status === 'completed' && session.total_distance_meters) {
        const date = new Date(session.started_at);
        const dayIndex = date.getDay();
        distanceByDay[dayIndex] += session.total_distance_meters / 1000; // Convert to km
        countByDay[dayIndex]++;
      }
    });

    // Calculate average distance per day
    const avgDistanceByDay = distanceByDay.map((total, idx) =>
      countByDay[idx] > 0 ? total / countByDay[idx] : 0
    );

    setWeeklyData({
      labels: dayNames,
      data: avgDistanceByDay,
    });
  };

  // Process roughness data from most recent scan
  const processRoughnessData = (sessions: ScanSession[]) => {
    // Find the most recent completed session
    const recentSession = sessions
      .filter((s) => s.status === 'completed')
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];

    if (!recentSession || !recentSession.duration_seconds) {
      setRoughnessData({ labels: [], data: [] });
      return;
    }

    // For now, we'll simulate minute-by-minute data since we don't have segment timestamps
    // In a real implementation, you'd query scan_segments with timestamps
    const durationMinutes = Math.ceil(recentSession.duration_seconds / 60);
    const labels: string[] = [];
    const dataPoints: number[] = [];

    // Generate simulated data based on average roughness
    // In real implementation, aggregate actual segment data by minute
    const baseRoughness = recentSession.average_roughness || 50;
    for (let i = 1; i <= Math.min(durationMinutes, 10); i++) {
      labels.push(`${i}m`);
      // Add some variance around the average
      const variance = (Math.random() - 0.5) * 20;
      dataPoints.push(Math.max(0, Math.min(100, baseRoughness + variance)));
    }

    setRoughnessData({ labels, data: dataPoints });
  };

  // Calculate total statistics
  const totalDistance = sessions.reduce(
    (sum, s) => sum + (s.total_distance_meters || 0),
    0
  ) / 1000; // km
  const totalScans = sessions.filter((s) => s.status === 'completed').length;
  const avgRoughness =
    totalScans > 0
      ? sessions
          .filter((s) => s.status === 'completed')
          .reduce((sum, s) => sum + (s.average_roughness || 0), 0) / totalScans
      : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data yet</Text>
        <Text style={styles.emptySubtext}>
          Complete some scans to see your statistics
        </Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: Colors.surface,
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: Colors.primary,
    },
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
        <Text style={styles.subtitle}>Your driving insights</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalDistance.toFixed(1)} km</Text>
          <Text style={styles.summaryLabel}>Total Distance</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalScans}</Text>
          <Text style={styles.summaryLabel}>Scans</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{avgRoughness.toFixed(0)}</Text>
          <Text style={styles.summaryLabel}>Avg Roughness</Text>
        </View>
      </View>

      {/* Weekly Distance Chart */}
      {weeklyData.data.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Average Distance by Day of Week</Text>
          <BarChart
            data={{
              labels: weeklyData.labels,
              datasets: [{ data: weeklyData.data }],
            }}
            width={screenWidth - 32}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" km"
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        </View>
      )}

      {/* Recent Scan Roughness */}
      {roughnessData.data.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Roughness from Last Scan (by minute)</Text>
          <LineChart
            data={{
              labels: roughnessData.labels,
              datasets: [{ data: roughnessData.data }],
            }}
            width={screenWidth - 32}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Note: Minute-by-minute roughness data is simulated for demonstration.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  chartContainer: {
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
  footer: {
    padding: 16,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
