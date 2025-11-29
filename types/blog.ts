// FILE: types/blog.ts
export interface Blog {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  imageUrl: string | null;
  author: string | null;
  publishedAt: string;
  updatedAt: string;
}
