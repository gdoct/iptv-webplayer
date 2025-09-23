import React from "react";

export type HeroProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * Main title text for the hero section.
     */
    title: string;
    /**
     * Optional subtitle text for the hero section.
     */
    subtitle?: string;
    /**
     * Visual variant for different hero styles.
     * Consumers can also pass a className to override styles.
     */
    variant?: "default" | "centered" | "dark";
    /**
     * Size variant for the hero section.
     */
    size?: "small" | "medium" | "large";
    /**
     * Optional background image URL.
     */
    backgroundImage?: string;
    /**
     * Optional action buttons or content.
     */
    actions?: React.ReactNode;
};

const Hero = React.forwardRef<HTMLDivElement, HeroProps>(
    ({
        title,
        subtitle,
        variant = "default",
        size = "medium",
        backgroundImage,
        actions,
        className = "",
        style,
        children,
        ...rest
    }, ref) => {
        const variantClass =
            variant === "centered" ? "hero--centered" :
            variant === "dark" ? "hero--dark" :
            "hero--default";

        const sizeClass =
            size === "small" ? "hero--small" :
            size === "large" ? "hero--large" :
            "hero--medium";

        const heroStyle = {
            ...style,
            ...(backgroundImage && {
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }),
        };

        return (
            <div
                ref={ref}
                className={`hero ${variantClass} ${sizeClass} ${className}`.trim()}
                style={heroStyle}
                {...rest}
            >
                <div className="hero__content">
                    <h1 className="hero__title">{title}</h1>
                    {subtitle && <p className="hero__subtitle">{subtitle}</p>}
                    {actions && <div className="hero__actions">{actions}</div>}
                    {children}
                </div>
            </div>
        );
    }
);

Hero.displayName = "Hero";

export default Hero;