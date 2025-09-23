import React, { useState } from "react";

export type Playlist = {
    id: string;
    name: string;
    url: string;
    channelCount: number;
    isActive?: boolean;
    lastUpdated?: Date;
};

export type PlaylistSelectorProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * List of available playlists.
     */
    playlists?: Playlist[];
    /**
     * Currently selected playlist ID.
     */
    selectedPlaylistId?: string;
    /**
     * Callback when a playlist is selected.
     */
    onPlaylistSelect?: (playlist: Playlist) => void;
    /**
     * Whether the dropdown is disabled.
     */
    disabled?: boolean;
    /**
     * Placeholder text when no playlist is selected.
     */
    placeholder?: string;
};

// Fake playlist data for demonstration
const FAKE_PLAYLISTS: Playlist[] = [
    {
        id: "1",
        name: "Premium Package",
        url: "https://example.com/premium.m3u",
        channelCount: 1250,
        isActive: true,
        lastUpdated: new Date("2024-01-15")
    },
    {
        id: "2",
        name: "Sports Only",
        url: "https://example.com/sports.m3u",
        channelCount: 180,
        isActive: true,
        lastUpdated: new Date("2024-01-14")
    },
    {
        id: "3",
        name: "Basic Package",
        url: "https://example.com/basic.m3u",
        channelCount: 450,
        isActive: false,
        lastUpdated: new Date("2024-01-10")
    },
    {
        id: "4",
        name: "International",
        url: "https://example.com/international.m3u",
        channelCount: 890,
        isActive: true,
        lastUpdated: new Date("2024-01-12")
    }
];

const PlaylistSelector = React.forwardRef<HTMLDivElement, PlaylistSelectorProps>(
    ({
        playlists = FAKE_PLAYLISTS,
        selectedPlaylistId,
        onPlaylistSelect,
        disabled = false,
        placeholder = "Select a playlist...",
        className = "",
        ...rest
    }, ref) => {
        const [isOpen, setIsOpen] = useState(false);

        const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

        const handleToggle = () => {
            if (!disabled) {
                setIsOpen(!isOpen);
            }
        };

        const handlePlaylistClick = (playlist: Playlist) => {
            onPlaylistSelect?.(playlist);
            setIsOpen(false);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        React.useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as HTMLElement;
                if (ref && 'current' in ref && ref.current && !ref.current.contains(target)) {
                    setIsOpen(false);
                }
            };

            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
                return () => document.removeEventListener('mousedown', handleClickOutside);
            }
        }, [isOpen, ref]);

        const openClass = isOpen ? "playlist-selector--open" : "";
        const disabledClass = disabled ? "playlist-selector--disabled" : "";

        return (
            <div
                ref={ref}
                className={`playlist-selector ${openClass} ${disabledClass} ${className}`.trim()}
                onKeyDown={handleKeyDown}
                {...rest}
            >
                <button
                    className="playlist-selector__trigger"
                    onClick={handleToggle}
                    disabled={disabled}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    style={{ width: "80%", margin: "0 auto" }}
                >
                    <div className="playlist-selector__content">
                        {selectedPlaylist ? (
                            <>
                                <div className="playlist-selector__name">
                                    {selectedPlaylist.name}
                                </div>
                                <div className="playlist-selector__info">
                                    {selectedPlaylist.channelCount} channels
                                    {!selectedPlaylist.isActive && (
                                        <span className="playlist-selector__status">• Inactive</span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="playlist-selector__placeholder">
                                {placeholder}
                            </div>
                        )}
                    </div>
                    <div className="playlist-selector__arrow">▼</div>
                </button>

                {isOpen && (
                    <div className="playlist-selector__dropdown" role="listbox">
                        {playlists.map((playlist) => {
                            const isSelected = selectedPlaylistId === playlist.id;
                            const selectedClass = isSelected ? "playlist-selector__option--selected" : "";
                            const inactiveClass = !playlist.isActive ? "playlist-selector__option--inactive" : "";

                            return (
                                <div
                                    key={playlist.id}
                                    className={`playlist-selector__option ${selectedClass} ${inactiveClass}`.trim()}
                                    onClick={() => handlePlaylistClick(playlist)}
                                    role="option"
                                    aria-selected={isSelected}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handlePlaylistClick(playlist);
                                        }
                                    }}
                                >
                                    <div className="playlist-selector__option-content">
                                        <div className="playlist-selector__option-name">
                                            {playlist.name}
                                            {!playlist.isActive && (
                                                <span className="playlist-selector__option-badge">Inactive</span>
                                            )}
                                        </div>
                                        <div className="playlist-selector__option-info">
                                            {playlist.channelCount} channels • Updated{' '}
                                            {playlist.lastUpdated?.toLocaleDateString()}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="playlist-selector__check">✓</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
);

PlaylistSelector.displayName = "PlaylistSelector";

export default PlaylistSelector;