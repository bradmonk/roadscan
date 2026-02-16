import * as SQLite from 'expo-sqlite';
import { ScanSession, ScanSegment } from '../types';

class LocalStorageService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('roadscan.db');
      await this.createTables();
    } catch (error) {
      console.error('Error initializing local database:', error);
    }
  }

  private async createTables() {
    if (!this.db) return;

    try {
      // Scan sessions table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS scan_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          started_at TEXT NOT NULL,
          ended_at TEXT,
          total_distance_km REAL DEFAULT 0,
          average_roughness REAL,
          status TEXT DEFAULT 'active',
          synced INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Scan segments table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS scan_segments (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          start_lat REAL NOT NULL,
          start_lng REAL NOT NULL,
          end_lat REAL NOT NULL,
          end_lng REAL NOT NULL,
          average_roughness REAL NOT NULL,
          segment_duration_seconds INTEGER NOT NULL,
          synced INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES scan_sessions (id) ON DELETE CASCADE
        );
      `);

      // Create indexes
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON scan_sessions(started_at DESC);
        CREATE INDEX IF NOT EXISTS idx_sessions_synced ON scan_sessions(synced);
        CREATE INDEX IF NOT EXISTS idx_segments_session_id ON scan_segments(session_id);
        CREATE INDEX IF NOT EXISTS idx_segments_synced ON scan_segments(synced);
      `);
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  }

  /**
   * Save scan session locally
   */
  async saveScanSession(session: Partial<ScanSession>): Promise<string | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    try {
      const id = session.id || this.generateId();
      
      await this.db.runAsync(
        `INSERT OR REPLACE INTO scan_sessions 
         (id, user_id, started_at, ended_at, total_distance_km, average_roughness, status, synced) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          session.user_id || '',
          session.started_at || new Date().toISOString(),
          session.ended_at || null,
          session.total_distance_km || 0,
          session.average_roughness || null,
          session.status || 'active',
          0,
        ]
      );

      return id;
    } catch (error) {
      console.error('Error saving scan session:', error);
      return null;
    }
  }

  /**
   * Save scan segment locally
   */
  async saveScanSegment(segment: Partial<ScanSegment>): Promise<boolean> {
    if (!this.db) await this.init();
    if (!this.db) return false;

    try {
      const id = segment.id || this.generateId();

      await this.db.runAsync(
        `INSERT INTO scan_segments 
         (id, session_id, start_lat, start_lng, end_lat, end_lng, average_roughness, segment_duration_seconds, synced) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          segment.session_id || '',
          segment.start_lat || 0,
          segment.start_lng || 0,
          segment.end_lat || 0,
          segment.end_lng || 0,
          segment.average_roughness || 0,
          segment.segment_duration_seconds || 0,
          0,
        ]
      );

      return true;
    } catch (error) {
      console.error('Error saving scan segment:', error);
      return false;
    }
  }

  /**
   * Get all scan sessions
   */
  async getScanSessions(): Promise<ScanSession[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync<ScanSession>(
        'SELECT * FROM scan_sessions ORDER BY started_at DESC'
      );
      return result || [];
    } catch (error) {
      console.error('Error fetching scan sessions:', error);
      return [];
    }
  }

  /**
   * Get segments for a session
   */
  async getSessionSegments(sessionId: string): Promise<ScanSegment[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync<ScanSegment>(
        'SELECT * FROM scan_segments WHERE session_id = ? ORDER BY created_at ASC',
        [sessionId]
      );
      return result || [];
    } catch (error) {
      console.error('Error fetching session segments:', error);
      return [];
    }
  }

  /**
   * Update scan session
   */
  async updateScanSession(
    sessionId: string,
    updates: Partial<ScanSession>
  ): Promise<boolean> {
    if (!this.db) await this.init();
    if (!this.db) return false;

    try {
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        fields.push(`${key} = ?`);
        values.push(value);
      });

      if (fields.length === 0) return false;

      values.push(sessionId);

      await this.db.runAsync(
        `UPDATE scan_sessions SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return true;
    } catch (error) {
      console.error('Error updating scan session:', error);
      return false;
    }
  }

  /**
   * Delete scan session and its segments
   */
  async deleteScanSession(sessionId: string): Promise<boolean> {
    if (!this.db) await this.init();
    if (!this.db) return false;

    try {
      await this.db.runAsync('DELETE FROM scan_sessions WHERE id = ?', [sessionId]);
      return true;
    } catch (error) {
      console.error('Error deleting scan session:', error);
      return false;
    }
  }

  /**
   * Mark session as synced
   */
  async markSessionSynced(sessionId: string): Promise<boolean> {
    if (!this.db) await this.init();
    if (!this.db) return false;

    try {
      await this.db.runAsync(
        'UPDATE scan_sessions SET synced = 1 WHERE id = ?',
        [sessionId]
      );
      await this.db.runAsync(
        'UPDATE scan_segments SET synced = 1 WHERE session_id = ?',
        [sessionId]
      );
      return true;
    } catch (error) {
      console.error('Error marking session as synced:', error);
      return false;
    }
  }

  /**
   * Get unsynced sessions
   */
  async getUnsyncedSessions(): Promise<ScanSession[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync<ScanSession>(
        'SELECT * FROM scan_sessions WHERE synced = 0 AND status = ?',
        ['completed']
      );
      return result || [];
    } catch (error) {
      console.error('Error fetching unsynced sessions:', error);
      return [];
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all local data
   */
  async clearAll(): Promise<boolean> {
    if (!this.db) await this.init();
    if (!this.db) return false;

    try {
      await this.db.execAsync(`
        DELETE FROM scan_segments;
        DELETE FROM scan_sessions;
      `);
      return true;
    } catch (error) {
      console.error('Error clearing local data:', error);
      return false;
    }
  }
}

// Singleton instance
export const localStorageService = new LocalStorageService();
