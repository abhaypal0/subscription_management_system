import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Search, Eye, CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { paymentService } from '../../services/payment.service'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'
import PageHeader from '../../components/layout/PageHeader'
import Table from '../../components/common/Table'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'

export const PaymentsPage = () => {
  const { role } = useSelector((state) => state.auth)
  const isCustomer = role === 'customer'

  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')

  // Details Modal
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const loadPayments = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        status: statusFilter || undefined,
        paymentMethod: methodFilter || undefined,
      }
      const res = await paymentService.getPayments(params)
      setPayments(res.data || [])
      if (res.pagination) {
        setPagination(res.pagination)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch payments')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, methodFilter])

  useEffect(() => {
    loadPayments(1)
  }, [loadPayments])

  const columns = [
    {
      header: 'Payment #',
      key: 'paymentNumber',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block font-mono">
            {row.paymentNumber}
          </span>
          <span className="text-xs text-slate-400">
            {formatDateTime(row.paymentDate || row.createdAt)}
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
      header: 'Invoice #',
      key: 'invoice',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">
          {row.invoice?.invoiceNumber || 'Direct Payment'}
        </span>
      ),
    },
    {
      header: 'Amount',
      key: 'amount',
      render: (row) => (
        <span className="font-bold text-slate-900">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      header: 'Method',
      key: 'paymentMethod',
      render: (row) => (
        <span className="text-xs font-semibold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {row.paymentMethod}
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
        <button
          type="button"
          onClick={() => {
            setSelectedPayment(row)
            setIsDetailsModalOpen(true)
          }}
          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
          title="View Transaction Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? 'My Payment History' : 'Payment Transactions'}
        description="Audit ledger of all automated and gateway billing transactions."
        breadcrumbs={['Operations', 'Payments']}
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-48">
          <Select
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Completed', value: 'completed' },
              { label: 'Pending', value: 'pending' },
              { label: 'Failed', value: 'failed' },
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            placeholder="All Methods"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            options={[
              { label: 'All Methods', value: '' },
              { label: 'Razorpay', value: 'razorpay' },
              { label: 'Bank Transfer', value: 'bank_transfer' },
              { label: 'Cash', value: 'cash' },
            ]}
          />
        </div>
      </div>

      {/* Payments Table */}
      <Table
        columns={columns}
        data={payments}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => loadPayments(page)}
        emptyTitle="No payments found"
        emptyDescription="Transactions will appear here when customers complete invoice checkouts."
      />

      {/* Transaction Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Transaction Details"
        subtitle={selectedPayment?.paymentNumber}
        maxWidth="max-w-md"
      >
        {selectedPayment && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Payment Status:</span>
                <Badge status={selectedPayment.status} size="xs" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Amount:</span>
                <span className="text-base font-bold text-slate-900">
                  {formatCurrency(selectedPayment.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="font-semibold uppercase text-slate-800">
                  {selectedPayment.paymentMethod}
                </span>
              </div>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-xl p-3.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-medium text-slate-900">
                  {selectedPayment.customer?.fullName || selectedPayment.customer?.fullname || 'Customer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-700">
                  {selectedPayment.customer?.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Ref:</span>
                <span className="font-mono text-slate-800">
                  {selectedPayment.invoice?.invoiceNumber || selectedPayment.invoice || 'Direct'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono text-slate-600 truncate max-w-[180px]">
                  {selectedPayment.razorpayOrderId || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono text-slate-600 truncate max-w-[180px]">
                  {selectedPayment.transactionId || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-700">
                  {formatDateTime(selectedPayment.paymentDate || selectedPayment.createdAt)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PaymentsPage
