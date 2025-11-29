// FILE: types/product.ts
export interface ProductVariant {
  id: string;
  sku: string;
  capacity: string | null;
  length: string | null;
  endConnectionStyle: string | null;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  basePrice: number | null;
  imageUrl: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
}
