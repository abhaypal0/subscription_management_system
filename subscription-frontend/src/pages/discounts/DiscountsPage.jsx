import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Plus, Search, Edit2, Trash2, Tag, CheckCircle2, Percent, Check } from 'lucide-react'
import { discountService } from '../../services/discount.service'
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

export const DiscountsPage = () => {
  const { role } = useSelector((state) => state.auth)
  const isStaffOrAdmin = ['admin', 'staff'].includes(role)
  const isAdmin = role === 'admin'

  const [discounts, setDiscounts] = useState([])
  const [productsList, setProductsList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState(null)
  const [discountForm, setDiscountForm] = useState({
    name: '',
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minimumPurchase: 0,
    minimumQuantity: 1,
    appliesTo: 'all',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    usageLimit: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Validation Tester Widget
  const [testCode, setTestCode] = useState('')
  const [testAmount, setTestAmount] = useState('1000')
  const [testResult, setTestResult] = useState(null)
  const [isValidating, setIsValidating] = useState(false)

  // Delete Dialog
  const [deletingId, setDeletingId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadDiscounts = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        discountType: typeFilter || undefined,
      }
      const res = await discountService.getDiscounts(params)
      setDiscounts(res.discounts || [])
      setPagination({
        page: res.currentPage || 1,
        totalPages: res.totalPages || 1,
        total: res.totalDiscounts || 0,
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch discounts')
    } finally {
      setIsLoading(false)
    }
  }, [search, typeFilter])

  useEffect(() => {
    loadDiscounts(1)
  }, [loadDiscounts])

  // Open Create
  const handleOpenCreate = () => {
    setEditingDiscount(null)
    const end = new Date()
    end.setMonth(end.getMonth() + 1)

    setDiscountForm({
      name: '',
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minimumPurchase: 0,
      minimumQuantity: 1,
      appliesTo: 'all',
      startDate: new Date().toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      usageLimit: '',
    })
    setIsModalOpen(true)
  }

  // Open Edit
  const handleOpenEdit = (item) => {
    setEditingDiscount(item)
    setDiscountForm({
      name: item.name || '',
      code: item.code || '',
      description: item.description || '',
      discountType: item.discountType || 'percentage',
      discountValue: item.discountValue || '',
      minimumPurchase: item.minimumPurchase || 0,
      minimumQuantity: item.minimumQuantity || 1,
      appliesTo: item.appliesTo || 'all',
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      usageLimit: item.usageLimit || '',
      isActive: item.isActive ?? true,
    })
    setIsModalOpen(true)
  }

  // Save Discount
  const handleSaveDiscount = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const payload = {
        name: discountForm.name,
        code: discountForm.code.trim().toUpperCase(),
        description: discountForm.description,
        discountType: discountForm.discountType,
        discountValue: Number(discountForm.discountValue),
        minimumPurchase: Number(discountForm.minimumPurchase) || 0,
        minimumQuantity: Number(discountForm.minimumQuantity) || 1,
        appliesTo: discountForm.appliesTo,
        startDate: discountForm.startDate,
        endDate: discountForm.endDate,
        usageLimit: discountForm.usageLimit ? Number(discountForm.usageLimit) : undefined,
      }

      if (editingDiscount) {
        payload.isActive = discountForm.isActive
        await discountService.updateDiscount(editingDiscount._id, payload)
        toast.success('Discount updated')
      } else {
        await discountService.createDiscount(payload)
        toast.success('Discount created')
      }
      setIsModalOpen(false)
      loadDiscounts(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save discount')
    } finally {
      setIsSaving(false)
    }
  }

  // Test Code
  const handleTestDiscount = async (e) => {
    e.preventDefault()
    if (!testCode || !testAmount) {
      toast.error('Enter a code and test purchase amount')
      return
    }

    setIsValidating(true)
    setTestResult(null)
    try {
      const res = await discountService.validateDiscount({
        code: testCode.trim().toUpperCase(),
        purchaseAmount: Number(testAmount),
      })
      setTestResult({
        success: true,
        data: res.discount,
      })
      toast.success(res.message || 'Coupon applied successfully')
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Coupon invalid',
      })
      toast.error(err.response?.data?.message || 'Coupon invalid')
    } finally {
      setIsValidating(false)
    }
  }

  // Delete Discount
  const handleConfirmDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      await discountService.deleteDiscount(deletingId)
      toast.success('Discount deleted')
      setDeletingId(null)
      loadDiscounts(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete discount')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = [
    {
      header: 'Discount Code',
      key: 'code',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-slate-900 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md inline-block">
            {row.code || 'NO-CODE'}
          </span>
          <span className="text-xs text-slate-500 block mt-1">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Benefit Value',
      key: 'discountValue',
      render: (row) => (
        <span className="font-bold text-slate-900">
          {row.discountType === 'percentage'
            ? `${row.discountValue}% OFF`
            : formatCurrency(row.discountValue)}
        </span>
      ),
    },
    {
      header: 'Usage Count',
      key: 'usedCount',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.usedCount || 0} / {row.usageLimit ? row.usageLimit : '∞'} used
        </span>
      ),
    },
    {
      header: 'Valid Period',
      key: 'validity',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {formatDate(row.startDate)} to {formatDate(row.endDate)}
        </span>
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
    ...(isStaffOrAdmin
      ? [
          {
            header: 'Actions',
            key: 'actions',
            className: 'text-right',
            render: (row) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(row)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                  title="Edit Discount"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setDeletingId(row._id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Discount"
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
        title="Promotions & Discounts"
        description="Coupon codes, percentage deductions, and minimum purchase volume discounts."
        breadcrumbs={['Billing & Rules', 'Discounts']}
        action={
          isStaffOrAdmin && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              Add Discount
            </Button>
          )
        }
      />

      {/* Validation Test Sandbox */}
      <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl text-white shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-sm tracking-wide">
            Interactive Coupon Validator
          </h3>
        </div>
        <form
          onSubmit={handleTestDiscount}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="w-full sm:flex-1">
            <input
              type="text"
              placeholder="Enter coupon code (e.g. SUMMER20)"
              className="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm px-3.5 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 uppercase font-mono"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <input
              type="number"
              placeholder="Cart Amount"
              className="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm px-3.5 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
            isLoading={isValidating}
          >
            Validate Code
          </Button>
        </form>

        {testResult && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between ${
              testResult.success
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <>
                <span>
                  Code <strong className="font-mono">{testResult.data.code}</strong> applied! Discount: -{formatCurrency(testResult.data.discountAmount)}
                </span>
                <span className="font-bold text-white">
                  Final Payable: {formatCurrency(testResult.data.finalAmount)}
                </span>
              </>
            ) : (
              <span>{testResult.message}</span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={discounts}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => loadDiscounts(page)}
        emptyTitle="No discount rules found"
        emptyDescription="Create discount coupons to reward loyal customers or run seasonal promotional campaigns."
        emptyActionLabel={isStaffOrAdmin ? 'Add First Discount' : undefined}
        onEmptyAction={isStaffOrAdmin ? handleOpenCreate : undefined}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDiscount ? 'Edit Discount' : 'Add New Discount'}
        subtitle="Configure benefit type, limits, and valid date range."
      >
        <form onSubmit={handleSaveDiscount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Promotion Name"
              required
              placeholder="e.g. Spring Sale"
              value={discountForm.name}
              onChange={(e) =>
                setDiscountForm({ ...discountForm, name: e.target.value })
              }
            />
            <Input
              label="Coupon Code"
              required
              placeholder="e.g. SAVE20"
              value={discountForm.code}
              onChange={(e) =>
                setDiscountForm({ ...discountForm, code: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Discount Type"
              required
              value={discountForm.discountType}
              onChange={(e) =>
                setDiscountForm({
                  ...discountForm,
                  discountType: e.target.value,
                })
              }
              options={[
                { label: 'Percentage (%)', value: 'percentage' },
                { label: 'Fixed Amount (INR)', value: 'fixed' },
              ]}
            />
            <Input
              label="Discount Value"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder={discountForm.discountType === 'percentage' ? '15' : '500'}
              value={discountForm.discountValue}
              onChange={(e) =>
                setDiscountForm({
                  ...discountForm,
                  discountValue: e.target.value,
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimum Purchase (INR)"
              type="number"
              min="0"
              value={discountForm.minimumPurchase}
              onChange={(e) =>
                setDiscountForm({
                  ...discountForm,
                  minimumPurchase: e.target.value,
                })
              }
            />
            <Input
              label="Usage Limit (Max Uses)"
              type="number"
              min="1"
              placeholder="Leave blank for unlimited"
              value={discountForm.usageLimit}
              onChange={(e) =>
                setDiscountForm({
                  ...discountForm,
                  usageLimit: e.target.value,
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={discountForm.startDate}
              onChange={(e) =>
                setDiscountForm({
                  ...discountForm,
                  startDate: e.target.value,
                })
              }
            />
            <Input
              label="End Date"
              type="date"
              required
              value={discountForm.endDate}
              onChange={(e) =>
                setDiscountForm({
                  ...discountForm,
                  endDate: e.target.value,
                })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingDiscount ? 'Save Changes' : 'Create Discount'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Discount Rule?"
        description="This will permanently delete this discount code from the database."
        isLoading={isDeleting}
        confirmLabel="Delete"
      />
    </div>
  )
}

export default DiscountsPage
