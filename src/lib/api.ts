import type { Todo } from './types'

const BASE = 'https://jsonplaceholder.typicode.com'

// Fetch tất cả todos (giữ nguyên — dùng ở chỗ khác nếu cần)
export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(`${BASE}/todos`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: Không thể tải dữ liệu`)
  return res.json()
}

// [MỚI] Fetch todos theo trang — dùng trong useInfiniteQuery
// JSONPlaceholder hỗ trợ _page và _limit natively
export async function fetchTodosPaginated(page: number): Promise<Todo[]> {
  const res = await fetch(`${BASE}/todos?_page=${page}&_limit=10`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: Không thể tải dữ liệu`)
  return res.json() // trả về Todo[] — mảng rỗng khi hết trang
}

// Toggle trạng thái completed (giữ nguyên)
export async function toggleTodoApi(
  id: number,
  completed: boolean
): Promise<Todo> {
  const res = await fetch(`${BASE}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: Cập nhật thất bại`)
  return res.json()
}