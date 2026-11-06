export interface GalleryPost {
  id: number;
  title: string;
  description: string;
  user_id: number;
  image_path: string;
  vehicle_category: string;
  is_approved: boolean;
  created_at: Date;

  user?: {
    id: number;
    name: string;
  };
}
