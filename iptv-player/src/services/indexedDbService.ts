import type { M3UPlaylist } from '../types/m3u';

/**
 * IndexedDB service for storing large M3U playlists
 * Replaces localStorage to handle files larger than 5-10MB
 */
export class IndexedDBService {
  private static readonly DB_NAME = 'IPTV_DB';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'playlists';

  /**
   * Initialize IndexedDB database
   */
  private static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Get all playlists from IndexedDB
   */
  static async getPlaylists(): Promise<M3UPlaylist[]> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onerror = () => {
          reject(new Error('Failed to retrieve playlists'));
        };

        request.onsuccess = () => {
          const playlists = request.result.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt)
          }));
          resolve(playlists);
        };
      });
    } catch (error) {
      console.error('Error loading playlists from IndexedDB:', error);
      return [];
    }
  }

  /**
   * Save a single playlist to IndexedDB
   */
  static async savePlaylist(playlist: M3UPlaylist): Promise<void> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(playlist);

        request.onerror = () => {
          reject(new Error('Failed to save playlist'));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Error saving playlist to IndexedDB:', error);
      throw new Error('Failed to save playlist');
    }
  }

  /**
   * Save multiple playlists to IndexedDB
   */
  static async savePlaylists(playlists: M3UPlaylist[]): Promise<void> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);

        // Clear existing playlists first
        const clearRequest = store.clear();

        clearRequest.onerror = () => {
          reject(new Error('Failed to clear existing playlists'));
        };

        clearRequest.onsuccess = () => {
          // Add all new playlists
          let completed = 0;
          const total = playlists.length;

          if (total === 0) {
            resolve();
            return;
          }

          playlists.forEach(playlist => {
            const addRequest = store.add(playlist);

            addRequest.onerror = () => {
              reject(new Error('Failed to save playlists'));
            };

            addRequest.onsuccess = () => {
              completed++;
              if (completed === total) {
                resolve();
              }
            };
          });
        };
      });
    } catch (error) {
      console.error('Error saving playlists to IndexedDB:', error);
      throw new Error('Failed to save playlists');
    }
  }

  /**
   * Delete a playlist by ID
   */
  static async deletePlaylist(id: string): Promise<boolean> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => {
          reject(new Error('Failed to delete playlist'));
        };

        request.onsuccess = () => {
          resolve(true);
        };
      });
    } catch (error) {
      console.error('Error deleting playlist from IndexedDB:', error);
      return false;
    }
  }

  /**
   * Get a single playlist by ID
   */
  static async getPlaylist(id: string): Promise<M3UPlaylist | null> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(id);

        request.onerror = () => {
          reject(new Error('Failed to retrieve playlist'));
        };

        request.onsuccess = () => {
          const playlist = request.result;
          if (playlist) {
            resolve({
              ...playlist,
              createdAt: new Date(playlist.createdAt),
              updatedAt: new Date(playlist.updatedAt)
            });
          } else {
            resolve(null);
          }
        };
      });
    } catch (error) {
      console.error('Error loading playlist from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Check if IndexedDB is supported
   */
  static isSupported(): boolean {
    return 'indexedDB' in window;
  }

  /**
   * Clear all data from IndexedDB
   */
  static async clearAll(): Promise<void> {
    try {
      const db = await this.openDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.clear();

        request.onerror = () => {
          reject(new Error('Failed to clear database'));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
      throw new Error('Failed to clear database');
    }
  }
}