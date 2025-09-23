import React, { useState, useRef } from 'react';
import { Button, TextInput } from '@ipts/ipts-styles';
import type { M3UPlaylist } from '../types/m3u';
import { M3UStorageService } from '../services/m3uStorageService';

export interface M3UUploadProps {
  onUpload?: (playlist: M3UPlaylist) => void;
  loading?: boolean;
}

export function M3UUpload({ onUpload, loading = false }: M3UUploadProps) {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    if (!file.name.toLowerCase().endsWith('.m3u') && !file.name.toLowerCase().endsWith('.m3u8')) {
      setError('Please select a valid M3U file (.m3u or .m3u8)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const name = playlistName || file.name.replace(/\.(m3u8?|txt)$/i, '');

      console.log('Uploading playlist:', name, 'Content length:', content.length);

      // Use the storage service to save the playlist
      const savedPlaylist = await M3UStorageService.savePlaylist(name, content);

      // Notify parent component
      onUpload?.(savedPlaylist);

      // Reset form
      setPlaylistName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      console.log('Upload successful:', savedPlaylist.name, 'with', savedPlaylist.channels.length, 'channels');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!playlistUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    if (!playlistName.trim()) {
      setError('Please enter a playlist name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the storage service to load and save the playlist
      const savedPlaylist = await M3UStorageService.loadPlaylistFromUrl(playlistName, playlistUrl);

      // Notify parent component
      onUpload?.(savedPlaylist);

      // Reset form
      setPlaylistName('');
      setPlaylistUrl('');
      console.log('URL upload successful:', savedPlaylist.name, 'with', savedPlaylist.channels.length, 'channels');
    } catch (err) {
      console.error('URL upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load playlist from URL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="m3u-upload">
      <h3>Add M3U Playlist</h3>

      {error && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.5rem',
          backgroundColor: '#ffe6e6',
          color: '#d00',
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            type="radio"
            value="file"
            checked={uploadMethod === 'file'}
            onChange={(e) => setUploadMethod(e.target.value as 'file')}
          />
          Upload from file
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="radio"
            value="url"
            checked={uploadMethod === 'url'}
            onChange={(e) => setUploadMethod(e.target.value as 'url')}
          />
          Load from URL
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <TextInput
          placeholder="Playlist name (optional for file upload)"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          disabled={loading || isLoading}
          style={{ width: '100%' }}
        />
      </div>

      {uploadMethod === 'file' ? (
        <div style={{ marginBottom: '1rem' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".m3u,.m3u8,.txt"
            onChange={handleFileUpload}
            disabled={loading || isLoading}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: loading || isLoading ? '#f5f5f5' : 'white'
            }}
          />
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
            Supported formats: .m3u, .m3u8
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <TextInput
            placeholder="M3U playlist URL"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            disabled={loading || isLoading}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />
          <Button
            onClick={handleUrlUpload}
            disabled={loading || isLoading || !playlistUrl.trim() || !playlistName.trim()}
            variant="primary"
            style={{ width: '100%' }}
          >
            {loading || isLoading ? 'Loading...' : 'Load Playlist'}
          </Button>
        </div>
      )}
    </div>
  );
}