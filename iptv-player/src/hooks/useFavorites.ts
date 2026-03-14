import { useState } from 'react';

const FAVORITES_KEY = 'iptv-favorites';

interface FavoritesData {
  channels: string[];
  groups: string[];
  playlists: string[];
}

function loadFavorites(): FavoritesData {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : { channels: [], groups: [], playlists: [] };
  } catch {
    return { channels: [], groups: [], playlists: [] };
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoritesData>(loadFavorites);

  const save = (newFavs: FavoritesData) => {
    setFavorites(newFavs);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
  };

  const toggleFavoriteChannel = (id: string) => {
    const channels = favorites.channels.includes(id)
      ? favorites.channels.filter(c => c !== id)
      : [...favorites.channels, id];
    save({ ...favorites, channels });
  };

  const toggleFavoriteGroup = (id: string) => {
    const groups = favorites.groups.includes(id)
      ? favorites.groups.filter(g => g !== id)
      : [...favorites.groups, id];
    save({ ...favorites, groups });
  };

  const toggleFavoritePlaylist = (id: string) => {
    const playlists = favorites.playlists.includes(id)
      ? favorites.playlists.filter(p => p !== id)
      : [...favorites.playlists, id];
    save({ ...favorites, playlists });
  };

  return {
    favoriteChannelIds: favorites.channels,
    favoriteGroupIds: favorites.groups,
    favoritePlaylistIds: favorites.playlists,
    toggleFavoriteChannel,
    toggleFavoriteGroup,
    toggleFavoritePlaylist,
  };
}
