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
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { syncService } from '../../services/sync';
import { ScanSession } from '../../types';
import { Colors } from '../../constants';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ScanSession[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapSegments, setMapSegments] = useState<any[]>([]);

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const data = await syncService.getScanSessions();
      setSessions(data);
      setFilteredSessions(data);
    } catch (error) {
      console.error('Failed to load scan sessions:', error);
      Alert.alert('Error', 'Failed to load scan history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Filter sessions by search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSessions(sessions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sessions.filter((session) => {
        const date = new Date(session.started_at).toLocaleDateString().toLowerCase();
        return date.includes(query);
      });
      setFilteredSessions(filtered);
    }
  }, [searchQuery, sessions]);

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
              setSelectedSessions((prev) => {
                const newSet = new Set(prev);
                newSet.delete(sessionId);
                return newSet;
              });
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

  // Toggle session selection
  const toggleSelection = (sessionId: string) => {
    setSelectedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  // View selected sessions on map
  const viewOnMap = async () => {
    if (selectedSessions.size === 0) {
      Alert.alert('No Selection', 'Please select at least one scan to view on the map');
      return;
    }

    try {
      // Load segments for selected sessions
      const segments = await syncService.getSegmentsForSessions(Array.from(selectedSessions));
      setMapSegments(segments);
      setShowMapModal(true);
    } catch (error) {
      console.error('Failed to load map data:', error);
      Alert.alert('Error', 'Failed to load map data');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format distance
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${(km * 1000).toFixed(0)}m`;
    }
    return `${km.toFixed(2)}km`;
  };

  // Format duration
  const formatDuration = (session: ScanSession) => {
    if (!session.started_at) return 'N/A';
    const start = new Date(session.started_at).getTime();
    const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
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
    const isSelected = selectedSessions.has(item.id);
    
    return (
      <View style={styles.sessionCard}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleSelection(item.id)}
        >
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <View style={styles.sessionContent}>
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
                {formatDistance(item.total_distance_km || 0)}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>
                {formatDuration(item)}
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by date..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textSecondary}
        />
        {selectedSessions.size > 0 && (
          <TouchableOpacity style={styles.viewMapButton} onPress={viewOnMap}>
            <Text style={styles.viewMapButtonText}>
              View on Map ({selectedSessions.size})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {filteredSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No results found' : 'No scans yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? 'Try a different search term'
              : 'Start scanning to build your road quality history'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
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

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selected Scans</Text>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          <MapView style={styles.map} initialRegion={{
            latitude: mapSegments[0]?.start_lat || 37.78825,
            longitude: mapSegments[0]?.start_lng || -122.4324,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}>
            {mapSegments.map((segment, index) => (
              <Polyline
                key={index}
                coordinates={[
                  { latitude: segment.start_lat, longitude: segment.start_lng },
                  { latitude: segment.end_lat, longitude: segment.end_lng },
                ]}
                strokeColor={segment.color || Colors.primary}
                strokeWidth={5}
              />
            ))}
          </MapView>
        </SafeAreaView>
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
  },
  viewMapButton: {
    marginLeft: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewMapButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionContent: {
    flex: 1,
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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  map: {
    flex: 1,
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

