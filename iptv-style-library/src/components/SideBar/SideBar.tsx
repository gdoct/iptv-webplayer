import React, { useEffect } from "react";
import { UserSection } from "../UserSection";
import type { UserSectionProps } from "../UserSection";
import { PlayListSection } from "../PlayListSection";
import type { Channel } from "../PlayListSection";
import { SettingsSection } from "../SettingsSection";
import type { Playlist } from "../PlaylistSelector";
import type { PlaybackSettings } from "../PlaybackSettingsModal";
import type { PlaylistGroup } from "../GroupSelector";

export type SideBarProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * Whether the sidebar is open/visible.
     */
    isOpen: boolean;
    /**
     * Callback to close the sidebar.
     */
    onClose: () => void;
    /**
     * User information for the user section.
     */
    user?: {
        name: string;
        icon?: string | React.ReactNode;
        subtitle?: string;
    };
    /**
     * Props to pass to the UserSection component.
     */
    userSectionProps?: Partial<UserSectionProps>;
    /**
     * Available channels for the playlist section.
     */
    channels?: Channel[];
    /**
     * Currently selected channel ID.
     */
    selectedChannelId?: string;
    /**
     * Callback when a channel is selected.
     */
    onChannelSelect?: (channel: Channel) => void;
    /**
     * Available groups for channel filtering.
     */
    groups?: PlaylistGroup[];
    /**
     * Currently selected group ID.
     */
    selectedGroupId?: string;
    /**
     * Callback when a group is selected.
     */
    onGroupSelect?: (group: PlaylistGroup) => void;
    /**
     * Available playlists for the settings section.
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
    /**
     * Width of the sidebar.
     */
    width?: string;
    /**
     * Position of the sidebar.
     */
    position?: 'left' | 'right';
    /**
     * Whether to show overlay when open.
     */
    showOverlay?: boolean;
};

const SideBar = React.forwardRef<HTMLDivElement, SideBarProps>(
    ({
        isOpen,
        onClose,
        user,
        userSectionProps = {},
        channels,
        selectedChannelId,
        onChannelSelect,
        groups,
        selectedGroupId,
        onGroupSelect,
        playlists,
        selectedPlaylistId,
        playbackSettings,
        onPlaylistSelect,
        onPlaylistsUpdate,
        onPlaybackSettingsUpdate,
        onResetToDefaults,
        onFileUpload,
        width = "320px",
        position = "left",
        showOverlay = true,
        className = "",
        style,
        ...rest
    }, ref) => {
        // Handle escape key to close sidebar
        useEffect(() => {
            const handleEscape = (event: KeyboardEvent) => {
                if (event.key === 'Escape' && isOpen) {
                    onClose();
                }
            };

            if (isOpen) {
                document.addEventListener('keydown', handleEscape);
                return () => document.removeEventListener('keydown', handleEscape);
            }
        }, [isOpen, onClose]);

        // Prevent body scroll when sidebar is open
        useEffect(() => {
            if (isOpen) {
                document.body.style.overflow = 'hidden';
                return () => {
                    document.body.style.overflow = '';
                };
            }
        }, [isOpen]);

        const openClass = isOpen ? "sidebar--open" : "";
        const positionClass = `sidebar--${position}`;

        const sidebarStyle = {
            width,
            ...style,
        };

        return (
            <>
                {/* Overlay */}
                {showOverlay && isOpen && (
                    <div
                        className="sidebar-overlay"
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            zIndex: 9999,
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)'
                        }}
                    />
                )}

                {/* Sidebar */}
                <div
                    ref={ref}
                    className={`sidebar ${openClass} ${positionClass} ${className}`.trim()}
                    style={{
                        ...sidebarStyle,
                        backgroundColor: 'rgba(30, 30, 30, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: position === 'right' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                        borderLeft: position === 'left' ? '1px solid rgba(255, 255, 255, 0.1)' : undefined,
                        borderRight: position === 'right' ? '1px solid rgba(255, 255, 255, 0.1)' : undefined,
                        boxShadow: position === 'left'
                            ? '4px 0 20px rgba(0, 0, 0, 0.3)'
                            : '-4px 0 20px rgba(0, 0, 0, 0.3)',
                        color: '#ffffff',
                        zIndex: 10000
                    }}
                    {...rest}
                >
                    <div
                        className="sidebar__header"
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            padding: '20px 20px 0 20px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '0'
                        }}
                    >
                        <button
                            className="sidebar__close"
                            onClick={onClose}
                            aria-label="Close sidebar"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '20px',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        >
                            ×
                        </button>
                    </div>

                    <div
                        className="sidebar__content"
                        style={{
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            flex: 1,
                            overflowY: 'auto'
                        }}
                    >
                        {/* User Section */}
                        {user && (
                            <div
                                className="sidebar__section"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '16px'
                                }}
                            >
                                <UserSection
                                    userName={user.name}
                                    userIcon="favicon-32x32.png"
                                    subtitle={user.subtitle}
                                    {...userSectionProps}
                                />
                            </div>
                        )}

                        {/* Channel List Section */}
                        <div
                            className="sidebar__section"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '16px'
                            }}
                        >
                            <PlayListSection
                                channels={channels}
                                selectedChannelId={selectedChannelId}
                                onChannelSelect={onChannelSelect}
                                groups={groups}
                                selectedGroupId={selectedGroupId}
                                onGroupSelect={onGroupSelect}
                                maxHeight="500px"
                            />
                        </div>

                        {/* Settings Section */}
                        <div
                            className="sidebar__section sidebar__section--settings"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '16px'
                            }}
                        >
                            <SettingsSection
                                playlists={playlists}
                                selectedPlaylistId={selectedPlaylistId}
                                playbackSettings={playbackSettings}
                                onPlaylistSelect={onPlaylistSelect}
                                onPlaylistsUpdate={onPlaylistsUpdate}
                                onPlaybackSettingsUpdate={onPlaybackSettingsUpdate}
                                onResetToDefaults={onResetToDefaults}
                                onFileUpload={onFileUpload}
                            />
                        </div>
                    </div>

                    <div
                        className="sidebar__footer"
                        style={{
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '16px 20px',
                            marginTop: 'auto'
                        }}
                    >
                        <div
                            className="sidebar__footer-text"
                            style={{
                                fontSize: '12px',
                                color: 'rgba(255, 255, 255, 0.6)',
                                textAlign: 'center',
                                fontWeight: '500'
                            }}
                        >
                            IPTV Player v1.0.0
                        </div>
                    </div>
                </div>
            </>
        );
    }
);

SideBar.displayName = "SideBar";

export default SideBar;