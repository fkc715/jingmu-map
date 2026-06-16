import type { CoordinateSystem } from "./map";

export type TheatreStatus = "active" | "closed" | "unknown";

export interface Theatre {
  id: string;
  name: {
    zh: string;
    en?: string;
  };
  aliases: string[];
  district: {
    adcode: string;
    name: string;
  };
  address: {
    full: string;
    street?: string;
  };
  location: {
    lng: number;
    lat: number;
    precision: "exact" | "approximate";
    source: string;
  };
  category: string;
  genres: string[];
  status: TheatreStatus;
  operator?: string;
  personal?: {
    visitedCount: number;
    favorite: boolean;
    wantToGo: boolean;
    note?: string;
  };
  halls?: Array<{
    name: string;
    capacity?: number;
  }>;
  display?: {
    priority: number;
    featured: boolean;
    color?: string;
  };
  links?: {
    official?: string;
  };
  verification?: {
    addressVerified: boolean;
    coordinateVerified: boolean;
    lastCheckedAt: string;
    notes?: string;
  };
}

export interface TheatreSeed {
  version: string;
  coordinateSystem: CoordinateSystem;
  sourcePolicy?: {
    preferredSources: string[];
    notes: string;
  };
  theatres: Theatre[];
}
