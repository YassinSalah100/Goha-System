'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { 
  Product, 
  Category, 
  Extra, 
  CategorySize, 
  LoadingStates, 
  ProductForm as ProductFormType 
} from '@/lib/types'
import { 
  fetchProducts, 
  fetchCategories, 
  fetchSizes, 
  fetchCategoryExtras,
  createProduct,
  updateProduct,
  deleteProduct
} from '@/lib/services'
import { 
  filterProducts, 
  initializeProductForm, 
  populateEditForm,
  prepareProductSubmissionData 
} from '@/lib/utils'
import ProductsHeader from './ProductsHeader'
import ProductGrid from './ProductGrid'
// import ProductForm from './ProductForm'

export default function ProductManagement() {
  const { toast } = useToast()

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [allSizes, setAllSizes] = useState<CategorySize[]>([])
  const [allExtras, setAllExtras] = useState<Extra[]>([])
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Form State
  const [productForm, setProductForm] = useState<ProductFormType>(
    initializeProductForm([], "")
  )
  
  // Loading States
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    categories: false,
    products: false,
    sizes: false,
    categoryExtras: false,
    categoryDetails: false,
    submit: false,
  })

  // Helper function for showing messages
  const showMessage = (type: "success" | "error", message: string) => {
    toast({
      title: type === "success" ? "نجح العملية" : "خطأ",
      description: message,
      variant: type === "success" ? "default" : "destructive",
    })
  }

  // Data fetching functions
  const loadCategories = async () => {
    setLoadingStates(prev => ({ ...prev, categories: true }))
    try {
      const categoriesData = await fetchCategories()
      setCategories(categoriesData)
    } catch (error) {
      showMessage("error", "خطأ في تحميل الفئات")
    } finally {
      setLoadingStates(prev => ({ ...prev, categories: false }))
    }
  }

  const loadProducts = async () => {
    setLoadingStates(prev => ({ ...prev, products: true }))
    try {
      const productsData = await fetchProducts()
      setProducts(productsData)
    } catch (error) {
      showMessage("error", "خطأ في تحميل المنتجات")
    } finally {
      setLoadingStates(prev => ({ ...prev, products: false }))
    }
  }

  const loadSizes = async () => {
    setLoadingStates(prev => ({ ...prev, sizes: true }))
    try {
      const sizesData = await fetchSizes()
      setAllSizes(sizesData)
    } catch (error) {
      showMessage("error", "خطأ في تحميل الأحجام")
    } finally {
      setLoadingStates(prev => ({ ...prev, sizes: false }))
    }
  }

  const loadCategoryExtras = async () => {
    setLoadingStates(prev => ({ ...prev, categoryExtras: true }))
    try {
      const extrasData = await fetchCategoryExtras()
      setAllExtras(extrasData)
    } catch (error) {
      showMessage("error", "خطأ في تحميل الإضافات")
    } finally {
      setLoadingStates(prev => ({ ...prev, categoryExtras: false }))
    }
  }

  // Load all data on component mount
  useEffect(() => {
    loadCategories()
    loadProducts()
    loadSizes()
    loadCategoryExtras()
  }, [])

  // Product operations
  const handleAddProduct = () => {
    setEditingProduct(null)
    setProductForm(initializeProductForm(allSizes, ""))
    setShowProductDialog(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm(populateEditForm(product, allSizes))
    setShowProductDialog(true)
  }

  const handleProductSubmit = async () => {
    setLoadingStates(prev => ({ ...prev, submit: true }))
    try {
      const submissionData = prepareProductSubmissionData(productForm)

      if (editingProduct) {
        await updateProduct(editingProduct.id, submissionData)
        showMessage("success", "تم تحديث المنتج بنجاح")
      } else {
        await createProduct(submissionData)
        showMessage("success", "تم إنشاء المنتج بنجاح")
      }

      setShowProductDialog(false)
      loadProducts() // Refresh products list
    } catch (error) {
      showMessage("error", editingProduct ? "خطأ في تحديث المنتج" : "خطأ في إنشاء المنتج")
    } finally {
      setLoadingStates(prev => ({ ...prev, submit: false }))
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId)
      showMessage("success", "تم حذف المنتج بنجاح")
      loadProducts() // Refresh products list
    } catch (error) {
      showMessage("error", "خطأ في حذف المنتج")
    }
  }

  const closeProductDialog = () => {
    setShowProductDialog(false)
    setEditingProduct(null)
  }

  // Filter products based on search and category
  const filteredProducts = filterProducts(products, searchTerm, selectedCategory)

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ProductsHeader
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        categories={categories}
        totalProducts={filteredProducts.length}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        onAddProduct={handleAddProduct}
      />

      <ProductGrid
        products={filteredProducts}
        loading={loadingStates.products}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      {showProductDialog && (
        <div>Product Form will be implemented</div>
        /* <ProductForm
          form={productForm}
          categories={categories}
          allSizes={allSizes}
          allExtras={allExtras}
          loading={loadingStates.submit}
          editingProduct={editingProduct}
          onFormChange={setProductForm}
          onSubmit={handleProductSubmit}
          onClose={closeProductDialog}
        /> */
      )}
    </div>
  )
}
