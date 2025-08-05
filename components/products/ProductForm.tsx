'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Product, Category, CategorySize, Extra, ProductForm as ProductFormType } from '@/lib/types'
import { getSizeName, updateFormPricesForCategory } from '@/lib/utils'

interface ProductFormProps {
  form: ProductFormType
  categories: Category[]
  allSizes: CategorySize[]
  allExtras: Extra[]
  loading: boolean
  editingProduct: Product | null
  onFormChange: (form: ProductFormType) => void
  onSubmit: () => void
  onClose: () => void
}

export default function ProductForm({
  form,
  categories,
  allSizes,
  allExtras,
  loading,
  editingProduct,
  onFormChange,
  onSubmit,
  onClose
}: ProductFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Get sizes for selected category
  const categorySizes = allSizes.filter(size => size.categoryId === form.categoryId)
  
  // Get extras that are available for the selected category
  const availableExtras = allExtras.filter(extra => 
    categories.find(cat => cat.id === form.categoryId)?.extras?.some(ce => ce.extraId === extra.id)
  )

  useEffect(() => {
    if (editingProduct?.image && typeof editingProduct.image === 'string') {
      setImagePreview(editingProduct.image)
    }
  }, [editingProduct])

  const handleCategoryChange = (categoryId: string) => {
    const updatedForm = updateFormPricesForCategory(form, categoryId, allSizes)
    onFormChange(updatedForm)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFormChange({ ...form, image: file })
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePriceChange = (sizeId: string, field: 'price' | 'cost', value: string) => {
    const updatedPrices = form.prices.map(price =>
      price.sizeId === sizeId ? { ...price, [field]: value } : price
    )
    onFormChange({ ...form, prices: updatedPrices })
  }

  const handleExtraToggle = (extraId: string) => {
    const existingExtraIndex = form.extras.findIndex(e => e.extraId === extraId)
    
    if (existingExtraIndex >= 0) {
      // Remove extra
      const updatedExtras = form.extras.filter((_, index) => index !== existingExtraIndex)
      onFormChange({ ...form, extras: updatedExtras })
    } else {
      // Add extra
      const updatedExtras = [
        ...form.extras,
        { extraId, isRequired: false, maxQuantity: '' }
      ]
      onFormChange({ ...form, extras: updatedExtras })
    }
  }

  const handleExtraChange = (extraId: string, field: 'isRequired' | 'maxQuantity', value: boolean | string) => {
    const updatedExtras = form.extras.map(extra =>
      extra.extraId === extraId ? { ...extra, [field]: value } : extra
    )
    onFormChange({ ...form, extras: updatedExtras })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">اسم المنتج *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                  placeholder="أدخل اسم المنتج"
                />
              </div>

              <div>
                <Label htmlFor="nameEn">الاسم الإنجليزي *</Label>
                <Input
                  id="nameEn"
                  value={form.nameEn}
                  onChange={(e) => onFormChange({ ...form, nameEn: e.target.value })}
                  placeholder="Enter product name in English"
                />
              </div>

              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => onFormChange({ ...form, description: e.target.value })}
                  placeholder="أدخل وصف المنتج"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">الفئة *</Label>
                <Select value={form.categoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) => onFormChange({ ...form, isActive: checked })}
                />
                <Label htmlFor="isActive">المنتج متاح</Label>
              </div>

              {/* Image Upload */}
              <div>
                <Label>صورة المنتج</Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview(null)
                          onFormChange({ ...form, image: undefined })
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <Label htmlFor="image" className="cursor-pointer text-sm text-gray-600">
                        اضغط لاختيار صورة
                      </Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Prices & Extras */}
            <div className="space-y-4">
              {/* Prices */}
              <div>
                <Label>الأسعار حسب الحجم</Label>
                <div className="space-y-3 mt-2">
                  {categorySizes.map((size) => {
                    const priceData = form.prices.find(p => p.sizeId === size.id)
                    return (
                      <div key={size.id} className="grid grid-cols-3 gap-2 items-center">
                        <Label className="text-sm">{size.name}</Label>
                        <Input
                          placeholder="السعر"
                          type="number"
                          step="0.01"
                          value={priceData?.price || ''}
                          onChange={(e) => handlePriceChange(size.id, 'price', e.target.value)}
                        />
                        <Input
                          placeholder="التكلفة"
                          type="number"
                          step="0.01"
                          value={priceData?.cost || ''}
                          onChange={(e) => handlePriceChange(size.id, 'cost', e.target.value)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Extras */}
              {availableExtras.length > 0 && (
                <div>
                  <Label>الإضافات المتاحة</Label>
                  <div className="space-y-3 mt-2">
                    {availableExtras.map((extra) => {
                      const selectedExtra = form.extras.find(e => e.extraId === extra.id)
                      const isSelected = !!selectedExtra

                      return (
                        <div key={extra.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleExtraToggle(extra.id)}
                                className="rounded"
                              />
                              <span className="font-medium">{extra.name}</span>
                              <Badge variant="outline">{extra.price} ريال</Badge>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={selectedExtra.isRequired}
                                  onCheckedChange={(checked) => 
                                    handleExtraChange(extra.id, 'isRequired', checked)
                                  }
                                />
                                <Label className="text-sm">إجباري</Label>
                              </div>
                              <Input
                                placeholder="الحد الأقصى"
                                type="number"
                                value={selectedExtra.maxQuantity}
                                onChange={(e) => 
                                  handleExtraChange(extra.id, 'maxQuantity', e.target.value)
                                }
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? 'جاري الحفظ...' : (editingProduct ? 'تحديث' : 'إنشاء')}
          </Button>
        </div>
      </div>
    </div>
  )
}

