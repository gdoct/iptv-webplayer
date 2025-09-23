import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button";

export type PlaybackSettings = {
    volume: number;
    autoplay: boolean;
    bufferSize: number;
    retryAttempts: number;
    preferredQuality: 'auto' | 'low' | 'medium' | 'high';
    enableSubtitles: boolean;
    subtitleLanguage: string;
};

export type PlaybackSettingsModalProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * Whether the modal is open.
     */
    isOpen: boolean;
    /**
     * Callback to close the modal.
     */
    onClose: () => void;
    /**
     * Current playback settings.
     */
    settings?: PlaybackSettings;
    /**
     * Callback when settings are updated.
     */
    onSettingsUpdate?: (settings: PlaybackSettings) => void;
};

const DEFAULT_SETTINGS: PlaybackSettings = {
    volume: 80,
    autoplay: true,
    bufferSize: 30,
    retryAttempts: 3,
    preferredQuality: 'auto',
    enableSubtitles: false,
    subtitleLanguage: 'en'
};

const PlaybackSettingsModal = React.forwardRef<HTMLDivElement, PlaybackSettingsModalProps>(
    ({
        isOpen,
        onClose,
        settings = DEFAULT_SETTINGS,
        onSettingsUpdate,
        className = "",
        ...rest
    }, ref) => {
        const [localSettings, setLocalSettings] = useState(settings);

        const handleSave = () => {
            onSettingsUpdate?.(localSettings);
            onClose();
        };

        const handleReset = () => {
            setLocalSettings(DEFAULT_SETTINGS);
        };

        const updateSetting = <K extends keyof PlaybackSettings>(
            key: K,
            value: PlaybackSettings[K]
        ) => {
            setLocalSettings(prev => ({ ...prev, [key]: value }));
        };

        if (!isOpen) return null;

        const modalContent = (
            <div
                className="modal-overlay"
                onClick={onClose}
                style={{
                    pointerEvents: 'auto',
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    width: '100vw',
                    height: '100vh',
                    zIndex: '10000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    margin: '0',
                    padding: '16px',
                    boxSizing: 'border-box'
                }}
            >
                <div
                    ref={ref}
                    className={`modal playback-settings-modal ${className}`.trim()}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: 'rgba(30, 30, 30, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                        color: '#ffffff',
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        width: '500px',
                        maxWidth: '90vw'
                    }}
                    {...rest}
                >
                    <div
                        className="modal__header"
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '24px 24px 0 24px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '24px'
                        }}
                    >
                        <h2
                            className="modal__title"
                            style={{
                                margin: '0',
                                fontSize: '24px',
                                fontWeight: '600',
                                color: '#ffffff'
                            }}
                        >
                            Playback Settings
                        </h2>
                        <button
                            className="modal__close"
                            onClick={onClose}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '20px',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        >
                            ×
                        </button>
                    </div>

                    <div
                        className="modal__content"
                        style={{ padding: '0 24px 24px 24px' }}
                    >
                        <div
                            className="settings-form"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px'
                            }}
                        >
                            <div
                                className="form-section"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '12px',
                                    padding: '20px'
                                }}
                            >
                                <h3
                                    className="form-section__title"
                                    style={{
                                        margin: '0 0 16px 0',
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#ffffff'
                                    }}
                                >
                                    Audio & Video
                                </h3>
                                
                                <div
                                    className="form-field"
                                    style={{ marginBottom: '16px' }}
                                >
                                    <label
                                        htmlFor="volume"
                                        style={{
                                            display: 'block',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        Volume ({localSettings.volume}%)
                                    </label>
                                    <input
                                        type="range"
                                        id="volume"
                                        min="0"
                                        max="100"
                                        value={localSettings.volume}
                                        onChange={(e) => updateSetting('volume', parseInt(e.target.value))}
                                        style={{
                                            width: '100%',
                                            height: '6px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '3px',
                                            outline: 'none',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>

                                <div
                                    className="form-field"
                                    style={{ marginBottom: '16px' }}
                                >
                                    <label
                                        style={{
                                            display: 'block',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        Preferred Quality
                                    </label>
                                    <select
                                        value={localSettings.preferredQuality}
                                        onChange={(e) => updateSetting('preferredQuality', e.target.value as PlaybackSettings['preferredQuality'])}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '6px',
                                            padding: '12px',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                            cursor: 'pointer'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                                    >
                                        <option value="auto">Auto (Recommended)</option>
                                        <option value="high">High (1080p+)</option>
                                        <option value="medium">Medium (720p)</option>
                                        <option value="low">Low (480p)</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label
                                        className="checkbox-field"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: '#ffffff'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={localSettings.autoplay}
                                            onChange={(e) => updateSetting('autoplay', e.target.checked)}
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <span>Autoplay channels</span>
                                    </label>
                                </div>
                            </div>

                            <div
                                className="form-section"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '12px',
                                    padding: '20px'
                                }}
                            >
                                <h3
                                    className="form-section__title"
                                    style={{
                                        margin: '0 0 16px 0',
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#ffffff'
                                    }}
                                >
                                    Buffering & Connection
                                </h3>
                                
                                <div
                                    className="form-field"
                                    style={{ marginBottom: '16px' }}
                                >
                                    <label
                                        htmlFor="buffer-size"
                                        style={{
                                            display: 'block',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        Buffer Size (seconds)
                                    </label>
                                    <input
                                        id="buffer-size"
                                        type="number"
                                        min="10"
                                        max="120"
                                        value={localSettings.bufferSize.toString()}
                                        onChange={(e) => updateSetting('bufferSize', parseInt(e.target.value) || 30)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '6px',
                                            padding: '12px',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                                    />
                                </div>

                                <div className="form-field">
                                    <label
                                        htmlFor="retry-attempts"
                                        style={{
                                            display: 'block',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        Retry Attempts
                                    </label>
                                    <input
                                        id="retry-attempts"
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={localSettings.retryAttempts.toString()}
                                        onChange={(e) => updateSetting('retryAttempts', parseInt(e.target.value) || 3)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '6px',
                                            padding: '12px',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                                    />
                                </div>
                            </div>

                            <div
                                className="form-section"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '12px',
                                    padding: '20px'
                                }}
                            >
                                <h3
                                    className="form-section__title"
                                    style={{
                                        margin: '0 0 16px 0',
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#ffffff'
                                    }}
                                >
                                    Subtitles
                                </h3>
                                
                                <div
                                    className="form-field"
                                    style={{ marginBottom: '16px' }}
                                >
                                    <label
                                        className="checkbox-field"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: '#ffffff'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={localSettings.enableSubtitles}
                                            onChange={(e) => updateSetting('enableSubtitles', e.target.checked)}
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <span>Enable subtitles</span>
                                    </label>
                                </div>

                                {localSettings.enableSubtitles && (
                                    <div className="form-field">
                                        <label
                                            htmlFor="subtitle-language"
                                            style={{
                                                display: 'block',
                                                color: '#ffffff',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                marginBottom: '8px'
                                            }}
                                        >
                                            Subtitle Language
                                        </label>
                                        <select
                                            id="subtitle-language"
                                            value={localSettings.subtitleLanguage}
                                            onChange={(e) => updateSetting('subtitleLanguage', e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '6px',
                                                padding: '12px',
                                                color: '#ffffff',
                                                fontSize: '14px',
                                                outline: 'none',
                                                transition: 'border-color 0.2s',
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                            <option value="de">German</option>
                                            <option value="it">Italian</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div
                        className="modal__footer"
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '24px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            marginTop: '24px'
                        }}
                    >
                        <Button variant="secondary" onClick={handleReset}>
                            Reset to Defaults
                        </Button>
                        <div
                            className="modal__actions"
                            style={{
                                display: 'flex',
                                gap: '12px'
                            }}
                        >
                            <Button variant="secondary" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                Save Settings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );

        return createPortal(modalContent, document.body);
    }
);

PlaybackSettingsModal.displayName = "PlaybackSettingsModal";

export default PlaybackSettingsModal;