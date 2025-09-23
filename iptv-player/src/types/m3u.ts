export interface Channel {
  id: string;
  name: string;
  url: string;
  group?: string;
  logo?: string;
  duration?: number;
}

export interface M3UPlaylist {
  id: string;
  name: string;
  url?: string;
  channels: Channel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface M3UParseResult {
  channels: Channel[];
  errors?: string[];
}