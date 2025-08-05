import { Product, ProductForm, CategorySize, ProductSubmissionData, Extra, CategoryExtra } from '@/lib/types/products'

// Get sizes available for a specific category
export function getCategorySizes(categoryId: string, allSizes: CategorySize[]): CategorySize[] {
  return allSizes.filter(size => size.categoryId === categoryId)
}

// Get extras available for a specific category
export function getCategoryExtras(categoryId: string, categoryExtras: CategoryExtra[]): Extra[] {
  return categoryExtras
    .filter(catExtra => catExtra.categoryId === categoryId)
    .map(catExtra => catExtra.extra)
    .filter((extra): extra is Extra => extra !== undefined)
}

// Filter products based on search term and category
export function filterProducts(
  products: Product[],
  searchTerm: string,
  selectedCategory: string
): Product[] {
  return products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory
    
    return matchesSearch && matchesCategory
  })
}

// Initialize product form with default values
export function initializeProductForm(
  allSizes: CategorySize[],
  categoryId: string
): ProductForm {
  return {
    name: '',
    nameEn: '',
    description: '',
    categoryId,
    isActive: true,
    prices: allSizes.map(size => ({
      sizeId: size.id,
      price: '',
      cost: ''
    })),
    extras: []
  }
}

// Populate form for editing a product
export function populateEditForm(
  product: Product,
  allSizes: CategorySize[]
): ProductForm {
  return {
    name: product.name,
    nameEn: product.nameEn,
    description: product.description || '',
    categoryId: product.categoryId,
    isActive: product.isActive,
    image: product.image,
    prices: allSizes.map(size => {
      const existingPrice = product.prices.find(p => p.sizeId === size.id)
      return {
        sizeId: size.id,
        price: existingPrice ? existingPrice.price.toString() : '',
        cost: existingPrice ? (existingPrice.cost?.toString() || '') : ''
      }
    }),
    extras: product.extras.map(extra => ({
      extraId: extra.extraId,
      isRequired: extra.isRequired,
      maxQuantity: extra.maxQuantity ? extra.maxQuantity.toString() : ''
    }))
  }
}

// Prepare form data for submission
export function prepareProductSubmissionData(form: ProductForm): ProductSubmissionData {
  return {
    name: form.name,
    nameEn: form.nameEn,
    description: form.description,
    categoryId: form.categoryId,
    isActive: form.isActive,
    image: form.image,
    prices: form.prices
      .filter(price => price.price && parseFloat(price.price) > 0)
      .map(price => ({
        sizeId: price.sizeId,
        price: parseFloat(price.price),
        cost: price.cost ? parseFloat(price.cost) : undefined
      })),
    extras: form.extras.map(extra => ({
      extraId: extra.extraId,
      isRequired: extra.isRequired,
      maxQuantity: extra.maxQuantity ? parseInt(extra.maxQuantity) : undefined
    }))
  }
}

// Validate product form
export function validateProductForm(form: ProductForm): string[] {
  const errors: string[] = []

  if (!form.name.trim()) {
    errors.push('اسم المنتج مطلوب')
  }

  if (!form.nameEn.trim()) {
    errors.push('الاسم الإنجليزي مطلوب')
  }

  if (!form.categoryId) {
    errors.push('الفئة مطلوبة')
  }

  const validPrices = form.prices.filter(price => price.price && parseFloat(price.price) > 0)
  if (validPrices.length === 0) {
    errors.push('يجب إدخال سعر واحد على الأقل')
  }

  return errors
}

// Format price for display
export function formatPrice(price: number): string {
  return price.toFixed(2) + ' ريال'
}

// Get size name by ID
export function getSizeName(sizeId: string, sizes: CategorySize[]): string {
  const size = sizes.find(s => s.id === sizeId)
  return size ? size.name : ''
}

// Update form prices when category changes
export function updateFormPricesForCategory(
  currentForm: ProductForm,
  newCategoryId: string,
  categorySizes: CategorySize[]
): ProductForm {
  const newPrices = categorySizes.map(size => {
    const existingPrice = currentForm.prices.find(p => p.sizeId === size.id)
    return existingPrice || {
      sizeId: size.id,
      price: '',
      cost: ''
    }
  })

  return {
    ...currentForm,
    categoryId: newCategoryId,
    prices: newPrices,
    extras: [] // Reset extras when category changes
  }
}

// Helper to check if form has changes
export function hasFormChanges(
  form: ProductForm,
  originalProduct?: Product,
  allSizes?: CategorySize[]
): boolean {
  if (!originalProduct || !allSizes) return true

  const originalForm = populateEditForm(originalProduct, allSizes)
  
  return JSON.stringify(form) !== JSON.stringify(originalForm)
}
