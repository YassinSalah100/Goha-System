'use client'

import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Category } from '@/lib/types'

interface ProductsHeaderProps {
  searchTerm: string
  selectedCategory: string
  categories: Category[]
  totalProducts: number
  onSearchChange: (term: string) => void
  onCategoryChange: (categoryId: string) => void
  onAddProduct: () => void
}

export default function ProductsHeader({
  searchTerm,
  selectedCategory,
  categories,
  totalProducts,
  onSearchChange,
  onCategoryChange,
  onAddProduct
}: ProductsHeaderProps) {
  return (
    <div className="bg-white border-b p-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h1>
          <p className="text-gray-600">إجمالي المنتجات: {totalProducts}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="البحث في المنتجات..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="جميع الفئات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع الفئات</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Add Product Button */}
          <Button onClick={onAddProduct} className="whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" />
            إضافة منتج
          </Button>
        </div>
      </div>
    </div>
  )
}