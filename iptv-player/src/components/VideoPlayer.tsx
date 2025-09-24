import { useEffect, useRef, useState } from 'react';
import { createPlayer, getFeatureList, type Player } from 'mpegts.js';

interface VideoPlayerProps {
  url: string;
  isLive?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
  onError?: (error: string | null) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export function VideoPlayer({
  url,
  isLive = true,
  autoplay = true,
  muted = false,
  onLoadingChange,
  onError,
  onPlayingChange
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const features = getFeatureList();
    if (!features.mseLivePlayback) {
      setIsSupported(false);
      setError('MPEG-TS playback is not supported in this browser');
      return;
    }

    const video = videoRef.current;
    if (!video || !url) return;

    try {

      const player = createPlayer({
        type: 'mpegts',
        url,
        isLive
      });

      player.attachMediaElement(video);
      player.load();

      playerRef.current = player;

      const handleLoadStart = () => {
          setIsLoading(true);
          onLoadingChange?.(true);
        };
        const handleCanPlay = () => {
          setIsLoading(false);
          onLoadingChange?.(false);
        };
        const handleError = () => {
          // Detect mixed content blocking
          const isMixedContent = window.location.protocol === 'https:' && url.startsWith('http://');

          let errorMsg = 'Failed to load video stream';
          if (isMixedContent) {
            errorMsg = '⚠️ Mixed Content Blocked: Cannot load HTTP stream on HTTPS site. Please serve this site over HTTP or use HTTPS streams.';
          }

          setError(errorMsg);
          setIsLoading(false);
          onError?.(errorMsg);
          onLoadingChange?.(false);
        };
        const handlePlay = () => onPlayingChange?.(true);
        const handlePause = () => onPlayingChange?.(false);

        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('error', handleError);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
          video.removeEventListener('loadstart', handleLoadStart);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('error', handleError);
          video.removeEventListener('play', handlePlay);
          video.removeEventListener('pause', handlePause);

          if (playerRef.current) {
            playerRef.current.destroy();
            playerRef.current = null;
          }
        };
    } catch (err) {
      // Check if this is a mixed content error
      const isMixedContent = window.location.protocol === 'https:' && url.startsWith('http://');

      let errorMsg = `Failed to initialize player: ${err instanceof Error ? err.message : 'Unknown error'}`;
      if (isMixedContent) {
        errorMsg = '⚠️ Mixed Content Blocked: Cannot load HTTP stream on HTTPS site. Please serve this site over HTTP or use HTTPS streams.';
      }

      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
      onLoadingChange?.(false);
    }
  }, [url, isLive]);

  if (!isSupported) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff' }}>
        <p>MPEG-TS playback not supported</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        autoPlay={autoplay}
        muted={muted}
        controls
        style={{ width: '100%', height: '100%', display: 'block', backgroundColor: '#000', objectFit: 'contain' }}
      />
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff'
        }}>
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
}
