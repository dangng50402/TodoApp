import type { FilterState } from '@/lib/types'

interface Props {
  value: FilterState
  onChange: (f: FilterState) => void
}

const OPTIONS: { label: string; value: FilterState }[] = [
  { label: 'ALL', value: 'all' },
  { label: 'INCOMPLETE', value: 'incomplete' },
  { label: 'COMPLETED', value: 'completed' },
]

export function FilterBar({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 mb-5">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="text-xs font-mono tracking-wide px-3 py-1.5 rounded-full border transition-all duration-150"
          style={{
            background: value === opt.value ? 'var(--accent)' : 'transparent',
            borderColor: value === opt.value ? 'var(--accent)' : 'var(--border)',
            color: value === opt.value ? '#fff' : 'var(--muted)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
