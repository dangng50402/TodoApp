import { useState, useMemo } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useTodos } from '@/hooks/useTodos'
import { TodoItem } from '@/components/TodoItem'
import { FilterBar } from '@/components/FilterBar'
import { SearchInput } from '@/components/SearchInput'
import { SkeletonList } from '@/components/SkeletonList'
import { Pagination } from '@/components/Pagination'
import type { FilterState } from '@/lib/types'

const PAGE_SIZE = 15

export default function App() {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterState>('all')
  const [searchInput, setSearchInput] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // useDebounce: searchInput thay đổi ngay khi gõ,
  // nhưng searchQuery chỉ cập nhật sau 300ms ngừng gõ
  // → useMemo trong useTodos sẽ chỉ re-compute sau khi ngừng gõ
  const searchQuery = useDebounce(searchInput, 300)

  // Reset về trang 1 khi filter hoặc search thay đổi
  const handleFilterChange = (f: FilterState) => {
    setFilter(f)
    setCurrentPage(1)
  }
  const handleSearchChange = (v: string) => {
    setSearchInput(v)
    setCurrentPage(1)
  }

  // ── Data layer (custom hook bọc useQuery + useMemo + useMutation) ─────────
  const { filteredTodos, isLoading, isError, error, stats, toggleTodo, pendingIds } =
    useTodos(filter, searchQuery)

  // ── Pagination (useMemo: chỉ tính lại khi filteredTodos / currentPage đổi)
  const { pagedTodos, totalPages } = useMemo(() => {
    const totalPages = Math.ceil(filteredTodos.length / PAGE_SIZE)
    const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages))
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return {
      pagedTodos: filteredTodos.slice(start, start + PAGE_SIZE),
      totalPages,
    }
  }, [filteredTodos, currentPage])

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            todo<span style={{ color: 'var(--accent)' }}>.</span>list
          </h1>
          <p className="text-xs font-mono mt-1" style={{ color: 'var(--muted)' }}>
            JSONPlaceholder · TanStack Query v5
          </p>
        </div>

        {/* Stats */}
        {!isLoading && !isError && (
          <div
            className="text-right text-xs font-mono leading-relaxed"
            style={{ color: 'var(--muted)' }}
          >
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>
              {stats.filtered}
            </span>{' '}
            results &nbsp;·&nbsp;{' '}
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>
              {stats.completed}
            </span>
            /{stats.total} done
          </div>
        )}
      </div>

      {/* Search */}
      <SearchInput value={searchInput} onChange={handleSearchChange} />

      {/* Filter */}
      <FilterBar value={filter} onChange={handleFilterChange} />

      {/* Error state */}
      {isError && (
        <div
          className="rounded-xl border px-4 py-3 text-sm mb-4"
          style={{
            background: '#2a1515',
            borderColor: 'var(--red)',
            color: 'var(--red)',
          }}
        >
          ⚠ {(error as Error).message}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && <SkeletonList count={12} />}

      {/* Todo list */}
      {!isLoading && !isError && (
        <>
          {pagedTodos.length === 0 ? (
            <div
              className="text-center py-16 text-sm"
              style={{ color: 'var(--muted)' }}
            >
              {searchQuery ? 'Không tìm thấy kết quả.' : 'Không có todo nào.'}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {pagedTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  searchQuery={searchQuery}
                  isPending={pendingIds.has(todo.id)}
                  onToggle={toggleTodo}
                />
              ))}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
