import type { ReactNode } from 'react'

export const fieldInputClass = 'rounded border border-line px-2 py-1.5 text-sm text-ink'

export function Field({
  label,
  extraClassName = '',
  children,
}: {
  label: ReactNode
  extraClassName?: string
  children: ReactNode
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-muted ${extraClassName}`}>
      {label}
      {children}
    </label>
  )
}
