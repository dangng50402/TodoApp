import type { Todo } from './types'

const BASE = 'https://jsonplaceholder.typicode.com'

// Fetch tất cả todos (dùng trong useQuery)
export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(`${BASE}/todos`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: Không thể tải dữ liệu`)
  return res.json()
}

// Toggle trạng thái completed (dùng trong useMutation)
// JSONPlaceholder chấp nhận PATCH nhưng không lưu thật — đủ để demo
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
