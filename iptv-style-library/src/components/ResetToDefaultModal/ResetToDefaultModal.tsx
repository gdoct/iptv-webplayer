import React from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button";

export type ResetToDefaultModalProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * Whether the modal is open.
     */
    isOpen: boolean;
    /**
     * Callback to close the modal.
     */
    onClose: () => void;
    /**
     * Callback when reset is confirmed.
     */
    onConfirm?: () => void;
    /**
     * Custom warning message.
     */
    message?: string;
    /**
     * Items that will be reset (for display).
     */
    resetItems?: string[];
};

const DEFAULT_RESET_ITEMS = [
    "All playback settings",
    "Playlist preferences", 
    "UI layout and theme",
    "Keyboard shortcuts",
    "Connection settings",
    "Cache and temporary data"
];

const ResetToDefaultModal = React.forwardRef<HTMLDivElement, ResetToDefaultModalProps>(
    ({
        isOpen,
        onClose,
        onConfirm,
        message = "This action will reset all settings to their default values. This cannot be undone.",
        resetItems = DEFAULT_RESET_ITEMS,
        className = "",
        ...rest
    }, ref) => {
        const handleConfirm = () => {
            onConfirm?.();
            onClose();
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
                    className={`modal reset-modal ${className}`.trim()}
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
                        width: '450px',
                        maxWidth: '90vw'
                    }}
                    {...rest}
                >
                    <div className="modal__header">
                        <h2 className="modal__title">Reset All Settings</h2>
                        <button className="modal__close" onClick={onClose}>×</button>
                    </div>

                    <div className="modal__content">
                        <div className="reset-modal__warning">
                            <div className="reset-modal__icon">⚠️</div>
                            <p className="reset-modal__message">{message}</p>
                        </div>

                        <div className="reset-modal__items">
                            <h3 className="reset-modal__items-title">The following will be reset:</h3>
                            <ul className="reset-modal__items-list">
                                {resetItems.map((item, index) => (
                                    <li key={index} className="reset-modal__item">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="reset-modal__note">
                            <strong>Note:</strong> Your playlists and favorites will be preserved, 
                            but you'll need to reconfigure your preferences.
                        </div>
                    </div>

                    <div className="modal__footer">
                        <div className="modal__actions">
                            <Button variant="secondary" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleConfirm}
                                className="btn--danger"
                            >
                                Reset All Settings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );

        return createPortal(modalContent, document.body);
    }
);

ResetToDefaultModal.displayName = "ResetToDefaultModal";

export default ResetToDefaultModal;