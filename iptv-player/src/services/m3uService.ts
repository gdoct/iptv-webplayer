import type { Channel, M3UPlaylist, M3UParseResult } from '../types/m3u';
import { IndexedDBService } from './indexedDbService';

const M3U_STORAGE_KEY = 'iptv-playlists';

export class M3UService {
  /**
   * Parse M3U content and extract channels
   */
  static parseM3U(content: string): M3UParseResult {
    const lines = content.split('\n').map(line => line.trim());
    const channels: Channel[] = [];
    const errors: string[] = [];

    let currentChannel: Partial<Channel> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('#EXTM3U')) {
        // Playlist header - ignore
        continue;
      }

      if (line.startsWith('#EXTINF:')) {
        // Channel info line
        try {
          currentChannel = this.parseExtInf(line);
        } catch (error) {
          errors.push(`Error parsing line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else if (line && !line.startsWith('#') && currentChannel) {
        // URL line
        currentChannel.url = line;
        currentChannel.id = this.generateChannelId(currentChannel.name || '', line);

        if (currentChannel.name && currentChannel.url) {
          const channel = currentChannel as Channel;
          console.log('Created channel:', channel.name, 'group:', channel.group);
          channels.push(channel);
        }
        currentChannel = null;
      }
    }

    return { channels, errors: errors.length > 0 ? errors : undefined };
  }

  /**
   * Parse #EXTINF line to extract channel information
   */
  private static parseExtInf(line: string): Partial<Channel> {
    // Split at the first comma to separate duration+params from name
    const match = line.match(/^#EXTINF:\s*([^,]*),(.*)$/);
    if (!match) {
      throw new Error('Invalid EXTINF format');
    }

    const [, durationAndParams, channelName] = match;

    // Parse duration (first part before any space)
    const durationMatch = durationAndParams.match(/^(-?\d*\.?\d+)/);
    const duration = durationMatch ? parseFloat(durationMatch[1]) : -1;

    // Extract all parameters from the duration+params part
    const params: Record<string, string> = {};

    // Try quoted parameters: key="value"
    const quotedParamMatches = durationAndParams.matchAll(/(\w+(?:-\w+)*)="([^"]*)"/g);
    for (const [, key, value] of quotedParamMatches) {
      params[key] = value;
    }

    // Also try unquoted parameters: key=value (up to space)
    const unquotedParamMatches = durationAndParams.matchAll(/(\w+(?:-\w+)*)=([^\s"]+)/g);
    for (const [, key, value] of unquotedParamMatches) {
      if (!params[key]) { // Don't override quoted params
        params[key] = value;
      }
    }

    // Debug logging for group-title extraction
    if (params['group-title']) {
      console.log('Found group-title:', params['group-title'], 'for channel:', channelName.trim());
    } else {
      console.log('No group-title found for channel:', channelName.trim(), 'params:', Object.keys(params));
    }

    return {
      name: channelName.trim(),
      duration: duration === -1 ? undefined : duration,
      logo: params['tvg-logo'],
      group: params['group-title']
    };
  }

  /**
   * Generate a unique ID for a channel
   */
  private static generateChannelId(name: string, url: string): string {
    // Add timestamp and random component to ensure uniqueness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);

    // Use a simple hash function for the content part
    const str = `${name}-${url}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const contentHash = Math.abs(hash).toString(36).substring(0, 8);

    // Combine all parts for guaranteed uniqueness
    return `${contentHash}-${timestamp}-${random}`;
  }

  /**
   * Load playlists from IndexedDB (with localStorage fallback)
   */
  static async getPlaylistsAsync(): Promise<M3UPlaylist[]> {
    if (IndexedDBService.isSupported()) {
      try {
        let playlists = await IndexedDBService.getPlaylists();

        // Migrate from localStorage if IndexedDB is empty but localStorage has data
        if (playlists.length === 0) {
          const legacyPlaylists = this.getLegacyPlaylists();
          if (legacyPlaylists.length > 0) {
            console.log('Migrating playlists from localStorage to IndexedDB...');
            playlists = this.deduplicateChannelIds(legacyPlaylists);
            await this.savePlaylistsAsync(playlists);
            // Clear localStorage after successful migration
            localStorage.removeItem(M3U_STORAGE_KEY);
            return playlists;
          }
        } else {
          // Check for and fix duplicate channel IDs in existing data
          const deduplicatedPlaylists = this.deduplicateChannelIds(playlists);
          if (this.hasChanges(playlists, deduplicatedPlaylists)) {
            console.log('Fixed duplicate channel IDs in existing playlists');
            await this.savePlaylistsAsync(deduplicatedPlaylists);
            return deduplicatedPlaylists;
          }
        }

        return playlists;
      } catch (error) {
        console.error('Error loading playlists from IndexedDB, falling back to localStorage:', error);
        return this.deduplicateChannelIds(this.getLegacyPlaylists());
      }
    } else {
      return this.deduplicateChannelIds(this.getLegacyPlaylists());
    }
  }

  /**
   * Load playlists from localStorage (synchronous, legacy)
   */
  static getPlaylists(): M3UPlaylist[] {
    return this.getLegacyPlaylists();
  }

  /**
   * Load playlists from localStorage (legacy support)
   */
  private static getLegacyPlaylists(): M3UPlaylist[] {
    try {
      const stored = localStorage.getItem(M3U_STORAGE_KEY);
      if (!stored) return [];

      const playlists = JSON.parse(stored) as M3UPlaylist[];
      return playlists.map((p) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading playlists from localStorage:', error);
      return [];
    }
  }

  /**
   * Save playlists to IndexedDB (with localStorage fallback)
   */
  static async savePlaylistsAsync(playlists: M3UPlaylist[]): Promise<void> {
    if (IndexedDBService.isSupported()) {
      try {
        await IndexedDBService.savePlaylists(playlists);
        return;
      } catch (error) {
        console.error('Error saving playlists to IndexedDB, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    this.savePlaylists(playlists);
  }

  /**
   * Save playlists to localStorage (legacy support)
   */
  static savePlaylists(playlists: M3UPlaylist[]): void {
    try {
      localStorage.setItem(M3U_STORAGE_KEY, JSON.stringify(playlists));
    } catch (error) {
      console.error('Error saving playlists to localStorage:', error);
      throw new Error('Failed to save playlist');
    }
  }

  /**
   * Add a new playlist (async, preferred)
   */
  static async addPlaylistAsync(name: string, content: string, url?: string): Promise<M3UPlaylist> {
    const parseResult = this.parseM3U(content);

    const playlist: M3UPlaylist = {
      id: this.generatePlaylistId(),
      name,
      url,
      channels: parseResult.channels,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (IndexedDBService.isSupported()) {
      try {
        await IndexedDBService.savePlaylist(playlist);
        return playlist;
      } catch (error) {
        console.error('Error saving playlist to IndexedDB, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    const playlists = this.getPlaylists();
    playlists.push(playlist);
    this.savePlaylists(playlists);

    return playlist;
  }

  /**
   * Add a new playlist (legacy synchronous method)
   */
  static addPlaylist(name: string, content: string, url?: string): M3UPlaylist {
    const parseResult = this.parseM3U(content);

    const playlist: M3UPlaylist = {
      id: this.generatePlaylistId(),
      name,
      url,
      channels: parseResult.channels,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const playlists = this.getPlaylists();
    playlists.push(playlist);
    this.savePlaylists(playlists);

    return playlist;
  }

  /**
   * Update an existing playlist
   */
  static updatePlaylist(id: string, updates: Partial<Pick<M3UPlaylist, 'name' | 'url'>>): M3UPlaylist | null {
    const playlists = this.getPlaylists();
    const index = playlists.findIndex(p => p.id === id);

    if (index === -1) return null;

    playlists[index] = {
      ...playlists[index],
      ...updates,
      updatedAt: new Date()
    };

    this.savePlaylists(playlists);
    return playlists[index];
  }

  /**
   * Delete a playlist (async, preferred)
   */
  static async deletePlaylistAsync(id: string): Promise<boolean> {
    if (IndexedDBService.isSupported()) {
      try {
        return await IndexedDBService.deletePlaylist(id);
      } catch (error) {
        console.error('Error deleting playlist from IndexedDB, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.deletePlaylist(id);
  }

  /**
   * Delete a playlist (legacy synchronous method)
   */
  static deletePlaylist(id: string): boolean {
    const playlists = this.getPlaylists();
    const filtered = playlists.filter(p => p.id !== id);

    if (filtered.length === playlists.length) return false;

    this.savePlaylists(filtered);
    return true;
  }

  /**
   * Refresh a playlist from its URL
   */
  static async refreshPlaylist(id: string): Promise<M3UPlaylist | null> {
    const playlists = this.getPlaylists();
    const playlist = playlists.find(p => p.id === id);

    if (!playlist || !playlist.url) return null;

    try {
      const response = await fetch(playlist.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      const parseResult = this.parseM3U(content);

      playlist.channels = parseResult.channels;
      playlist.updatedAt = new Date();

      this.savePlaylists(playlists);
      return playlist;
    } catch (error) {
      console.error('Error refreshing playlist:', error);
      throw error;
    }
  }

  /**
   * Generate a unique playlist ID
   */
  private static generatePlaylistId(): string {
    return `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Deduplicate channel IDs across all playlists
   */
  private static deduplicateChannelIds(playlists: M3UPlaylist[]): M3UPlaylist[] {
    const usedIds = new Set<string>();

    return playlists.map(playlist => ({
      ...playlist,
      channels: playlist.channels.map(channel => {
        let channelId = channel.id;

        // If ID is already used, generate a new unique one
        if (usedIds.has(channelId)) {
          channelId = this.generateChannelId(channel.name, channel.url);
          console.log(`Regenerated duplicate channel ID: ${channel.id} -> ${channelId} for channel: ${channel.name}`);
        }

        usedIds.add(channelId);

        return {
          ...channel,
          id: channelId
        };
      })
    }));
  }

  /**
   * Check if playlists have changes after deduplication
   */
  private static hasChanges(original: M3UPlaylist[], updated: M3UPlaylist[]): boolean {
    if (original.length !== updated.length) return true;

    for (let i = 0; i < original.length; i++) {
      const origChannels = original[i].channels;
      const updatedChannels = updated[i].channels;

      if (origChannels.length !== updatedChannels.length) return true;

      for (let j = 0; j < origChannels.length; j++) {
        if (origChannels[j].id !== updatedChannels[j].id) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get a playlist by ID
   */
  static getPlaylist(id: string): M3UPlaylist | null {
    const playlists = this.getPlaylists();
    return playlists.find(p => p.id === id) || null;
  }

  /**
   * Get all channels from all playlists
   */
  static getAllChannels(): Channel[] {
    const playlists = this.getPlaylists();
    return playlists.flatMap(playlist => playlist.channels);
  }

  /**
   * Search channels by name
   */
  static searchChannels(query: string): Channel[] {
    const channels = this.getAllChannels();
    const lowerQuery = query.toLowerCase();

    return channels.filter(channel =>
      channel.name.toLowerCase().includes(lowerQuery) ||
      (channel.group && channel.group.toLowerCase().includes(lowerQuery))
    );
  }
}