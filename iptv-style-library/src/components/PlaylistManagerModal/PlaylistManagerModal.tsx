import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button";
import { TextInput } from "../TextInput";
import { Label } from "../Label";
import type { Playlist } from "../PlaylistSelector";

export type PlaylistManagerModalProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * Whether the modal is open.
     */
    isOpen: boolean;
    /**
     * Callback to close the modal.
     */
    onClose: () => void;
    /**
     * List of existing playlists.
     */
    playlists?: Playlist[];
    /**
     * Callback when playlists are updated.
     */
    onPlaylistsUpdate?: (playlists: Playlist[]) => void;
    /**
     * Callback to handle file upload.
     */
    onFileUpload?: (name: string, content: string) => Promise<void>;
};

const PlaylistManagerModal = React.forwardRef<HTMLDivElement, PlaylistManagerModalProps>(
    ({
        isOpen,
        onClose,
        playlists = [],
        onPlaylistsUpdate,
        onFileUpload,
        className = "",
        ...rest
    }, ref) => {
        const [newPlaylistName, setNewPlaylistName] = useState("");
        const [newPlaylistUrl, setNewPlaylistUrl] = useState("");
        const [isAdding, setIsAdding] = useState(false);
        const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
        const [isUploading, setIsUploading] = useState(false);
        const [uploadError, setUploadError] = useState<string | null>(null);
        const [selectedFile, setSelectedFile] = useState<File | null>(null);
        const [uploadProgress, setUploadProgress] = useState<string>('');
        const fileInputRef = useRef<HTMLInputElement>(null);

        const handleAddPlaylist = async () => {
            if (uploadMethod === 'url' && newPlaylistName.trim() && newPlaylistUrl.trim()) {
                const newPlaylist: Playlist = {
                    id: `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    name: newPlaylistName.trim(),
                    url: newPlaylistUrl.trim(),
                    channelCount: Math.floor(Math.random() * 1000) + 100, // Fake count
                    isActive: true,
                    lastUpdated: new Date()
                };

                onPlaylistsUpdate?.([...playlists, newPlaylist]);
                resetForm();
            } else if (uploadMethod === 'file' && newPlaylistName.trim() && selectedFile) {
                // Process the selected file
                await processFileUpload();
            }
        };

        const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) {
                setSelectedFile(null);
                setUploadError(null);
                return;
            }

            if (!file.name.toLowerCase().endsWith('.m3u') && !file.name.toLowerCase().endsWith('.m3u8')) {
                setUploadError('Please select a valid M3U file (.m3u or .m3u8)');
                setSelectedFile(null);
                return;
            }

            setSelectedFile(file);
            setUploadError(null);
        };

        const processFileUpload = async () => {
            if (!selectedFile || !newPlaylistName.trim()) return;

            setIsUploading(true);
            setUploadError(null);
            setUploadProgress('');

            try {
                // Step 1: Reading file
                setUploadProgress('Reading file...');
                await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to show progress

                const content = await selectedFile.text();
                const fileSizeMB = (content.length / (1024 * 1024)).toFixed(1);
                console.log('File content loaded, size:', content.length, `(${fileSizeMB} MB)`);

                // Step 2: Parsing content
                setUploadProgress(`Parsing M3U content (${fileSizeMB} MB)...`);
                await new Promise(resolve => setTimeout(resolve, 200)); // Small delay to show progress

                if (onFileUpload) {
                    // Step 3: Saving to storage
                    setUploadProgress('Saving to IndexedDB...');
                    await onFileUpload(newPlaylistName.trim(), content);
                    console.log('File upload callback completed');
                } else {
                    // Fallback: just create a mock playlist entry
                    setUploadProgress('Creating playlist entry...');
                    const newPlaylist: Playlist = {
                        id: `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        name: newPlaylistName.trim(),
                        url: undefined, // No URL for file uploads
                        channelCount: Math.floor(Math.random() * 1000) + 100, // Fake count - would be parsed from content
                        isActive: true,
                        lastUpdated: new Date()
                    };

                    onPlaylistsUpdate?.([...playlists, newPlaylist]);
                    console.log('Mock playlist created:', newPlaylist);
                }

                // Step 4: Complete
                setUploadProgress('Upload complete!');
                await new Promise(resolve => setTimeout(resolve, 500)); // Show completion message briefly

                resetForm();
            } catch (err) {
                console.error('File upload error:', err);
                setUploadError(err instanceof Error ? err.message : 'Failed to upload file');
                setUploadProgress('');
            } finally {
                setIsUploading(false);
                setUploadProgress('');
            }
        };

        const resetForm = () => {
            setNewPlaylistName("");
            setNewPlaylistUrl("");
            setSelectedFile(null);
            setIsAdding(false);
            setUploadError(null);
            setUploadProgress('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };

        const handleDeletePlaylist = (id: string) => {
            onPlaylistsUpdate?.(playlists.filter(p => p.id !== id));
        };

        const handleToggleActive = (id: string) => {
            onPlaylistsUpdate?.(
                playlists.map(p => 
                    p.id === id ? { ...p, isActive: !p.isActive } : p
                )
            );
        };

        if (!isOpen) return null;

        // Add spinner animation CSS
        if (!document.querySelector('#modal-spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-spinner-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

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
                    className={`modal playlist-manager-modal ${className}`.trim()}
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
                        width: '600px',
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
                            Manage Playlists
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
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        >
                            ×
                        </button>
                    </div>

                    <div
                        className="modal__content"
                        style={{ padding: '0 24px 24px 24px' }}
                    >
                        <div
                            className="playlist-manager__list"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                marginBottom: '24px',
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }}
                        >
                            {playlists.map((playlist) => (
                                <div
                                    key={playlist.id}
                                    className="playlist-manager__item"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'background-color 0.2s',
                                        ...(playlist.isActive ? {
                                            background: 'rgba(59, 130, 246, 0.2)',
                                            border: '1px solid rgba(59, 130, 246, 0.3)'
                                        } : {})
                                    }}
                                >
                                    <div className="playlist-manager__info" style={{ flex: 1 }}>
                                        <div
                                            className="playlist-manager__name"
                                            style={{
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: '#ffffff',
                                                marginBottom: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            {playlist.name}
                                            {playlist.isActive && (
                                                <span
                                                    style={{
                                                        background: 'rgba(34, 197, 94, 0.2)',
                                                        color: '#22c55e',
                                                        fontSize: '12px',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(34, 197, 94, 0.3)'
                                                    }}
                                                >
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            className="playlist-manager__details"
                                            style={{
                                                fontSize: '14px',
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                wordBreak: 'break-all'
                                            }}
                                        >
                                            {playlist.channelCount} channels • {playlist.url}
                                        </div>
                                    </div>
                                    <div
                                        className="playlist-manager__actions"
                                        style={{
                                            display: 'flex',
                                            gap: '8px',
                                            marginLeft: '16px'
                                        }}
                                    >
                                        <button
                                            onClick={() => handleToggleActive(playlist.id)}
                                            style={{
                                                background: playlist.isActive
                                                    ? 'rgba(239, 68, 68, 0.2)'
                                                    : 'rgba(34, 197, 94, 0.2)',
                                                border: playlist.isActive
                                                    ? '1px solid rgba(239, 68, 68, 0.3)'
                                                    : '1px solid rgba(34, 197, 94, 0.3)',
                                                color: playlist.isActive ? '#ef4444' : '#22c55e',
                                                borderRadius: '6px',
                                                padding: '8px 12px',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {playlist.isActive ? "Deactivate" : "Activate"}
                                        </button>
                                        <button
                                            onClick={() => handleDeletePlaylist(playlist.id)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                color: '#ef4444',
                                                borderRadius: '6px',
                                                padding: '8px 12px',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!isAdding ? (
                            <button
                                onClick={() => setIsAdding(true)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(59, 130, 246, 0.2)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    color: '#3b82f6',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = 'rgba(59, 130, 246, 0.3)';
                                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                }}
                            >
                                + Add New Playlist
                            </button>
                        ) : (
                            <div
                                className="playlist-manager__form"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    padding: '20px'
                                }}
                            >
                                {/* Method Selection */}
                                <div
                                    className="form-field"
                                    style={{ marginBottom: '20px' }}
                                >
                                    <label
                                        style={{
                                            display: 'block',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '12px'
                                        }}
                                    >
                                        Add Method
                                    </label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <label
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '12px 16px',
                                                borderRadius: '8px',
                                                border: `2px solid ${uploadMethod === 'url' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
                                                background: uploadMethod === 'url' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                flex: 1
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                value="url"
                                                checked={uploadMethod === 'url'}
                                                onChange={(e) => setUploadMethod(e.target.value as 'url')}
                                                style={{ margin: 0 }}
                                            />
                                            <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                                                🌐 From URL
                                            </span>
                                        </label>
                                        <label
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '12px 16px',
                                                borderRadius: '8px',
                                                border: `2px solid ${uploadMethod === 'file' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
                                                background: uploadMethod === 'file' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                flex: 1
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                value="file"
                                                checked={uploadMethod === 'file'}
                                                onChange={(e) => setUploadMethod(e.target.value as 'file')}
                                                style={{ margin: 0 }}
                                            />
                                            <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                                                📁 Upload File
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Playlist Name */}
                                <div
                                    className="form-field"
                                    style={{ marginBottom: '16px' }}
                                >
                                    <label
                                        htmlFor="playlist-name"
                                        style={{
                                            display: 'block',
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            marginBottom: '8px'
                                        }}
                                    >
                                        Playlist Name
                                    </label>
                                    <input
                                        id="playlist-name"
                                        type="text"
                                        value={newPlaylistName}
                                        onChange={(e) => {
                                            setNewPlaylistName(e.target.value);
                                            setUploadError(null);
                                        }}
                                        placeholder="Enter playlist name"
                                        disabled={isUploading}
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
                                            opacity: isUploading ? 0.6 : 1
                                        }}
                                        onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                                        onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                                    />
                                </div>

                                {/* URL Input or File Upload */}
                                {uploadMethod === 'url' ? (
                                    <div
                                        className="form-field"
                                        style={{ marginBottom: '20px' }}
                                    >
                                        <label
                                            htmlFor="playlist-url"
                                            style={{
                                                display: 'block',
                                                color: '#ffffff',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                marginBottom: '8px'
                                            }}
                                        >
                                            M3U URL
                                        </label>
                                        <input
                                            id="playlist-url"
                                            type="url"
                                            value={newPlaylistUrl}
                                            onChange={(e) => setNewPlaylistUrl(e.target.value)}
                                            placeholder="https://example.com/playlist.m3u"
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
                                            onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                                            onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className="form-field"
                                        style={{ marginBottom: '20px' }}
                                    >
                                        <label
                                            htmlFor="playlist-file"
                                            style={{
                                                display: 'block',
                                                color: '#ffffff',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                marginBottom: '8px'
                                            }}
                                        >
                                            M3U File
                                        </label>
                                        <div
                                            style={{
                                                position: 'relative',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                id="playlist-file"
                                                type="file"
                                                accept=".m3u,.m3u8"
                                                onChange={handleFileSelect}
                                                disabled={isUploading}
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
                                                    opacity: isUploading ? 0.6 : 1,
                                                    cursor: isUploading ? 'not-allowed' : 'pointer'
                                                }}
                                                onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                                                onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                                            />
                                            {isUploading && (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        right: '12px',
                                                        color: 'rgba(255, 255, 255, 0.7)',
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    Uploading...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Error Display */}
                                {uploadError && (
                                    <div
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            borderRadius: '6px',
                                            padding: '12px',
                                            marginBottom: '20px',
                                            color: '#ef4444',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {uploadError}
                                    </div>
                                )}

                                {/* Progress Display */}
                                {isUploading && uploadProgress && (
                                    <div
                                        style={{
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                            borderRadius: '6px',
                                            padding: '12px',
                                            marginBottom: '20px',
                                            color: '#3b82f6',
                                            fontSize: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                border: '2px solid rgba(59, 130, 246, 0.3)',
                                                borderTop: '2px solid #3b82f6',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}
                                        />
                                        {uploadProgress}
                                    </div>
                                )}
                                <div
                                    className="form-actions"
                                    style={{
                                        display: 'flex',
                                        gap: '12px',
                                        justifyContent: 'flex-end'
                                    }}
                                >
                                    <button
                                        onClick={resetForm}
                                        disabled={isUploading}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            color: '#ffffff',
                                            borderRadius: '6px',
                                            padding: '10px 16px',
                                            fontSize: '14px',
                                            cursor: isUploading ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s',
                                            opacity: isUploading ? 0.6 : 1
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddPlaylist}
                                        disabled={
                                            isUploading ||
                                            !newPlaylistName.trim() ||
                                            (uploadMethod === 'url' && !newPlaylistUrl.trim()) ||
                                            (uploadMethod === 'file' && !selectedFile)
                                        }
                                        style={{
                                            background: (!isUploading && newPlaylistName.trim() && ((uploadMethod === 'file' && selectedFile) || (uploadMethod === 'url' && newPlaylistUrl.trim())))
                                                ? 'rgba(34, 197, 94, 0.2)'
                                                : 'rgba(255, 255, 255, 0.05)',
                                            border: (!isUploading && newPlaylistName.trim() && ((uploadMethod === 'file' && selectedFile) || (uploadMethod === 'url' && newPlaylistUrl.trim())))
                                                ? '1px solid rgba(34, 197, 94, 0.3)'
                                                : '1px solid rgba(255, 255, 255, 0.1)',
                                            color: (!isUploading && newPlaylistName.trim() && ((uploadMethod === 'file' && selectedFile) || (uploadMethod === 'url' && newPlaylistUrl.trim())))
                                                ? '#22c55e'
                                                : 'rgba(255, 255, 255, 0.5)',
                                            borderRadius: '6px',
                                            padding: '10px 16px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: (!isUploading && newPlaylistName.trim() && ((uploadMethod === 'file' && selectedFile) || (uploadMethod === 'url' && newPlaylistUrl.trim())))
                                                ? 'pointer'
                                                : 'not-allowed',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {isUploading ? (
                                            <>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            uploadMethod === 'url' ? 'Add Playlist' : 'Upload & Add'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );

        return createPortal(modalContent, document.body);
    }
);

PlaylistManagerModal.displayName = "PlaylistManagerModal";

export default PlaylistManagerModal;