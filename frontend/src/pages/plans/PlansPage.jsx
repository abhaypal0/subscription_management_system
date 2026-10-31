import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Plus, Search, Edit2, Trash2, Layers, Calendar, Check, X } from 'lucide-react'
import { planService } from '../../services/plan.service'
import { productService } from '../../services/product.service'
import { formatCurrency, formatDate } from '../../utils/formatters'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import toast from 'react-hot-toast'

export const PlansPage = () => {
  const { role } = useSelector((state) => state.auth)
  const isStaffOrAdmin = ['admin', 'staff'].includes(role)
  const isAdmin = role === 'admin'

  const [plans, setPlans] = useState([])
  const [productsList, setProductsList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [billingCycleFilter, setBillingCycleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')

  // Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    product: '',
    description: '',
    price: '',
    billingCycle: 'monthly',
    minQuantity: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    allowEarlyClosure: true,
    allowPause: true,
    allowRenewal: true,
    autoClose: false,
  })
  const [isSavingPlan, setIsSavingPlan] = useState(false)

  // Delete Plan Dialog
  const [deletingPlanId, setDeletingPlanId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch plans
  const loadPlans = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        limit: 50,
        search: search.trim() || undefined,
        billingCycle: billingCycleFilter || undefined,
        isActive: activeFilter !== '' ? activeFilter : undefined,
      }
      const res = await planService.getPlans(params)
      setPlans(res.plans || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch plans')
    } finally {
      setIsLoading(false)
    }
  }, [search, billingCycleFilter, activeFilter])

  // Fetch active products for plan creation
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getProducts({ isActive: 'true', limit: 100 })
        setProductsList(res.data || [])
      } catch (err) {
        console.error('Failed to load products for plan selector', err)
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPlan(null)
    setPlanForm({
      name: '',
      product: productsList[0]?._id || '',
      description: '',
      price: '',
      billingCycle: 'monthly',
      minQuantity: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      autoClose: false,
    })
    setIsPlanModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (plan) => {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name || '',
      product: plan.product?._id || plan.product || '',
      description: plan.description || '',
      price: plan.price || '',
      billingCycle: plan.billingCycle || 'monthly',
      minQuantity: plan.minQuantity || 1,
      startDate: plan.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : '',
      endDate: plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '',
      allowEarlyClosure: plan.allowEarlyClosure ?? true,
      allowPause: plan.allowPause ?? true,
      allowRenewal: plan.allowRenewal ?? true,
      autoClose: plan.autoClose ?? false,
      isActive: plan.isActive ?? true,
    })
    setIsPlanModalOpen(true)
  }

  // Save Plan
  const handleSavePlan = async (e) => {
    e.preventDefault()
    if (!planForm.product) {
      toast.error('Please select an associated product')
      return
    }

    setIsSavingPlan(true)
    try {
      const payload = {
        name: planForm.name,
        product: planForm.product,
        description: planForm.description,
        price: Number(planForm.price),
        billingCycle: planForm.billingCycle,
        minQuantity: Number(planForm.minQuantity) || 1,
        startDate: planForm.startDate,
        endDate: planForm.endDate || undefined,
        allowEarlyClosure: planForm.allowEarlyClosure,
        allowPause: planForm.allowPause,
        allowRenewal: planForm.allowRenewal,
        autoClose: planForm.autoClose,
      }

      if (editingPlan) {
        payload.isActive = planForm.isActive
        await planService.updatePlan(editingPlan._id, payload)
        toast.success('Plan updated successfully')
      } else {
        await planService.createPlan(payload)
        toast.success('Plan created successfully')
      }
      setIsPlanModalOpen(false)
      loadPlans()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan')
    } finally {
      setIsSavingPlan(false)
    }
  }

  // Delete Plan
  const handleConfirmDelete = async () => {
    if (!deletingPlanId) return
    setIsDeleting(true)
    try {
      await planService.deletePlan(deletingPlanId)
      toast.success('Plan deactivated successfully')
      setDeletingPlanId(null)
      loadPlans()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate plan')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        description="Configure recurring pricing schedules and tier benefits."
        breadcrumbs={['Catalog', 'Plans']}
        action={
          isStaffOrAdmin && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleOpenCreate}
            >
              Create Plan
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Search plans by name..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            placeholder="All Billing Cycles"
            value={billingCycleFilter}
            onChange={(e) => setBillingCycleFilter(e.target.value)}
            options={[
              { label: 'All Billing Cycles', value: '' },
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly', value: 'yearly' },
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

      {/* Plans Grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading subscription plans..." />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No plans configured"
          description="Create recurring plans to attach to customer quotations and subscriptions."
          actionLabel={isStaffOrAdmin ? 'Create First Plan' : undefined}
          onAction={isStaffOrAdmin ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {plan.name}
                  </h3>
                  <Badge status={plan.isActive ? 'active' : 'closed'} size="xs">
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-3">
                  Product: {plan.product?.name || 'General Service'}
                </p>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {plan.description || 'No description provided.'}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-1 mt-2 mb-4">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 capitalize">
                    /{plan.billingCycle}
                  </span>
                </div>

                {/* Rules & Flags Checklist */}
                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    {plan.allowPause ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300" />
                    )}
                    <span>Allows Pause & Resume</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.allowRenewal ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300" />
                    )}
                    <span>Auto-renewal Eligible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.allowEarlyClosure ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300" />
                    )}
                    <span>Early Cancellation Allowed</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              {isStaffOrAdmin && (
                <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Created {formatDate(plan.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(plan)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 transition-colors"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && plan.isActive && (
                      <button
                        type="button"
                        onClick={() => setDeletingPlanId(plan._id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-100/60 transition-colors"
                        title="Deactivate Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? 'Edit Plan' : 'Create Subscription Plan'}
        subtitle="Set up recurring pricing cycle, associated product, and terms."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <Input
            label="Plan Name"
            required
            placeholder="e.g. Pro Monthly Tier"
            value={planForm.name}
            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Associated Product"
              required
              value={planForm.product}
              onChange={(e) =>
                setPlanForm({ ...planForm, product: e.target.value })
              }
            >
              {productsList.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({formatCurrency(p.salesPrice)})
                </option>
              ))}
            </Select>

            <Select
              label="Billing Cycle"
              required
              value={planForm.billingCycle}
              onChange={(e) =>
                setPlanForm({ ...planForm, billingCycle: e.target.value })
              }
              options={[
                { label: 'Daily', value: 'daily' },
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
                { label: 'Yearly', value: 'yearly' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Price (INR)"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              value={planForm.price}
              onChange={(e) =>
                setPlanForm({ ...planForm, price: e.target.value })
              }
            />

            <Input
              label="Minimum Quantity"
              type="number"
              min="1"
              value={planForm.minQuantity}
              onChange={(e) =>
                setPlanForm({ ...planForm, minQuantity: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={planForm.startDate}
              onChange={(e) =>
                setPlanForm({ ...planForm, startDate: e.target.value })
              }
            />

            <Input
              label="End Date (Optional)"
              type="date"
              value={planForm.endDate}
              onChange={(e) =>
                setPlanForm({ ...planForm, endDate: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Plan Description
            </label>
            <textarea
              rows="2"
              placeholder="Features, service level agreement, or highlights..."
              className="block w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              value={planForm.description}
              onChange={(e) =>
                setPlanForm({ ...planForm, description: e.target.value })
              }
            />
          </div>

          {/* Feature flags */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Subscription Permissions:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planForm.allowPause}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, allowPause: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Allow Pause & Resume</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planForm.allowRenewal}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, allowRenewal: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Allow Auto Renewal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planForm.allowEarlyClosure}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      allowEarlyClosure: e.target.checked,
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Allow Early Closure</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planForm.autoClose}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, autoClose: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Auto-Close on Expiry</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingPlan}>
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Plan Confirm */}
      <ConfirmDialog
        isOpen={!!deletingPlanId}
        onClose={() => setDeletingPlanId(null)}
        onConfirm={handleConfirmDelete}
        title="Deactivate Plan?"
        description="This will prevent new quotations or subscriptions from selecting this plan."
        isLoading={isDeleting}
        confirmLabel="Deactivate"
      />
    </div>
  )
}

export default PlansPage
