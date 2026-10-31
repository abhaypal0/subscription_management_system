import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Search,
  Eye,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  Receipt,
  Repeat,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { subscriptionService } from '../../services/subscription.service'
import { invoiceService } from '../../services/invoice.service'
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

export const SubscriptionsPage = () => {
  const { role } = useSelector((state) => state.auth)
  const isStaffOrAdmin = ['admin', 'staff'].includes(role)
  const isCustomer = role === 'customer'

  const [subscriptions, setSubscriptions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cycleFilter, setCycleFilter] = useState('')

  // Details Modal
  const [selectedSub, setSelectedSub] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Action Dialogs
  const [actionDialog, setActionDialog] = useState({
    isOpen: false,
    type: null, // activate | pause | resume | close | generateInvoice
    subscriptionId: null,
    subNumber: '',
  })
  const [isPerformingAction, setIsPerformingAction] = useState(false)

  const loadSubscriptions = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        billingCycle: cycleFilter || undefined,
      }
      const res = await subscriptionService.getSubscriptions(params)
      setSubscriptions(res.data || [])
      if (res.pagination) {
        setPagination(res.pagination)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch subscriptions')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, cycleFilter])

  useEffect(() => {
    loadSubscriptions(1)
  }, [loadSubscriptions])

  // Execute lifecycle action
  const handleExecuteAction = async () => {
    const { type, subscriptionId } = actionDialog
    if (!subscriptionId) return

    setIsPerformingAction(true)
    try {
      if (type === 'activate') {
        await subscriptionService.activateSubscription(subscriptionId)
        toast.success('Subscription activated successfully')
      } else if (type === 'pause') {
        await subscriptionService.pauseSubscription(subscriptionId)
        toast.success('Subscription paused')
      } else if (type === 'resume') {
        await subscriptionService.resumeSubscription(subscriptionId)
        toast.success('Subscription resumed')
      } else if (type === 'close') {
        await subscriptionService.closeSubscription(subscriptionId)
        toast.success('Subscription cancelled and closed')
      } else if (type === 'generateInvoice') {
        await invoiceService.generateInvoice(subscriptionId)
        toast.success('Billing invoice generated successfully')
      }

      setActionDialog({ isOpen: false, type: null, subscriptionId: null })
      loadSubscriptions(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setIsPerformingAction(false)
    }
  }

  const columns = [
    {
      header: 'Subscription #',
      key: 'subscriptionNumber',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block font-mono">
            {row.subscriptionNumber}
          </span>
          <span className="text-xs text-slate-400 capitalize">
            Cycle: {row.billingCycle}
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
      header: 'Plan Tier',
      key: 'plan',
      render: (row) => (
        <span className="font-medium text-slate-800">
          {row.plan?.name || 'Subscription Tier'}
        </span>
      ),
    },
    {
      header: 'Recurring Amount',
      key: 'totalAmount',
      render: (row) => (
        <span className="font-bold text-slate-900">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      header: 'Next Billing',
      key: 'nextBillingDate',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.nextBillingDate ? formatDate(row.nextBillingDate) : 'Not scheduled'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <Badge status={row.status} size="xs" />,
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedSub(row)
              setIsDetailsModalOpen(true)
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {isStaffOrAdmin && (
            <>
              {/* Activate */}
              {row.status === 'confirmed' && (
                <button
                  type="button"
                  onClick={() =>
                    setActionDialog({
                      isOpen: true,
                      type: 'activate',
                      subscriptionId: row._id,
                      subNumber: row.subscriptionNumber,
                    })
                  }
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="Activate Subscription"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}

              {/* Pause */}
              {row.status === 'active' && (
                <button
                  type="button"
                  onClick={() =>
                    setActionDialog({
                      isOpen: true,
                      type: 'pause',
                      subscriptionId: row._id,
                      subNumber: row.subscriptionNumber,
                    })
                  }
                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                  title="Pause Subscription"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}

              {/* Resume */}
              {row.status === 'paused' && (
                <button
                  type="button"
                  onClick={() =>
                    setActionDialog({
                      isOpen: true,
                      type: 'resume',
                      subscriptionId: row._id,
                      subNumber: row.subscriptionNumber,
                    })
                  }
                  className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Resume Subscription"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* Generate scheduled invoice */}
              {row.status === 'active' && (
                <button
                  type="button"
                  onClick={() =>
                    setActionDialog({
                      isOpen: true,
                      type: 'generateInvoice',
                      subscriptionId: row._id,
                      subNumber: row.subscriptionNumber,
                    })
                  }
                  className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                  title="Generate Invoice for Billing Period"
                >
                  <Receipt className="w-4 h-4" />
                </button>
              )}

              {/* Close */}
              {['active', 'paused'].includes(row.status) && (
                <button
                  type="button"
                  onClick={() =>
                    setActionDialog({
                      isOpen: true,
                      type: 'close',
                      subscriptionId: row._id,
                      subNumber: row.subscriptionNumber,
                    })
                  }
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                  title="Close / Cancel Subscription"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ]

  const getActionDialogTitle = () => {
    switch (actionDialog.type) {
      case 'activate':
        return `Activate Subscription ${actionDialog.subNumber}?`
      case 'pause':
        return `Pause Subscription ${actionDialog.subNumber}?`
      case 'resume':
        return `Resume Subscription ${actionDialog.subNumber}?`
      case 'close':
        return `Close / Cancel Subscription ${actionDialog.subNumber}?`
      case 'generateInvoice':
        return `Generate Invoice for ${actionDialog.subNumber}?`
      default:
        return 'Confirm Action'
    }
  }

  const getActionDialogDescription = () => {
    switch (actionDialog.type) {
      case 'activate':
        return 'This will transition the subscription to active status and schedule the next recurring billing date.'
      case 'pause':
        return 'The customer will not be billed while this subscription is paused.'
      case 'resume':
        return 'This will re-activate recurring billing for this subscription.'
      case 'close':
        return 'This will immediately terminate recurring renewals. This action cannot be reversed.'
      case 'generateInvoice':
        return 'This will generate an official invoice in confirmed status and advance the next scheduled billing date.'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? 'My Subscriptions' : 'Subscriptions Management'}
        description="Monitor active recurring contracts, billing schedules, and customer status."
        breadcrumbs={['Operations', 'Subscriptions']}
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Search subscriptions by number..."
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
              { label: 'Confirmed', value: 'confirmed' },
              { label: 'Active', value: 'active' },
              { label: 'Paused', value: 'paused' },
              { label: 'Closed', value: 'closed' },
            ]}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            placeholder="All Cycles"
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            options={[
              { label: 'All Cycles', value: '' },
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly', value: 'yearly' },
            ]}
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <Table
        columns={columns}
        data={subscriptions}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => loadSubscriptions(page)}
        emptyTitle="No subscriptions found"
        emptyDescription="Convert confirmed quotations into active subscriptions to begin billing."
      />

      {/* Subscription Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Subscription: ${selectedSub?.subscriptionNumber || ''}`}
        subtitle="Full recurring schedule and line item configuration."
        maxWidth="max-w-xl"
      >
        {selectedSub && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-400 block">Customer</span>
                <span className="font-semibold text-slate-900">
                  {selectedSub.customer?.fullName || selectedSub.customer?.fullname || 'Customer'}
                </span>
                <span className="text-xs text-slate-500 block">
                  {selectedSub.customer?.email}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Status & Cycle</span>
                <Badge status={selectedSub.status} size="xs" />
                <span className="text-xs text-slate-600 block mt-1 capitalize font-medium">
                  {selectedSub.billingCycle} billing ({selectedSub.autoRenew ? 'Auto-renews' : 'Manual'})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-slate-200 text-center text-xs">
              <div>
                <span className="text-slate-400 block">Start Date</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(selectedSub.startDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Expiry Date</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(selectedSub.expiryDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Next Billing</span>
                <span className="font-semibold text-indigo-600">
                  {selectedSub.nextBillingDate ? formatDate(selectedSub.nextBillingDate) : 'None'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Subscribed Products & Services ({selectedSub.items?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {selectedSub.items?.map((item, idx) => (
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

            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Recurring:</span>
              <span>{formatCurrency(selectedSub.totalAmount)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Dialog for Actions */}
      <ConfirmDialog
        isOpen={actionDialog.isOpen}
        onClose={() =>
          setActionDialog({ isOpen: false, type: null, subscriptionId: null })
        }
        onConfirm={handleExecuteAction}
        title={getActionDialogTitle()}
        description={getActionDialogDescription()}
        confirmVariant={actionDialog.type === 'close' ? 'danger' : 'primary'}
        isLoading={isPerformingAction}
        confirmLabel="Proceed"
      />
    </div>
  )
}

export default SubscriptionsPage
