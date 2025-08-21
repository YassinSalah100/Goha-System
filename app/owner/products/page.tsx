"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthApiService } from "@/lib/services/auth-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, CheckCircle, AlertCircle, Plus, Edit, Trash2, Search, Package, Tag, Ruler, DollarSign, BarChart3, Filter, TrendingUp, X } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string
  created_at?: string
}

interface Product {
  id: string
  name: string
  price: number
  category_id: string
  image_url?: string
  category?: Category | null
  sizePrices?: ProductSizePrice[]
  created_at?: string
}

interface CategorySize {
  id: string
  name: string
  category_id: string
  category?: Category | null
}

interface CategoryExtra {
  id: string
  name: string
  price: number
  category_id: string
  category?: Category | null
}

interface ProductSizePrice {
  id?: string
  product_size_id?: string
  product_id: string
  size_id: string
  price: number | string
  product?: Product
  size?: {
    size_id: string
    size_name: string
  }
}

interface Stats {
  totalCategories: number
  totalProducts: number
  totalSizes: number
  totalExtras: number
  totalRevenue: number
}

// New interfaces for integrated forms
interface NewSize {
  id?: string
  name: string
  tempId?: string
}

interface NewExtra {
  id?: string
  name: string
  price: number
  tempId?: string
}

interface ProductPricing {
  size_id: string
  size_name: string
  price: number
}

export default function IntegratedProductManagement() {
  // State management
  const [activeTab, setActiveTab] = useState("dashboard")
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sizes, setSizes] = useState<CategorySize[]>([])
  const [extras, setExtras] = useState<CategoryExtra[]>([])
  const [productSizePrices, setProductSizePrices] = useState<ProductSizePrice[]>([])
  const [stats, setStats] = useState<Stats>({
    totalCategories: 0,
    totalProducts: 0,
    totalSizes: 0,
    totalExtras: 0,
    totalRevenue: 0,
  })

  // Loading states
  const [loading, setLoading] = useState(false)
  const [loadingStates, setLoadingStates] = useState({
    categories: false,
    products: false,
    sizes: false,
    extras: false,
    productSizePrices: false,
  })

  // UI states
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Integrated dialog states
  const [categoryDialog, setCategoryDialog] = useState(false)
  const [productDialog, setProductDialog] = useState(false)

  // Integrated form states
  const [categoryForm, setCategoryForm] = useState({
    id: "",
    name: "",
    description: "",
    sizes: [] as NewSize[],
    extras: [] as NewExtra[],
  })

  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    category_id: "",
    image_url: "",
    pricing: [] as ProductPricing[],
  })

  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageUploading, setImageUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData()
  }, [])

  // Calculate stats when data changes
  useEffect(() => {
    calculateStats()
  }, [categories, products, sizes, extras, productSizePrices])

  const calculateStats = () => {
    const totalRevenue = Array.isArray(products) ? products.reduce((sum, product) => sum + (product.price || 0), 0) : 0
    setStats({
      totalCategories: Array.isArray(categories) ? categories.length : 0,
      totalProducts: Array.isArray(products) ? products.length : 0,
      totalSizes: Array.isArray(sizes) ? sizes.length : 0,
      totalExtras: Array.isArray(extras) ? extras.length : 0,
      totalRevenue,
    })
  }

  // Function to sort Arabic sizes properly (صغير → وسط → كبير)
  const sortArabicSizes = (sizePrices: any[]) => {
    const sizeOrder = {
      'صغير': 1,
      'وسط': 2,
      'كبير': 3
    }
    
    return [...sizePrices].sort((a, b) => {
      const sizeA = (a.size?.size_name || '').trim()
      const sizeB = (b.size?.size_name || '').trim()
      
      // Get order values, default to 999 for unknown sizes (puts them at the end)
      const orderA = sizeOrder[sizeA as keyof typeof sizeOrder] || 999
      const orderB = sizeOrder[sizeB as keyof typeof sizeOrder] || 999
      
      // If both have the same order value, sort alphabetically
      if (orderA === orderB) {
        return sizeA.localeCompare(sizeB, 'ar')
      }
      
      return orderA - orderB
    })
  }

  // API Functions
  const fetchCategories = async () => {
    setLoadingStates((prev) => ({ ...prev, categories: true }))
    try {
      const data = await AuthApiService.apiRequest<any>('/categories')
      let categoriesArray: any[] = []
      if (Array.isArray(data)) {
        categoriesArray = data
      } else if (data.data && Array.isArray(data.data)) {
        categoriesArray = data.data
      } else if (data.categories && Array.isArray(data.categories)) {
        categoriesArray = data.categories
      } else if (data.data && data.data.categories && Array.isArray(data.data.categories)) {
        categoriesArray = data.data.categories
      }

      const validCategories = categoriesArray
        .map((cat: any) => ({
          id: cat.category_id || cat.id,
          name: cat.name,
          description: cat.description || "",
          created_at: cat.created_at,
        }))
        .filter((cat: any) => cat && cat.id && cat.id !== "undefined" && cat.name)

      setCategories(validCategories)
    } catch (error) {
      console.error("Error fetching categories:", error)
      setCategories([])
      showMessage("error", "خطأ في الاتصال بالخادم")
    } finally {
      setLoadingStates((prev) => ({ ...prev, categories: false }))
    }
  }

  const fetchProducts = async () => {
    setLoadingStates((prev) => ({ ...prev, products: true }))
    try {
      const allProducts: any[] = [];
      let page = 1;
      let hasMoreProducts = true;
      const limit = 100; // Request maximum limit to reduce API calls
      
      // Keep fetching pages until no more products are returned
      while (hasMoreProducts) {
        console.log(`Fetching products page ${page} with limit ${limit}...`);
        const data = await AuthApiService.apiRequest<any>(`/products?page=${page}&limit=${limit}`);
        
        let productsArray: any[] = [];
        
        if (data.success && data.data && Array.isArray(data.data.products)) {
          productsArray = data.data.products;
        } else if (data.success && Array.isArray(data.data)) {
          productsArray = data.data;
        } else if (Array.isArray(data)) {
          productsArray = data;
        }
        
        // If no products were returned, we've reached the end
        if (productsArray.length === 0) {
          hasMoreProducts = false;
        } else {
          allProducts.push(...productsArray);
          // If we received fewer products than the limit, we've reached the end
          if (productsArray.length < limit) {
            hasMoreProducts = false;
          } else {
            page++;
          }
        }
      }
      
      console.log(`Total products fetched: ${allProducts.length}`);

      const validProducts = allProducts
        .map((product: any) => ({
          id: product.product_id,
          name: product.name,
          image_url: product.image_url || "",
          price:
            product.sizePrices && product.sizePrices.length > 0 ? Number.parseFloat(product.sizePrices[0].price) : 0,
          category_id: product.category ? product.category.category_id : "",
          category: product.category
            ? {
                id: product.category.category_id,
                name: product.category.name,
                description: "",
              }
            : null,
          sizePrices:
            product.sizePrices?.map((sp: any) => ({
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

      setProducts(validProducts)
    } catch (error) {
      console.error("Error fetching products:", error)
      setProducts([])
      showMessage("error", "خطأ في الاتصال بالخادم")
    } finally {
      setLoadingStates((prev) => ({ ...prev, products: false }))
    }
  }

  const fetchSizes = async () => {
    setLoadingStates((prev) => ({ ...prev, sizes: true }))
    try {
      const data = await AuthApiService.apiRequest<any>('/category-sizes')
      let sizesArray: any[] = []
      if (data.success && data.data && data.data.sizes && Array.isArray(data.data.sizes)) {
        sizesArray = data.data.sizes
      } else if (data.success && data.data && Array.isArray(data.data)) {
        sizesArray = data.data
      } else if (Array.isArray(data)) {
        sizesArray = data
      }

      const validSizes = sizesArray
        .map((size: any) => ({
            id: size.size_id,
            name: size.size_name,
            category_id: size.category ? size.category.category_id : "",
            category: size.category
              ? {
                  id: size.category.category_id,
                  name: size.category.name,
                  description: "",
                }
              : null,
          }))
          .filter((size: any) => size && size.id && size.name)

        setSizes(validSizes)
    } catch (error) {
      console.error("Error fetching sizes:", error)
      setSizes([])
      showMessage("error", "خطأ في تحميل الأحجام")
    } finally {
      setLoadingStates((prev) => ({ ...prev, sizes: false }))
    }
  }

  const fetchExtras = async () => {
    setLoadingStates((prev) => ({ ...prev, extras: true }))
    try {
      const data = await AuthApiService.apiRequest<any>('/category-extras')
      let extrasArray: any[] = []
      // Handle the new API response structure for extras
      if (data.success && data.data && data.data.extras && Array.isArray(data.data.extras)) {
        extrasArray = data.data.extras
      } else if (data.success && data.data && Array.isArray(data.data)) {
        extrasArray = data.data
        } else if (Array.isArray(data)) {
          extrasArray = data
        }

        const extrasWithCategories = extrasArray
          .map((extra: any) => ({
            id: extra.extra_id,
            name: extra.name,
            price: Number.parseFloat(extra.price) || 0,
            category_id: extra.category ? extra.category.category_id : "",
            category: extra.category
              ? {
                  id: extra.category.category_id,
                  name: extra.category.name,
                  description: "",
                }
              : null,
          }))
          .filter((extra: any) => extra && extra.id && extra.name)

        setExtras(extrasWithCategories)
    } catch (error) {
      console.error("Error fetching extras:", error)
      setExtras([])
      showMessage("error", "خطأ في تحميل الإضافات")
    } finally {
      setLoadingStates((prev) => ({ ...prev, extras: false }))
    }
  }

  const fetchAllData = async () => {
    try {
      console.log("Starting fetchAllData...")
      setLoadingStates({
        categories: true,
        products: true,
        sizes: true,
        extras: true,
        productSizePrices: true,
      })
      
      // First fetch categories
      await fetchCategories()
      // Wait longer for categories to be properly set
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      // Then fetch sizes and extras in parallel since they're smaller datasets
      await Promise.all([
        fetchSizes(),
        fetchExtras()
      ]);
      
      // Finally fetch products (which now handles pagination)
      await fetchProducts()
      
      console.log("fetchAllData completed successfully")
    } catch (error) {
      console.error("Error in fetchAllData:", error)
      showMessage("error", "خطأ في تحميل البيانات")
    } finally {
      setLoadingStates({
        categories: false,
        products: false,
        sizes: false,
        extras: false,
        productSizePrices: false,
      })
    }
  }

  // Helper functions
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Integrated Category Management
  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      const categorySizes = sizes.filter((s) => s.category_id === category.id)
      const categoryExtras = extras.filter((e) => e.category_id === category.id)
      setCategoryForm({
        id: category.id,
        name: category.name,
        description: category.description,
        sizes: categorySizes.map((s) => ({ id: s.id, name: s.name })),
        extras: categoryExtras.map((e) => ({ id: e.id, name: e.name, price: e.price })),
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({
        id: "",
        name: "",
        description: "",
        sizes: [],
        extras: [],
      })
    }
    setCategoryDialog(true)
  }

  const closeCategoryDialog = () => {
    setCategoryDialog(false)
    setEditingCategory(null)
    setCategoryForm({
      id: "",
      name: "",
      description: "",
      sizes: [],
      extras: [],
    })
  }

  const addSizeToCategory = () => {
    const tempId = Date.now().toString()
    setCategoryForm((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { name: "", tempId }],
    }))
  }

  const addExtraToCategory = () => {
    const tempId = Date.now().toString()
    setCategoryForm((prev) => ({
      ...prev,
      extras: [...prev.extras, { name: "", price: 0, tempId }],
    }))
  }

  const removeSizeFromCategory = (index: number) => {
    setCategoryForm((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }))
  }

  const removeExtraFromCategory = (index: number) => {
    setCategoryForm((prev) => ({
      ...prev,
      extras: prev.extras.filter((_, i) => i !== index),
    }))
  }

  const updateCategorySize = (index: number, name: string) => {
    setCategoryForm((prev) => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => (i === index ? { ...size, name } : size)),
    }))
  }

  const updateCategoryExtra = (index: number, field: string, value: any) => {
    setCategoryForm((prev) => ({
      ...prev,
      extras: prev.extras.map((extra, i) => (i === index ? { ...extra, [field]: value } : extra)),
    }))
  }

  const handleCategorySubmit = async () => {
    if (!categoryForm.name.trim()) {
      showMessage("error", "اسم الفئة مطلوب")
      return
    }

    // Validate sizes
    for (const size of categoryForm.sizes) {
      if (!size.name.trim()) {
        showMessage("error", "جميع أسماء الأحجام مطلوبة")
        return
      }
    }

    // Validate extras
    for (const extra of categoryForm.extras) {
      if (!extra.name.trim()) {
        showMessage("error", "جميع أسماء الإضافات مطلوبة")
        return
      }
      if (extra.price < 0) {
        showMessage("error", "أسعار الإضافات يجب أن تكون أكبر من أو تساوي صفر")
        return
      }
    }

    setLoading(true)
    try {
      // Create or update category
      const categoryData = {
        name: categoryForm.name,
        description: categoryForm.description || "",
      }

      const categoryUrl = editingCategory
        ? `/categories/${categoryForm.id}`
        : `/categories`

      console.log("Submitting category:", categoryData, "to:", categoryUrl)

      const categoryResult = await AuthApiService.apiRequest<any>(categoryUrl, {
        method: editingCategory ? "PUT" : "POST",
        body: JSON.stringify(categoryData),
      })

      const categoryId = editingCategory ? categoryForm.id : categoryResult.data?.category_id || categoryResult.id

      console.log("Category saved successfully, ID:", categoryId)

      // Handle sizes - only process if there are sizes to add/update
      if (categoryForm.sizes.length > 0) {
        console.log("Processing sizes:", categoryForm.sizes)
        for (const size of categoryForm.sizes) {
          const sizeData = {
            size_name: size.name,
            category_id: categoryId,
          }

          try {
            if (size.id && !size.tempId) {
              // Update existing size
              console.log("Updating size:", size.id, sizeData)
              await AuthApiService.apiRequest<any>(`/category-sizes/${size.id}`, {
                method: "PUT",
                body: JSON.stringify(sizeData),
              })
              console.log("Size updated successfully")
            } else {
              // Create new size
              console.log("Creating new size:", sizeData)
              await AuthApiService.apiRequest<any>('/category-sizes', {
                method: "POST",
                body: JSON.stringify(sizeData),
              })
            }
          } catch (sizeError) {
            console.error("Error processing size:", sizeError)
          }
        }
      } else {
        console.log("No sizes to process")
      }      // Handle extras - only process if there are extras to add/update
      if (categoryForm.extras.length > 0) {
        console.log("Processing extras:", categoryForm.extras)
        for (const extra of categoryForm.extras) {
          const extraData = {
            name: extra.name,
            price: extra.price,
            category_id: categoryId,
          }

          try {
            if (extra.id && !extra.tempId) {
              // Update existing extra
              console.log("Updating extra:", extra.id, extraData)
              await AuthApiService.apiRequest<any>(`/category-extras/${extra.id}`, {
                method: "PUT",
                body: JSON.stringify(extraData),
              })
              console.log("Extra updated successfully")
            } else {
              // Create new extra
              console.log("Creating new extra:", extraData)
              await AuthApiService.apiRequest<any>('/category-extras', {
                method: "POST",
                body: JSON.stringify(extraData),
              })
              console.log("Extra created successfully")
            }
          } catch (extraError) {
            console.error("Error processing extra:", extraError)
          }
        }
      }

      showMessage("success", `تم ${editingCategory ? "تحديث" : "إنشاء"} الفئة بنجاح`)
      closeCategoryDialog()

      // Wait a bit longer and refresh data multiple times to ensure consistency
      setTimeout(async () => {
        await fetchAllData()
        // Double refresh to ensure all data is loaded
        setTimeout(() => fetchAllData(), 1000)
      }, 1000)
    } catch (error) {
      console.error("Error submitting category:", error)
      showMessage("error", error.message || "خطأ في حفظ الفئة")
    } finally {
      setLoading(false)
    }
  }

  // Integrated Product Management
  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      const productPricing =
        product.sizePrices?.map((sp: any) => ({
          size_id: sp.size?.size_id || sp.size_id,
          size_name: sp.size?.size_name || "",
          price: Number.parseFloat(sp.price),
        })) || []

      setProductForm({
        id: product.id,
        name: product.name,
        category_id: product.category_id,
        image_url: product.image_url || "",
        pricing: productPricing,
      })
    
    // Reset image upload states
    setImageFile(null)
    setImagePreview("")
  } else {
    setEditingProduct(null)
    setImageFile(null)
    setImagePreview("")
    setProductForm({
      id: "",
      name: "",
      category_id: "",
      image_url: "",
      pricing: [],
    })
  }
  setProductDialog(true)
}

  const closeProductDialog = () => {
    setProductDialog(false)
    setEditingProduct(null)
    setImageFile(null)
    setImagePreview("")
    setProductForm({
      id: "",
      name: "",
      category_id: "",
      image_url: "",
      pricing: [],
    })
  }

  const handleCategoryChange = (categoryId: string) => {
    setProductForm((prev) => ({
      ...prev,
      category_id: categoryId,
      pricing: [],
    }))

    // Auto-populate pricing with category sizes
    const categorySizes = sizes.filter((s) => s.category_id === categoryId)
    const newPricing = categorySizes.map((size) => ({
      size_id: size.id,
      size_name: size.name,
      price: 0,
    }))

    setProductForm((prev) => ({
      ...prev,
      pricing: newPricing,
    }))
  }

  const updateProductPricing = (sizeId: string, price: number) => {
    setProductForm((prev) => ({
      ...prev,
      pricing: prev.pricing.map((p) => (p.size_id === sizeId ? { ...p, price } : p)),
    }))
  }

  // Advanced Image Upload Functions
const handleImageSelect = (file: File) => {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    showMessage("error", "نوع الملف غير مدعوم. يرجى اختيار صورة (JPG, PNG, WebP, GIF)")
    return
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    showMessage("error", "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت")
    return
  }

  setImageFile(file)
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    setImagePreview(result)
  }
  reader.readAsDataURL(file)
}

const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedDataUrl)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

const handleImageUpload = async () => {
  if (!imageFile) return ""
  
  setImageUploading(true)
  try {
    // Compress image
    const compressedImage = await compressImage(imageFile, 800, 0.8)
    
    // Update form with base64 image
    setProductForm(prev => ({
      ...prev,
      image_url: compressedImage
    }))
    
    showMessage("success", "تم رفع الصورة بنجاح")
    return compressedImage
  } catch (error) {
    console.error("Error uploading image:", error)
    showMessage("error", "فشل في رفع الصورة")
    return ""
  } finally {
    setImageUploading(false)
  }
}

const handleDrag = (e: React.DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (e.type === "dragenter" || e.type === "dragover") {
    setDragActive(true)
  } else if (e.type === "dragleave") {
    setDragActive(false)
  }
}

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  setDragActive(false)
  
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleImageSelect(e.dataTransfer.files[0])
  }
}

const removeImage = () => {
  setImageFile(null)
  setImagePreview("")
  setProductForm(prev => ({
    ...prev,
    image_url: ""
  }))
}

  const handleProductSubmit = async () => {
  if (!productForm.name.trim()) {
    showMessage("error", "اسم المنتج مطلوب")
    return
  }
  if (!productForm.category_id) {
    showMessage("error", "يجب اختيار فئة للمنتج")
    return
  }

  // Validate pricing
  for (const pricing of productForm.pricing) {
    if (pricing.price < 0) {
      showMessage("error", "جميع الأسعار يجب أن تكون أكبر من أو تساوي صفر")
      return
    }
  }

  setLoading(true)
  try {
    // Handle image upload if file is selected
    let finalImageUrl = productForm.image_url
    if (imageFile && !productForm.image_url.startsWith('data:')) {
      finalImageUrl = await handleImageUpload()
    }

    // Create or update product
    const productData = {
      name: productForm.name,
      category_id: productForm.category_id,
      image_url: finalImageUrl,
      price: productForm.pricing.length > 0 ? productForm.pricing[0].price : 0, // Base price
    }

    const productUrl = editingProduct ? `/products/${productForm.id}` : `/products`

    const productResult = await AuthApiService.apiRequest<any>(productUrl, {
      method: editingProduct ? "PUT" : "POST",
      body: JSON.stringify(productData),
    })

    const productId = editingProduct ? productForm.id : productResult.data?.product_id || productResult.id

    // Handle product size pricing
    for (const pricing of productForm.pricing) {
      const pricingData = {
        product_id: productId,
        size_id: pricing.size_id,
        price: pricing.price,
      }

      // Check if pricing already exists
      const existingPricing = productSizePrices.find(
        (psp) => psp.product_id === productId && psp.size_id === pricing.size_id,
      )

      if (existingPricing) {
        // Update existing pricing
        await AuthApiService.apiRequest<any>(`/product-size-prices/${existingPricing.id}`, {
          method: "PUT",
          body: JSON.stringify(pricingData),
        })
      } else {
        // Create new pricing
        await AuthApiService.apiRequest<any>('/product-size-prices', {
          method: "POST",
          body: JSON.stringify(pricingData),
        })
      }
    }

    showMessage("success", `تم ${editingProduct ? "تحديث" : "إنشاء"} المنتج بنجاح`)
    closeProductDialog()
    setTimeout(() => fetchAllData(), 100)
  } catch (error) {
    console.error("Error submitting product:", error)
    showMessage("error", "خطأ في حفظ المنتج")
  } finally {
    setLoading(false)
  }
}

  // Delete functions with proper cascade handling
  const handleDeleteSize = async (sizeId: string, sizeName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الحجم "${sizeName}"؟\nسيتم حذف جميع أسعار المنتجات المرتبطة بهذا الحجم.`)) return

    setLoading(true)
    try {
      console.log("Deleting size and related data:", sizeId)
      // Step 1: Delete all product-size-prices for this size
      try {
        const pricingData = await AuthApiService.apiRequest<any>(`/product-size-prices?size_id=${sizeId}`)
        const pricingArray = Array.isArray(pricingData) ? pricingData : pricingData.data || []
        // Delete each pricing record
        for (const pricing of pricingArray) {
          await AuthApiService.apiRequest<any>(`/product-size-prices/${pricing.id || pricing.product_size_id}`, {
            method: "DELETE",
          })
        }
      } catch (error) {
        console.warn("Error deleting product size prices:", error)
      }

      // Step 2: Delete the size
      await AuthApiService.apiRequest<any>(`/category-sizes/${sizeId}`, {
        method: "DELETE",
      })
      
      showMessage("success", "تم حذف الحجم بنجاح")
      await fetchAllData()
    } catch (error) {
      console.error("Error deleting size:", error)
      showMessage("error", "خطأ في حذف الحجم")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExtra = async (extraId: string, extraName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الإضافة "${extraName}"؟`)) return

    setLoading(true)
    try {
      await AuthApiService.apiRequest<any>(`/category-extras/${extraId}`, {
        method: "DELETE",
      })

      showMessage("success", "تم حذف الإضافة بنجاح")
      await fetchAllData()
    } catch (error) {
      console.error("Error deleting extra:", error)
      showMessage("error", "خطأ في حذف الإضافة")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    // Get category details first
    const category = categories.find((c) => c.id === id)
    const categorySizes = getCategorySizes(id)
    const categoryExtras = getCategoryExtras(id)
    const categoryProducts = products.filter((p) => p.category_id === id)

    let confirmMessage = `هل أنت متأكد من حذف فئة "${category?.name}"؟\n\n`
    if (categoryProducts.length > 0) {
      confirmMessage += `⚠️ تحتوي على ${categoryProducts.length} منتج(ات)\n`
    }
    if (categorySizes.length > 0) {
      confirmMessage += `⚠️ تحتوي على ${categorySizes.length} حجم/أحجام\n`
    }
    if (categoryExtras.length > 0) {
      confirmMessage += `⚠️ تحتوي على ${categoryExtras.length} إضافة/إضافات\n`
    }
    confirmMessage += `\nسيتم حذف جميع البيانات المرتبطة بهذه الفئة نهائياً.`

    if (!confirm(confirmMessage)) return

    setLoading(true)
    try {
      console.log("Deleting category and related data:", id)

      // Step 1: Delete all product-size-prices for all sizes in this category
      for (const size of categorySizes) {
        try {
          const pricingData = await AuthApiService.apiRequest<any>(`/product-size-prices?size_id=${size.id}`)
          const pricingArray = Array.isArray(pricingData) ? pricingData : pricingData.data || []
          // Delete each pricing record
          for (const pricing of pricingArray) {
            await AuthApiService.apiRequest<any>(`/product-size-prices/${pricing.id || pricing.product_size_id}`, {
              method: 'DELETE'
            })
          }
        } catch (error) {
          console.warn("Error deleting product size prices for size:", size.id, error)
        }
      }

      // Step 2: Delete all product-size-prices for products in this category
      for (const product of categoryProducts) {
        try {
          const pricingData = await AuthApiService.apiRequest<any>(`/product-size-prices?product_id=${product.id}`)
          const pricingArray = Array.isArray(pricingData) ? pricingData : pricingData.data || []
          // Delete each pricing record
          for (const pricing of pricingArray) {
            await AuthApiService.apiRequest<any>(`/product-size-prices/${pricing.id || pricing.product_size_id}`, {
              method: 'DELETE'
            })
          }
        } catch (error) {
          console.warn("Error deleting product size prices for product:", product.id, error)
        }
      }

      // Step 3: Delete all products in this category
      for (const product of categoryProducts) {
        try {
          await AuthApiService.apiRequest<any>(`/products/${product.id}`, {
            method: 'DELETE'
          })
        } catch (error) {
          console.warn("Error deleting product:", product.id, error)
        }
      }

      // Step 4: Delete all sizes in this category
      for (const size of categorySizes) {
        try {
          await AuthApiService.apiRequest<any>(`/category-sizes/${size.id}`, {
            method: 'DELETE'
          })
        } catch (error) {
          console.warn("Error deleting size:", size.id, error)
        }
      }

      // Step 5: Delete all extras in this category
      for (const extra of categoryExtras) {
        try {
          await AuthApiService.apiRequest<any>(`/category-extras/${extra.id}`, {
            method: 'DELETE'
          })
        } catch (error) {
          console.warn("Error deleting extra:", extra.id, error)
        }
      }

      // Step 6: Finally delete the category
      await AuthApiService.apiRequest<any>(`/categories/${id}`, {
        method: 'DELETE'
      })

      showMessage("success", "تم حذف الفئة وجميع البيانات المرتبطة بها بنجاح")
      await fetchAllData()
    } catch (error) {
      console.error("Error deleting category:", error)
      showMessage("error", "خطأ في الاتصال أثناء حذف الفئة")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    const product = products.find((p) => p.id === id)
    if (!confirm(`هل أنت متأكد من حذف منتج "${product?.name}"؟\nسيتم حذف جميع أسعار الأحجام المرتبطة به.`)) return

    setLoading(true)
    try {
      console.log("Deleting product and related pricing:", id)
      // Step 1: Delete all product-size-prices for this product
      try {
        const pricingData = await AuthApiService.apiRequest<any>(`/product-size-prices?product_id=${id}`)
        const pricingArray = Array.isArray(pricingData) ? pricingData : pricingData.data || []
        // Delete each pricing record
        for (const pricing of pricingArray) {
          await AuthApiService.apiRequest<any>(`/product-size-prices/${pricing.id || pricing.product_size_id}`, {
            method: 'DELETE'
          })
        }
      } catch (error) {
        console.warn("Error deleting product size prices:", error)
      }

      // Step 2: Delete the product
      await AuthApiService.apiRequest<any>(`/products/${id}`, {
        method: 'DELETE'
      })

      showMessage("success", "تم حذف المنتج بنجاح")
      await fetchAllData()
    } catch (error) {
      console.error("Error deleting product:", error)
      showMessage("error", "خطأ في الاتصال")
    } finally {
      setLoading(false)
    }
  }

  // Filter functions
  const filteredCategories = Array.isArray(categories)
    ? categories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : []

  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory
        return matchesSearch && matchesCategory
      })
    : []

  const getCategorySizes = (categoryId: string) => {
    return sizes.filter((size) => size.category_id === categoryId)
  }

  const getCategoryExtras = (categoryId: string) => {
    return extras.filter((extra) => extra.category_id === categoryId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">نظام إدارة المنتجات المتكامل</h1>
              <p className="text-gray-600 mt-1">إدارة شاملة ومتكاملة للفئات والمنتجات والأسعار</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => fetchAllData()} variant="outline" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                تحديث البيانات
              </Button>
              <Button
                onClick={() => {
                  console.log("Current state:", { categories, sizes, extras, products })
                }}
                variant="outline"
                size="sm"
              >
                عرض البيانات
              </Button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في جميع البيانات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="تصفية حسب الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all-categories" value="all">
                  جميع الفئات
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Alert */}
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
              {message.type === "error" ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">الفئات المتكاملة</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">المنتجات والأسعار</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الفئات</CardTitle>
                  <Tag className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCategories}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
                  <Package className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الأحجام</CardTitle>
                  <Ruler className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSizes}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الإضافات</CardTitle>
                  <Plus className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalExtras}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    أحدث المنتجات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {products.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url || "/placeholder.svg"}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.category?.name || "غير مرتبط بفئة"}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{product.price} ج.م</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    الفئات الأكثر استخداماً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.slice(0, 5).map((category) => {
                      const productCount = products.filter((p) => p.category_id === category.id).length
                      return (
                        <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                          <Badge variant="outline">{productCount} منتج</Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integrated Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة الفئات المتكاملة</h2>
              <Button onClick={() => openCategoryDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                إضافة فئة متكاملة
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الفئة</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الأحجام</TableHead>
                      <TableHead>الإضافات</TableHead>
                      <TableHead>عدد المنتجات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingStates.categories ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          <p className="mt-2">جاري تحميل الفئات...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          لا توجد فئات متاحة
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCategories.map((category) => {
                        const productCount = products.filter((p) => p.category_id === category.id).length
                        const categorySizes = getCategorySizes(category.id)
                        const categoryExtras = getCategoryExtras(category.id)

                        return (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="text-gray-600">{category.description || "لا يوجد وصف"}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {categorySizes.map((size) => (
                                  <div key={size.id} className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {size.name}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                      onClick={() => handleDeleteSize(size.id, size.name)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                                {categorySizes.length === 0 && (
                                  <span className="text-gray-400 text-xs">لا توجد أحجام</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {categoryExtras.map((extra) => (
                                  <div key={extra.id} className="flex items-center gap-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {extra.name} ({extra.price}ج.م)
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                      onClick={() => handleDeleteExtra(extra.id, extra.name)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                                {categoryExtras.length === 0 && (
                                  <span className="text-gray-400 text-xs">لا توجد إضافات</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{productCount} منتج</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => openCategoryDialog(category)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDeleteCategory(category.id)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrated Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة المنتجات والأسعار</h2>
              <Button onClick={() => openProductDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                إضافة منتج مع الأسعار
              </Button>
            </div>
            
            {loadingStates.products && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-600 font-medium">جاري تحميل المنتجات...</p>
                <p className="text-gray-500 text-sm mt-1">قد يستغرق هذا بعض الوقت إذا كان هناك الكثير من المنتجات</p>
              </div>
            )}
            
            {!loadingStates.products && products.length === 0 && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد منتجات</h3>
                <p className="text-gray-500 mb-4">لم يتم العثور على منتجات. يمكنك إضافة منتج جديد باستخدام الزر أعلاه.</p>
                <Button variant="outline" onClick={() => openProductDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة أول منتج
                </Button>
              </div>
            )}

            {!loadingStates.products && products.length > 0 && (
              <Card>
                <CardHeader className="py-2 px-4 border-b bg-slate-50">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">إجمالي المنتجات: {products.length}</div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الصورة</TableHead>
                        <TableHead>اسم المنتج</TableHead>
                        <TableHead>الفئة</TableHead>
                        <TableHead>أسعار الأحجام</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.image_url ? (
                              <img
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            {product.category?.name ? (
                              <Badge variant="outline">{product.category.name}</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                غير مرتبط بفئة
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {product.sizePrices && product.sizePrices.length > 0 ? (
                                sortArabicSizes(product.sizePrices).map((sp: any, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {sp.size?.size_name || "غير محدد"}: {sp.price}ج.م
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-400 text-xs">لا توجد أسعار محددة</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openProductDialog(product)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteProduct(product.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Integrated Category Dialog */}
        {categoryDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">
                    {editingCategory ? "تعديل الفئة المتكاملة" : "إضافة فئة متكاملة جديدة"}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={closeCategoryDialog}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Basic Category Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفئة *</label>
                      <Input
                        placeholder="اسم الفئة"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                        className={!categoryForm.name.trim() ? "border-red-300" : ""}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">وصف الفئة</label>
                      <Input
                        placeholder="وصف الفئة"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Sizes Management */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Ruler className="w-5 h-5" />
                        الأحجام
                      </h4>
                      <Button type="button" variant="outline" size="sm" onClick={addSizeToCategory}>
                        <Plus className="w-4 h-4 mr-1" />
                        إضافة حجم
                      </Button>
                    </div>
                    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                      {categoryForm.sizes.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          لا توجد أحجام - اضغط "إضافة حجم" لإضافة حجم جديد
                        </p>
                      ) : (
                        categoryForm.sizes.map((size, index) => (
                          <div key={size.id || size.tempId} className="flex items-center gap-3 bg-white p-3 rounded-lg">
                            <div className="flex-1">
                              <Input
                                placeholder="اسم الحجم"
                                value={size.name}
                                onChange={(e) => updateCategorySize(index, e.target.value)}
                                className={!size.name.trim() ? "border-red-300" : ""}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSizeFromCategory(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Extras Management */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        الإضافات
                      </h4>
                      <Button type="button" variant="outline" size="sm" onClick={addExtraToCategory}>
                        <Plus className="w-4 h-4 mr-1" />
                        إضافة إضافة
                      </Button>
                    </div>
                    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                      {categoryForm.extras.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          لا توجد إضافات - اضغط "إضافة إضافة" لإضافة إضافة جديدة
                        </p>
                      ) : (
                        categoryForm.extras.map((extra, index) => (
                          <div
                            key={extra.id || extra.tempId}
                            className="flex items-center gap-3 bg-white p-3 rounded-lg"
                          >
                            <div className="flex-1">
                              <Input
                                placeholder="اسم الإضافة"
                                value={extra.name}
                                onChange={(e) => updateCategoryExtra(index, "name", e.target.value)}
                                className={!extra.name.trim() ? "border-red-300" : ""}
                              />
                            </div>
                            <div className="w-32">
                              <Input
                                type="number"
                                placeholder="السعر"
                                value={extra.price}
                                onChange={(e) =>
                                  updateCategoryExtra(index, "price", Number.parseFloat(e.target.value) || 0)
                                }
                                min="0"
                                step="0.01"
                                className={extra.price < 0 ? "border-red-300" : ""}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExtraFromCategory(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8 pt-6 border-t">
                  <Button
                    onClick={handleCategorySubmit}
                    disabled={loading || !categoryForm.name.trim()}
                    className="flex-1"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {editingCategory ? "تحديث الفئة المتكاملة" : "إنشاء الفئة المتكاملة"}
                  </Button>
                  <Button variant="outline" onClick={closeCategoryDialog} className="flex-1 bg-transparent">
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrated Product Dialog */}
        {productDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">
                    {editingProduct ? "تعديل المنتج والأسعار" : "إضافة منتج جديد مع الأسعار"}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={closeProductDialog}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Basic Product Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج *</label>
                      <Input
                        placeholder="اسم المنتج"
                        value={productForm.name}
                        onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                        className={!productForm.name.trim() ? "border-red-300" : ""}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الفئة *</label>
                      <Select value={productForm.category_id} onValueChange={handleCategoryChange}>
                        <SelectTrigger className={!productForm.category_id ? "border-red-300" : ""}>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Advanced Image Upload */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">صورة المنتج</label>
  
  {/* Upload Area */}
  <div
    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
      dragActive 
        ? "border-blue-500 bg-blue-50" 
        : "border-gray-300 hover:border-gray-400"
    }`}
    onDragEnter={handleDrag}
    onDragLeave={handleDrag}
    onDragOver={handleDrag}
    onDrop={handleDrop}
  >
    {imagePreview || productForm.image_url ? (
      <div className="space-y-4">
        {/* Image Preview */}
        <div className="relative inline-block">
          <img
            src={imagePreview || productForm.image_url || "/placeholder.svg"}
            alt="معاينة الصورة"
            className="w-32 h-32 object-cover rounded-lg border shadow-sm"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg"
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            onClick={removeImage}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Upload New Image Button */}
        <div>
          <input
            type="file"
            id="image-upload-replace"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageSelect(e.target.files[0])
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('image-upload-replace')?.click()}
          >
            <Edit className="w-4 h-4 mr-2" />
            تغيير الصورة
          </Button>
        </div>
      </div>
    ) : (
      <div className="space-y-4">
        {/* Upload Icon and Text */}
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <Package className="w-6 h-6 text-gray-400" />
        </div>
        
        <div>
          <p className="text-sm text-gray-600 mb-2">
            اسحب وأفلت الصورة هنا، أو اضغط لاختيار ملف
          </p>
          <p className="text-xs text-gray-500">
            JPG, PNG, WebP, GIF حتى 5MB
          </p>
        </div>
        
        {/* File Input */}
        <input
          type="file"
          id="image-upload"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleImageSelect(e.target.files[0])
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={imageUploading}
        >
          {imageUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري الرفع...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              اختيار صورة
            </>
          )}
        </Button>
      </div>
    )}
  </div>
  
  {/* Alternative URL Input */}
  <div className="mt-4">
    <details className="group">
      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
        أو أدخل رابط الصورة يدوياً
      </summary>
      <div className="mt-2 space-y-2">
        <Input
          placeholder="https://example.com/image.jpg"
          value={productForm.image_url}
          onChange={(e) => {
            setProductForm(prev => ({ ...prev, image_url: e.target.value }))
            if (e.target.value) {
              setImagePreview("")
              setImageFile(null)
            }
          }}
          type="url"
          className="text-sm"
        />
        <p className="text-xs text-gray-500">
          يمكنك إدخال رابط صورة من الإنترنت بدلاً من رفع ملف
        </p>
      </div>
    </details>
  </div>
</div>

                  {/* Category Details */}
                  {productForm.category_id && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Available Sizes and Pricing */}
                      <div>
                        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          أسعار الأحجام
                        </h4>
                        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                          {productForm.pricing.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">لا توجد أحجام متاحة لهذه الفئة</p>
                          ) : (
                            productForm.pricing.map((pricing) => (
                              <div key={pricing.size_id} className="flex items-center gap-3 bg-white p-3 rounded-lg">
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {pricing.size_name}
                                  </label>
                                </div>
                                <div className="w-32">
                                  <Input
                                    type="number"
                                    placeholder="السعر"
                                    value={pricing.price}
                                    onChange={(e) =>
                                      updateProductPricing(pricing.size_id, Number.parseFloat(e.target.value) || 0)
                                    }
                                    min="0"
                                    step="0.01"
                                    className={pricing.price < 0 ? "border-red-300" : ""}
                                  />
                                </div>
                                <span className="text-sm text-gray-500 w-8">ج.م</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Available Extras */}
                      <div>
                        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Plus className="w-5 h-5" />
                          الإضافات المتاحة
                        </h4>
                        <div className="border rounded-lg p-4 bg-gray-50">
                          {getCategoryExtras(productForm.category_id).length === 0 ? (
                            <p className="text-gray-500 text-center py-4">لا توجد إضافات متاحة لهذه الفئة</p>
                          ) : (
                            <div className="space-y-2">
                              {getCategoryExtras(productForm.category_id).map((extra) => (
                                <div
                                  key={extra.id}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                                >
                                  <span className="font-medium">{extra.name}</span>
                                  <Badge variant="secondary">{extra.price} ج.م</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-8 pt-6 border-t">
                  <Button
                    onClick={handleProductSubmit}
                    disabled={loading || !productForm.name.trim() || !productForm.category_id}
                    className="flex-1"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {editingProduct ? "تحديث المنتج والأسعار" : "إنشاء المنتج مع الأسعار"}
                  </Button>
                  <Button variant="outline" onClick={closeProductDialog} className="flex-1 bg-transparent">
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
