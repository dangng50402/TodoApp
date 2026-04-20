import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
}

/**
 * SearchInput — controlled input.
 * Bản thân component không debounce; parent truyền raw value,
 * App sẽ dùng useDebounce để tạo debouncedQuery riêng.
 *
 * Tại sao tách ra vậy?
 *   - Input hiển thị ngay lập tức (UX mượt)
 *   - API call chỉ trigger sau khi ngừng gõ (useDebounce)
 */
export function SearchInput({ value, onChange }: Props) {
  return (
    <div className="relative mb-4">
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        size={15}
        style={{ color: 'var(--muted)' }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search todos..."
        className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition-colors duration-150 focus:border-[var(--accent)]"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
          fontFamily: 'var(--font-sans)',
        }}
      />
    </div>
  )
}
