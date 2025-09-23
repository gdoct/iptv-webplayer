import React, { useState, useRef } from 'react';
import { Wizard, type WizardStep, TextInput } from '@ipts/ipts-styles';
import { M3UService } from '../services/m3uService';

export interface M3USetupWizardProps {
  isOpen: boolean;
  onComplete: (name: string, content: string, url?: string) => Promise<void>;
  onCancel?: () => void;
  allowCancel?: boolean;
}

interface WizardData {
  method: 'file' | 'url';
  playlistName: string;
  playlistUrl: string;
  fileContent: string;
  fileName: string;
}

export function M3USetupWizard({
  isOpen,
  onComplete,
  onCancel,
  allowCancel = true
}: M3USetupWizardProps) {
  const [wizardData, setWizardData] = useState<WizardData>({
    method: 'file',
    playlistName: '',
    playlistUrl: '',
    fileContent: '',
    fileName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
    setError(null); // Clear error when user makes changes
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    try {
      const content = await file.text();
      const name = file.name.replace(/\.(m3u8?|txt)$/i, '');

      console.log('File content read:', content.length, 'characters');
      console.log('First 100 characters:', content.substring(0, 100));

      updateWizardData({
        fileContent: content,
        fileName: file.name,
        playlistName: wizardData.playlistName || name
      });
    } catch (err) {
      setError('Failed to read file content');
      console.error('File read error:', err);
    }
  };

  const validateMethod = async (): Promise<boolean> => {
    // Always valid - user just needs to select a method
    return true;
  };

  const validateSource = async (): Promise<boolean> => {
    console.log('validateSource called, method:', wizardData.method);
    console.log('fileContent length:', wizardData.fileContent?.length || 0);

    if (wizardData.method === 'file') {
      if (!wizardData.fileContent) {
        setError('Please select an M3U file');
        return false;
      }

      console.log('Validating file content:', wizardData.fileContent.substring(0, 100));

      // Use the actual M3U service to validate the content
      try {
        const parseResult = M3UService.parseM3U(wizardData.fileContent);
        if (parseResult.channels.length === 0) {
          setError('No valid channels found in the M3U file');
          return false;
        }
        if (parseResult.errors && parseResult.errors.length > 0) {
          console.warn('M3U parsing warnings:', parseResult.errors);
        }
        console.log('M3U file validation passed, found', parseResult.channels.length, 'channels');
      } catch (err) {
        setError(`Invalid M3U file: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return false;
      }
    } else {
      if (!wizardData.playlistUrl.trim()) {
        setError('Please enter a playlist URL');
        return false;
      }

      try {
        new URL(wizardData.playlistUrl);
      } catch {
        setError('Please enter a valid URL');
        return false;
      }

      // Test the URL
      try {
        setLoading(true);
        const response = await fetch(wizardData.playlistUrl);
        if (!response.ok) {
          setError(`HTTP ${response.status}: ${response.statusText}`);
          return false;
        }

        const content = await response.text();

        // Use the M3U service to validate the content
        try {
          const parseResult = M3UService.parseM3U(content);
          if (parseResult.channels.length === 0) {
            setError('No valid channels found in the playlist from this URL');
            return false;
          }
          console.log('URL validation passed, found', parseResult.channels.length, 'channels');
        } catch (err) {
          setError(`Invalid M3U content from URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
          return false;
        }

        updateWizardData({ fileContent: content });
      } catch (err) {
        setError(`Failed to load playlist: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return false;
      } finally {
        setLoading(false);
      }
    }

    return true;
  };

  const validateName = async (): Promise<boolean> => {
    if (!wizardData.playlistName.trim()) {
      setError('Please enter a name for your playlist');
      return false;
    }
    return true;
  };

  const handleComplete = async (): Promise<void> => {
    try {
      setLoading(true);
      await onComplete(
        wizardData.playlistName,
        wizardData.fileContent,
        wizardData.method === 'url' ? wizardData.playlistUrl : undefined
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add playlist');
      throw err; // Re-throw to prevent wizard from closing
    } finally {
      setLoading(false);
    }
  };

  const steps: WizardStep[] = [
    {
      id: 'method',
      title: 'Choose Method',
      validation: validateMethod,
      content: (
        <div style={{ padding: '1rem 0' }}>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            How would you like to add your IPTV playlist?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              border: `2px solid ${wizardData.method === 'file' ? '#007bff' : '#e9ecef'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}>
              <input
                type="radio"
                value="file"
                checked={wizardData.method === 'file'}
                onChange={(e) => updateWizardData({ method: e.target.value as 'file' })}
                style={{ margin: 0 }}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  📁 Upload File
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  Upload an M3U or M3U8 file from your device
                </div>
              </div>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              border: `2px solid ${wizardData.method === 'url' ? '#007bff' : '#e9ecef'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}>
              <input
                type="radio"
                value="url"
                checked={wizardData.method === 'url'}
                onChange={(e) => updateWizardData({ method: e.target.value as 'url' })}
                style={{ margin: 0 }}
              />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  🌐 Load from URL
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  Load a playlist directly from a web URL
                </div>
              </div>
            </label>
          </div>
        </div>
      )
    },
    {
      id: 'source',
      title: wizardData.method === 'file' ? 'Select File' : 'Enter URL',
      validation: validateSource,
      content: (
        <div style={{ padding: '1rem 0' }}>
          {wizardData.method === 'file' ? (
            <div>
              <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                Select your M3U playlist file from your device.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".m3u,.m3u8,.txt"
                onChange={handleFileSelect}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px dashed #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa',
                  fontSize: '0.875rem'
                }}
              />

              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                Supported formats: .m3u, .m3u8, .txt
              </div>

              {wizardData.fileName && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#e8f5e8',
                  borderRadius: '4px',
                  border: '1px solid #28a745'
                }}>
                  ✅ File selected: {wizardData.fileName}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                Enter the URL of your M3U playlist.
              </p>

              <TextInput
                placeholder="https://example.com/playlist.m3u"
                value={wizardData.playlistUrl}
                onChange={(e) => updateWizardData({ playlistUrl: e.target.value })}
                style={{ width: '100%' }}
              />

              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                The URL should point directly to an M3U or M3U8 file
              </div>
            </div>
          )}

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#ffe6e6',
              color: '#d00',
              borderRadius: '4px',
              border: '1px solid #dc3545'
            }}>
              {error}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'name',
      title: 'Name Your Playlist',
      validation: validateName,
      content: (
        <div style={{ padding: '1rem 0' }}>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            Give your playlist a memorable name.
          </p>

          <TextInput
            placeholder="My IPTV Playlist"
            value={wizardData.playlistName}
            onChange={(e) => updateWizardData({ playlistName: e.target.value })}
            style={{ width: '100%' }}
          />

          {wizardData.fileName && (
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
              Default name from file: {wizardData.fileName.replace(/\.(m3u8?|txt)$/i, '')}
            </div>
          )}

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#ffe6e6',
              color: '#d00',
              borderRadius: '4px',
              border: '1px solid #dc3545'
            }}>
              {error}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <Wizard
      steps={steps}
      isOpen={isOpen}
      onComplete={handleComplete}
      onCancel={allowCancel && onCancel ? onCancel : () => {}}
      size="md"
      captions={{
        finishCaption: loading ? 'Adding Playlist...' : 'Add Playlist',
        cancelCaption: allowCancel ? 'Cancel' : undefined
      }}
    />
  );
}