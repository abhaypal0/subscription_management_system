import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'motion/react'
import {
  Package,
  Layers,
  Repeat,
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { productService } from '../../services/product.service'
import { planService } from '../../services/plan.service'
import { subscriptionService } from '../../services/subscription.service'
import { paymentService } from '../../services/payment.service'
import { formatCurrency, formatDate } from '../../utils/formatters'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Button from '../../components/common/Button'

export const Dashboard = () => {
  const { user, role } = useSelector((state) => state.auth)

  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalPlans: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalCustomersCount: 0,
    recentSubscriptions: [],
    recentPayments: [],
    subscriptionStatusDistribution: [],
    revenueChartData: [],
  })

  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      setIsLoading(true)
      try {
        // Parallel requests to real backend endpoints
        const [
          productsRes,
          plansRes,
          activeSubsRes,
          allSubsRes,
          paymentsRes,
          completedPaymentsRes,
        ] = await Promise.allSettled([
          productService.getProducts({ limit: 1 }),
          planService.getPlans({ limit: 1 }),
          subscriptionService.getSubscriptions({ status: 'active', limit: 1 }),
          subscriptionService.getSubscriptions({ limit: 10 }),
          paymentService.getPayments({ limit: 5 }),
          paymentService.getPayments({ status: 'completed', limit: 50 }),
        ])

        if (!isMounted) return

        // 1. Total Products
        const totalProducts =
          productsRes.status === 'fulfilled'
            ? productsRes.value?.pagination?.totalProducts || 0
            : 0

        // 2. Total Plans
        const totalPlans =
          plansRes.status === 'fulfilled'
            ? plansRes.value?.totalPlans || plansRes.value?.plans?.length || 0
            : 0

        // 3. Active Subscriptions
        const activeSubscriptions =
          activeSubsRes.status === 'fulfilled'
            ? activeSubsRes.value?.pagination?.total || 0
            : 0

        // 4. Recent Subscriptions & Status Distribution
        const allSubsList =
          allSubsRes.status === 'fulfilled' ? allSubsRes.value?.data || [] : []
        const recentSubscriptions = allSubsList.slice(0, 5)

        // Status counts for chart
        const statusMap = {}
        allSubsList.forEach((sub) => {
          const s = sub.status || 'unknown'
          statusMap[s] = (statusMap[s] || 0) + 1
        })
        const subscriptionStatusDistribution = Object.keys(statusMap).map(
          (key) => ({
            name: key.toUpperCase(),
            value: statusMap[key],
          })
        )

        // 5. Total Revenue & Completed Payments
        const completedList =
          completedPaymentsRes.status === 'fulfilled'
            ? completedPaymentsRes.value?.data || []
            : []
        const totalRevenue = completedList.reduce(
          (sum, p) => sum + (Number(p.amount) || 0),
          0
        )

        // Group revenue by date for Recharts
        const revenueByDate = {}
        completedList.forEach((p) => {
          const dateStr = formatDate(p.paymentDate || p.createdAt)
          revenueByDate[dateStr] =
            (revenueByDate[dateStr] || 0) + (Number(p.amount) || 0)
        })
        const revenueChartData = Object.keys(revenueByDate).map((date) => ({
          date,
          revenue: revenueByDate[date],
        }))

        // 6. Recent Payments
        const recentPayments =
          paymentsRes.status === 'fulfilled' ? paymentsRes.value?.data || [] : []

        // 7. Customers count (deduplicated from subscriptions)
        const uniqueCustomers = new Set()
        allSubsList.forEach((s) => {
          if (s.customer?._id || s.customer) {
            uniqueCustomers.add(s.customer?._id || s.customer)
          }
        })
        completedList.forEach((p) => {
          if (p.customer?._id || p.customer) {
            uniqueCustomers.add(p.customer?._id || p.customer)
          }
        })

        setStats({
          totalProducts,
          totalPlans,
          activeSubscriptions,
          totalRevenue,
          totalCustomersCount: uniqueCustomers.size,
          recentSubscriptions,
          recentPayments,
          subscriptionStatusDistribution,
          revenueChartData: revenueChartData.slice(-7), // last 7 points
        })
      } catch (err) {
        console.error('Error loading dashboard stats:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [role])

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6']

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
      description: 'Calculated from completed transactions',
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      icon: Repeat,
      color: 'bg-indigo-50 text-indigo-600',
      description: 'Subscriptions with active recurring billing',
    },
    {
      title: 'Total Plans',
      value: stats.totalPlans,
      icon: Layers,
      color: 'bg-amber-50 text-amber-600',
      description: 'Configured pricing plans in catalog',
    },
    {
      title: role === 'customer' ? 'Active Products' : 'Total Customers',
      value: role === 'customer' ? stats.totalProducts : stats.totalCustomersCount,
      icon: role === 'customer' ? Package : Users,
      color: 'bg-purple-50 text-purple-600',
      description:
        role === 'customer'
          ? 'Available products & services'
          : 'Distinct accounts with transactions',
    },
  ]

  if (isLoading) {
    return <LoadingSpinner size="lg" message="Loading dashboard analytics..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.fullname || 'User'}`}
        description={`Here is an overview of your subscription operations as of today.`}
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Role: {role?.toUpperCase()}
            </span>
          </div>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {card.value}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{card.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Revenue Inflow (INR)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregated from verified transactions
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>

          {stats.revenueChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueChartData}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
              <CreditCard className="w-10 h-10 mb-2 opacity-40" />
              <span>No completed transactions to graph yet.</span>
            </div>
          )}
        </div>

        {/* Subscription Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Subscription Status
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current operational distribution
              </p>
            </div>
          </div>

          {stats.subscriptionStatusDistribution.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.subscriptionStatusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {stats.subscriptionStatusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
              <Repeat className="w-10 h-10 mb-2 opacity-40" />
              <span>No subscriptions found.</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Subscriptions & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subscriptions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recent Subscriptions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest subscriptions created
              </p>
            </div>
            <Link to="/subscriptions">
              <Button variant="ghost" size="xs">
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.recentSubscriptions.length > 0 ? (
              stats.recentSubscriptions.map((sub) => (
                <div
                  key={sub._id}
                  className="py-3 flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {sub.subscriptionNumber}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cycle: <span className="capitalize">{sub.billingCycle}</span> • Start: {formatDate(sub.startDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900">
                      {formatCurrency(sub.totalAmount)}
                    </span>
                    <Badge status={sub.status} size="xs" />
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">
                No subscription records yet.
              </p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recent Transactions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest customer billing payments
              </p>
            </div>
            <Link to="/payments">
              <Button variant="ghost" size="xs">
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.recentPayments.length > 0 ? (
              stats.recentPayments.map((p) => (
                <div
                  key={p._id}
                  className="py-3 flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {p.paymentNumber}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Method: <span className="uppercase">{p.paymentMethod}</span> • Date: {formatDate(p.paymentDate || p.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(p.amount)}
                    </span>
                    <Badge status={p.status} size="xs" />
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">
                No payment transactions recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
