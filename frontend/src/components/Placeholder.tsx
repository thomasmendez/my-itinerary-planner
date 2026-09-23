export function Placeholder({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded border border-dashed border-line bg-surface p-6 text-sm text-faint ${className}`}
    >
      {label}
    </div>
  )
}
