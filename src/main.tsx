import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import './index.css'

/**
 * QueryClient config:
 *   - retry: 1       → thử lại 1 lần nếu request thất bại
 *   - staleTime: 0   → default; mỗi hook tự override staleTime nếu cần
 *   - refetchOnWindowFocus: false → không refetch khi tab được focus lại
 *     (Thích hợp với JSONPlaceholder vì data không thay đổi)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* DevTools: chỉ hiện trong development, tự ẩn khi build production */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
)
