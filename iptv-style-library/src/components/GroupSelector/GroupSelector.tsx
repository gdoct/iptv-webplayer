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
};

const GroupSelector = React.forwardRef<HTMLDivElement, GroupSelectorProps>(
    ({
        groups = [],
        selectedGroupId,
        onGroupSelect,
        placeholder = "Select a group",
        disabled = false,
        className = "",
        ...rest
    }, ref) => {
        const [isOpen, setIsOpen] = useState(false);

        const selectedGroup = groups.find(g => g.id === selectedGroupId);

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
                                        marginBottom: '2px'
                                    }}
                                >
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
                        {groups.length === 0 ? (
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
                            groups.map((group) => {
                                const isSelected = selectedGroupId === group.id;
                                return (
                                    < div
                                        key={group.id}
                                        className={`group-selector__option ${isSelected ? 'group-selector__option--selected' : ''}`.trim()}
                                        onClick={() => handleGroupSelect(group)}
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                            background: isSelected
                                                ? 'rgba(59, 130, 246, 0.2)'
                                                : 'transparent'
                                        }}
                                        onMouseOver={(e) => {
                                            if (!isSelected) {
                                                (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (!isSelected) {
                                                (e.target as HTMLElement).style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        < div
                                            className="group-selector__option-name"
                                            style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#ffffff',
                                                marginBottom: '2px'
                                            }}
                                        >
                                            {group.name}
                                        </div >
                                        < div
                                            className="group-selector__option-count"
                                            style={{
                                                fontSize: '12px',
                                                color: 'rgba(255, 255, 255, 0.7)'
                                            }}
                                        >
                                            {group.channelCount} channels
                                        </div >
                                    </div >
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