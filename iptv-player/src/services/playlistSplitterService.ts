import type { Channel } from '../types/m3u';

export interface PlaylistGroup {
  id: string;
  name: string;
  channels: Channel[];
  channelCount: number;
}

export interface PlaylistIndex {
  id: string;
  name: string;
  url?: string;
  groups: PlaylistGroupReference[];
  totalChannels: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaylistGroupReference {
  id: string;
  name: string;
  channelCount: number;
  subPlaylistId: string;
}

export interface SubPlaylist {
  id: string;
  parentId: string;
  groupId: string;
  groupName: string;
  channels: Channel[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service for splitting large playlists into manageable sub-playlists by group
 */
export class PlaylistSplitterService {
  private static readonly INDEX_STORAGE_KEY = 'iptv-playlist-indexes';
  private static readonly SUB_PLAYLIST_KEY_PREFIX = 'iptv-sub-playlist-';

  /**
   * Split a playlist into groups and create sub-playlists
   */
  static splitPlaylistByGroups(
    playlistId: string,
    playlistName: string,
    channels: Channel[],
    url?: string
  ): PlaylistIndex {
    // Group channels by group-title
    const channelGroups = this.groupChannelsByTitle(channels);

    const now = new Date();
    const groupReferences: PlaylistGroupReference[] = [];

    // Create sub-playlists for each group
    for (const [groupName, groupChannels] of channelGroups.entries()) {
      const groupId = this.generateGroupId(groupName);
      const subPlaylistId = this.generateSubPlaylistId(playlistId, groupId);

      const subPlaylist: SubPlaylist = {
        id: subPlaylistId,
        parentId: playlistId,
        groupId,
        groupName,
        channels: groupChannels,
        createdAt: now,
        updatedAt: now
      };

      // Save sub-playlist to localStorage
      this.saveSubPlaylist(subPlaylist);

      groupReferences.push({
        id: groupId,
        name: groupName,
        channelCount: groupChannels.length,
        subPlaylistId
      });
    }

    // Create playlist index
    const playlistIndex: PlaylistIndex = {
      id: playlistId,
      name: playlistName,
      url,
      groups: groupReferences,
      totalChannels: channels.length,
      createdAt: now,
      updatedAt: now
    };

    // Save index
    this.savePlaylistIndex(playlistIndex);

    console.log(`Split playlist "${playlistName}" into ${groupReferences.length} groups with ${channels.length} total channels`);

    return playlistIndex;
  }

  /**
   * Group channels by their group-title
   */
  private static groupChannelsByTitle(channels: Channel[]): Map<string, Channel[]> {
    const groups = new Map<string, Channel[]>();

    for (const channel of channels) {
      const groupName = channel.group || 'Uncategorized';

      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }

      groups.get(groupName)!.push(channel);
    }

    return groups;
  }

  /**
   * Generate a consistent group ID from group name
   */
  private static generateGroupId(groupName: string): string {
    return groupName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50) || 'uncategorized';
  }

  /**
   * Generate sub-playlist ID
   */
  private static generateSubPlaylistId(parentId: string, groupId: string): string {
    return `${parentId}-${groupId}`;
  }

  /**
   * Save playlist index to localStorage
   */
  private static savePlaylistIndex(index: PlaylistIndex): void {
    try {
      const indexes = this.getPlaylistIndexes();
      const existingIndex = indexes.findIndex(idx => idx.id === index.id);

      if (existingIndex >= 0) {
        indexes[existingIndex] = index;
      } else {
        indexes.push(index);
      }

      localStorage.setItem(this.INDEX_STORAGE_KEY, JSON.stringify(indexes));
    } catch (error) {
      console.error('Failed to save playlist index:', error);
      throw new Error('Failed to save playlist index');
    }
  }

  /**
   * Save sub-playlist to localStorage
   */
  private static saveSubPlaylist(subPlaylist: SubPlaylist): void {
    try {
      const key = `${this.SUB_PLAYLIST_KEY_PREFIX}${subPlaylist.id}`;
      localStorage.setItem(key, JSON.stringify(subPlaylist));
    } catch (error) {
      console.error('Failed to save sub-playlist:', error);
      throw new Error('Failed to save sub-playlist');
    }
  }

  /**
   * Get all playlist indexes
   */
  static getPlaylistIndexes(): PlaylistIndex[] {
    try {
      const stored = localStorage.getItem(this.INDEX_STORAGE_KEY);
      if (!stored) return [];

      const indexes = JSON.parse(stored) as PlaylistIndex[];
      return indexes.map((idx) => ({
        ...idx,
        createdAt: new Date(idx.createdAt),
        updatedAt: new Date(idx.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading playlist indexes:', error);
      return [];
    }
  }

  /**
   * Get playlist index by ID
   */
  static getPlaylistIndex(id: string): PlaylistIndex | null {
    const indexes = this.getPlaylistIndexes();
    return indexes.find(idx => idx.id === id) || null;
  }

  /**
   * Get sub-playlist by ID
   */
  static getSubPlaylist(id: string): SubPlaylist | null {
    try {
      const key = `${this.SUB_PLAYLIST_KEY_PREFIX}${id}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const subPlaylist = JSON.parse(stored) as SubPlaylist;
      return {
        ...subPlaylist,
        createdAt: new Date(subPlaylist.createdAt),
        updatedAt: new Date(subPlaylist.updatedAt)
      };
    } catch (error) {
      console.error('Error loading sub-playlist:', error);
      return null;
    }
  }

  /**
   * Get channels from a specific group
   */
  static getGroupChannels(playlistId: string, groupId: string): Channel[] {
    const index = this.getPlaylistIndex(playlistId);
    if (!index) return [];

    const groupRef = index.groups.find(g => g.id === groupId);
    if (!groupRef) return [];

    const subPlaylist = this.getSubPlaylist(groupRef.subPlaylistId);
    return subPlaylist?.channels || [];
  }

  /**
   * Delete playlist and all its sub-playlists
   */
  static deletePlaylist(id: string): boolean {
    try {
      const index = this.getPlaylistIndex(id);
      if (!index) return false;

      // Delete all sub-playlists
      for (const groupRef of index.groups) {
        const key = `${this.SUB_PLAYLIST_KEY_PREFIX}${groupRef.subPlaylistId}`;
        localStorage.removeItem(key);
      }

      // Remove from indexes
      const indexes = this.getPlaylistIndexes();
      const filtered = indexes.filter(idx => idx.id !== id);
      localStorage.setItem(this.INDEX_STORAGE_KEY, JSON.stringify(filtered));

      console.log(`Deleted playlist "${index.name}" and ${index.groups.length} sub-playlists`);
      return true;
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      return false;
    }
  }

  /**
   * Check if a playlist should be split (based on size or channel count)
   */
  static shouldSplitPlaylist(channels: Channel[]): boolean {
    // Split if more than 1000 channels or multiple groups exist
    if (channels.length > 1000) return true;

    const groups = this.groupChannelsByTitle(channels);
    return groups.size > 1;
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(): { indexes: number; subPlaylists: number; totalSize: string } {
    let indexSize = 0;
    let subPlaylistSize = 0;
    let subPlaylistCount = 0;

    try {
      // Count indexes
      const indexData = localStorage.getItem(this.INDEX_STORAGE_KEY);
      if (indexData) {
        indexSize = new Blob([indexData]).size;
      }

      // Count sub-playlists
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.SUB_PLAYLIST_KEY_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            subPlaylistSize += new Blob([data]).size;
            subPlaylistCount++;
          }
        }
      }

      const totalSize = this.formatBytes(indexSize + subPlaylistSize);

      return {
        indexes: this.getPlaylistIndexes().length,
        subPlaylists: subPlaylistCount,
        totalSize
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { indexes: 0, subPlaylists: 0, totalSize: '0 B' };
    }
  }

  /**
   * Format bytes to human readable format
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}