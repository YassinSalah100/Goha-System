'use client'

import { Product } from '@/lib/types'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: Product[]
  loading: boolean
  onEditProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
}

export default function ProductGrid({
  products,
  loading,
  onEditProduct,
  onDeleteProduct
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-t-lg"></div>
              <div className="bg-white p-4 rounded-b-lg border border-t-0">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded mb-4 w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">📦</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            لا توجد منتجات
          </h3>
          <p className="text-gray-600 mb-4">
            لم يتم العثور على منتجات تطابق معايير البحث
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEditProduct}
            onDelete={onDeleteProduct}
          />
        ))}
      </div>
    </div>
  )
}
