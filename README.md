# Todo App — TanStack Query + React

Ứng dụng Todo mini kết nối JSONPlaceholder API, được xây dựng để minh họa các React patterns:
`useQuery` · `useMutation` · `useMemo` · `useDebounce` (custom hook) · Optimistic Update

---

## Cấu trúc dự án

```
src/
├── lib/
│   ├── types.ts          # TypeScript interfaces (Todo, FilterState)
│   └── api.ts            # Các hàm gọi API thuần (fetchTodos, toggleTodoApi)
│
├── hooks/
│   ├── useDebounce.ts    # Custom hook: debounce giá trị input
│   └── useTodos.ts       # Custom hook tổng hợp: useQuery + useMemo + useMutation
│
├── components/
│   ├── TodoItem.tsx      # Một dòng todo + highlight search
│   ├── FilterBar.tsx     # Nút lọc all/completed/incomplete
│   ├── SearchInput.tsx   # Ô tìm kiếm (controlled)
│   ├── SkeletonList.tsx  # Placeholder khi đang loading
│   └── Pagination.tsx    # Điều hướng trang
│
├── App.tsx               # Component chính — kết nối tất cả hooks + components
├── main.tsx              # Entry point — setup QueryClientProvider
└── index.css             # Global styles + Tailwind + CSS variables
```

---

## Cài đặt & chạy

```bash
# 1. Cài dependencies
npm install

# 2. Chạy dev server
npm run dev

# 3. Mở trình duyệt tại http://localhost:5173
```

> **Yêu cầu:** Node.js >= 18

---

## Các patterns được minh họa

### 1. useQuery — Fetch & Cache

```tsx
// src/hooks/useTodos.ts
const { data: todos, isLoading, isError } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5 * 60 * 1000,  // Cache 5 phút
})
```

- `queryKey` là unique identifier — TanStack dùng để cache, invalidate, refetch.
- `staleTime` kiểm soát khi nào data bị coi là "cũ" và cần refetch.
- `isLoading` chỉ `true` lần đầu — lần sau có cache thì không loading.

---

### 2. useMemo — Filter + Search

```tsx
// src/hooks/useTodos.ts
const filteredTodos = useMemo(() => {
  let result = todos
  if (filter === 'completed')  result = result.filter(t => t.completed)
  if (filter === 'incomplete') result = result.filter(t => !t.completed)
  const q = searchQuery.trim().toLowerCase()
  if (q) result = result.filter(t => t.title.toLowerCase().includes(q))
  return result
}, [todos, filter, searchQuery])
```

- Không tính lại 200 todos mỗi render — chỉ khi deps thay đổi.
- `searchQuery` đã được debounce trước khi truyền vào → không filter mỗi keystroke.

---

### 3. useDebounce — Custom Hook

```tsx
// src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)  // cleanup!
  }, [value, delay])

  return debouncedValue
}

// Dùng trong App.tsx:
const searchQuery = useDebounce(searchInput, 300)
```

- `searchInput` cập nhật ngay khi gõ → input phản hồi tức thì.
- `searchQuery` cập nhật sau 300ms ngừng gõ → useMemo không chạy liên tục.
- Cleanup `clearTimeout` ngăn timer cũ kích hoạt sau khi deps thay đổi.

---

### 4. useMutation + Optimistic Update

```tsx
// src/hooks/useTodos.ts
const toggleMutation = useMutation({
  mutationFn: ({ id, completed }) => toggleTodoApi(id, completed),

  onMutate: async ({ id, completed }) => {
    // 1. Cancel pending queries để tránh overwrite
    await queryClient.cancelQueries({ queryKey: TODO_QUERY_KEY })

    // 2. Snapshot để rollback nếu lỗi
    const previousTodos = queryClient.getQueryData(TODO_QUERY_KEY)

    // 3. Cập nhật cache ngay (optimistic) — user thấy ngay
    queryClient.setQueryData(TODO_QUERY_KEY, old =>
      old?.map(t => t.id === id ? { ...t, completed } : t)
    )

    return { previousTodos }  // context cho onError
  },

  onError: (_err, _vars, context) => {
    // Rollback nếu API thất bại
    queryClient.setQueryData(TODO_QUERY_KEY, context?.previousTodos)
  },

  onSettled: () => {
    // Luôn sync lại với server sau cùng
    queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY })
  },
})
```

**Flow:**
```
Click todo
  → onMutate: UI cập nhật ngay
    → API call (background)
      → onError (nếu lỗi): rollback
      → onSettled (luôn): refetch từ server
```

---

## TanStack Query DevTools

Khi chạy dev mode, một icon nhỏ xuất hiện ở góc dưới màn hình.
Click vào để xem:
- Cache state của query `['todos']`
- Trạng thái mutation đang pending
- Thời gian stale/fresh của data

---

## Mở rộng (gợi ý bài tập)

1. **Thêm `useInfiniteQuery`** — load thêm todos khi scroll xuống cuối.
2. **Thêm `add todo`** — `useMutation` với POST, optimistic insert vào đầu list.
3. **Persist filter vào URL** — `useSearchParams` từ React Router.
4. **Error boundary** — bọc App bằng `<ErrorBoundary>` để handle lỗi toàn cục.
5. **Test custom hooks** — dùng `@testing-library/react` và `renderHook`.
