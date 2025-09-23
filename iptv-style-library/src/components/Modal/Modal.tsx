import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the modal is open/visible.
   */
  isOpen: boolean;
  /**
   * Callback to close the modal.
   */
  onClose: () => void;
  /**
   * Optional title for the modal header.
   */
  title?: string;
  /**
   * Modal content.
   */
  children: React.ReactNode;
  /**
   * Size variant for the modal.
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether to show the close button in header.
   */
  showCloseButton?: boolean;
  /**
   * Whether clicking the overlay should close the modal.
   */
  closeOnOverlayClick?: boolean;
  /**
   * Whether pressing escape should close the modal.
   */
  closeOnEscape?: boolean;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    className = '',
    ...rest
  }, ref) => {
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEscape) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    }, [isOpen, closeOnEscape, onClose]);

    if (!isOpen) return null;

    const sizeClass = `modal--${size}`;

    const modalContent = (
      <div
        className="modal-overlay"
        onClick={closeOnOverlayClick ? onClose : undefined}
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
          className={`modal ${sizeClass} ${className}`.trim()}
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
            overflow: 'hidden'
          }}
          {...rest}
        >
          {title && (
            <div className="modal__header">
              <h2 className="modal__title">{title}</h2>
              {showCloseButton && (
                <button
                  className="modal__close"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg width="20" height="20" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          <div className="modal__content">
            {children}
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = "Modal";

export { Modal };
export default Modal;