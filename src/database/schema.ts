export interface Earthquake {
  id: string;
  datetime: string;
  timestamp: number;
  magnitude: number;
  depth: number;
  latitude: number;
  longitude: number;
  region: string;
  tsunami_potential: string | null;
  felt_status: string | null;
  shakemap_url: string | null;
  created_at: number;
}
