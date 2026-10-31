import React from 'react'
import { Loader2 } from 'lucide-react'

export const LoadingSpinner = ({
  size = 'md',
  message = 'Loading...',
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  }

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 gap-3 text-slate-500 ${className}`}
    >
      <Loader2 className={`${sizes[size]} animate-spin text-indigo-600`} />
      {message && <p className="text-sm font-medium text-slate-600">{message}</p>}
    </div>
  )
}

export default LoadingSpinner
