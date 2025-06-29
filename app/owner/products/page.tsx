"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Tag,
  Ruler,
  DollarSign,
  BarChart3,
  Filter,
  TrendingUp,
  X,
} from "lucide-react"

const API_BASE_URL = "https://172.162.241.242:3000/api/v1"

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
    pricing: [] as ProductPricing[],
  })

  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

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

  // API Functions
  const fetchCategories = async () => {
    setLoadingStates((prev) => ({ ...prev, categories: true }))
    try {
      const response = await fetch(`${API_BASE_URL}/categories`)
      if (response.ok) {
        const data = await response.json()
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
      } else {
        setCategories([])
        showMessage("error", `خطأ في تحميل الفئات: ${response.status}`)
      }
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
      const response = await fetch(`${API_BASE_URL}/products`)
      if (response.ok) {
        const data = await response.json()
        let productsArray: any[] = []
        if (data.success && data.data && Array.isArray(data.data.products)) {
          productsArray = data.data.products
        } else if (Array.isArray(data)) {
          productsArray = data
        }

        const validProducts = productsArray
          .map((product: any) => ({
            id: product.product_id,
            name: product.name,
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
      } else {
        setProducts([])
        showMessage("error", `خطأ في تحميل المنتجات: ${response.status}`)
      }
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
      const response = await fetch(`${API_BASE_URL}/category-sizes`)
      if (response.ok) {
        const data = await response.json()
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
      } else {
        setSizes([])
        showMessage("error", `خطأ في تحميل الأحجام: ${response.status}`)
      }
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
      const response = await fetch(`${API_BASE_URL}/category-extras`)
      if (response.ok) {
        const data = await response.json()
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
      } else {
        setExtras([])
        showMessage("error", `خطأ في تحميل الإضافات: ${response.status}`)
      }
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

      // First fetch categories
      await fetchCategories()

      // Wait longer for categories to be properly set
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Then fetch everything else in sequence (not parallel) to avoid race conditions
      await fetchSizes()
      await new Promise((resolve) => setTimeout(resolve, 300))

      await fetchExtras()
      await new Promise((resolve) => setTimeout(resolve, 300))

      await fetchProducts()

      console.log("fetchAllData completed")
    } catch (error) {
      console.error("Error in fetchAllData:", error)
      showMessage("error", "خطأ في تحميل البيانات")
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
        ? `${API_BASE_URL}/categories/${categoryForm.id}`
        : `${API_BASE_URL}/categories`

      console.log("Submitting category:", categoryData, "to:", categoryUrl)

      const categoryResponse = await fetch(categoryUrl, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      })

      if (!categoryResponse.ok) {
        const errorText = await categoryResponse.text()
        console.error("Category submission failed:", categoryResponse.status, errorText)
        throw new Error(`فشل في حفظ الفئة: ${categoryResponse.status}`)
      }

      const categoryResult = await categoryResponse.json()
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
              const sizeResponse = await fetch(`${API_BASE_URL}/category-sizes/${size.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sizeData),
              })
              if (!sizeResponse.ok) {
                const errorText = await sizeResponse.text()
                console.error("Failed to update size:", errorText)
              } else {
                console.log("Size updated successfully")
              }
            } else {
              // Create new size
              console.log("Creating new size:", sizeData)
              const sizeResponse = await fetch(`${API_BASE_URL}/category-sizes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sizeData),
              })
              if (!sizeResponse.ok) {
                const errorText = await sizeResponse.text()
                console.error("Failed to create size:", errorText)
              } else {
                const result = await sizeResponse.json()
                console.log("Size created successfully:", result)
              }
            }
          } catch (sizeError) {
            console.error("Error processing size:", sizeError)
          }
        }
      } else {
        console.log("No sizes to process")
      }

      // Handle extras - only process if there are extras to add/update
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
              const extraResponse = await fetch(`${API_BASE_URL}/category-extras/${extra.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(extraData),
              })
              if (!extraResponse.ok) {
                const errorText = await extraResponse.text()
                console.error("Failed to update extra:", errorText)
              } else {
                console.log("Extra updated successfully")
              }
            } else {
              // Create new extra
              console.log("Creating new extra:", extraData)
              const extraResponse = await fetch(`${API_BASE_URL}/category-extras`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(extraData),
              })
              if (!extraResponse.ok) {
                const errorText = await extraResponse.text()
                console.error("Failed to create extra:", errorText)
              } else {
                const result = await extraResponse.json()
                console.log("Extra created successfully:", result)
              }
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
        pricing: productPricing,
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        id: "",
        name: "",
        category_id: "",
        pricing: [],
      })
    }
    setProductDialog(true)
  }

  const closeProductDialog = () => {
    setProductDialog(false)
    setEditingProduct(null)
    setProductForm({
      id: "",
      name: "",
      category_id: "",
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
      // Create or update product
      const productData = {
        name: productForm.name,
        category_id: productForm.category_id,
        price: productForm.pricing.length > 0 ? productForm.pricing[0].price : 0, // Base price
      }

      const productUrl = editingProduct ? `${API_BASE_URL}/products/${productForm.id}` : `${API_BASE_URL}/products`

      const productResponse = await fetch(productUrl, {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })

      if (!productResponse.ok) {
        throw new Error("فشل في حفظ المنتج")
      }

      const productResult = await productResponse.json()
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
          await fetch(`${API_BASE_URL}/product-size-prices/${existingPricing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pricingData),
          })
        } else {
          // Create new pricing
          await fetch(`${API_BASE_URL}/product-size-prices`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

  // Delete functions
  // Delete functions with proper cascade handling
  const handleDeleteSize = async (sizeId: string, sizeName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الحجم "${sizeName}"؟\nسيتم حذف جميع أسعار المنتجات المرتبطة بهذا الحجم.`)) return

    setLoading(true)
    try {
      console.log("Deleting size and related data:", sizeId)

      // Step 1: Delete all product-size-prices for this size
      try {
        const productSizePricesResponse = await fetch(`${API_BASE_URL}/product-size-prices?size_id=${sizeId}`)
        if (productSizePricesResponse.ok) {
          const pricingData = await productSizePricesResponse.json()
          const pricingArray = Array.isArray(pricingData) ? pricingData : pricingData.data || []

          // Delete each pricing record
          for (const pricing of pricingArray) {
            await fetch(`${API_BASE_URL}/product-size-prices/${pricing.id || pricing.product_size_id}`, {
              method: "DELETE",
            })
          }
        }
      } catch (error) {
        console.warn("Error deleting product size prices:", error)
      }

      // Step 2: Delete the size
      const response = await fetch(`${API_BASE_URL}/category-sizes/${sizeId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        showMessage("success", "تم حذف الحجم بنجاح")
        await fetchAllData()
      } else {
        const errorText = await response.text()
        console.error("Size delete failed:", response.status, errorText)
        showMessage("error", `خطأ في حذف الحجم: ${response.status}`)
      }
    } catch (error) {
      console.error("Error deleting size:", error)
      showMessage("error", "خطأ في الاتصال")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExtra = async (extraId: string, extraName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الإضافة "${extraName}"؟`)) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/category-extras/${extraId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        showMessage("success", "تم حذف الإضافة بنجاح")
        await fetchAllData()
      } else {
        const errorText = await response.text()
        console.error("Extra delete failed:", response.status, errorText)
        showMessage("error", `خطأ في حذف الإضافة: ${response.status}`)
      }
    } catch (error) {
      console.error("Error deleting extra:", error)
      showMessage("error", "خطأ في الاتصال")
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
          const productSizePricesResponse = await fetch(`${API_BASE_URL}/product-size-prices?size_id=${size.id}`)
          if (productSizePricesResponse.ok) {
            const pricingData = await productSizePricesResponse.json()
            const pricingArray = Array.isArray(pricingData) ? pricingData : pricingData.data || []

            // Delete each pricing record
            for (const pricing of pricingArray) {
              await fetch(`${API_BASE_URL}/product-size-prices/${pricing.id || pricing.product_size_id}`, {
                method: "DELETE",
              })
            }
          }
        } catch (error) {
          console.warn("Error deleting product size prices for size:", size.id, error)
        }
      }

      // Step 2: Delete all product-size-prices for products in this category
      for (const product of categoryProducts) {
        try {
          const productSizePricesResponse = await fetch(`${API_BASE_URL}/product-size-prices?product_id=${product.id}`)
          if (productSizePricesResponse.ok) {
            const pricingData = await productSizePricesResponse.json()
            const pricingArray = Array.isArray(pricingData) ? pricingData : pricingData.data || []

            // Delete each pricing record
            for (const pricing of pricingArray) {
              await fetch(`${API_BASE_URL}/product-size-prices/${pricing.id || pricing.product_size_id}`, {
                method: "DELETE",
              })
            }
          }
        } catch (error) {
          console.warn("Error deleting product size prices for product:", product.id, error)
        }
      }

      // Step 3: Delete all products in this category
      for (const product of categoryProducts) {
        try {
          const productResponse = await fetch(`${API_BASE_URL}/products/${product.id}`, {
            method: "DELETE",
          })
          if (!productResponse.ok) {
            console.warn(`Failed to delete product ${product.id}:`, await productResponse.text())
          }
        } catch (error) {
          console.warn("Error deleting product:", error)
        }
      }

      // Step 4: Delete all sizes in this category
      for (const size of categorySizes) {
        try {
          const sizeResponse = await fetch(`${API_BASE_URL}/category-sizes/${size.id}`, {
            method: "DELETE",
          })
          if (!sizeResponse.ok) {
            console.warn(`Failed to delete size ${size.id}:`, await sizeResponse.text())
          }
        } catch (error) {
          console.warn("Error deleting size:", error)
        }
      }

      // Step 5: Delete all extras in this category
      for (const extra of categoryExtras) {
        try {
          const extraResponse = await fetch(`${API_BASE_URL}/category-extras/${extra.id}`, {
            method: "DELETE",
          })
          if (!extraResponse.ok) {
            console.warn(`Failed to delete extra ${extra.id}:`, await extraResponse.text())
          }
        } catch (error) {
          console.warn("Error deleting extra:", error)
        }
      }

      // Step 6: Finally delete the category
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        showMessage("success", "تم حذف الفئة وجميع البيانات المرتبطة بها بنجاح")
        await fetchAllData()
      } else {
        const errorText = await response.text()
        console.error("Category delete failed:", response.status, errorText)

        // Try to parse error message
        let errorMessage = `خطأ في حذف الفئة: ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          // Use default message
        }

        showMessage("error", errorMessage)
      }
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
        const productSizePricesResponse = await fetch(`${API_BASE_URL}/product-size-prices?product_id=${id}`)
        if (productSizePricesResponse.ok) {
          const pricingData = await productSizePricesResponse.json()
          const pricingArray = Array.isArray(pricingData) ? pricingData : pricingData.data || []

          // Delete each pricing record
          for (const pricing of pricingArray) {
            await fetch(`${API_BASE_URL}/product-size-prices/${pricing.id || pricing.product_size_id}`, {
              method: "DELETE",
            })
          }
        }
      } catch (error) {
        console.warn("Error deleting product size prices:", error)
      }

      // Step 2: Delete the product
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        showMessage("success", "تم حذف المنتج بنجاح")
        await fetchAllData()
      } else {
        const errorText = await response.text()
        console.error("Product delete failed:", response.status, errorText)
        showMessage("error", `خطأ في حذف المنتج: ${response.status}`)
      }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                  <DollarSign className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} ج.م</div>
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
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.category?.name || "غير مرتبط بفئة"}</p>
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

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المنتج</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>أسعار الأحجام</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingStates.products ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          <p className="mt-2">جاري تحميل المنتجات...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          لا توجد منتجات متاحة
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
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
                                product.sizePrices.map((sp: any, index: number) => (
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
