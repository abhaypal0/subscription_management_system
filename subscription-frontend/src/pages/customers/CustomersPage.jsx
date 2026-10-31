import React, { useEffect, useState } from 'react'
import { Search, Eye, Users, Copy, Check, Repeat, Receipt } from 'lucide-react'
import { subscriptionService } from '../../services/subscription.service'
import { quotationService } from '../../services/quotation.service'
import { invoiceService } from '../../services/invoice.service'
import { formatCurrency, formatDate } from '../../utils/formatters'
import PageHeader from '../../components/layout/PageHeader'
import Table from '../../components/common/Table'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([])
  const [allSubs, setAllSubs] = useState([])
  const [allInvoices, setAllInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  // Selected customer for history modal
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadCustomerData = async () => {
      setIsLoading(true)
      try {
        const [subsRes, invRes] = await Promise.allSettled([
          subscriptionService.getSubscriptions({ limit: 100 }),
          invoiceService.getInvoices({ limit: 100 }),
        ])

        if (!isMounted) return

        const subs = subsRes.status === 'fulfilled' ? subsRes.value?.data || [] : []
        const invoices = invRes.status === 'fulfilled' ? invRes.value?.data || [] : []

        setAllSubs(subs)
        setAllInvoices(invoices)

        // Aggregate unique customer entities
        const customerMap = new Map()

        subs.forEach((sub) => {
          if (sub.customer && sub.customer._id) {
            const id = sub.customer._id
            if (!customerMap.has(id)) {
              customerMap.set(id, {
                _id: id,
                fullname: sub.customer.fullName || sub.customer.fullname || 'Customer',
                email: sub.customer.email,
                activeSubsCount: 0,
                totalSubsCount: 0,
                totalBilled: 0,
              })
            }
            const c = customerMap.get(id)
            c.totalSubsCount += 1
            if (sub.status === 'active') {
              c.activeSubsCount += 1
            }
          }
        })

        invoices.forEach((inv) => {
          if (inv.customer && inv.customer._id) {
            const id = inv.customer._id
            if (!customerMap.has(id)) {
              customerMap.set(id, {
                _id: id,
                fullname: inv.customer.fullName || inv.customer.fullname || 'Customer',
                email: inv.customer.email,
                activeSubsCount: 0,
                totalSubsCount: 0,
                totalBilled: 0,
              })
            }
            const c = customerMap.get(id)
            c.totalBilled += Number(inv.paidAmount || 0)
          }
        })

        setCustomers(Array.from(customerMap.values()))
      } catch (err) {
        console.error('Failed to aggregate customer directory', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadCustomerData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success('Customer ID copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.fullname?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c._id?.toLowerCase().includes(q)
    )
  })

  const columns = [
    {
      header: 'Customer Details',
      key: 'fullname',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.fullname}</span>
          <span className="text-xs text-slate-500">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Customer ID (for Quotations)',
      key: '_id',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded select-all">
            {row._id}
          </span>
          <button
            type="button"
            onClick={() => handleCopyId(row._id)}
            className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors"
            title="Copy ID"
          >
            {copiedId === row._id ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      ),
    },
    {
      header: 'Active Subscriptions',
      key: 'activeSubsCount',
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {row.activeSubsCount} / {row.totalSubsCount}
        </span>
      ),
    },
    {
      header: 'Lifetime Value (Paid)',
      key: 'totalBilled',
      render: (row) => (
        <span className="font-bold text-slate-900">
          {formatCurrency(row.totalBilled)}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => {
            setSelectedCustomer(row)
            setIsModalOpen(true)
          }}
          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
          title="View Subscription History"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  // Filter linked records for modal
  const customerSubs = allSubs.filter(
    (s) => s.customer?._id === selectedCustomer?._id
  )
  const customerInvoices = allInvoices.filter(
    (i) => i.customer?._id === selectedCustomer?._id
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        description="Unified directory of active subscription accounts, account IDs, and payment histories."
        breadcrumbs={['Billing & Rules', 'Customers']}
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search customers by name, email, or account ID..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredCustomers}
        isLoading={isLoading}
        emptyTitle="No customer accounts discovered"
        emptyDescription="Customer accounts will automatically be organized here when quotations, invoices, or subscriptions are generated."
      />

      {/* Customer Profile & History Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCustomer?.fullname || 'Customer Profile'}
        subtitle={selectedCustomer?.email}
        maxWidth="max-w-2xl"
      >
        {selectedCustomer && (
          <div className="space-y-6 text-sm">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-xs text-slate-400 block">Total Paid</span>
                <span className="text-base font-bold text-slate-900">
                  {formatCurrency(selectedCustomer.totalBilled)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Active Subscriptions</span>
                <span className="text-base font-bold text-indigo-600">
                  {selectedCustomer.activeSubsCount}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Total Contracts</span>
                <span className="text-base font-bold text-slate-800">
                  {selectedCustomer.totalSubsCount}
                </span>
              </div>
            </div>

            {/* Linked Subscriptions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                Subscription Contracts ({customerSubs.length})
              </h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {customerSubs.length > 0 ? (
                  customerSubs.map((sub) => (
                    <div
                      key={sub._id}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-semibold text-slate-800">
                          {sub.subscriptionNumber}
                        </span>
                        <span className="text-slate-400 block">
                          Plan: {sub.plan?.name || 'Standard'} • {sub.billingCycle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(sub.totalAmount)}
                        </span>
                        <Badge status={sub.status} size="xs" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-xs text-slate-400">
                    No subscriptions found.
                  </p>
                )}
              </div>
            </div>

            {/* Linked Invoices */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                Invoices History ({customerInvoices.length})
              </h4>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {customerInvoices.length > 0 ? (
                  customerInvoices.map((inv) => (
                    <div
                      key={inv._id}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-semibold text-slate-800">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-slate-400 block">
                          Date: {formatDate(inv.invoiceDate || inv.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(inv.totalAmount)}
                        </span>
                        <Badge status={inv.paymentStatus} size="xs" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-xs text-slate-400">
                    No invoices generated yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CustomersPage
