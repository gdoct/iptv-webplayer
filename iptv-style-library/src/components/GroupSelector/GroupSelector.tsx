import React, { useState } from "react";

export type PlaylistGroup = {
    id: string;
    name: string;
    channelCount: number;
};

export type GroupSelectorProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * List of groups to display.
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
     * Placeholder text when no group is selected.
     */
    placeholder?: string;
    /**
     * Whether the selector is disabled.
     */
    disabled?: boolean;
    /**
     * Set of favorite group IDs.
     */
    favoriteGroupIds?: string[];
    /**
     * Callback to toggle a group as favorite.
     */
    onToggleFavoriteGroup?: (id: string) => void;
};

const GroupSelector = React.forwardRef<HTMLDivElement, GroupSelectorProps>(
    ({
        groups = [],
        selectedGroupId,
        onGroupSelect,
        placeholder = "Select a group",
        disabled = false,
        favoriteGroupIds = [],
        onToggleFavoriteGroup,
        className = "",
        ...rest
    }, ref) => {
        const [isOpen, setIsOpen] = useState(false);

        const selectedGroup = groups.find(g => g.id === selectedGroupId);

        const sortedGroups = React.useMemo(() => {
            const favs = groups.filter(g => favoriteGroupIds.includes(g.id));
            const rest = groups.filter(g => !favoriteGroupIds.includes(g.id));
            return [...favs, ...rest];
        }, [groups, favoriteGroupIds]);

        const handleToggle = () => {
            if (!disabled) {
                setIsOpen(!isOpen);
            }
        };

        const handleGroupSelect = (group: PlaylistGroup) => {
            onGroupSelect?.(group);
            setIsOpen(false);
        };

        const handleKeyDown = (event: React.KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        const openClass = isOpen ? "group-selector--open" : "";
        const disabledClass = disabled ? "group-selector--disabled" : "";

        return (
            <div
                ref={ref}
                className={`group-selector ${openClass} ${disabledClass} ${className}`.trim()}
                onKeyDown={handleKeyDown}
                style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                {...rest}
            >
                <button
                    className="group-selector__trigger"
                    onClick={handleToggle}
                    disabled={disabled}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    style={{
                        width: "100%",
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        color: '#ffffff',
                        fontSize: '14px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        ...(disabled ? {
                            opacity: 0.5
                        } : {}),
                        ...(isOpen ? {
                            borderColor: 'rgba(59, 130, 246, 0.5)',
                            boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.2)'
                        } : {})
                    }}
                    onMouseOver={!disabled ? (e) => {
                        if (!isOpen) {
                            (e.target as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        }
                    } : undefined}
                    onMouseOut={!disabled ? (e) => {
                        if (!isOpen) {
                            (e.target as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }
                    } : undefined}
                >
                    <div className="group-selector__content" style={{ flex: 1 }}>
                        {selectedGroup ? (
                            <>
                                <div
                                    className="group-selector__name"
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#ffffff',
                                        marginBottom: '2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {favoriteGroupIds.includes(selectedGroup.id) && (
                                        <span style={{ color: '#fbbf24', fontSize: '12px' }}>★</span>
                                    )}
                                    {selectedGroup.name}
                                </div>
                                <div
                                    className="group-selector__count"
                                    style={{
                                        fontSize: '12px',
                                        color: 'rgba(255, 255, 255, 0.7)'
                                    }}
                                >
                                    {selectedGroup.channelCount} channels
                                </div>
                            </>
                        ) : (
                            < div
                                className="group-selector__placeholder"
                                style={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '14px'
                                }}
                            >
                                {placeholder}
                            </div >
                        )}
                    </div >
                    < div
                        className="group-selector__arrow"
                        style={{
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                        }}
                    >
                        ▼
                    </div >
                </button >

                {isOpen && (
                    < div
                        className="group-selector__dropdown"
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            background: 'rgba(30, 30, 30, 0.95)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                            marginTop: '4px',
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}
                    >
                        {sortedGroups.length === 0 ? (
                            < div
                                className="group-selector__empty"
                                style={{
                                    padding: '16px',
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '14px',
                                    textAlign: 'center'
                                }}
                            >
                                No groups available
                            </div >
                        ) : (
                            sortedGroups.map((group, index) => {
                                const isSelected = selectedGroupId === group.id;
                                const isFavorite = favoriteGroupIds.includes(group.id);
                                const prevIsFavorite = index > 0 && favoriteGroupIds.includes(sortedGroups[index - 1].id);
                                const showDivider = index > 0 && !isFavorite && prevIsFavorite;
                                return (
                                    <React.Fragment key={group.id}>
                                        {showDivider && (
                                            <div style={{
                                                height: '1px',
                                                background: 'rgba(255, 255, 255, 0.15)',
                                                margin: '4px 0'
                                            }} />
                                        )}
                                        <div
                                            className={`group-selector__option ${isSelected ? 'group-selector__option--selected' : ''}`.trim()}
                                            onClick={() => handleGroupSelect(group)}
                                            style={{
                                                padding: '12px 16px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s',
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                                background: isSelected
                                                    ? 'rgba(59, 130, 246, 0.2)'
                                                    : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                            onMouseOver={(e) => {
                                                if (!isSelected) {
                                                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                if (!isSelected) {
                                                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                                                }
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div
                                                    className="group-selector__option-name"
                                                    style={{
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        color: '#ffffff',
                                                        marginBottom: '2px'
                                                    }}
                                                >
                                                    {group.name}
                                                </div>
                                                <div
                                                    className="group-selector__option-count"
                                                    style={{
                                                        fontSize: '12px',
                                                        color: 'rgba(255, 255, 255, 0.7)'
                                                    }}
                                                >
                                                    {group.channelCount} channels
                                                </div>
                                            </div>
                                            {onToggleFavoriteGroup && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onToggleFavoriteGroup(group.id); }}
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
                                    </React.Fragment>
                                );
                            })
                        )}
                    </div >
                )}
            </div >
        );
    }
);

GroupSelector.displayName = "GroupSelector";

export default GroupSelector;