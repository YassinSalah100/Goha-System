// Main Components
export { default as ProductManagement } from './ProductManagement'
export { default as ProductsHeader } from './ProductsHeader'
export { default as ProductGrid } from './ProductGrid'
export { default as ProductCard } from './ProductCard'
export { default as ProductForm } from './ProductForm'

// Re-export from lib for convenience
export * from '@/lib/services'
export * from '@/lib/types'
export * from '@/lib/utils'

// Default export for easy importing
export { default } from './ProductManagement'