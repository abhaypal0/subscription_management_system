import React from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard,
  Package,
  Layers,
  FileText,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  PercentSquare,
  Users,
  ChevronLeft,
  X,
  Sparkles,
} from 'lucide-react'
import {
  setSidebarOpen,
  toggleSidebarCollapse,
} from '../../store/slices/uiSlice'

export const Sidebar = () => {
  const dispatch = useDispatch()
  const { role } = useSelector((state) => state.auth)
  const { isSidebarOpen, isSidebarCollapsed } = useSelector((state) => state.ui)

  // Role-aware navigation links
  const navItems = [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          roles: ['admin', 'staff', 'customer'],
        },
      ],
    },
    {
      title: 'Catalog',
      items: [
        {
          name: 'Products',
          path: '/products',
          icon: Package,
          roles: ['admin', 'staff', 'customer'],
        },
        {
          name: 'Plans',
          path: '/plans',
          icon: Layers,
          roles: ['admin', 'staff', 'customer'],
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          name: role === 'customer' ? 'My Quotations' : 'Quotations',
          path: '/quotations',
          icon: FileText,
          roles: ['admin', 'staff', 'customer'],
        },
        {
          name: role === 'customer' ? 'My Subscriptions' : 'Subscriptions',
          path: '/subscriptions',
          icon: Repeat,
          roles: ['admin', 'staff', 'customer'],
        },
        {
          name: role === 'customer' ? 'My Invoices' : 'Invoices',
          path: '/invoices',
          icon: Receipt,
          roles: ['admin', 'staff', 'customer'],
        },
        {
          name: role === 'customer' ? 'Payments & History' : 'Payments',
          path: '/payments',
          icon: CreditCard,
          roles: ['admin', 'staff', 'customer'],
        },
      ],
    },
    {
      title: 'Billing & Rules',
      items: [
        {
          name: 'Discounts',
          path: '/discounts',
          icon: Percent,
          roles: ['admin', 'staff'],
        },
        {
          name: 'Tax Rates',
          path: '/taxes',
          icon: PercentSquare,
          roles: ['admin', 'staff'],
        },
        {
          name: 'Customers',
          path: '/customers',
          icon: Users,
          roles: ['admin', 'staff'],
        },
      ],
    },
  ]

  // Filter groups and items based on role
  const filteredNavGroups = navItems
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role || 'customer')),
    }))
    .filter((group) => group.items.length > 0)

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col truncate"
            >
              <span className="font-bold text-white tracking-tight text-base leading-none">
                FLUX
              </span>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                Subscription Cloud
              </span>
            </motion.div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => dispatch(setSidebarOpen(false))}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {filteredNavGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => dispatch(setSidebarOpen(false))}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`
                  }
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                  {!isSidebarCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer (Desktop only) */}
      <div className="hidden md:flex items-center justify-between p-3 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => dispatch(toggleSidebarCollapse())}
          className="flex items-center justify-center w-full py-2 px-3 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors gap-2"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-200 ${
              isSidebarCollapsed ? 'rotate-180' : ''
            }`}
          />
          {!isSidebarCollapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer Backdrop and Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => dispatch(setSidebarOpen(false))}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 w-72 max-w-full shadow-2xl z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
