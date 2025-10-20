# IPTV Web Player

A lightweight, privacy-focused web-based IPTV player for streaming live TV channels directly in your browser.

## Features

- **Single HTML File Deployment** - Builds to a single, self-contained HTML file for easy deployment and distribution
- **Easy to Use** - Intuitive interface with drag-and-drop M3U playlist support
- **Total Privacy** - All data processing happens locally in your browser. No telemetry, tracking, or external data transmission
- **Docker Support** - Containerized deployment option for consistent hosting environments

## Key Capabilities

- Stream MPEG-TS content directly in modern web browsers
- Support for M3U/M3U8 playlist formats
- Handle large channel lists (1000+ channels)
- Multiple playlist management
- Responsive design for various screen sizes
- No server-side dependencies required

## Deployment Options

### Single File Build
```bash
yarn build
```
Generates a single HTML file containing the entire application.

### Docker
```bash
docker build -t iptv-player .
docker run -p 8080:80 iptv-player
```

## Technical Notes

- HTTPS deployment required for mixed content compatibility
- For HTTP-only streams, deploy to HTTP endpoints or run locally
- Built with React, TypeScript, and Vite

## Privacy

This application operates entirely client-side. Your viewing preferences, playlist data, and streaming activity remain on your device and are never transmitted to external servers.
