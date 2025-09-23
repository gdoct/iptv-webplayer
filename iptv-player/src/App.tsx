import React, { useState, useEffect } from 'react'
import './App.css'
import { VideoPlayer } from './components/VideoPlayer'
import { M3USetupWizard } from './components/M3USetupWizard'
import { HamburgerMenu, SideBar } from '@ipts/ipts-styles'
import type { Channel as StyleChannel, Playlist as StylePlaylist } from '@ipts/ipts-styles'
import { useM3UPlaylists } from './hooks/useM3UPlaylists'
import { useVideoPlayer } from './hooks/useVideoPlayer'
import { adaptM3UChannelsToStyleChannels, adaptM3UPlaylistsToStylePlaylists } from './utils/typeAdapters'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [showAddPlaylistWizard, setShowAddPlaylistWizard] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [showChannelInfo, setShowChannelInfo] = useState(false)
  const [showErrorOverlay, setShowErrorOverlay] = useState(false)

  const {
    playlists,
    selectedPlaylist,
    channels,
    selectedChannel,
    selectChannel,
    selectPlaylist,
    addPlaylist,
    deletePlaylist,
    initialLoading,
    error
  } = useM3UPlaylists()

  const videoPlayer = useVideoPlayer()

  // Convert M3U types to Style Library types
  const adaptedChannels = adaptM3UChannelsToStyleChannels(channels)
  const adaptedPlaylists = adaptM3UPlaylistsToStylePlaylists(playlists)

  // Generate groups from channel categories
  const channelGroups = React.useMemo(() => {
    const groupMap = new Map<string, number>();

    adaptedChannels.forEach(channel => {
      const category = channel.category || 'Uncategorized';
      groupMap.set(category, (groupMap.get(category) || 0) + 1);
    });

    return Array.from(groupMap.entries()).map(([name, count]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      channelCount: count
    }));
  }, [adaptedChannels]);

  // Check if we need to show setup wizard on startup
  useEffect(() => {
    if (!initialLoading && playlists.length === 0) {
      console.log('No playlists found after initial loading, showing setup wizard');
      setShowSetupWizard(true);
    } else if (!initialLoading && playlists.length > 0) {
      console.log('Found', playlists.length, 'playlists, not showing setup wizard');
      setShowSetupWizard(false);
    }
  }, [initialLoading, playlists.length])

  const handleChannelSelect = (styleChannel: StyleChannel) => {
    // Find the original M3U channel to get the URL
    const m3uChannel = channels.find(c => c.id === styleChannel.id)
    if (m3uChannel) {
      selectChannel(m3uChannel.id)
      videoPlayer.setChannelFromM3U(m3uChannel)
      setSidebarOpen(false) // Close sidebar on mobile after selection
    }
  }

  const handlePlaylistSelect = (stylePlaylist: StylePlaylist) => {
    selectPlaylist(stylePlaylist.id)
  }

  const handleGroupSelect = (group: import('@ipts/ipts-styles').PlaylistGroup) => {
    setSelectedGroupId(group.id)
  }

  // Filter channels by selected group
  const filteredChannels = React.useMemo(() => {
    if (!selectedGroupId) return adaptedChannels;

    const groupName = channelGroups.find(g => g.id === selectedGroupId)?.name;
    if (!groupName) return adaptedChannels;

    return adaptedChannels.filter(channel =>
      (channel.category || 'Uncategorized') === groupName
    );
  }, [adaptedChannels, selectedGroupId, channelGroups]);

  // Show/hide channel info overlay on mouse hover with auto-hide
  useEffect(() => {
    let hideTimer: number;

    const handleShowOverlay = () => {
      if (videoPlayer.currentChannel && videoPlayer.currentChannelUrl) {
        setShowChannelInfo(true);
        // Clear any existing hide timer
        if (hideTimer) {
          window.clearTimeout(hideTimer);
        }
      }
    };

    const handleHideOverlay = () => {
      // Hide after 2 seconds when mouse leaves both areas
      hideTimer = window.setTimeout(() => {
        setShowChannelInfo(false);
      }, 2000);
    };

    const videoContainer = document.querySelector('.video-container');
    const channelOverlay = document.querySelector('.channel-info-overlay');

    if (videoContainer) {
      videoContainer.addEventListener('mouseenter', handleShowOverlay);
      videoContainer.addEventListener('mouseleave', handleHideOverlay);
    }

    if (channelOverlay) {
      channelOverlay.addEventListener('mouseenter', handleShowOverlay);
      channelOverlay.addEventListener('mouseleave', handleHideOverlay);
    }

    return () => {
      if (videoContainer) {
        videoContainer.removeEventListener('mouseenter', handleShowOverlay);
        videoContainer.removeEventListener('mouseleave', handleHideOverlay);
      }
      if (channelOverlay) {
        channelOverlay.removeEventListener('mouseenter', handleShowOverlay);
        channelOverlay.removeEventListener('mouseleave', handleHideOverlay);
      }
      if (hideTimer) {
        window.clearTimeout(hideTimer);
      }
    };
  }, [videoPlayer.currentChannel, videoPlayer.currentChannelUrl, showChannelInfo]);

  // Auto-hide error overlay after 7 seconds
  useEffect(() => {
    if (error || videoPlayer.error) {
      setShowErrorOverlay(true);
      const timer = setTimeout(() => {
        setShowErrorOverlay(false);
      }, 7000);

      return () => clearTimeout(timer);
    } else {
      setShowErrorOverlay(false);
    }
  }, [error, videoPlayer.error]);

  const handleSetupWizardComplete = async (name: string, content: string, url?: string) => {
    await addPlaylist(name, content, url)
    setShowSetupWizard(false)
    console.log('Setup wizard completed successfully')
  }

  const handleAddPlaylistWizardComplete = async (name: string, content: string, url?: string) => {
    await addPlaylist(name, content, url)
    setShowAddPlaylistWizard(false)
    setSidebarOpen(false) // Close sidebar after adding
    console.log('Add playlist wizard completed successfully')
  }

  return (
    <div className="app">
      {/* Floating Hamburger Menu - Hidden until hover */}
      <div className="hamburger-container">
        <HamburgerMenu
          isOpen={sidebarOpen}
          onToggle={() => {
            console.log('Hamburger clicked, current state:', sidebarOpen);
            setSidebarOpen(!sidebarOpen);
          }}
          size="large"
          className="floating-hamburger"
        />
      </div>

      {/* Translucent Sidebar */}
      <SideBar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        channels={filteredChannels}
        selectedChannelId={videoPlayer.currentChannel?.id || selectedChannel?.id}
        onChannelSelect={handleChannelSelect}
        groups={channelGroups}
        selectedGroupId={selectedGroupId ?? undefined}
        onGroupSelect={handleGroupSelect}
        playlists={adaptedPlaylists}
        selectedPlaylistId={selectedPlaylist?.id}
        onPlaylistSelect={handlePlaylistSelect}
        onPlaylistsUpdate={(updatedPlaylists) => {
          console.log('Playlists updated:', updatedPlaylists)
          // Handle playlist deletions by updating our M3U service
          const deletedPlaylistIds = playlists
            .filter(p => !updatedPlaylists.find(up => up.id === p.id))
            .map(p => p.id)

          deletedPlaylistIds.forEach(async (id) => {
            try {
              await deletePlaylist(id)
            } catch (err) {
              console.error('Failed to delete playlist:', err)
            }
          })
        }}
        onFileUpload={async (name: string, content: string) => {
          console.log('File upload requested:', name, 'Content length:', content.length)
          await addPlaylist(name, content)
          console.log('File upload completed successfully')
        }}
        onResetToDefaults={() => {
          console.log('Reset to defaults requested')
          // Clear all playlists and show setup wizard
          playlists.forEach(async (playlist) => {
            try {
              await deletePlaylist(playlist.id)
            } catch (err) {
              console.error('Failed to delete playlist during reset:', err)
            }
          })
          videoPlayer.clearChannel()
          setShowSetupWizard(true)
        }}
        user={{
          name: 'IPTV User',
          icon: '📺',
          subtitle: `${playlists.length} playlist${playlists.length !== 1 ? 's' : ''} • ${channels.length} channels`
        }}
        userSectionProps={{
          onClick: () => setShowAddPlaylistWizard(true)
        }}
        className="translucent-sidebar"
      />

      {/* Fullscreen Video Player */}
      <div className="video-container">
        {videoPlayer.currentChannelUrl ? (
          <VideoPlayer
            url={videoPlayer.currentChannelUrl}
            isLive={true}
            onLoadingChange={videoPlayer.setLoading}
            onError={videoPlayer.setError}
            onPlayingChange={videoPlayer.setPlaying}
          />
        ) : (
          <div className="no-video-message">
            {playlists.length === 0 && !showSetupWizard ? (
              <div>
                <h2>📺 IPTV Player</h2>
                <p>Setting up your first playlist...</p>
              </div>
            ) : (
              <div>
                <h2>📺 IPTV Player</h2>
                <p>Select a channel from the menu to start watching</p>
                <div className="hint">
                  <span>Click the ☰ menu in the top-left corner</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Channel Info Overlay */}
      {videoPlayer.currentChannel && videoPlayer.currentChannelUrl && showChannelInfo && (
        <div className="channel-info-overlay">
          <div className="channel-name">{videoPlayer.currentChannel.name}</div>
          {videoPlayer.currentChannel.category && (
            <div className="channel-group">{videoPlayer.currentChannel.category}</div>
          )}
          {videoPlayer.currentChannel.logo && (
            <img className="channel-logo" src={videoPlayer.currentChannel.logo} />
          )}
          {videoPlayer.isLoading && (
            <div className="channel-status">Loading...</div>
          )}
          {videoPlayer.isPlaying && !videoPlayer.isLoading && (
            <div className="channel-status">🔴 LIVE</div>
          )}
        </div>
      )}

      {/* Error Overlay */}
      {(error || videoPlayer.error) && showErrorOverlay && (
        <div className="error-overlay">
          <div className="error-message">
            <strong>⚠️ Error:</strong> {error || videoPlayer.error}
          </div>
        </div>
      )}

      {/* Setup Wizard - Shown on first run when no playlists exist */}
      <M3USetupWizard
        isOpen={showSetupWizard}
        onComplete={handleSetupWizardComplete}
        allowCancel={false}
      />

      {/* Add Playlist Wizard - Shown when user wants to add another playlist */}
      <M3USetupWizard
        isOpen={showAddPlaylistWizard}
        onComplete={handleAddPlaylistWizardComplete}
        onCancel={() => setShowAddPlaylistWizard(false)}
        allowCancel={true}
      />
    </div>
  )
}

export default App
