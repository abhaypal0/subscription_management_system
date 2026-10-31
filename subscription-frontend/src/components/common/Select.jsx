import React, { forwardRef } from 'react'

export const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      options = [],
      className = '',
      id,
      name,
      required = false,
      placeholder = 'Select an option',
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || name

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          name={name}
          required={required}
          className={`block w-full rounded-lg border bg-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-3.5 py-2 ${
            error
              ? 'border-rose-300 text-rose-900 focus:border-rose-500'
              : 'border-slate-300 text-slate-900 focus:border-indigo-500'
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
