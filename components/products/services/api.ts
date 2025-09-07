import { Product, Category, CategorySize, Extra, ProductSubmissionData, ApiResponse } from '../types'
import { API_CONFIG } from '@/lib/config'
import { AuthApiService } from '@/lib/services/auth-api'

// Categories API
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/categories`)
    if (response.ok) {
      const data = await response.json()
      return data.success && Array.isArray(data.data) ? 
        data.data.map((cat: any) => ({
          id: cat.category_id,
          name: cat.name,
          description: cat.description || "",
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
          // Include pagination parameters
      const response = await fetch(`${API_CONFIG.BASE_URL}/products?page=${page}&limit=${limit}`)
      
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
        image_url: product.image_url || "",
        price: product.sizePrices && product.sizePrices.length > 0 ? 
          Number.parseFloat(product.sizePrices[0].price) : 0,
        category_id: product.category ? product.category.category_id : "",
        category: product.category ? {
          id: product.category.category_id,
          name: product.category.name,
          description: "",
        } : null,
        sizePrices: product.sizePrices?.map((sp: any) => ({
          id: sp.product_size_id,
          product_size_id: sp.product_size_id,
          product_id: product.product_id,
          size_id: sp.size?.size_id,
          price: Number.parseFloat(sp.price),
          size: sp.size,
        })) || [],
        created_at: product.created_at,
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
    const response = await fetch(`${API_CONFIG.BASE_URL}/category-sizes`)
    if (response.ok) {
      const data = await response.json()
      return data.success && Array.isArray(data.data) ? 
        data.data.map((cs: any) => ({
          category_id: cs.category_id,
          size_id: cs.size_id,
          size: {
            size_id: cs.size.size_id,
            name: cs.size.name,
            description: cs.size.description || "",
          },
        })) : []
    }
    throw new Error(`HTTP ${response.status}`)
  } catch (error) {
    console.error("Error fetching sizes:", error)
    throw error
  }
}

// Category Extras API
export const fetchCategoryExtras = async (): Promise<Extra[]> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/category-extras`)
    if (response.ok) {
      const data = await response.json()
      return data.success && Array.isArray(data.data) ? 
        data.data.map((extra: any) => ({
          id: extra.extra_id,
          name: extra.name,
          price: Number.parseFloat(extra.price),
          category_id: extra.category_id,
        })) : []
    }
    throw new Error(`HTTP ${response.status}`)
  } catch (error) {
    console.error("Error fetching category extras:", error)
    throw error
  }
}

// Create Product API
export const createProduct = async (productData: ProductSubmissionData): Promise<Product> => {
  try {
    // Send data to API
    const response = await fetch(`${API_CONFIG.BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AuthApiService.createAuthHeaders()
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
    const response = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...AuthApiService.createAuthHeaders()
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
    const response = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: {
        ...AuthApiService.createAuthHeaders()
      }
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
