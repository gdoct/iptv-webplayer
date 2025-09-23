declare module 'mpegts.js' {
  export interface PlayerConfig {
    type: 'mpegts';
    url: string;
    isLive?: boolean;
  }

  export interface Player {
    attachMediaElement(element: HTMLVideoElement): void;
    detachMediaElement(): void;
    load(): void;
    unload(): void;
    play(): void;
    pause(): void;
    destroy(): void;
  }

  export function getFeatureList(): { mseLivePlayback: boolean };
  export function createPlayer(config: PlayerConfig): Player;
}