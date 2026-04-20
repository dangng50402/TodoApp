import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTodos, toggleTodoApi } from '@/lib/api'
import type { Todo, FilterState } from '@/lib/types'

// Query key dùng chung — đảm bảo invalidate đúng cache
export const TODO_QUERY_KEY = ['todos'] as const

/**
 * useTodos — custom hook tổng hợp toàn bộ logic của Todo feature:
 *   - useQuery: fetch & cache danh sách todos
 *   - useMemo:  filter + search (chỉ tính lại khi deps thay đổi)
 *   - useMutation: toggle completed với optimistic update
 */
export function useTodos(filter: FilterState, searchQuery: string) {
  const queryClient = useQueryClient()

  // ─── useQuery: fetch todos ────────────────────────────────────────────────
  // staleTime: 5 phút — không refetch nếu data còn "tươi"
  // gcTime:    10 phút — giữ cache 10 phút sau khi không còn observer
  const {
    data: todos = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: TODO_QUERY_KEY,
    queryFn: fetchTodos,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // ─── useMemo: filter + search ─────────────────────────────────────────────
  // Chỉ tính lại khi todos, filter, hoặc searchQuery thay đổi.
  // Tránh re-filter toàn bộ 200 todos mỗi lần render không liên quan.
  const filteredTodos = useMemo(() => {
    let result = todos

    // Lọc theo trạng thái
    if (filter === 'completed')  result = result.filter(t => t.completed)
    if (filter === 'incomplete') result = result.filter(t => !t.completed)

    // Tìm kiếm theo title (case-insensitive)
    const q = searchQuery.trim().toLowerCase()
    if (q) result = result.filter(t => t.title.toLowerCase().includes(q))

    return result
  }, [todos, filter, searchQuery])

  // ─── useMutation: toggle completed với optimistic update ─────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      toggleTodoApi(id, completed),

    // onMutate chạy TRƯỚC khi API call — đây là trái tim của optimistic update
    onMutate: async ({ id, completed }) => {
      // 1. Cancel mọi query đang pending cho key này
      //    → tránh server response overwrite optimistic update của ta
      await queryClient.cancelQueries({ queryKey: TODO_QUERY_KEY })

      // 2. Lưu snapshot state hiện tại để rollback nếu lỗi
      const previousTodos = queryClient.getQueryData<Todo[]>(TODO_QUERY_KEY)

      // 3. Cập nhật cache ngay lập tức (optimistic)
      //    User thấy kết quả ngay, không cần chờ server
      queryClient.setQueryData<Todo[]>(TODO_QUERY_KEY, old =>
        old?.map(t => t.id === id ? { ...t, completed } : t) ?? []
      )
      //    ?? [] có thể gây bug nếu old undefined

      // 4. Trả về context để onError có thể rollback
      return { previousTodos }
    },

    // onError: nếu API thất bại → rollback về snapshot
    onError: (_err, _vars, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(TODO_QUERY_KEY, context.previousTodos)
      }
    },

    // onSettled: luôn chạy (dù thành công hay thất bại)
    // → invalidate để refetch data thật từ server, đảm bảo đồng bộ
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY })
    },
  })
    // có thể dùng onSuccess?

  // Stats để hiển thị
  const stats = useMemo(() => ({
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    filtered: filteredTodos.length,
  }), [todos, filteredTodos])

  return {
    filteredTodos,
    isLoading,
    isError,
    error,
    stats,
    toggleTodo: (todo: Todo) =>
      toggleMutation.mutate({ id: todo.id, completed: !todo.completed }),
    pendingIds: new Set(
      toggleMutation.isPending && toggleMutation.variables
        ? [toggleMutation.variables.id]
        : []
    ),
  }
}
