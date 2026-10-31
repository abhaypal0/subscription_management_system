import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Plus, Search, Edit2, Trash2, Percent } from 'lucide-react'
import { taxService } from '../../services/tax.service'
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

export const TaxesPage = () => {
  const { role } = useSelector((state) => state.auth)
  const isStaffOrAdmin = ['admin', 'staff'].includes(role)
  const isAdmin = role === 'admin'

  const [taxes, setTaxes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTax, setEditingTax] = useState(null)
  const [taxForm, setTaxForm] = useState({
    name: '',
    taxType: 'percentage',
    rate: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Delete Dialog
  const [deletingId, setDeletingId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadTaxes = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        taxType: typeFilter || undefined,
      }
      const res = await taxService.getTaxes(params)
      setTaxes(res.taxes || [])
      setPagination({
        page: res.currentPage || 1,
        totalPages: res.totalPages || 1,
        total: res.totalTaxes || 0,
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch tax rates')
    } finally {
      setIsLoading(false)
    }
  }, [search, typeFilter])

  useEffect(() => {
    loadTaxes(1)
  }, [loadTaxes])

  const handleOpenCreate = () => {
    setEditingTax(null)
    setTaxForm({
      name: '',
      taxType: 'percentage',
      rate: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (tax) => {
    setEditingTax(tax)
    setTaxForm({
      name: tax.name || '',
      taxType: tax.taxType || 'percentage',
      rate: tax.rate || '',
      description: tax.description || '',
      startDate: tax.startDate ? new Date(tax.startDate).toISOString().split('T')[0] : '',
      endDate: tax.endDate ? new Date(tax.endDate).toISOString().split('T')[0] : '',
      isActive: tax.isActive ?? true,
    })
    setIsModalOpen(true)
  }

  const handleSaveTax = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const payload = {
        name: taxForm.name,
        taxType: taxForm.taxType,
        rate: Number(taxForm.rate),
        description: taxForm.description,
        startDate: taxForm.startDate,
        endDate: taxForm.endDate || undefined,
      }

      if (editingTax) {
        payload.isActive = taxForm.isActive
        await taxService.updateTax(editingTax._id, payload)
        toast.success('Tax rate updated')
      } else {
        await taxService.createTax(payload)
        toast.success('Tax rate created')
      }
      setIsModalOpen(false)
      loadTaxes(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save tax rate')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      await taxService.deleteTax(deletingId)
      toast.success('Tax rate deleted')
      setDeletingId(null)
      loadTaxes(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete tax rate')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = [
    {
      header: 'Tax Name',
      key: 'name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.name}</span>
          <span className="text-xs text-slate-400 capitalize">{row.taxType}</span>
        </div>
      ),
    },
    {
      header: 'Rate',
      key: 'rate',
      render: (row) => (
        <span className="font-bold text-slate-900">
          {row.taxType === 'percentage'
            ? `${row.rate}%`
            : formatCurrency(row.rate)}
        </span>
      ),
    },
    {
      header: 'Effective Dates',
      key: 'dates',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {formatDate(row.startDate)} {row.endDate ? `to ${formatDate(row.endDate)}` : '(Ongoing)'}
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
                  title="Edit Tax"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setDeletingId(row._id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Tax"
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
        title="Tax Rates & Rules"
        description="Configure applicable sales tax, VAT, or GST rates applied to invoice line items."
        breadcrumbs={['Billing & Rules', 'Tax Rates']}
        action={
          isStaffOrAdmin && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              Add Tax Rate
            </Button>
          )
        }
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Search taxes by name..."
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
              { label: 'Percentage', value: 'percentage' },
              { label: 'Fixed Amount', value: 'fixed' },
            ]}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={taxes}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => loadTaxes(page)}
        emptyTitle="No tax rules found"
        emptyDescription="Create tax definitions to apply statutory rates to subscriptions and quotations."
        emptyActionLabel={isStaffOrAdmin ? 'Add First Tax Rate' : undefined}
        onEmptyAction={isStaffOrAdmin ? handleOpenCreate : undefined}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTax ? 'Edit Tax Rate' : 'Add New Tax Rate'}
        subtitle="Define statutory tax percentage or flat levy."
      >
        <form onSubmit={handleSaveTax} className="space-y-4">
          <Input
            label="Tax Name"
            required
            placeholder="e.g. Standard GST 18%"
            value={taxForm.name}
            onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tax Type"
              required
              value={taxForm.taxType}
              onChange={(e) => setTaxForm({ ...taxForm, taxType: e.target.value })}
              options={[
                { label: 'Percentage (%)', value: 'percentage' },
                { label: 'Fixed Amount (INR)', value: 'fixed' },
              ]}
            />
            <Input
              label="Rate / Value"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder={taxForm.taxType === 'percentage' ? '18' : '50'}
              value={taxForm.rate}
              onChange={(e) => setTaxForm({ ...taxForm, rate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={taxForm.startDate}
              onChange={(e) => setTaxForm({ ...taxForm, startDate: e.target.value })}
            />
            <Input
              label="End Date (Optional)"
              type="date"
              value={taxForm.endDate}
              onChange={(e) => setTaxForm({ ...taxForm, endDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              rows="2"
              placeholder="Regulatory description or invoice notes..."
              className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              value={taxForm.description}
              onChange={(e) => setTaxForm({ ...taxForm, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingTax ? 'Save Changes' : 'Create Tax Rate'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Tax Rate?"
        description="This will permanently delete this tax rate definition from the system."
        isLoading={isDeleting}
        confirmLabel="Delete"
      />
    </div>
  )
}

export default TaxesPage
