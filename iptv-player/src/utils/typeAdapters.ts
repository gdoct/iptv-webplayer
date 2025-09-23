import type { Channel as M3UChannel, M3UPlaylist } from '../types/m3u';
import type { Channel as StyleChannel } from '@ipts/ipts-styles';
import type { Playlist as StylePlaylist } from '@ipts/ipts-styles';

/**
 * Convert M3U Channel to Style Library Channel
 */
export function adaptM3UChannelToStyleChannel(m3uChannel: M3UChannel): StyleChannel {
  return {
    id: m3uChannel.id,
    name: m3uChannel.name,
    logo: m3uChannel.logo || '📺', // Default icon if no logo
    category: m3uChannel.group || 'Uncategorized',
    isLive: true // Assume all M3U channels are live
  };
}

/**
 * Convert M3U Playlist to Style Library Playlist
 */
export function adaptM3UPlaylistToStylePlaylist(m3uPlaylist: M3UPlaylist): StylePlaylist {
  return {
    id: m3uPlaylist.id,
    name: m3uPlaylist.name,
    url: m3uPlaylist.url || '', // Style library expects required url
    channelCount: m3uPlaylist.channels.length,
    isActive: true, // All loaded playlists are considered active
    lastUpdated: m3uPlaylist.updatedAt
  };
}

/**
 * Convert array of M3U Channels to Style Library Channels
 */
export function adaptM3UChannelsToStyleChannels(m3uChannels: M3UChannel[]): StyleChannel[] {
  return m3uChannels.map(adaptM3UChannelToStyleChannel);
}

/**
 * Convert array of M3U Playlists to Style Library Playlists
 */
export function adaptM3UPlaylistsToStylePlaylists(m3uPlaylists: M3UPlaylist[]): StylePlaylist[] {
  return m3uPlaylists.map(adaptM3UPlaylistToStylePlaylist);
}