import NetInfo from '@react-native-community/netinfo';
import { apiService } from './api';
import { localStorageService } from './localStorage';
import { supabase } from './supabase';

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize sync service
   */
  async init() {
    await localStorageService.init();
    this.setupAutoSync();
    this.setupNetworkListener();
  }

  /**
   * Check if user is online
   */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  }

  /**
   * Save scan session (online or offline)
   */
  async saveScanSession(sessionData: any): Promise<string | null> {
    const online = await this.isOnline();
    const authenticated = await this.isAuthenticated();

    // Always save locally first
    const localId = await localStorageService.saveScanSession(sessionData);

    // If online and authenticated, also save to cloud
    if (online && authenticated && localId) {
      const cloudSession = await apiService.createScanSession();
      if (cloudSession) {
        // Update local record with cloud ID
        await localStorageService.updateScanSession(localId, {
          id: cloudSession.id,
        });
        return cloudSession.id;
      }
    }

    return localId;
  }

  /**
   * Save scan segment (online or offline)
   */
  async saveScanSegment(segmentData: any): Promise<boolean> {
    const online = await this.isOnline();
    const authenticated = await this.isAuthenticated();

    // Always save locally first
    const localSuccess = await localStorageService.saveScanSegment(segmentData);

    // If online and authenticated, also save to cloud
    if (online && authenticated && localSuccess) {
      await apiService.saveScanSegment(
        segmentData.session_id,
        segmentData.start_lat,
        segmentData.start_lng,
        segmentData.end_lat,
        segmentData.end_lng,
        segmentData.average_roughness,
        segmentData.segment_duration_seconds
      );
    }

    return localSuccess;
  }

  /**
   * End scan session (online or offline)
   */
  async endScanSession(
    sessionId: string,
    totalDistance: number,
    averageRoughness: number
  ): Promise<boolean> {
    const online = await this.isOnline();
    const authenticated = await this.isAuthenticated();

    // Update locally
    const localSuccess = await localStorageService.updateScanSession(sessionId, {
      ended_at: new Date().toISOString(),
      total_distance_km: totalDistance / 1000,
      average_roughness: averageRoughness,
      status: 'completed',
    });

    // If online and authenticated, also update cloud
    if (online && authenticated && localSuccess) {
      await apiService.endScanSession(sessionId, totalDistance, averageRoughness);
      await localStorageService.markSessionSynced(sessionId);
    }

    return localSuccess;
  }

  /**
   * Sync all unsynced data to cloud
   */
  async syncAll(): Promise<{ success: boolean; synced: number }> {
    if (this.isSyncing) {
      return { success: false, synced: 0 };
    }

    const online = await this.isOnline();
    const authenticated = await this.isAuthenticated();

    if (!online || !authenticated) {
      return { success: false, synced: 0 };
    }

    this.isSyncing = true;
    let syncedCount = 0;

    try {
      // Get all unsynced sessions
      const unsyncedSessions = await localStorageService.getUnsyncedSessions();

      for (const session of unsyncedSessions) {
        // Create session in cloud
        const cloudSession = await apiService.createScanSession();
        if (!cloudSession) continue;

        // Update local session with cloud ID
        await localStorageService.updateScanSession(session.id, {
          id: cloudSession.id,
        });

        // Get all segments for this session
        const segments = await localStorageService.getSessionSegments(session.id);

        // Upload each segment
        for (const segment of segments) {
          await apiService.saveScanSegment(
            cloudSession.id,
            segment.start_lat,
            segment.start_lng,
            segment.end_lat,
            segment.end_lng,
            segment.average_roughness,
            segment.segment_duration_seconds
          );
        }

        // End the session in cloud
        await apiService.endScanSession(
          cloudSession.id,
          (session.total_distance_km || 0) * 1000,
          session.average_roughness || 0
        );

        // Mark as synced locally
        await localStorageService.markSessionSynced(cloudSession.id);
        syncedCount++;
      }

      return { success: true, synced: syncedCount };
    } catch (error) {
      console.error('Error during sync:', error);
      return { success: false, synced: syncedCount };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get all scan sessions (prioritize cloud if online)
   */
  async getScanSessions() {
    const online = await this.isOnline();
    const authenticated = await this.isAuthenticated();

    if (online && authenticated) {
      // Try to get from cloud first
      const cloudSessions = await apiService.getScanSessions();
      if (cloudSessions.length > 0) {
        return cloudSessions;
      }
    }

    // Fall back to local storage
    return localStorageService.getScanSessions();
  }

  /**
   * Get session segments (prioritize cloud if online)
   */
  async getSessionSegments(sessionId: string) {
    const online = await this.isOnline();
    const authenticated = await this.isAuthenticated();

    if (online && authenticated) {
      // Try to get from cloud first
      const cloudSegments = await apiService.getSessionSegments(sessionId);
      if (cloudSegments.length > 0) {
        return cloudSegments;
      }
    }

    // Fall back to local storage
    return localStorageService.getSessionSegments(sessionId);
  }

  /**
   * Delete scan session (both local and cloud)
   */
  async deleteScanSession(sessionId: string): Promise<boolean> {
    const online = await this.isOnline();
    const authenticated = await this.isAuthenticated();

    // Delete locally
    const localSuccess = await localStorageService.deleteScanSession(sessionId);

    // If online and authenticated, also delete from cloud
    if (online && authenticated) {
      await apiService.deleteScanSession(sessionId);
    }

    return localSuccess;
  }

  /**
   * Setup automatic sync every 5 minutes when online
   */
  private setupAutoSync() {
    this.syncInterval = setInterval(async () => {
      const online = await this.isOnline();
      const authenticated = await this.isAuthenticated();

      if (online && authenticated) {
        await this.syncAll();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Listen for network changes and sync when coming online
   */
  private setupNetworkListener() {
    NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        const authenticated = await this.isAuthenticated();
        if (authenticated) {
          // Wait a bit for connection to stabilize
          setTimeout(() => this.syncAll(), 2000);
        }
      }
    });
  }

  /**
   * Stop sync service
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Singleton instance
export const syncService = new SyncService();
