import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

export const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  pagination,
  onPageChange,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display.',
  onEmptyAction,
  emptyActionLabel,
  className = '',
}) => {
  if (isLoading && data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-8">
        <LoadingSpinner message="Loading records..." />
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={col.key || index}
                  className={`px-6 py-3.5 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row._id || row.id || rowIndex}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.key || colIndex}
                      className={`px-6 py-4 whitespace-nowrap text-slate-700 ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row, rowIndex) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40 text-sm text-slate-600">
          <div>
            Showing page <span className="font-semibold text-slate-900">{pagination.page || pagination.currentPage}</span> of{' '}
            <span className="font-semibold text-slate-900">{pagination.totalPages}</span> (Total{' '}
            <span className="font-semibold text-slate-900">{pagination.total || pagination.totalProducts || pagination.totalPlans}</span> records)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={(pagination.page || pagination.currentPage) <= 1}
              onClick={() => onPageChange((pagination.page || pagination.currentPage) - 1)}
              className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={(pagination.page || pagination.currentPage) >= pagination.totalPages}
              onClick={() => onPageChange((pagination.page || pagination.currentPage) + 1)}
              className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Table
