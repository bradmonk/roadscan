import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { syncService } from '../../services/sync';
import { ScanSession } from '../../types';
import { Colors } from '../../constants';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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
  const [roughnessHistogram, setRoughnessHistogram] = useState<{
    labels: string[];
    data: number[];
  }>({
    labels: [],
    data: [],
  });
  const [speedDistribution, setSpeedDistribution] = useState<{
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
      processRoughnessHistogram(data);
      processSpeedDistribution(data);
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

  // Process roughness histogram (distribution of roughness scores)
  const processRoughnessHistogram = (sessions: ScanSession[]) => {
    const bins = [0, 20, 40, 60, 80, 100];
    const binLabels = ['0-20', '20-40', '40-60', '60-80', '80-100'];
    const binCounts = [0, 0, 0, 0, 0];

    sessions.forEach((session) => {
      if (session.status === 'completed' && session.average_roughness != null) {
        const roughness = session.average_roughness;
        if (roughness < 20) binCounts[0]++;
        else if (roughness < 40) binCounts[1]++;
        else if (roughness < 60) binCounts[2]++;
        else if (roughness < 80) binCounts[3]++;
        else binCounts[4]++;
      }
    });

    setRoughnessHistogram({
      labels: binLabels,
      data: binCounts,
    });
  };

  // Process speed distribution
  const processSpeedDistribution = (sessions: ScanSession[]) => {
    // Group by speed ranges (0-20, 20-40, 40-60, 60-80, 80+)
    const speedBins = [0, 0, 0, 0, 0]; // counts for each bin
    const speedLabels = ['0-20', '20-40', '40-60', '60-80', '80+'];

    // Since we don't have segment-level speed data easily accessible,
    // we'll simulate based on average speeds
    // In production, you'd query scan_segments table
    sessions.forEach((session) => {
      if (session.status === 'completed' && session.total_distance_meters && session.duration_seconds) {
        // Calculate average speed (km/h)
        const avgSpeed = (session.total_distance_meters / 1000) / (session.duration_seconds / 3600);
        
        if (avgSpeed < 20) speedBins[0]++;
        else if (avgSpeed < 40) speedBins[1]++;
        else if (avgSpeed < 60) speedBins[2]++;
        else if (avgSpeed < 80) speedBins[3]++;
        else speedBins[4]++;
      }
    });

    setSpeedDistribution({
      labels: speedLabels,
      data: speedBins,
    });
  };

  // Export data to CSV
  const exportToCSV = async () => {
    try {
      let csvContent = 'Date,Distance (km),Duration (min),Avg Roughness,Status\n';
      
      sessions.forEach((session) => {
        const date = new Date(session.started_at).toLocaleDateString();
        const distance = ((session.total_distance_meters || 0) / 1000).toFixed(2);
        const duration = ((session.duration_seconds || 0) / 60).toFixed(1);
        const roughness = (session.average_roughness || 0).toFixed(1);
        const status = session.status;
        
        csvContent += `${date},${distance},${duration},${roughness},${status}\n`;
      });

      const fileName = `roadscan_export_${Date.now()}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert('Success', `Data exported to: ${filePath}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  // Calculate total statistics
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const totalDistance = completedSessions.reduce(
    (sum, s) => sum + (s.total_distance_meters || 0),
    0
  ) / 1000; // km
  const totalScans = completedSessions.length;
  const avgRoughness =
    totalScans > 0
      ? completedSessions.reduce((sum, s) => sum + (s.average_roughness || 0), 0) / totalScans
      : 0;
  
  // Calculate additional stats
  const roughestRoad = completedSessions.reduce((max, s) => 
    (s.average_roughness || 0) > (max.average_roughness || 0) ? s : max
  , completedSessions[0] || { average_roughness: 0 });
  
  const smoothestRoad = completedSessions.reduce((min, s) => 
    (s.average_roughness || 0) < (min.average_roughness || 0) ? s : min
  , completedSessions[0] || { average_roughness: 100 });
  
  const totalDuration = completedSessions.reduce(
    (sum, s) => sum + (s.duration_seconds || 0),
    0
  );
  
  const avgSpeed = totalDuration > 0 ? (totalDistance / (totalDuration / 3600)) : 0;

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

      {/* Export Button */}
      <View style={styles.exportContainer}>
        <TouchableOpacity style={styles.exportButton} onPress={exportToCSV}>
          <Text style={styles.exportButtonText}>📊 Export to CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalDistance.toFixed(1)} km</Text>
          <Text style={styles.summaryLabel}>Total Distance</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalScans}</Text>
          <Text style={styles.summaryLabel}>Total Scans</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{avgRoughness.toFixed(0)}</Text>
          <Text style={styles.summaryLabel}>Avg Roughness</Text>
        </View>
      </View>

      {/* Additional Stats */}
      <View style={styles.detailedStatsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Average Speed:</Text>
          <Text style={styles.statRowValue}>{avgSpeed.toFixed(1)} km/h</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Total Time Driving:</Text>
          <Text style={styles.statRowValue}>
            {Math.floor(totalDuration / 3600)}h {Math.floor((totalDuration % 3600) / 60)}m
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Roughest Road:</Text>
          <Text style={styles.statRowValue}>
            {roughestRoad?.average_roughness?.toFixed(0) || 'N/A'}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>Smoothest Road:</Text>
          <Text style={styles.statRowValue}>
            {smoothestRoad?.average_roughness?.toFixed(0) || 'N/A'}
          </Text>
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

      {/* Roughness Histogram */}
      {roughnessHistogram.data.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Roughness Distribution (Number of Scans)</Text>
          <BarChart
            data={{
              labels: roughnessHistogram.labels,
              datasets: [{ data: roughnessHistogram.data }],
            }}
            width={screenWidth - 32}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        </View>
      )}

      {/* Speed Distribution */}
      {speedDistribution.data.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Speed Distribution (km/h)</Text>
          <BarChart
            data={{
              labels: speedDistribution.labels,
              datasets: [{ data: speedDistribution.data }],
            }}
            width={screenWidth - 32}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        </View>
      )}

      {/* Recent Scan Roughness */}
      {roughnessData.data.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Time-Series Roughness from Last Scan</Text>
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
          Tap the Export button above to download your data as CSV
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
  exportContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  exportButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  detailedStatsContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statRowLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
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
