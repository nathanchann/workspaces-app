export type Workspace = {
  id: string;
  name: string;
  image_url: string | null;
  rating: number | null;
  rating_count: number | null;
  latitude: number;
  longitude: number;
  created_at: string | null;
};
