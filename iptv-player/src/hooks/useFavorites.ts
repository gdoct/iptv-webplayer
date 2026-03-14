import { useCallback, useState } from 'react';

const FAVORITES_KEY = 'iptv-favorites';

interface FavoritesData {
  channels: string[];
  groups: string[];
  playlists: string[];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}
function normalizeFavorites(value: unknown): FavoritesData {
  if (typeof value !== 'object' || value === null) {
    return { channels: [], groups: [], playlists: [] };
  }
  const obj = value as Partial<FavoritesData>;
  return {
    channels: isStringArray(obj.channels) ? obj.channels : [],
    groups: isStringArray(obj.groups) ? obj.groups : [],
    playlists: isStringArray(obj.playlists) ? obj.playlists : [],
  };
}

function loadFavorites(): FavoritesData {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) {
      return { channels: [], groups: [], playlists: [] };
    }
    const parsed = JSON.parse(stored);
    return normalizeFavorites(parsed);
  } catch {
    return { channels: [], groups: [], playlists: [] };
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoritesData>(loadFavorites);

  const toggleFavoriteChannel = useCallback((id: string) => {
    setFavorites(prev => {
      const channels = prev.channels.includes(id)
        ? prev.channels.filter(c => c !== id)
        : [...prev.channels, id];
      const next = { ...prev, channels };
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch (error) {
        console.error('Failed to save favorites to localStorage', error);
      }
      return next;
    });
  }, []);

  const toggleFavoriteGroup = useCallback((id: string) => {
    setFavorites(prev => {
      const groups = prev.groups.includes(id)
        ? prev.groups.filter(g => g !== id)
        : [...prev.groups, id];
      const next = { ...prev, groups };
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch (error) {
        console.error('Failed to save favorites to localStorage', error);
      }
      return next;
    });
  }, []);

  const toggleFavoritePlaylist = useCallback((id: string) => {
    setFavorites(prev => {
      const playlists = prev.playlists.includes(id)
        ? prev.playlists.filter(p => p !== id)
        : [...prev.playlists, id];
      const next = { ...prev, playlists };
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch (error) {
        console.error('Failed to save favorites to localStorage', error);
      }
      return next;
    });
  }, []);

  return {
    favoriteChannelIds: favorites.channels,
    favoriteGroupIds: favorites.groups,
    favoritePlaylistIds: favorites.playlists,
    toggleFavoriteChannel,
    toggleFavoriteGroup,
    toggleFavoritePlaylist,
  };
}
