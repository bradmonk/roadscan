import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { syncService } from '../../services/sync';
import { ScanSession } from '../../types';
import { Colors } from '../../constants';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const data = await syncService.getScanSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load scan sessions:', error);
      Alert.alert('Error', 'Failed to load scan history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessions();
  }, [loadSessions]);

  // Handle delete
  const handleDelete = useCallback(
    (sessionId: string) => {
      Alert.alert('Delete Scan', 'Are you sure you want to delete this scan?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await syncService.deleteScanSession(sessionId);
              setSessions((prev) => prev.filter((s) => s.id !== sessionId));
              Alert.alert('Success', 'Scan deleted');
            } catch (error) {
              console.error('Failed to delete scan:', error);
              Alert.alert('Error', 'Failed to delete scan');
            }
          },
        },
      ]);
    },
    []
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  // Get roughness label and color
  const getRoughnessInfo = (score: number) => {
    if (score < 20) return { label: 'Excellent', color: Colors.roughness.excellent };
    if (score < 40) return { label: 'Good', color: Colors.roughness.good };
    if (score < 60) return { label: 'Fair', color: Colors.roughness.fair };
    if (score < 80) return { label: 'Poor', color: Colors.roughness.poor };
    return { label: 'Very Poor', color: Colors.roughness.veryPoor };
  };

  // Render session item
  const renderItem = ({ item }: { item: ScanSession }) => {
    const roughnessInfo = getRoughnessInfo(item.average_roughness || 0);
    
    return (
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionDate}>{formatDate(item.started_at)}</Text>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sessionStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>
              {formatDistance(item.total_distance_meters || 0)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>
              {formatDuration(item.duration_seconds || 0)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Roughness</Text>
            <View style={styles.roughnessContainer}>
              <View
                style={[
                  styles.roughnessIndicator,
                  { backgroundColor: roughnessInfo.color },
                ]}
              />
              <Text style={styles.statValue}>{roughnessInfo.label}</Text>
            </View>
          </View>
        </View>

        {item.status === 'active' && (
          <View style={styles.activeIndicator}>
            <Text style={styles.activeText}>Active Session</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
        <Text style={styles.subtitle}>
          {sessions.length} {sessions.length === 1 ? 'scan' : 'scans'}
        </Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No scans yet</Text>
          <Text style={styles.emptySubtext}>
            Start scanning to build your road quality history
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </View>
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
  listContainer: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.error + '20',
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  roughnessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roughnessIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  activeIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  activeText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
});

