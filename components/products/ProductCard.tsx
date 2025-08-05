'use client'

import { useState } from 'react'
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  const getLowestPrice = () => {
    if (!product.prices || product.prices.length === 0) return 0
    return Math.min(...product.prices.map(p => p.price))
  }

  const getHighestPrice = () => {
    if (!product.prices || product.prices.length === 0) return 0
    return Math.max(...product.prices.map(p => p.price))
  }

  const formatPriceRange = () => {
    const lowest = getLowestPrice()
    const highest = getHighestPrice()
    
    if (lowest === highest) {
      return `${lowest.toFixed(2)} ريال`
    }
    return `${lowest.toFixed(2)} - ${highest.toFixed(2)} ريال`
  }

  return (
    <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-lg border border-gray-200">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
        {product.image && !imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-400">
              <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-sm">لا توجد صورة</p>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={product.isActive ? "default" : "secondary"}>
            {product.isActive ? (
              <><Eye className="w-3 h-3 mr-1" /> متاح</>
            ) : (
              <><EyeOff className="w-3 h-3 mr-1" /> غير متاح</>
            )}
          </Badge>
        </div>
      </div>

      {/* Product Content */}
      <CardContent className="flex-1 p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
            {product.name}
          </h3>
          
          {product.nameEn && (
            <p className="text-sm text-gray-500 line-clamp-1">
              {product.nameEn}
            </p>
          )}
          
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          )}
          
          <div className="space-y-1">
            <p className="text-lg font-bold text-primary">
              {formatPriceRange()}
            </p>
            
            {product.category && (
              <Badge variant="outline" className="text-xs">
                {product.category.name}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      {/* Product Actions */}
      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(product)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            تعديل
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(product.id)}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            حذف
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
