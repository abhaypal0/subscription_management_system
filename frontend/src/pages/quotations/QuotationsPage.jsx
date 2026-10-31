import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Plus,
  Search,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Repeat,
  FileText,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { quotationService } from '../../services/quotation.service'
import { subscriptionService } from '../../services/subscription.service'
import { productService } from '../../services/product.service'
import { planService } from '../../services/plan.service'
import { formatCurrency, formatDate } from '../../utils/formatters'
import PageHeader from '../../components/layout/PageHeader'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'

export const QuotationsPage = () => {
  const { user, role } = useSelector((state) => state.auth)
  const isStaffOrAdmin = ['admin', 'staff'].includes(role)
  const isCustomer = role === 'customer'

  const [quotations, setQuotations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Catalog data for creator
  const [productsList, setProductsList] = useState([])
  const [plansList, setPlansList] = useState([])

  // Create Quotation Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    customer: '',
    plan: '',
    validDays: 15,
    paymentTerms: 'Due on receipt',
    discountAmount: 0,
    notes: '',
    items: [],
  })
  const [isSubmittingQuotation, setIsSubmittingQuotation] = useState(false)

  // Details Modal
  const [selectedQuotation, setSelectedQuotation] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Convert to Subscription Modal
  const [convertToSubModal, setConvertToSubModal] = useState({
    isOpen: false,
    quotation: null,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    autoRenew: true,
    notes: '',
  })
  const [isConverting, setIsConverting] = useState(false)

  const loadQuotations = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      }
      const res = await quotationService.getQuotations(params)
      setQuotations(res.data || [])
      if (res.pagination) {
        setPagination(res.pagination)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch quotations')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter])

  // Load plans & products
  useEffect(() => {
    if (isStaffOrAdmin) {
      productService
        .getProducts({ isActive: 'true', limit: 100 })
        .then((res) => setProductsList(res.data || []))
        .catch(() => {})

      planService
        .getPlans({ isActive: 'true', limit: 100 })
        .then((res) => setPlansList(res.plans || []))
        .catch(() => {})
    }
  }, [isStaffOrAdmin])

  useEffect(() => {
    loadQuotations(1)
  }, [loadQuotations])

  // Open Create Modal
  const handleOpenCreate = () => {
    setCreateForm({
      customer: '',
      plan: plansList[0]?._id || '',
      validDays: 15,
      paymentTerms: 'Due on receipt',
      discountAmount: 0,
      notes: '',
      items: productsList[0]
        ? [{ product: productsList[0]._id, quantity: 1, unitPrice: productsList[0].salesPrice }]
        : [],
    })
    setIsCreateModalOpen(true)
  }

  // Handle Item Row changes
  const handleAddItemRow = () => {
    if (!productsList.length) return
    setCreateForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: productsList[0]._id,
          quantity: 1,
          unitPrice: productsList[0].salesPrice,
        },
      ],
    }))
  }

  const handleRemoveItemRow = (index) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }))
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...createForm.items]
    if (field === 'product') {
      const p = productsList.find((prod) => prod._id === value)
      updated[index] = {
        ...updated[index],
        product: value,
        unitPrice: p ? p.salesPrice : 0,
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setCreateForm((prev) => ({ ...prev, items: updated }))
  }

  // Save Quotation
  const handleSaveQuotation = async (e) => {
    e.preventDefault()
    if (!createForm.customer) {
      toast.error('Customer ID is required')
      return
    }
    if (!createForm.plan) {
      toast.error('Plan selection is required')
      return
    }
    if (!createForm.items.length) {
      toast.error('Add at least one product item to the quotation')
      return
    }

    setIsSubmittingQuotation(true)
    try {
      const payload = {
        customer: createForm.customer.trim(),
        plan: createForm.plan,
        items: createForm.items.map((i) => ({
          product: i.product,
          quantity: Number(i.quantity) || 1,
        })),
        validDays: Number(createForm.validDays) || 15,
        paymentTerms: createForm.paymentTerms,
        discountAmount: Number(createForm.discountAmount) || 0,
        notes: createForm.notes,
      }

      await quotationService.createQuotation(payload)
      toast.success('Quotation draft created successfully')
      setIsCreateModalOpen(false)
      loadQuotations(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quotation')
    } finally {
      setIsSubmittingQuotation(false)
    }
  }

  // Change Quotation Status
  const handleUpdateStatus = async (quotationId, newStatus) => {
    try {
      await quotationService.updateStatus(quotationId, newStatus)
      toast.success(`Quotation marked as ${newStatus}`)
      loadQuotations(pagination.page)
      if (selectedQuotation?._id === quotationId) {
        setIsDetailsModalOpen(false)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  // Open Convert to Subscription Modal
  const handleOpenConvert = (quotation) => {
    const start = new Date()
    const exp = new Date(start)
    exp.setDate(exp.getDate() + 30) // default 30 days

    setConvertToSubModal({
      isOpen: true,
      quotation,
      startDate: start.toISOString().split('T')[0],
      expiryDate: exp.toISOString().split('T')[0],
      autoRenew: true,
      notes: quotation.notes || '',
    })
  }

  // Execute Convert
  const handleExecuteConvert = async (e) => {
    e.preventDefault()
    if (!convertToSubModal.quotation) return

    setIsConverting(true)
    try {
      await subscriptionService.createSubscription({
        quotationId: convertToSubModal.quotation._id,
        startDate: convertToSubModal.startDate,
        expiryDate: convertToSubModal.expiryDate,
        autoRenew: convertToSubModal.autoRenew,
        notes: convertToSubModal.notes,
      })
      toast.success('Converted quotation into an active subscription!')
      setConvertToSubModal({ isOpen: false, quotation: null })
      loadQuotations(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to convert quotation')
    } finally {
      setIsConverting(false)
    }
  }

  const columns = [
    {
      header: 'Quotation Number',
      key: 'quotationNumber',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block font-mono">
            {row.quotationNumber}
          </span>
          <span className="text-xs text-slate-400">
            Created {formatDate(row.quotationDate || row.createdAt)}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer',
      key: 'customer',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-900 block">
            {row.customer?.fullName || row.customer?.fullname || 'Customer'}
          </span>
          <span className="text-xs text-slate-500">{row.customer?.email}</span>
        </div>
      ),
    },
    {
      header: 'Plan',
      key: 'plan',
      render: (row) => (
        <span className="text-slate-800 font-medium">
          {row.plan?.name || 'Standard Plan'}
        </span>
      ),
    },
    {
      header: 'Total Amount',
      key: 'totalAmount',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">
            {formatCurrency(row.totalAmount)}
          </span>
          {row.discountAmount > 0 && (
            <span className="text-[11px] text-emerald-600">
              Disc: -{formatCurrency(row.discountAmount)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <Badge status={row.status} size="xs" />,
    },
    {
      header: 'Expiry Date',
      key: 'expiryDate',
      render: (row) => (
        <span className="text-xs text-slate-500">{formatDate(row.expiryDate)}</span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedQuotation(row)
              setIsDetailsModalOpen(true)
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Staff actions */}
          {isStaffOrAdmin && row.status === 'draft' && (
            <button
              type="button"
              onClick={() => handleUpdateStatus(row._id, 'quotation')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              title="Send to Customer"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          )}

          {/* Staff convert to subscription action */}
          {isStaffOrAdmin && row.status === 'confirmed' && (
            <button
              type="button"
              onClick={() => handleOpenConvert(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
              title="Convert to Subscription"
            >
              <Repeat className="w-3.5 h-3.5" />
              Convert
            </button>
          )}

          {/* Customer approval actions */}
          {isCustomer && row.status === 'quotation' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleUpdateStatus(row._id, 'confirmed')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Confirm
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(row._id, 'rejected')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? 'My Quotations' : 'Quotations Management'}
        description="Formal price quotes, customer approvals, and conversion to active recurring subscriptions."
        breadcrumbs={['Operations', 'Quotations']}
        action={
          isStaffOrAdmin && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              New Quotation
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Search quotations by number..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Draft', value: 'draft' },
              { label: 'Quotation (Sent)', value: 'quotation' },
              { label: 'Confirmed', value: 'confirmed' },
              { label: 'Converted', value: 'converted' },
              { label: 'Rejected', value: 'rejected' },
              { label: 'Expired', value: 'expired' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={quotations}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => loadQuotations(page)}
        emptyTitle="No quotations found"
        emptyDescription="Create formal quotations to propose pricing plans and services to customers."
        emptyActionLabel={isStaffOrAdmin ? 'Create First Quotation' : undefined}
        onEmptyAction={isStaffOrAdmin ? handleOpenCreate : undefined}
      />

      {/* Create Quotation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate New Quotation"
        subtitle="Add line items, discount, terms, and customer details."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveQuotation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer User ID (MongoDB ObjectId)"
              required
              placeholder="e.g. 660f1b2c4e5a9d8..."
              value={createForm.customer}
              onChange={(e) =>
                setCreateForm({ ...createForm, customer: e.target.value })
              }
            />

            <Select
              label="Subscription Plan"
              required
              value={createForm.plan}
              onChange={(e) =>
                setCreateForm({ ...createForm, plan: e.target.value })
              }
            >
              {plansList.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({formatCurrency(p.price)}/{p.billingCycle})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Valid Days"
              type="number"
              min="1"
              value={createForm.validDays}
              onChange={(e) =>
                setCreateForm({ ...createForm, validDays: e.target.value })
              }
            />
            <Input
              label="Payment Terms"
              value={createForm.paymentTerms}
              onChange={(e) =>
                setCreateForm({ ...createForm, paymentTerms: e.target.value })
              }
            />
            <Input
              label="Discount Amount (INR)"
              type="number"
              min="0"
              step="0.01"
              value={createForm.discountAmount}
              onChange={(e) =>
                setCreateForm({ ...createForm, discountAmount: e.target.value })
              }
            />
          </div>

          {/* Line items section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Products & Services Included
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {createForm.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="flex-1">
                    <Select
                      value={item.product}
                      onChange={(e) =>
                        handleItemChange(idx, 'product', e.target.value)
                      }
                    >
                      {productsList.map((prod) => (
                        <option key={prod._id} value={prod._id}>
                          {prod.name} ({formatCurrency(prod.salesPrice)})
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(idx, 'quantity', e.target.value)
                      }
                    />
                  </div>
                  {createForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      className="p-2 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Special Notes / Terms
            </label>
            <textarea
              rows="2"
              placeholder="Terms, deliverables, or customer instructions..."
              className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              value={createForm.notes}
              onChange={(e) =>
                setCreateForm({ ...createForm, notes: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingQuotation}
            >
              Generate Draft
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quotation Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Quotation: ${selectedQuotation?.quotationNumber || ''}`}
        subtitle="Review quotation items and terms."
        maxWidth="max-w-xl"
      >
        {selectedQuotation && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-400 block">Customer</span>
                <span className="font-semibold text-slate-900">
                  {selectedQuotation.customer?.fullName || selectedQuotation.customer?.fullname || 'Customer'}
                </span>
                <span className="text-xs text-slate-500 block">
                  {selectedQuotation.customer?.email}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Status & Expiry</span>
                <Badge status={selectedQuotation.status} size="xs" />
                <span className="text-xs text-slate-500 block mt-1">
                  Valid until: {formatDate(selectedQuotation.expiryDate)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Quoted Items ({selectedQuotation.items?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {selectedQuotation.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800">
                        {item.product?.name || 'Product'}
                      </span>
                      <span className="text-xs text-slate-400 block">
                        Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-right">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedQuotation.subtotal)}</span>
              </div>
              {selectedQuotation.discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(selectedQuotation.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
                <span>Total Amount:</span>
                <span>{formatCurrency(selectedQuotation.totalAmount)}</span>
              </div>
            </div>

            {selectedQuotation.notes && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-800">
                <span className="font-semibold block mb-0.5">Notes:</span>
                {selectedQuotation.notes}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Convert to Subscription Modal */}
      <Modal
        isOpen={convertToSubModal.isOpen}
        onClose={() => setConvertToSubModal({ isOpen: false, quotation: null })}
        title="Convert Quotation to Subscription"
        subtitle={`Generate active subscription for ${convertToSubModal.quotation?.quotationNumber || ''}.`}
      >
        <form onSubmit={handleExecuteConvert} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={convertToSubModal.startDate}
              onChange={(e) =>
                setConvertToSubModal({
                  ...convertToSubModal,
                  startDate: e.target.value,
                })
              }
            />
            <Input
              label="Expiry Date"
              type="date"
              required
              value={convertToSubModal.expiryDate}
              onChange={(e) =>
                setConvertToSubModal({
                  ...convertToSubModal,
                  expiryDate: e.target.value,
                })
              }
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={convertToSubModal.autoRenew}
              onChange={(e) =>
                setConvertToSubModal({
                  ...convertToSubModal,
                  autoRenew: e.target.checked,
                })
              }
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Enable Auto-Renew at expiration</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() =>
                setConvertToSubModal({ isOpen: false, quotation: null })
              }
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isConverting}>
              Generate Subscription
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default QuotationsPage
