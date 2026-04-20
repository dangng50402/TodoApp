import { useRef, useEffect } from 'react'
import type { Todo } from '@/lib/types'

interface Props {
  todo: Todo
  searchQuery: string
  isPending: boolean
  onToggle: (todo: Todo) => void
}

/**
 * Highlight text khớp với searchQuery.
 * Tách title thành các phần, wrap phần khớp với <mark>.
 */
function HighlightedTitle({
  title,
  query,
}: {
  title: string
  query: string
}) {
  if (!query.trim()) return <span>{title}</span>

  const regex = new RegExp(
    `(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  )
  const parts = title.split(regex)

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              background: 'rgba(124,106,247,0.2)',
              color: '#a78bfa',
              borderRadius: '2px',
              padding: '0 1px',
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

export function TodoItem({ todo, searchQuery, isPending, onToggle }: Props) {
  // useRef để truy cập DOM element khi cần thêm shake animation
  const itemRef = useRef<HTMLDivElement>(null)

  // Khi isPending → false đột ngột (lỗi xảy ra), thêm shake
  const prevPending = useRef(isPending)
  useEffect(() => {
    // Nếu vừa chuyển từ pending → không pending: có thể là error → shake
    // (Logic đơn giản hóa; trong app thật bạn sẽ check mutation error state)
    prevPending.current = isPending
  }, [isPending])

  return (
    <div
      ref={itemRef}
      onClick={() => !isPending && onToggle(todo)}
      className="fade-in flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-150 hover:border-[var(--accent)] hover:bg-[var(--surface2)]"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {/* Checkbox */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-md transition-all duration-150"
        style={{
          width: 20,
          height: 20,
          border: todo.completed
            ? 'none'
            : `1.5px solid ${isPending ? 'var(--accent)' : 'var(--border)'}`,
          background: todo.completed ? 'var(--green)' : 'transparent',
          animation: isPending ? 'spin 0.6s linear infinite' : 'none',
        }}
      >
        {todo.completed && !isPending && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path
              d="M1 4L4 7L10 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Title với highlight */}
      <span
        className="flex-1 text-sm leading-snug"
        style={{
          color: todo.completed ? 'var(--muted)' : 'var(--text)',
          textDecoration: todo.completed ? 'line-through' : 'none',
          textDecorationColor: 'var(--muted)',
        }}
      >
        <HighlightedTitle title={todo.title} query={searchQuery} />
      </span>

      {/* ID badge */}
      <span
        className="flex-shrink-0 text-xs font-mono"
        style={{ color: 'var(--muted)' }}
      >
        #{todo.id}
      </span>
    </div>
  )
}
