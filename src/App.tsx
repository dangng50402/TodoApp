import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useTodos } from '@/hooks/useTodos'
import { TodoItem } from '@/components/TodoItem'
import { FilterBar } from '@/components/FilterBar'
import { SearchInput } from '@/components/SearchInput'
import { SkeletonList } from '@/components/SkeletonList'
// Pagination đã bỏ — thay bằng infinite scroll
import type { FilterState } from '@/lib/types'

export default function App() {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterState>('all')
  const [searchInput, setSearchInput] = useState('')

  // currentPage đã bỏ — không còn dùng pagination
  const searchQuery = useDebounce(searchInput, 300)

  const handleFilterChange = (f: FilterState) => setFilter(f)
  const handleSearchChange = (v: string) => setSearchInput(v)

  // ── Data layer ────────────────────────────────────────────────────────────
  const {
    filteredTodos,
    isLoading,
    isError,
    error,
    stats,
    toggleTodo,
    pendingIds,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTodos(filter, searchQuery)

  // ── IntersectionObserver — watch sentinel div ở cuối list ─────────────────
  //
  // Tại sao không dùng useEffect + scroll event?
  //   - scroll event bắn 60fps+ → cần throttle thủ công, dễ sai, tốn CPU
  //   - Phải tự tính scrollTop + clientHeight + scrollHeight → fragile trên mobile
  //   - Không hoạt động đúng khi list nằm trong scroll container lồng nhau
  //   - IntersectionObserver: browser tự handle, chạy off main thread,
  //     không block UI, không cần cleanup phức tạp
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = observerRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Chỉ fetch khi:
        //   1. sentinel vào viewport
        //   2. còn trang tiếp (hasNextPage = true)
        //   3. không đang fetch dở (tránh gọi double)
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      {
        // Bắt đầu fetch trước khi người dùng chạm đáy 100px
        // → UX mượt hơn, không bị "chờ" khi cuộn nhanh
        rootMargin: '0px 0px 100px 0px',
        threshold: 0,
      }
    )

    observer.observe(sentinel)

    // cleanup: disconnect khi deps thay đổi hoặc component unmount
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // ── Render ────────────────────────────────────────────────────────────────
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

        {/* Stats — tính trên allTodos đã load, không chỉ page hiện tại */}
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
            {/* Chỉ hiện khi còn trang — biến mất khi load xong toàn bộ */}
            {hasNextPage && (
              <span style={{ color: 'var(--muted)' }}> · còn nữa…</span>
            )}
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

      {/* Loading skeleton — chỉ cho lần fetch đầu tiên (isLoading) */}
      {isLoading && <SkeletonList count={12} />}

      {/* Todo list */}
      {!isLoading && !isError && (
        <div className="flex flex-col gap-1.5">
          {filteredTodos.length === 0 && !isFetchingNextPage ? (
            <div
              className="text-center py-16 text-sm"
              style={{ color: 'var(--muted)' }}
            >
              {searchQuery ? 'Không tìm thấy kết quả.' : 'Không có todo nào.'}
            </div>
          ) : (
            filteredTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                searchQuery={searchQuery}
                isPending={pendingIds.has(todo.id)}
                onToggle={toggleTodo}
              />
            ))
          )}

          {/*
           * Skeleton khi đang fetch thêm trang (isFetchingNextPage).
           * KHÁC với isLoading (lần đầu):
           *   isLoading         = true  → chưa có data gì → SkeletonList toàn trang (trên)
           *   isFetchingNextPage = true → đang load thêm → skeleton nhỏ ở cuối list
           */}
          {isFetchingNextPage && <SkeletonList count={4} />}

          {/*
           * Sentinel — IntersectionObserver quan sát div này.
           * Khi div vào viewport → callback → fetchNextPage().
           * Luôn render (kể cả khi !hasNextPage) để observer có DOM node,
           * nhưng guard hasNextPage bên trong callback sẽ không fetch nữa.
           */}
          <div ref={observerRef} style={{ height: 1 }} aria-hidden />

          {/* Ẩn hoàn toàn khi còn trang — chỉ hiện khi đã load hết */}
          {!hasNextPage && filteredTodos.length > 0 && (
            <p
              className="text-center text-xs py-4 font-mono"
              style={{ color: 'var(--muted)' }}
            >
              ✓ Đã hiển thị tất cả {stats.total} todos
            </p>
          )}
        </div>
      )}

      {/* Pagination đã bỏ — replaced by infinite scroll */}
    </div>
  )
}