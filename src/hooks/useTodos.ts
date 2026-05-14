import { useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTodosPaginated, toggleTodoApi } from '@/lib/api'
import type { Todo, FilterState } from '@/lib/types'

export const TODO_QUERY_KEY = ['todos'] as const

/**
 * useTodos — refactored sang useInfiniteQuery
 *
 * DIAGRAM luồng data:
 *
 *  useInfiniteQuery({ queryFn: fetchTodosPaginated, getNextPageParam })
 *        │
 *        ▼
 *  data.pages = [
 *    [todo1..10],   ← pageParam = 1
 *    [todo11..20],  ← pageParam = 2
 *    [todo21..30],  ← pageParam = 3
 *  ]
 *        │
 *        ▼  flatMap(page => page)
 *  allTodos = [todo1, ..., todo30]  ← flat array
 *        │
 *        ▼  useMemo: filter + search
 *  filteredTodos = [...]
 *        │
 *        ▼  render trong App.tsx
 *  <TodoItem /> × n  +  <div ref={observerRef} />
 *                               │
 *                               ▼  IntersectionObserver (trong App.tsx)
 *                        isIntersecting && hasNextPage
 *                               │
 *                               ▼
 *                        fetchNextPage() → fetch trang tiếp → data.pages thêm mảng mới
 */
export function useTodos(filter: FilterState, searchQuery: string) {
  const queryClient = useQueryClient()

  // ─── useInfiniteQuery: fetch todos theo trang ─────────────────────────────
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: TODO_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchTodosPaginated(pageParam as number),

    // pageParam đầu tiên khi chưa có gì
    initialPageParam: 1,

    // getNextPageParam:
    //   - lastPage = Todo[] của trang vừa xong
    //   - allPages = tất cả pages đã có
    //   - lastPage.length < 10 → trang cuối → return undefined → hasNextPage = false
    //   - lastPage.length === 10 → còn trang → return số trang tiếp theo
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.length + 1 : undefined,

    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // ─── Flatten pages → 1 mảng phẳng ────────────────────────────────────────
  // data.pages = [[...], [...], [...]]
  // flatMap(page => page) = [..., ..., ...]
  const allTodos: Todo[] = useMemo(
    () => data?.pages.flatMap(page => page) ?? [],
    [data]
  )

  // ─── useMemo: filter + search ─────────────────────────────────────────────
  // Chạy trên allTodos (đã flat) — giữ nguyên logic cũ
  const filteredTodos = useMemo(() => {
    let result = allTodos

    if (filter === 'completed')  result = result.filter(t => t.completed)
    if (filter === 'incomplete') result = result.filter(t => !t.completed)

    const q = searchQuery.trim().toLowerCase()
    if (q) result = result.filter(t => t.title.toLowerCase().includes(q))

    return result
  }, [allTodos, filter, searchQuery])

  // ─── useMutation: toggle completed với optimistic update ─────────────────
  // Logic giữ nguyên — chỉ cần cập nhật cách setQueryData vì
  // data bây giờ là InfiniteData<Todo[]> thay vì Todo[]
  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      toggleTodoApi(id, completed),

    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: TODO_QUERY_KEY })

      // Snapshot InfiniteData (có shape { pages, pageParams })
      const previousData = queryClient.getQueryData(TODO_QUERY_KEY)

      // Cập nhật optimistic: duyệt qua từng page, map từng todo
      queryClient.setQueryData<{ pages: Todo[][]; pageParams: unknown[] }>(
        TODO_QUERY_KEY,
        old => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map(page =>
              page.map(t => t.id === id ? { ...t, completed } : t)
            ),
          }
        }
      )

      return { previousData }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(TODO_QUERY_KEY, context.previousData)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY })
    },
  })

  // Stats — tính trên allTodos (toàn bộ đã load, không chỉ trang hiện tại)
  const stats = useMemo(() => ({
    total: allTodos.length,
    completed: allTodos.filter(t => t.completed).length,
    filtered: filteredTodos.length,
  }), [allTodos, filteredTodos])

  return {
    filteredTodos,
    isLoading,
    isError,
    error,
    stats,
    // infinite scroll controls — trả ra để App.tsx dùng
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    toggleTodo: (todo: Todo) =>
      toggleMutation.mutate({ id: todo.id, completed: !todo.completed }),
    pendingIds: new Set(
      toggleMutation.isPending && toggleMutation.variables
        ? [toggleMutation.variables.id]
        : []
    ),
  }
}