import { useState, useEffect, useCallback, useMemo } from 'react';
import { M3UService } from '../services/m3uService';
import type { M3UPlaylist, Channel } from '../types/m3u';

export function useM3UPlaylists() {
  const [playlists, setPlaylists] = useState<M3UPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load playlists from IndexedDB on mount
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const loadedPlaylists = await M3UService.getPlaylistsAsync();
        console.log('Loaded playlists from storage:', loadedPlaylists.length);
        setPlaylists(loadedPlaylists);
      } catch (err) {
        setError('Failed to load playlists');
        console.error('Error loading playlists:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    loadPlaylists();
  }, []); // Only run on mount

  // Auto-select first playlist if available and none is selected
  useEffect(() => {
    if (playlists.length > 0 && !selectedPlaylistId) {
      setSelectedPlaylistId(playlists[0].id);
    }
  }, [playlists, selectedPlaylistId]);

  // Get currently selected playlist
  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId) || null;

  // Get channels from selected playlist
  const channels = useMemo(() => selectedPlaylist?.channels || [], [selectedPlaylist]);

  // Get currently selected channel
  const selectedChannel = channels.find(c => c.id === selectedChannelId) || null;

  const addPlaylist = useCallback(async (name: string, content: string, url?: string) => {
    setLoading(true);
    setError(null);

    try {
      const newPlaylist = await M3UService.addPlaylistAsync(name, content, url);
      setPlaylists(prev => [...prev, newPlaylist]);
      setSelectedPlaylistId(newPlaylist.id);
      return newPlaylist;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add playlist';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlaylist = useCallback((id: string, updates: Partial<Pick<M3UPlaylist, 'name' | 'url'>>) => {
    try {
      const updatedPlaylist = M3UService.updatePlaylist(id, updates);
      if (updatedPlaylist) {
        setPlaylists(prev => prev.map(p => p.id === id ? updatedPlaylist : p));
        return updatedPlaylist;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update playlist';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deletePlaylist = useCallback(async (id: string) => {
    try {
      const success = await M3UService.deletePlaylistAsync(id);
      if (success) {
        setPlaylists(prev => prev.filter(p => p.id !== id));

        // If deleted playlist was selected, select first available
        if (selectedPlaylistId === id) {
          const remaining = playlists.filter(p => p.id !== id);
          setSelectedPlaylistId(remaining.length > 0 ? remaining[0].id : null);
          setSelectedChannelId(null);
        }
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete playlist';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [playlists, selectedPlaylistId]);

  const refreshPlaylist = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const refreshedPlaylist = await M3UService.refreshPlaylist(id);
      if (refreshedPlaylist) {
        setPlaylists(prev => prev.map(p => p.id === id ? refreshedPlaylist : p));
        return refreshedPlaylist;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh playlist';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectPlaylist = useCallback((playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setSelectedChannelId(null); // Reset channel selection
  }, []);

  const selectChannel = useCallback((channelId: string) => {
    setSelectedChannelId(channelId);
  }, []);

  const searchChannels = useCallback((query: string): Channel[] => {
    if (!query.trim()) return channels;
    return M3UService.searchChannels(query);
  }, [channels]);

  return {
    // State
    playlists,
    selectedPlaylist,
    selectedPlaylistId,
    channels,
    selectedChannel,
    selectedChannelId,
    loading,
    initialLoading,
    error,

    // Actions
    addPlaylist,
    updatePlaylist,
    deletePlaylist,
    refreshPlaylist,
    selectPlaylist,
    selectChannel,
    searchChannels,

    // Utilities
    clearError: () => setError(null)
  };
}