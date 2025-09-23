import React from "react";

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    /**
     * Visual variant for different input styles.
     * Consumers can also pass a className to override styles.
     */
    variant?: "default" | "outline" | "filled";
    /**
     * Size variant for the input.
     */
    size?: "small" | "medium" | "large";
};

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
    ({ variant = "default", size = "medium", className = "", ...rest }, ref) => {
        const variantClass =
            variant === "outline" ? "input--outline" :
            variant === "filled" ? "input--filled" :
            "input--default";

        const sizeClass =
            size === "small" ? "input--small" :
            size === "large" ? "input--large" :
            "input--medium";

        return (
            <input
                ref={ref}
                className={`input ${variantClass} ${sizeClass} ${className}`.trim()}
                {...rest}
            />
        );
    }
);

TextInput.displayName = "TextInput";

export default TextInput;