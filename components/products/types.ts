// Product Types for components

// Category Type
export interface Category {
  id: string;
  name: string;
  description: string;
}

// Size Type
export interface CategorySize {
  category_id: string;
  size_id: string;
  size: {
    size_id: string;
    name: string;
    description: string;
  };
}

// Extra Type
export interface Extra {
  id: string;
  name: string;
  price: number;
  category_id: string;
}

// Product Type
export interface Product {
  id: string;
  name: string;
  image_url?: string;
  price?: number;
  category_id?: string;
  category?: Category | null;
  sizePrices?: Array<{
    id: string;
    product_size_id: string;
    product_id: string;
    size_id: string;
    price: number;
    size?: any;
  }>;
  created_at?: string;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

// Product Submission Data - matches backend CreateProductDto
export interface ProductSubmissionData {
  name: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  category_id: string;
}
