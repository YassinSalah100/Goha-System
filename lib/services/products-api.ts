import { Product, Category, CategorySize, Extra, ProductSubmissionData, ApiResponse } from '@/lib/types/products'
import { AuthApiService } from './auth-api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002/api"

// Helper function for API calls with authentication
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const authHeaders = AuthApiService.createAuthHeaders()
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      ...authHeaders,
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    // Handle auth errors
    if (response.status === 401) {
      AuthApiService.clearAuthData()
      throw new Error('Unauthorized - please login again')
    }
    
    const error = await response.json().catch(() => ({ message: 'Network error' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Categories API
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`)
    if (response.ok) {
      const data = await response.json()
      return data.success && Array.isArray(data.data) ? 
        data.data.map((cat: any) => ({
          id: cat.category_id,
          name: cat.name,
          nameEn: cat.name_en || cat.name,
          description: cat.description || "",
          isActive: cat.is_active !== false,
          sortOrder: cat.sort_order || 0,
          createdAt: cat.created_at,
          updatedAt: cat.updated_at,
          sizes: [],
          extras: []
        })) : []
    }
    throw new Error(`HTTP ${response.status}`)
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw error
  }
}

// Products API
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const allProducts: any[] = []
    let page = 1
    let hasMoreProducts = true
    const limit = 100

    while (hasMoreProducts) {
      console.log(`Fetching products page ${page} with limit ${limit}...`)
      const response = await fetch(`${API_BASE_URL}/products?page=${page}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      let productsArray: any[] = []
      
      if (data.success && data.data && Array.isArray(data.data.products)) {
        productsArray = data.data.products
      } else if (data.success && Array.isArray(data.data)) {
        productsArray = data.data
      } else if (Array.isArray(data)) {
        productsArray = data
      }
      
      if (productsArray.length === 0) {
        hasMoreProducts = false
      } else {
        allProducts.push(...productsArray)
        if (productsArray.length < limit) {
          hasMoreProducts = false
        } else {
          page++
        }
      }
    }

    console.log(`Total products fetched: ${allProducts.length}`)

    return allProducts
      .map((product: any) => ({
        id: product.product_id,
        name: product.name,
        nameEn: product.name_en || product.name,
        description: product.description || "",
        categoryId: product.category ? product.category.category_id : "",
        category: product.category ? {
          id: product.category.category_id,
          name: product.category.name,
          nameEn: product.category.name_en || product.category.name,
          description: product.category.description || "",
          isActive: product.category.is_active !== false,
          sortOrder: product.category.sort_order || 0,
          createdAt: product.category.created_at,
          updatedAt: product.category.updated_at,
          sizes: [],
          extras: []
        } : undefined,
        isActive: product.is_active !== false,
        image: product.image_url || "",
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        prices: product.sizePrices?.map((sp: any) => ({
          id: sp.product_size_id,
          productId: product.product_id,
          sizeId: sp.size?.size_id,
          size: sp.size ? {
            id: sp.size.size_id,
            categoryId: sp.size.category_id,
            name: sp.size.name,
            nameEn: sp.size.name_en || sp.size.name,
            sortOrder: sp.size.sort_order || 0,
            isActive: sp.size.is_active !== false
          } : undefined,
          price: Number.parseFloat(sp.price),
          cost: sp.cost ? Number.parseFloat(sp.cost) : undefined
        })) || [],
        extras: []
      }))
      .filter((product: any) => product && product.id && product.name)
  } catch (error) {
    console.error("Error fetching products:", error)
    throw error
  }
}

// Sizes API
export const fetchSizes = async (): Promise<CategorySize[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/category-sizes`)
    if (response.ok) {
      const data = await response.json()
      return data.success && Array.isArray(data.data) ? 
        data.data.map((cs: any) => ({
          id: cs.size.size_id,
          categoryId: cs.category_id,
          name: cs.size.name,
          nameEn: cs.size.name_en || cs.size.name,
          sortOrder: cs.size.sort_order || 0,
          isActive: cs.size.is_active !== false
        })) : []
    }
    throw new Error(`HTTP ${response.status}`)
  } catch (error) {
    console.error("Error fetching sizes:", error)
    throw error
  }
}

export const fetchCategorySizes = async (categoryId: string): Promise<CategorySize[]> => {
  const allSizes = await fetchSizes()
  return allSizes.filter(size => size.categoryId === categoryId)
}

// Category Extras API
export const fetchCategoryExtras = async (): Promise<Extra[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/category-extras`)
    if (response.ok) {
      const data = await response.json()
      return data.success && Array.isArray(data.data) ? 
        data.data.map((extra: any) => ({
          id: extra.extra_id,
          name: extra.name,
          nameEn: extra.name_en || extra.name,
          price: Number.parseFloat(extra.price),
          cost: extra.cost ? Number.parseFloat(extra.cost) : undefined,
          isActive: extra.is_active !== false,
          createdAt: extra.created_at,
          updatedAt: extra.updated_at
        })) : []
    }
    throw new Error(`HTTP ${response.status}`)
  } catch (error) {
    console.error("Error fetching category extras:", error)
    throw error
  }
}

export const fetchExtras = async (): Promise<Extra[]> => {
  return fetchCategoryExtras()
}

// Create Product API
export const createProduct = async (productData: ProductSubmissionData): Promise<Product> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.message || "Failed to create product")
    }

    return result.data
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

// Update Product API
export const updateProduct = async (id: string, productData: ProductSubmissionData): Promise<Product> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.message || "Failed to update product")
    }

    return result.data
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

// Delete Product API
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.message || "Failed to delete product")
    }
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

// Image upload
export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${API_BASE_URL}/products/upload-image`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }))
    throw new Error(error.message || `Upload failed! status: ${response.status}`)
  }

  const result = await response.json()
  return result.data.url
}
