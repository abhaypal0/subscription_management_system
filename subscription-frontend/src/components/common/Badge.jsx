import React from 'react'
import { getStatusBadgeStyle, capitalize } from '../../utils/formatters'

export const Badge = ({
  status,
  children,
  size = 'sm',
  showDot = true,
  className = '',
}) => {
  const label = children || capitalize(status)
  const styles = getStatusBadgeStyle(status)

  const sizeClasses = {
    xs: 'text-[11px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-0.5 gap-1.5 font-medium',
    md: 'text-sm px-3 py-1 gap-2 font-medium',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border ${styles.bg} ${sizeClasses[size]} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
      )}
      {label}
    </span>
  )
}

export default Badge
