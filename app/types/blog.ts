export type Comment = {
  id: number;
  comment_text: string;
  created_at: string;
  user_id: string;
  user: {
    name: string;
  };
};

export type Blog = {
  id: number;
  title: string;
  slug: string;
  featured_image: string | null;
  body: string;
  published_at: string | null;
}; 