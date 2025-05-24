export type Workspace = {
  id: string;
  name: string;
  rating: number | null;
  rating_count: number | null;
  latitude: number;
  longitude: number;
  created_at: string | null;
};

export type WorkspaceImage = {
  id: string;
  workspace_id: string;
  image_url: string;
  user_id: string;
  created_at: string;
};
