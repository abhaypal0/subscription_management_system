import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Plus, Search, Edit2, Trash2, Layers, Filter } from 'lucide-react'
import { productService } from '../../services/product.service'
import { formatCurrency, formatDate } from '../../utils/formatters'
import PageHeader from '../../components/layout/PageHeader'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'

export const ProductsPage = () => {
  const { role } = useSelector((state) => state.auth)
  const isAdmin = role === 'admin'

  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalProducts: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')

  // Product Add/Edit Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'service',
    salesPrice: '',
    costPrice: '',
    notes: '',
  })
  const [isSavingProduct, setIsSavingProduct] = useState(false)

  // Variant Modal
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null)
  const [variantForm, setVariantForm] = useState({
    variantName: '',
    variantValue: '',
    additionalPrice: 0,
  })
  const [isSavingVariant, setIsSavingVariant] = useState(false)

  // Deactivate Confirm Dialog
  const [deactivatingProductId, setDeactivatingProductId] = useState(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const loadProducts = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        type: typeFilter || undefined,
        isActive: activeFilter !== '' ? activeFilter : undefined,
      }
      const res = await productService.getProducts(params)
      setProducts(res.data || [])
      if (res.pagination) {
        setPagination(res.pagination)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch products')
    } finally {
      setIsLoading(false)
    }
  }, [search, typeFilter, activeFilter])

  useEffect(() => {
    loadProducts(1)
  }, [loadProducts])

  // Open Create Product
  const handleOpenCreate = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      type: 'service',
      salesPrice: '',
      costPrice: '',
      notes: '',
    })
    setIsProductModalOpen(true)
  }

  // Open Edit Product
  const handleOpenEdit = (product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name || '',
      type: product.type || 'service',
      salesPrice: product.salesPrice || '',
      costPrice: product.costPrice || '',
      notes: product.notes || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
    })
    setIsProductModalOpen(true)
  }

  // Save Product (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setIsSavingProduct(true)
    try {
      const payload = {
        name: productForm.name,
        type: productForm.type,
        salesPrice: Number(productForm.salesPrice),
        costPrice: productForm.costPrice ? Number(productForm.costPrice) : 0,
        notes: productForm.notes,
      }

      if (editingProduct) {
        payload.isActive = productForm.isActive
        await productService.updateProduct(editingProduct._id, payload)
        toast.success('Product updated successfully')
      } else {
        await productService.createProduct(payload)
        toast.success('Product created successfully')
      }
      setIsProductModalOpen(false)
      loadProducts(pagination.currentPage)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product')
    } finally {
      setIsSavingProduct(false)
    }
  }

  // Deactivate Product
  const handleConfirmDeactivate = async () => {
    if (!deactivatingProductId) return
    setIsDeactivating(true)
    try {
      await productService.deactivateProduct(deactivatingProductId)
      toast.success('Product deactivated successfully')
      setDeactivatingProductId(null)
      loadProducts(pagination.currentPage)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate product')
    } finally {
      setIsDeactivating(false)
    }
  }

  // Open Variants Modal
  const handleOpenVariants = (product) => {
    setSelectedProductForVariants(product)
    setVariantForm({
      variantName: '',
      variantValue: '',
      additionalPrice: 0,
    })
    setIsVariantModalOpen(true)
  }

  // Add Variant
  const handleAddVariant = async (e) => {
    e.preventDefault()
    if (!variantForm.variantName || !variantForm.variantValue) {
      toast.error('Variant name and value are required')
      return
    }
    setIsSavingVariant(true)
    try {
      await productService.createVariant({
        productId: selectedProductForVariants._id,
        variantName: variantForm.variantName,
        variantValue: variantForm.variantValue,
        additionalPrice: Number(variantForm.additionalPrice) || 0,
      })
      toast.success('Variant added successfully')
      setVariantForm({ variantName: '', variantValue: '', additionalPrice: 0 })
      // Refresh selected product's variants
      const updated = await productService.getProductById(selectedProductForVariants._id)
      setSelectedProductForVariants(updated.data)
      loadProducts(pagination.currentPage)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create variant')
    } finally {
      setIsSavingVariant(false)
    }
  }

  // Deactivate Variant
  const handleDeactivateVariant = async (variantId) => {
    try {
      await productService.deactivateVariant(variantId)
      toast.success('Variant deactivated')
      const updated = await productService.getProductById(selectedProductForVariants._id)
      setSelectedProductForVariants(updated.data)
      loadProducts(pagination.currentPage)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate variant')
    }
  }

  const columns = [
    {
      header: 'Product Details',
      key: 'name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.name}</span>
          <span className="text-xs text-slate-500 capitalize">{row.type}</span>
        </div>
      ),
    },
    {
      header: 'Sales Price',
      key: 'salesPrice',
      render: (row) => (
        <span className="font-medium text-slate-900">
          {formatCurrency(row.salesPrice)}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            header: 'Cost Price',
            key: 'costPrice',
            render: (row) => (
              <span className="text-slate-600">
                {row.costPrice !== undefined ? formatCurrency(row.costPrice) : '—'}
              </span>
            ),
          },
        ]
      : []),
    {
      header: 'Variants',
      key: 'variants',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {row.variants?.length || 0} variants
          </span>
          <button
            type="button"
            onClick={() => handleOpenVariants(row)}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium ml-1 underline"
          >
            Manage
          </button>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'isActive',
      render: (row) => (
        <Badge status={row.isActive ? 'active' : 'closed'} size="xs">
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Created At',
      key: 'createdAt',
      render: (row) => (
        <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>
      ),
    },
    ...(isAdmin
      ? [
          {
            header: 'Actions',
            key: 'actions',
            className: 'text-right',
            render: (row) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(row)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                  title="Edit Product"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {row.isActive && (
                  <button
                    type="button"
                    onClick={() => setDeactivatingProductId(row._id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Deactivate Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Services"
        description="Catalog of billable services, goods, and active item variants."
        breadcrumbs={['Catalog', 'Products']}
        action={
          isAdmin && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              Add Product
            </Button>
          )
        }
      />

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Search products by name..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            placeholder="All Types"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { label: 'All Types', value: '' },
              { label: 'Service', value: 'service' },
              { label: 'Goods', value: 'goods' },
            ]}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            placeholder="All Status"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            options={[
              { label: 'All Status', value: '' },
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
          />
        </div>
      </div>

      {/* Products Table */}
      <Table
        columns={columns}
        data={products}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => loadProducts(page)}
        emptyTitle="No products found"
        emptyDescription="Create a product in your catalog to begin selling subscriptions."
        emptyActionLabel={isAdmin ? 'Add First Product' : undefined}
        onEmptyAction={isAdmin ? handleOpenCreate : undefined}
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        subtitle="Configure product pricing and service attributes."
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Product Name"
            required
            placeholder="e.g. Cloud Server Hosting"
            value={productForm.name}
            onChange={(e) =>
              setProductForm({ ...productForm, name: e.target.value })
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Product Type"
              required
              value={productForm.type}
              onChange={(e) =>
                setProductForm({ ...productForm, type: e.target.value })
              }
              options={[
                { label: 'Service', value: 'service' },
                { label: 'Goods', value: 'goods' },
              ]}
            />

            <Input
              label="Sales Price (INR)"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              value={productForm.salesPrice}
              onChange={(e) =>
                setProductForm({ ...productForm, salesPrice: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cost Price (INR)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              helperText="Internal cost tracking (Admin only)"
              value={productForm.costPrice}
              onChange={(e) =>
                setProductForm({ ...productForm, costPrice: e.target.value })
              }
            />

            {editingProduct && (
              <Select
                label="Product Status"
                value={productForm.isActive ? 'true' : 'false'}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    isActive: e.target.value === 'true',
                  })
                }
                options={[
                  { label: 'Active', value: 'true' },
                  { label: 'Inactive', value: 'false' },
                ]}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Internal Notes
            </label>
            <textarea
              rows="3"
              placeholder="Optional notes or specifications..."
              className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              value={productForm.notes}
              onChange={(e) =>
                setProductForm({ ...productForm, notes: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setIsProductModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingProduct}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Variants Modal */}
      <Modal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        title={`Variants: ${selectedProductForVariants?.name || ''}`}
        subtitle="Manage product variants such as storage size, bandwidth, or seats."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Add Variant Form (Admin only) */}
          {isAdmin && (
            <form
              onSubmit={handleAddVariant}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Add New Variant
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="Name (e.g. Storage)"
                  required
                  value={variantForm.variantName}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, variantName: e.target.value })
                  }
                />
                <Input
                  placeholder="Value (e.g. 500GB)"
                  required
                  value={variantForm.variantValue}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, variantValue: e.target.value })
                  }
                />
                <Input
                  placeholder="Addl. Price (INR)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={variantForm.additionalPrice}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      additionalPrice: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  isLoading={isSavingVariant}
                >
                  Add Variant
                </Button>
              </div>
            </form>
          )}

          {/* Existing Variants List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Configured Variants (
              {selectedProductForVariants?.variants?.length || 0})
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {selectedProductForVariants?.variants?.length > 0 ? (
                selectedProductForVariants.variants.map((v) => (
                  <div
                    key={v._id}
                    className="p-3.5 flex items-center justify-between bg-white text-sm"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">
                        {v.variantName}: {v.variantValue}
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Additional Price: {formatCurrency(v.additionalPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={v.isActive ? 'active' : 'closed'} size="xs">
                        {v.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {isAdmin && v.isActive && (
                        <button
                          type="button"
                          onClick={() => handleDeactivateVariant(v._id)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-6 text-center text-xs text-slate-400 bg-white">
                  No variants added yet for this product.
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Deactivate Product Confirm */}
      <ConfirmDialog
        isOpen={!!deactivatingProductId}
        onClose={() => setDeactivatingProductId(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Product?"
        description="This will mark the product as inactive. It will no longer appear in new quotation options."
        isLoading={isDeactivating}
        confirmLabel="Deactivate"
      />
    </div>
  )
}

export default ProductsPage
