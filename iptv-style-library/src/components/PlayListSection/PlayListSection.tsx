import React from "react";
import { GroupSelector, type PlaylistGroup } from "../GroupSelector";

export type Channel = {
    id: string;
    name: string;
    logo?: string;
    category?: string;
    isLive?: boolean;
};

export type PlayListSectionProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * List of channels to display.
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
     * Whether to show category headers.
     */
    showCategories?: boolean;
    /**
     * Maximum height for the scrollable list.
     */
    maxHeight?: string;
    /**
     * List of groups for group selection mode.
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
     * Whether to show group selection first.
     */
    showGroupSelection?: boolean;
    /**
     * Set of favorite channel IDs.
     */
    favoriteChannelIds?: string[];
    /**
     * Callback to toggle a channel as favorite.
     */
    onToggleFavoriteChannel?: (id: string) => void;
    /**
     * Set of favorite group IDs.
     */
    favoriteGroupIds?: string[];
    /**
     * Callback to toggle a group as favorite.
     */
    onToggleFavoriteGroup?: (id: string) => void;
};

// Fake channel data for demonstration
const FAKE_CHANNELS: Channel[] = [
    { id: "1", name: "BBC One HD", logo: "🎬", category: "Entertainment", isLive: true },
    { id: "2", name: "CNN International", logo: "📺", category: "News", isLive: true },
    { id: "3", name: "Discovery Channel", logo: "🌍", category: "Documentary", isLive: true },
    { id: "4", name: "ESPN HD", logo: "⚽", category: "Sports", isLive: false },
    { id: "5", name: "National Geographic", logo: "🦁", category: "Documentary", isLive: true },
    { id: "6", name: "MTV", logo: "🎵", category: "Music", isLive: true },
    { id: "7", name: "Food Network", logo: "🍳", category: "Lifestyle", isLive: true },
    { id: "8", name: "Comedy Central", logo: "😂", category: "Entertainment", isLive: false },
    { id: "9", name: "Sky News", logo: "📰", category: "News", isLive: true },
    { id: "10", name: "Animal Planet", logo: "🐾", category: "Documentary", isLive: true },
];

const PlayListSection = React.forwardRef<HTMLDivElement, PlayListSectionProps>(
    ({
        channels = FAKE_CHANNELS,
        selectedChannelId,
        onChannelSelect,
        showCategories = true,
        maxHeight = "400px",
        groups = [],
        selectedGroupId,
        onGroupSelect,
        showGroupSelection = true,
        favoriteChannelIds = [],
        onToggleFavoriteChannel,
        favoriteGroupIds = [],
        onToggleFavoriteGroup,
        className = "",
        ...rest
    }, ref) => {
        const groupedChannels = React.useMemo(() => {
            if (!showCategories) {
                return { "All Channels": channels };
            }

            const grouped = channels.reduce((groups, channel) => {
                const category = channel.category || "Uncategorized";
                if (!groups[category]) {
                    groups[category] = [];
                }
                groups[category].push(channel);
                return groups;
            }, {} as Record<string, Channel[]>);

            // Put favorite channels in a "Favorites" section at the top
            const favoriteChannels = channels.filter(c => favoriteChannelIds.includes(c.id));
            if (favoriteChannels.length > 0) {
                return { "★ Favorites": favoriteChannels, ...grouped };
            }

            return grouped;
        }, [channels, showCategories, favoriteChannelIds]);

        const handleChannelClick = (channel: Channel) => {
            onChannelSelect?.(channel);
        };

        const renderChannel = (channel: Channel) => {
            const isSelected = selectedChannelId === channel.id;
            const isFavorite = favoriteChannelIds.includes(channel.id);
            const selectedClass = isSelected ? "playlist__channel--selected" : "";
            const liveClass = channel.isLive ? "playlist__channel--live" : "";

            return (
                <div
                    key={channel.id}
                    className={`playlist__channel ${selectedClass} ${liveClass}`.trim()}
                    onClick={() => handleChannelClick(channel)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleChannelClick(channel);
                        }
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        background: isSelected
                            ? "rgba(59, 130, 246, 0.2)"
                            : "rgba(255, 255, 255, 0.05)",
                        ...(isSelected ? {
                            borderColor: "rgba(59, 130, 246, 0.4)",
                            boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.2)"
                        } : {})
                    }}
                    onMouseOver={(e) => {
                        if (!isSelected) {
                            (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.1)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255, 255, 255, 0.2)";
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!isSelected) {
                            (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.05)";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255, 255, 255, 0.1)";
                        }
                    }}
                >
                    <div
                        className="playlist__channel-info"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            flex: 1,
                            minWidth: 0
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                                minWidth: 0
                            }}
                        >
                            <div
                                className="playlist__channel-name"
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#ffffff",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    marginBottom: "2px"
                                }}
                            >
                                {channel.name}
                            </div>
                            {channel.category && (
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "rgba(255, 255, 255, 0.6)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}
                                >
                                    {channel.category}
                                </div>
                            )}
                        </div>
                        {channel.isLive && (
                            <div
                                className="playlist__channel-status"
                                style={{
                                    background: "rgba(34, 197, 94, 0.2)",
                                    color: "#22c55e",
                                    fontSize: "10px",
                                    fontWeight: "600",
                                    padding: "4px 8px",
                                    borderRadius: "12px",
                                    border: "1px solid rgba(34, 197, 94, 0.3)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px"
                                }}
                            >
                                LIVE
                            </div>
                        )}
                        {onToggleFavoriteChannel && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleFavoriteChannel(channel.id); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    color: isFavorite ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                                    padding: '0 2px',
                                    lineHeight: 1,
                                    flexShrink: 0
                                }}
                                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                {isFavorite ? '★' : '☆'}
                            </button>
                        )}
                    </div>
                </div>
            );
        };

        return (
            <div
                ref={ref}
                className={`playlist ${className}`.trim()}
                style={{
                    maxHeight,
                    display: 'flex',
                    flexDirection: 'column'
                }}
                {...rest}
            >
                <div
                    className="playlist__header"
                    style={{
                        marginBottom: '16px'
                    }}
                >
                    {showGroupSelection ? (
                        <>
                            <h3
                                className="playlist__title"
                                style={{
                                    margin: '0 0 12px 0',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                📁 Select Group
                            </h3>
                            <GroupSelector
                                groups={groups}
                                selectedGroupId={selectedGroupId}
                                onGroupSelect={onGroupSelect}
                                placeholder="Choose channel group"
                                favoriteGroupIds={favoriteGroupIds}
                                onToggleFavoriteGroup={onToggleFavoriteGroup}
                            />
                        </>
                    ) : (
                        <h3
                            className="playlist__title"
                            style={{
                                margin: '0',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            📺 {channels.length} Channels
                        </h3>
                    )}
                </div>
                <div
                    className="playlist__content"
                    style={{
                        overflowY: 'auto',
                        flex: 1
                    }}
                >
                    {showGroupSelection && !selectedGroupId ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '40px 20px',
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '14px',
                                textAlign: 'center'
                            }}
                        >
                            👆 Select a group above to view channels
                        </div>
                    ) : (
                        Object.entries(groupedChannels).map(([category, categoryChannels]) => (
                        <div
                            key={category}
                            className="playlist__category"
                            style={{
                                marginBottom: showCategories ? '20px' : '0'
                            }}
                        >
                            {showCategories && (
                                <div
                                    className="playlist__category-header"
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        marginBottom: '12px',
                                        padding: '8px 12px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    {category}
                                </div>
                            )}
                            <div
                                className="playlist__channels"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}
                            >
                                {categoryChannels.map(renderChannel)}
                            </div>
                        </div>
                        ))
                    )}
                </div>
            </div>
        );
    }
);

PlayListSection.displayName = "PlayListSection";

export default PlayListSection;