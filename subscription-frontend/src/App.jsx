import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { fetchCurrentUser } from './store/slices/authSlice'
import AppRoutes from './routes/AppRoutes'

function App() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    // 1. Check if returning from Google OAuth
    if (
      searchParams.get('auth') === 'google' &&
      searchParams.get('status') === 'success'
    ) {
      searchParams.delete('auth')
      searchParams.delete('status')
      setSearchParams(searchParams, { replace: true })
    }

    // 2. Hydrate session from HTTP-only cookie
    dispatch(fetchCurrentUser())
  }, [dispatch, searchParams, setSearchParams])

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            fontSize: '13px',
            borderRadius: '10px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <AppRoutes />
    </>
  )
}

export default App
