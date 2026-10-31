import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import {
  Search,
  Eye,
  CheckCircle,
  Send,
  XCircle,
  CreditCard,
  Printer,
  Receipt,
  FileCheck,
  AlertCircle,
} from 'lucide-react'
import { invoiceService } from '../../services/invoice.service'
import { paymentService } from '../../services/payment.service'
import { loadRazorpayScript } from '../../utils/razorpay'
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

export const InvoicesPage = () => {
  const { user, role } = useSelector((state) => state.auth)
  const isStaffOrAdmin = ['admin', 'staff'].includes(role)
  const isCustomer = role === 'customer'

  const [invoices, setInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')

  // View / Print Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const printableRef = useRef(null)

  // Razorpay Checkout State
  const [isPaying, setIsPaying] = useState(false)

  // Action Dialogs (Confirm, Send, Cancel)
  const [actionDialog, setActionDialog] = useState({
    isOpen: false,
    type: null, // confirm | send | cancel
    invoiceId: null,
    invoiceNumber: '',
  })
  const [isPerformingAction, setIsPerformingAction] = useState(false)

  const loadInvoices = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
      }
      const res = await invoiceService.getInvoices(params)
      setInvoices(res.data || [])
      if (res.pagination) {
        setPagination(res.pagination)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch invoices')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, paymentStatusFilter])

  useEffect(() => {
    loadInvoices(1)
  }, [loadInvoices])

  // Handle Razorpay Payment Checkout
  const handlePayInvoice = async (invoice) => {
    if (invoice.status !== 'confirmed') {
      toast.error('Only confirmed invoices can be paid.')
      return
    }

    if (invoice.dueAmount <= 0) {
      toast.success('Invoice is already fully paid.')
      return
    }

    setIsPaying(true)
    try {
      // 1. Load Razorpay SDK
      const isScriptLoaded = await loadRazorpayScript()
      if (!isScriptLoaded) {
        toast.error('Razorpay SDK failed to load. Are you online?')
        setIsPaying(false)
        return
      }

      // 2. Create Order on backend
      const orderRes = await paymentService.createOrder(invoice._id)
      const { razorpayOrderId, amount, currency, razorpayKey } = orderRes.data

      // 3. Configure Razorpay checkout options
      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency || 'INR',
        name: 'FLUX Subscriptions',
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.fullname || '',
          email: user?.email || '',
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async (response) => {
          try {
            // 4. Verify payment on server
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success('Payment verified successfully! Invoice is paid.')
            loadInvoices(pagination.page)
            if (selectedInvoice?._id === invoice._id) {
              setIsInvoiceModalOpen(false)
            }
          } catch (verifyErr) {
            toast.error(
              verifyErr.response?.data?.message || 'Payment verification failed'
            )
          }
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (failedRes) => {
        toast.error(`Payment failed: ${failedRes.error.description}`)
      })
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment')
    } finally {
      setIsPaying(false)
    }
  }

  // Handle Invoice Status Changes (Confirm, Send, Cancel)
  const handleExecuteAction = async () => {
    const { type, invoiceId } = actionDialog
    if (!invoiceId) return

    setIsPerformingAction(true)
    try {
      if (type === 'confirm') {
        await invoiceService.confirmInvoice(invoiceId)
        toast.success('Invoice confirmed')
      } else if (type === 'send') {
        await invoiceService.sendInvoice(invoiceId)
        toast.success('Invoice marked as sent')
      } else if (type === 'cancel') {
        await invoiceService.cancelInvoice(invoiceId)
        toast.success('Invoice cancelled')
      }
      setActionDialog({ isOpen: false, type: null, invoiceId: null })
      loadInvoices(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setIsPerformingAction(false)
    }
  }

  // Print Invoice
  const handlePrint = () => {
    window.print()
  }

  const columns = [
    {
      header: 'Invoice #',
      key: 'invoiceNumber',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block font-mono">
            {row.invoiceNumber}
          </span>
          <span className="text-xs text-slate-400">
            Date: {formatDate(row.invoiceDate || row.createdAt)}
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
      header: 'Total / Due Amount',
      key: 'totalAmount',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">
            {formatCurrency(row.totalAmount)}
          </span>
          <span className="text-xs text-slate-500">
            Due: <span className={row.dueAmount > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>
              {formatCurrency(row.dueAmount)}
            </span>
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <Badge status={row.status} size="xs" />
          {row.isSent && (
            <span className="text-[10px] text-indigo-600 font-medium">
              Sent to customer
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Payment Status',
      key: 'paymentStatus',
      render: (row) => <Badge status={row.paymentStatus} size="xs" />,
    },
    {
      header: 'Due Date',
      key: 'dueDate',
      render: (row) => (
        <span className="text-xs text-slate-500">{formatDate(row.dueDate)}</span>
      ),
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
              setSelectedInvoice(row)
              setIsInvoiceModalOpen(true)
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            title="View & Print Invoice"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Pay Invoice (Customer action on confirmed invoice) */}
          {isCustomer && row.status === 'confirmed' && row.dueAmount > 0 && (
            <Button
              variant="primary"
              size="xs"
              onClick={() => handlePayInvoice(row)}
              isLoading={isPaying}
            >
              <CreditCard className="w-3.5 h-3.5 mr-1" />
              Pay Now
            </Button>
          )}

          {/* Staff controls */}
          {isStaffOrAdmin && (
            <>
              {row.status === 'draft' && (
                <button
                  type="button"
                  onClick={() =>
                    setActionDialog({
                      isOpen: true,
                      type: 'confirm',
                      invoiceId: row._id,
                      invoiceNumber: row.invoiceNumber,
                    })
                  }
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="Confirm Invoice"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}

              {row.status === 'confirmed' && !row.isSent && (
                <button
                  type="button"
                  onClick={() =>
                    setActionDialog({
                      isOpen: true,
                      type: 'send',
                      invoiceId: row._id,
                      invoiceNumber: row.invoiceNumber,
                    })
                  }
                  className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Mark as Sent"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}

              {['draft', 'confirmed'].includes(row.status) && row.paidAmount === 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setActionDialog({
                      isOpen: true,
                      type: 'cancel',
                      invoiceId: row._id,
                      invoiceNumber: row.invoiceNumber,
                    })
                  }
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                  title="Cancel Invoice"
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? 'My Invoices' : 'Invoices & Billing'}
        description="Track issued invoices, payment collections, and billing period dues."
        breadcrumbs={['Operations', 'Invoices']}
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Search invoices by number..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            placeholder="Invoice Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Draft', value: 'draft' },
              { label: 'Confirmed', value: 'confirmed' },
              { label: 'Cancelled', value: 'cancelled' },
            ]}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            placeholder="Payment Status"
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            options={[
              { label: 'All Payments', value: '' },
              { label: 'Unpaid', value: 'unpaid' },
              { label: 'Partially Paid', value: 'partially_paid' },
              { label: 'Paid', value: 'paid' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => loadInvoices(page)}
        emptyTitle="No invoices found"
        emptyDescription="Invoices are generated from active subscriptions when the billing period arrives."
      />

      {/* Printable Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Official Tax Invoice"
        subtitle={selectedInvoice?.invoiceNumber}
        maxWidth="max-w-3xl"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Printable container */}
            <div
              ref={printableRef}
              className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6 print:border-none print:shadow-none print:p-0"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-indigo-600 tracking-tight">
                    FLUX
                  </h2>
                  <p className="text-xs text-slate-500">
                    Subscription Management Platform
                  </p>
                  <p className="text-xs text-slate-500">GSTIN: 27AABCF1234F1Z5</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                    INVOICE
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {selectedInvoice.invoiceNumber}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Date: {formatDate(selectedInvoice.invoiceDate || selectedInvoice.createdAt)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Due: {formatDate(selectedInvoice.dueDate)}
                  </p>
                </div>
              </div>

              {/* Billed To / Status details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Billed To:
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedInvoice.customer?.fullName || selectedInvoice.customer?.fullname || 'Customer'}
                  </p>
                  <p className="text-slate-500">{selectedInvoice.customer?.email}</p>
                </div>
                <div className="text-right space-y-1">
                  <div>
                    <span className="text-slate-400 mr-2">Invoice Status:</span>
                    <Badge status={selectedInvoice.status} size="xs" />
                  </div>
                  <div>
                    <span className="text-slate-400 mr-2">Payment Status:</span>
                    <Badge status={selectedInvoice.paymentStatus} size="xs" />
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-right">Quantity</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-medium">
                          {item.product?.name || 'Subscription Service'}
                        </td>
                        <td className="p-3 text-right">{item.quantity}</td>
                        <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Calculations */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  {selectedInvoice.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Taxes:</span>
                      <span>+{formatCurrency(selectedInvoice.taxAmount)}</span>
                    </div>
                  )}
                  {selectedInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(selectedInvoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-indigo-600 pt-1 border-t border-slate-100">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(selectedInvoice.dueAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                icon={Printer}
                onClick={handlePrint}
              >
                Print Invoice
              </Button>

              {isCustomer && selectedInvoice.status === 'confirmed' && selectedInvoice.dueAmount > 0 && (
                <Button
                  variant="primary"
                  icon={CreditCard}
                  onClick={() => handlePayInvoice(selectedInvoice)}
                  isLoading={isPaying}
                >
                  Pay {formatCurrency(selectedInvoice.dueAmount)}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Action Confirmation Dialog */}
      <ConfirmDialog
        isOpen={actionDialog.isOpen}
        onClose={() => setActionDialog({ isOpen: false, type: null, invoiceId: null })}
        onConfirm={handleExecuteAction}
        title={`${actionDialog.type?.toUpperCase()} Invoice ${actionDialog.invoiceNumber}?`}
        description={`Are you sure you want to ${actionDialog.type} this invoice?`}
        confirmVariant={actionDialog.type === 'cancel' ? 'danger' : 'primary'}
        isLoading={isPerformingAction}
      />
    </div>
  )
}

export default InvoicesPage
