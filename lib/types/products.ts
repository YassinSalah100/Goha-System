// Product Types

// Response structure from API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

// Category Type
export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  sizes?: CategorySize[];
  extras?: Extra[];
}

// Size Type
export interface CategorySize {
  id: string;
  categoryId: string;
  name: string;
  nameEn?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// Extra Type
export interface Extra {
  id: string;
  name: string;
  nameEn?: string;
  price: number;
  cost?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Price Type
export interface ProductPrice {
  id: string;
  productId: string;
  sizeId: string;
  size?: {
    id: string;
    name: string;
    nameEn?: string;
    categoryId?: string;
    sortOrder?: number;
    isActive?: boolean;
  };
  price: number;
  cost?: number;
}

// Product Type
export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  categoryId?: string;
  category?: Category;
  isActive?: boolean;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  prices: ProductPrice[];
  extras?: Extra[];
}

// Data needed to create/update a product - must match backend DTO
export interface ProductSubmissionData {
  name: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  category_id: string;
  // Note: The backend does not accept sizePrices in the create/update endpoints
  // Size prices must be managed separately after product creation
}

// Backend expects these formats for create/update
export interface ProductSizePrice {
  product_size_id?: string; // Only for updates
  product_id?: string;      // Only for updates
  size_id: string;
  price: number;
}

// Data needed to add size prices to a product
export interface ProductSizePriceSubmission {
  productId: string;
  sizePrices: ProductSizePrice[];
}
