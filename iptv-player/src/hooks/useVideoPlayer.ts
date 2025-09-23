import { useState, useCallback } from 'react';
import type { Channel as M3UChannel } from '../types/m3u';
import type { Channel as StyleChannel } from '@ipts/ipts-styles';

export interface VideoPlayerState {
  currentChannel: StyleChannel | null;
  currentChannelUrl: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface VideoPlayerActions {
  setChannel: (channel: StyleChannel, url: string) => void;
  setChannelFromM3U: (m3uChannel: M3UChannel) => void;
  clearChannel: () => void;
  setPlaying: (playing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface UseVideoPlayerReturn extends VideoPlayerState, VideoPlayerActions {}

function adaptM3UChannelToStyleChannel(m3uChannel: M3UChannel): StyleChannel {
  return {
    id: m3uChannel.id,
    name: m3uChannel.name,
    logo: m3uChannel.logo,
    category: m3uChannel.group,
    isLive: true // M3U channels are typically live streams
  };
}

export function useVideoPlayer(initialChannel?: StyleChannel, initialUrl?: string): UseVideoPlayerReturn {
  const [state, setState] = useState<VideoPlayerState>({
    currentChannel: initialChannel || null,
    currentChannelUrl: initialUrl || null,
    isPlaying: false,
    isLoading: false,
    error: null
  });

  const setChannel = useCallback((channel: StyleChannel, url: string) => {
    setState(prev => ({
      ...prev,
      currentChannel: channel,
      currentChannelUrl: url,
      error: null,
      isLoading: true
    }));
  }, []);

  const setChannelFromM3U = useCallback((m3uChannel: M3UChannel) => {
    const styleChannel = adaptM3UChannelToStyleChannel(m3uChannel);
    setChannel(styleChannel, m3uChannel.url);
  }, [setChannel]);

  const clearChannel = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentChannel: null,
      currentChannelUrl: null,
      isPlaying: false,
      isLoading: false,
      error: null
    }));
  }, []);

  const setPlaying = useCallback((playing: boolean) => {
    setState(prev => ({
      ...prev,
      isPlaying: playing
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false
    }));
  }, []);

  return {
    ...state,
    setChannel,
    setChannelFromM3U,
    clearChannel,
    setPlaying,
    setLoading,
    setError
  };
}