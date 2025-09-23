import React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    /**
     * Simple variant to allow different visual styles.
     * Consumers can also pass a className to override styles.
     */
    variant?: "primary" | "secondary";
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, variant = "primary", className = "", ...rest }, ref) => {
        const variantClass =
            variant === "primary" ? "btn--primary" : "btn--secondary";

        return (
            <button
                ref={ref}
                className={`btn ${variantClass} ${className}`.trim()}
                {...rest}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;