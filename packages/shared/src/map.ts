export type CoordinateSystem = "GCJ-02" | "WGS84" | "BD-09";

export type LngLat = [lng: number, lat: number];

export interface DistrictProperties {
  adcode: string;
  name: string;
  pinyin: string;
  shortName: string;
  center: LngLat;
  labelPoint: LngLat;
  bbox: [minLng: number, minLat: number, maxLng: number, maxLat: number];
}

export interface DistrictFeature {
  type: "Feature";
  properties: DistrictProperties;
  geometry: {
    type: "Polygon";
    coordinates: LngLat[][];
  };
}

export interface DistrictFeatureCollection {
  type: "FeatureCollection";
  name: string;
  metadata: {
    version: string;
    coordinateSystem: CoordinateSystem;
    simplifiedFor: string;
    includedDistricts?: string[];
    source: string;
    notes: string;
  };
  features: DistrictFeature[];
}
