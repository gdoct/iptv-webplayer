import React from "react";

export type UserSectionProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * User's display name.
     */
    userName: string;
    /**
     * User's avatar/icon URL or element.
     */
    userIcon?: string | React.ReactNode;
    /**
     * Optional subtitle text (e.g., email, role).
     */
    subtitle?: string;
    /**
     * Size variant for the user section.
     */
    size?: "small" | "medium" | "large";
    /**
     * Callback when user section is clicked.
     */
    onClick?: () => void;
};

const UserSection = React.forwardRef<HTMLDivElement, UserSectionProps>(
    ({
        userName,
        userIcon,
        subtitle,
        size = "medium",
        onClick,
        className = "",
        ...rest
    }, ref) => {
        const sizeClass =
            size === "small" ? "user-section--small" :
            size === "large" ? "user-section--large" :
            "user-section--medium";

        const clickableClass = onClick ? "user-section--clickable" : "";

        const renderIcon = () => {
            if (typeof userIcon === "string") {
                return (
                    <img
                        src={userIcon}
                        alt={`${userName} avatar`}
                        className="user-section__avatar"
                        style={{
                            width: size === 'small' ? '32px' : size === 'large' ? '56px' : '44px',
                            height: size === 'small' ? '32px' : size === 'large' ? '56px' : '44px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        }}
                    />
                );
            } else if (userIcon) {
                return (
                    <div
                        className="user-section__icon"
                        style={{
                            width: size === 'small' ? '32px' : size === 'large' ? '56px' : '44px',
                            height: size === 'small' ? '32px' : size === 'large' ? '56px' : '44px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            border: '2px solid rgba(59, 130, 246, 0.3)',
                            fontSize: size === 'small' ? '16px' : size === 'large' ? '24px' : '20px'
                        }}
                    >
                        {userIcon}
                    </div>
                );
            } else {
                // Default avatar with user's initials
                const initials = userName
                    .split(' ')
                    .map(name => name.charAt(0))
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                return (
                    <div
                        className="user-section__avatar user-section__avatar--default"
                        style={{
                            width: size === 'small' ? '32px' : size === 'large' ? '56px' : '44px',
                            height: size === 'small' ? '32px' : size === 'large' ? '56px' : '44px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                            border: '2px solid rgba(34, 197, 94, 0.3)',
                            color: '#22c55e',
                            fontSize: size === 'small' ? '12px' : size === 'large' ? '20px' : '16px',
                            fontWeight: '600'
                        }}
                    >
                        {initials}
                    </div>
                );
            }
        };

        return (
            <div
                ref={ref}
                className={`user-section ${sizeClass} ${clickableClass} ${className}`.trim()}
                onClick={onClick}
                role={onClick ? "button" : undefined}
                tabIndex={onClick ? 0 : undefined}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: onClick ? '4px' : '0',
                    borderRadius: onClick ? '8px' : '0',
                    cursor: onClick ? 'pointer' : 'default',
                    transition: 'background-color 0.2s',
                    ...(onClick ? {
                        background: 'transparent'
                    } : {})
                }}
                onMouseOver={onClick ? (e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.08)' : undefined}
                onMouseOut={onClick ? (e) => (e.target as HTMLElement).style.backgroundColor = 'transparent' : undefined}
                {...rest}
            >
                {renderIcon()}
                <div
                    className="user-section__info"
                    style={{
                        flex: 1,
                        minWidth: 0
                    }}
                >
                    <div
                        className="user-section__name"
                        style={{
                            fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
                            fontWeight: '600',
                            color: '#ffffff',
                            marginBottom: subtitle ? '2px' : '0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {userName}
                    </div>
                    {subtitle && (
                        <div
                            className="user-section__subtitle"
                            style={{
                                fontSize: size === 'small' ? '11px' : size === 'large' ? '14px' : '12px',
                                color: 'rgba(255, 255, 255, 0.7)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {subtitle}
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

UserSection.displayName = "UserSection";

export default UserSection;