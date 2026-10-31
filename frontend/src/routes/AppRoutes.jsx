import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AppLayout from '../components/layout/AppLayout'

// Pages
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import VerifyEmail from '../pages/auth/VerifyEmail'
import ResetPassword from '../pages/auth/ResetPassword'
import ForgotPassword from '../pages/auth/ForgotPassword'

import Dashboard from '../pages/dashboard/Dashboard'
import ProductsPage from '../pages/products/ProductsPage'
import PlansPage from '../pages/plans/PlansPage'
import QuotationsPage from '../pages/quotations/QuotationsPage'
import SubscriptionsPage from '../pages/subscriptions/SubscriptionsPage'
import InvoicesPage from '../pages/invoices/InvoicesPage'
import PaymentsPage from '../pages/payments/PaymentsPage'
import DiscountsPage from '../pages/discounts/DiscountsPage'
import TaxesPage from '../pages/taxes/TaxesPage'
import CustomersPage from '../pages/customers/CustomersPage'

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route
        path="/reset-password/:token"
        element={<ResetPassword />}
      />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="payments" element={<PaymentsPage />} />

        {/* Admin and Staff Only */}
        <Route
          path="discounts"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <DiscountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="taxes"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <TaxesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="customers"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <CustomersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
