import React from "react";

export type HamburgerMenuProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    /**
     * Whether the menu is open (for animation state).
     */
    isOpen?: boolean;
    /**
     * Size variant for the hamburger menu.
     */
    size?: "small" | "medium" | "large";
    /**
     * Callback when the hamburger menu is clicked.
     */
    onToggle?: () => void;
};

const HamburgerMenu = React.forwardRef<HTMLButtonElement, HamburgerMenuProps>(
    ({ isOpen = false, size = "medium", onToggle, className = "", ...rest }, ref) => {
        const sizeClass =
            size === "small" ? "hamburger--small" :
            size === "large" ? "hamburger--large" :
            "hamburger--medium";

        const openClass = isOpen ? "hamburger--open" : "";

        return (
            <button
                ref={ref}
                className={`hamburger ${sizeClass} ${openClass} ${className}`.trim()}
                onClick={onToggle}
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
                {...rest}
            >
                <span className="hamburger__line"></span>
                <span className="hamburger__line"></span>
                <span className="hamburger__line"></span>
            </button>
        );
    }
);

HamburgerMenu.displayName = "HamburgerMenu";

export default HamburgerMenu;