import React, { useState } from "react";
import { Button } from "../Button";
import { PlaylistSelector } from "../PlaylistSelector";
import type { Playlist } from "../PlaylistSelector";
import { PlaylistManagerModal } from "../PlaylistManagerModal";
import { PlaybackSettingsModal } from "../PlaybackSettingsModal";
import type { PlaybackSettings } from "../PlaybackSettingsModal";
import { ResetToDefaultModal } from "../ResetToDefaultModal";

export type SettingsSectionProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * Available playlists for selection.
     */
    playlists?: Playlist[];
    /**
     * Currently selected playlist ID.
     */
    selectedPlaylistId?: string;
    /**
     * Current playback settings.
     */
    playbackSettings?: PlaybackSettings;
    /**
     * Callback when playlist is selected.
     */
    onPlaylistSelect?: (playlist: Playlist) => void;
    /**
     * Callback when playlists are updated.
     */
    onPlaylistsUpdate?: (playlists: Playlist[]) => void;
    /**
     * Callback when playback settings are updated.
     */
    onPlaybackSettingsUpdate?: (settings: PlaybackSettings) => void;
    /**
     * Callback when reset to defaults is confirmed.
     */
    onResetToDefaults?: () => void;
    /**
     * Callback to handle file upload.
     */
    onFileUpload?: (name: string, content: string) => Promise<void>;
};

const SettingsSection = React.forwardRef<HTMLDivElement, SettingsSectionProps>(
    ({
        playlists = [],
        selectedPlaylistId,
        playbackSettings,
        onPlaylistSelect,
        onPlaylistsUpdate,
        onPlaybackSettingsUpdate,
        onResetToDefaults,
        onFileUpload,
        className = "",
        ...rest
    }, ref) => {
        const [isPlaylistManagerOpen, setIsPlaylistManagerOpen] = useState(false);
        const [isPlaybackSettingsOpen, setIsPlaybackSettingsOpen] = useState(false);
        const [isResetModalOpen, setIsResetModalOpen] = useState(false);

        return (
            <>
                <div
                    ref={ref}
                    className={`settings-section ${className}`.trim()}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}
                    {...rest}
                >
                    <div
                        className="settings-section__content"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}
                    >
                        <div
                            className="settings-group"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}
                        >
                            <div
                                className="settings-group__header"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <h4
                                    className="settings-group__title"
                                    style={{
                                        margin: '0',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    📋 Active Playlist
                                </h4>
                            </div>
                            <PlaylistSelector
                                playlists={playlists}
                                selectedPlaylistId={selectedPlaylistId}
                                onPlaylistSelect={onPlaylistSelect}
                                placeholder="No playlist selected"
                            />
                        </div>

                        <div className="settings-group">
                            <Button
                                variant="secondary"
                                onClick={() => setIsPlaylistManagerOpen(true)}
                                className="settings-action"
                                style={{
                                    width: '100%',
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    color: '#60a5fa',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                                onMouseOver={(e) => {
                                    (e.target as HTMLElement).style.background = 'rgba(59, 130, 246, 0.25)';
                                    (e.target as HTMLElement).style.borderColor = 'rgba(59, 130, 246, 0.4)';
                                }}
                                onMouseOut={(e) => {
                                    (e.target as HTMLElement).style.background = 'rgba(59, 130, 246, 0.15)';
                                    (e.target as HTMLElement).style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                }}
                            >
                                🎵 Manage Playlists
                            </Button>
                        </div>

                        <div className="settings-group">
                            <Button
                                variant="secondary"
                                onClick={() => setIsPlaybackSettingsOpen(true)}
                                className="settings-action"
                                style={{
                                    width: '100%',
                                    background: 'rgba(34, 197, 94, 0.15)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    color: '#4ade80',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                                onMouseOver={(e) => {
                                    (e.target as HTMLElement).style.background = 'rgba(34, 197, 94, 0.25)';
                                    (e.target as HTMLElement).style.borderColor = 'rgba(34, 197, 94, 0.4)';
                                }}
                                onMouseOut={(e) => {
                                    (e.target as HTMLElement).style.background = 'rgba(34, 197, 94, 0.15)';
                                    (e.target as HTMLElement).style.borderColor = 'rgba(34, 197, 94, 0.3)';
                                }}
                            >
                                ⚙️ Configure Playback
                            </Button>
                        </div>

                        <div className="settings-group settings-group--danger">
                            <Button
                                variant="secondary"
                                onClick={() => setIsResetModalOpen(true)}
                                className="settings-action btn--danger-outline"
                                style={{
                                    width: '100%',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#f87171',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                                onMouseOver={(e) => {
                                    (e.target as HTMLElement).style.background = 'rgba(239, 68, 68, 0.2)';
                                    (e.target as HTMLElement).style.borderColor = 'rgba(239, 68, 68, 0.4)';
                                }}
                                onMouseOut={(e) => {
                                    (e.target as HTMLElement).style.background = 'rgba(239, 68, 68, 0.1)';
                                    (e.target as HTMLElement).style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                }}
                            >
                                🔄 Restore Defaults
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <PlaylistManagerModal
                    isOpen={isPlaylistManagerOpen}
                    onClose={() => setIsPlaylistManagerOpen(false)}
                    playlists={playlists}
                    onPlaylistsUpdate={onPlaylistsUpdate}
                    onFileUpload={onFileUpload}
                />

                <PlaybackSettingsModal
                    isOpen={isPlaybackSettingsOpen}
                    onClose={() => setIsPlaybackSettingsOpen(false)}
                    settings={playbackSettings}
                    onSettingsUpdate={onPlaybackSettingsUpdate}
                />

                <ResetToDefaultModal
                    isOpen={isResetModalOpen}
                    onClose={() => setIsResetModalOpen(false)}
                    onConfirm={onResetToDefaults}
                />
            </>
        );
    }
);

SettingsSection.displayName = "SettingsSection";

export default SettingsSection;