// Kiểu dữ liệu trả về từ JSONPlaceholder /todos
export interface Todo {
  userId: number
  id: number
  title: string
  completed: boolean
}

// Các trạng thái lọc
export type FilterState = 'all' | 'completed' | 'incomplete'
