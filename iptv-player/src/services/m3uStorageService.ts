import type { M3UPlaylist } from '../types/m3u';
import { M3UService } from './m3uService';
import { PlaylistSplitterService, type PlaylistIndex } from './playlistSplitterService';

/**
 * Dedicated service for M3U storage operations
 * Handles both regular playlists and split sub-playlists
 */
export class M3UStorageService {
  /**
   * Save playlist with validation and error handling
   * Automatically splits large playlists by group
   */
  static async savePlaylist(name: string, content: string, url?: string): Promise<M3UPlaylist> {
    // Validate inputs
    if (!name.trim()) {
      throw new Error('Playlist name is required');
    }

    if (!content.trim()) {
      throw new Error('Playlist content is required');
    }

    try {
      // Use async M3UService to parse and add the playlist
      const playlist = await M3UService.addPlaylistAsync(name.trim(), content, url);

      // Check if playlist should be split
      if (PlaylistSplitterService.shouldSplitPlaylist(playlist.channels)) {
        console.log(`Large playlist detected (${playlist.channels.length} channels), splitting by groups...`);

        // Split the playlist
        const playlistIndex = PlaylistSplitterService.splitPlaylistByGroups(
          playlist.id,
          playlist.name,
          playlist.channels,
          playlist.url
        );

        console.log(`Playlist split into ${playlistIndex.groups.length} groups`);
      }

      console.log(`Playlist "${name}" saved successfully with ${playlist.channels.length} channels`);
      return playlist;
    } catch (error) {
      console.error('Failed to save playlist:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to save playlist: ${error.message}`);
      } else {
        throw new Error('Failed to save playlist: Unknown error');
      }
    }
  }

  /**
   * Load playlist from URL with proper error handling
   */
  static async loadPlaylistFromUrl(name: string, url: string): Promise<M3UPlaylist> {
    if (!name.trim()) {
      throw new Error('Playlist name is required');
    }

    if (!url.trim()) {
      throw new Error('Playlist URL is required');
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      return this.savePlaylist(name, content, url);
    } catch (error) {
      console.error('Failed to load playlist from URL:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to load playlist: ${error.message}`);
      } else {
        throw new Error('Failed to load playlist: Unknown error');
      }
    }
  }

  /**
   * Get playlist index (for split playlists)
   */
  static getPlaylistIndex(id: string): PlaylistIndex | null {
    return PlaylistSplitterService.getPlaylistIndex(id);
  }

  /**
   * Get all playlist indexes
   */
  static getPlaylistIndexes(): PlaylistIndex[] {
    return PlaylistSplitterService.getPlaylistIndexes();
  }

  /**
   * Get channels from a specific group in a split playlist
   */
  static getGroupChannels(playlistId: string, groupId: string) {
    return PlaylistSplitterService.getGroupChannels(playlistId, groupId);
  }

  /**
   * Check if a playlist is split into groups
   */
  static isPlaylistSplit(id: string): boolean {
    const index = this.getPlaylistIndex(id);
    return index !== null && index.groups.length > 0;
  }

  /**
   * Delete playlist (handles both regular and split playlists)
   */
  static deletePlaylist(id: string): boolean {
    // Try to delete as split playlist first
    if (PlaylistSplitterService.deletePlaylist(id)) {
      return true;
    }

    // Fall back to regular playlist deletion
    try {
      return M3UService.deletePlaylist(id);
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      return false;
    }
  }
}