import { useState, useEffect } from 'react'

/**
 * useDebounce — trả về giá trị đã "debounce" sau `delay` ms.
 *
 * Cách hoạt động:
 *   1. Mỗi khi `value` thay đổi, bắt đầu đếm ngược `delay` ms.
 *   2. Nếu `value` thay đổi lại trước khi hết `delay`, reset đồng hồ.
 *   3. Chỉ khi `delay` ms trôi qua mà không có thay đổi → cập nhật debouncedValue.
 *
 * Cleanup: clearTimeout khi value thay đổi hoặc component unmount
 * → tránh memory leak và gọi setState trên unmounted component.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Đặt timer: chỉ cập nhật sau `delay` ms
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup: xóa timer nếu value thay đổi trước khi hết delay
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
