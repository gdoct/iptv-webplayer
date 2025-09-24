import React, { useState, useRef } from 'react';
import { Wizard, type WizardStep } from '@ipts/ipts-styles';
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
  allowCancel = false
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
      id: 'welcome',
      title: 'Welcome',
      validation: async () => true, // Always valid, just informational
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '24px'
          }}>
            📺
          </div>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '28px',
            fontWeight: '600',
            color: '#ffffff',
            lineHeight: '1.3'
          }}>
            Welcome to IPTV Web Player!
          </h3>
          <p style={{
            marginBottom: '32px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '18px',
            lineHeight: '1.6',
            maxWidth: '500px',
            margin: '0 auto 32px auto'
          }}>
            To get started, you'll need to provide an M3U playlist containing your IPTV channels.
            This can be uploaded as a file or loaded from a URL.
          </p>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '24px',
            maxWidth: '500px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '20px' }}>💡</div>
              <span style={{
                color: '#3b82f6',
                fontWeight: '600',
                fontSize: '16px'
              }}>
                What's an M3U playlist?
              </span>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              lineHeight: '1.5',
              margin: 0
            }}>
              An M3U playlist is a file format that contains a list of IPTV channels with their streaming URLs.
              It's commonly used by IPTV providers to deliver channel lists to their customers.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'method',
      title: 'Choose Method',
      validation: validateMethod,
      content: (
        <div>
          <p style={{
            marginBottom: '24px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            How would you like to add your IPTV playlist?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              border: `2px solid ${wizardData.method === 'file' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
              background: wizardData.method === 'file' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                value="file"
                checked={wizardData.method === 'file'}
                onChange={(e) => updateWizardData({ method: e.target.value as 'file' })}
                style={{ margin: 0, accentColor: '#3b82f6' }}
              />
              <div>
                <div style={{
                  fontWeight: '600',
                  marginBottom: '4px',
                  color: '#ffffff',
                  fontSize: '16px'
                }}>
                  📁 Upload File
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.4'
                }}>
                  Upload an M3U or M3U8 file from your device
                </div>
              </div>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              border: `2px solid ${wizardData.method === 'url' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
              background: wizardData.method === 'url' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                value="url"
                checked={wizardData.method === 'url'}
                onChange={(e) => updateWizardData({ method: e.target.value as 'url' })}
                style={{ margin: 0, accentColor: '#3b82f6' }}
              />
              <div>
                <div style={{
                  fontWeight: '600',
                  marginBottom: '4px',
                  color: '#ffffff',
                  fontSize: '16px'
                }}>
                  🌐 Load from URL
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.4'
                }}>
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
        <div>
          {wizardData.method === 'file' ? (
            <div>
              <p style={{
                marginBottom: '24px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                Select your M3U playlist file from your device.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".m3u,.m3u8,.txt"
                onChange={handleFileSelect}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px dashed rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(255, 255, 255, 0.3)'}
              />

              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '8px'
              }}>
                Supported formats: .m3u, .m3u8, .txt
              </div>

              {wizardData.fileName && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  color: '#22c55e',
                  fontSize: '14px'
                }}>
                  ✅ File selected: {wizardData.fileName}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p style={{
                marginBottom: '24px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                Enter the URL of your M3U playlist.
              </p>

              <input
                type="url"
                placeholder="https://example.com/playlist.m3u"
                value={wizardData.playlistUrl}
                onChange={(e) => updateWizardData({ playlistUrl: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '12px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />

              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '8px'
              }}>
                The URL should point directly to an M3U or M3U8 file
              </div>
            </div>
          )}

          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '14px'
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
        <div>
          <p style={{
            marginBottom: '24px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            Give your playlist a memorable name.
          </p>

          <input
            type="text"
            placeholder="My IPTV Playlist"
            value={wizardData.playlistName}
            onChange={(e) => updateWizardData({ playlistName: e.target.value })}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              padding: '12px',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(59, 130, 246, 0.5)'}
            onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(255, 255, 255, 0.2)'}
          />

          {wizardData.fileName && (
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '8px'
            }}>
              Default name from file: {wizardData.fileName.replace(/\.(m3u8?|txt)$/i, '')}
            </div>
          )}

          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '14px'
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
      allowCancel={allowCancel}
      captions={{
        finishCaption: loading ? 'Adding Playlist...' : 'Add Playlist',
        cancelCaption: allowCancel ? 'Cancel' : undefined
      }}
    />
  );
}