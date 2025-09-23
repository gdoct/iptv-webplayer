import React from "react";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
    /**
     * Visual variant for different label styles.
     * Consumers can also pass a className to override styles.
     */
    variant?: "default" | "bold" | "muted";
    /**
     * Size variant for the label.
     */
    size?: "small" | "medium" | "large";
    /**
     * Whether the field is required (adds visual indicator).
     */
    required?: boolean;
};

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ children, variant = "default", size = "medium", required = false, className = "", ...rest }, ref) => {
        const variantClass =
            variant === "bold" ? "label--bold" :
            variant === "muted" ? "label--muted" :
            "label--default";

        const sizeClass =
            size === "small" ? "label--small" :
            size === "large" ? "label--large" :
            "label--medium";

        return (
            <label
                ref={ref}
                className={`label ${variantClass} ${sizeClass} ${className}`.trim()}
                {...rest}
            >
                {children}
                {required && <span className="label--required">*</span>}
            </label>
        );
    }
);

Label.displayName = "Label";

export default Label;