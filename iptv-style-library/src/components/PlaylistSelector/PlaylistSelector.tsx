import React, { useState } from "react";

export type Playlist = {
    id: string;
    name: string;
    url?: string;
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
    /**
     * Set of favorite playlist IDs.
     */
    favoritePlaylistIds?: string[];
    /**
     * Callback to toggle a playlist as favorite.
     */
    onToggleFavoritePlaylist?: (id: string) => void;
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
        favoritePlaylistIds = [],
        onToggleFavoritePlaylist,
        className = "",
        ...rest
    }, ref) => {
        const [isOpen, setIsOpen] = useState(false);

        const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

        const sortedPlaylists = React.useMemo(() => {
            const favs = playlists.filter(p => favoritePlaylistIds.includes(p.id));
            const rest = playlists.filter(p => !favoritePlaylistIds.includes(p.id));
            return [...favs, ...rest];
        }, [playlists, favoritePlaylistIds]);

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
                                <div className="playlist-selector__name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {favoritePlaylistIds.includes(selectedPlaylist.id) && (
                                        <span style={{ color: '#fbbf24', fontSize: '12px' }}>★</span>
                                    )}
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
                        {sortedPlaylists.map((playlist, index) => {
                            const isSelected = selectedPlaylistId === playlist.id;
                            const isFavorite = favoritePlaylistIds.includes(playlist.id);
                            const selectedClass = isSelected ? "playlist-selector__option--selected" : "";
                            const inactiveClass = !playlist.isActive ? "playlist-selector__option--inactive" : "";
                            const prevIsFavorite = index > 0 && favoritePlaylistIds.includes(sortedPlaylists[index - 1].id);
                            const showDivider = index > 0 && !isFavorite && prevIsFavorite;

                            return (
                                <React.Fragment key={playlist.id}>
                                    {showDivider && (
                                        <div style={{
                                            height: '1px',
                                            background: 'rgba(255, 255, 255, 0.15)',
                                            margin: '4px 0'
                                        }} />
                                    )}
                                    <div
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
                                        style={{ display: 'flex', alignItems: 'center' }}
                                    >
                                        <div className="playlist-selector__option-content" style={{ flex: 1 }}>
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
                                        {onToggleFavoritePlaylist && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onToggleFavoritePlaylist(playlist.id); }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '16px',
                                                    color: isFavorite ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                                                    padding: '0 4px',
                                                    lineHeight: 1,
                                                    flexShrink: 0
                                                }}
                                                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                            >
                                                {isFavorite ? '★' : '☆'}
                                            </button>
                                        )}
                                        {isSelected && (
                                            <div className="playlist-selector__check">✓</div>
                                        )}
                                    </div>
                                </React.Fragment>
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