import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // -------------------------------------------------------
  // TC-1: Giá trị ban đầu được trả về ngay khi mount
  // -------------------------------------------------------
  it('trả về initial value ngay khi mount, không cần đợi delay', () => {
    const { result } = renderHook(() => useDebounce('hello', 500))

    // Không advance timer — giá trị phải có ngay lập tức
    expect(result.current).toBe('hello')
  })

  // -------------------------------------------------------
  // TC-2: Không update trước khi delay hết
  // -------------------------------------------------------
  it('giữ nguyên giá trị cũ khi chưa đủ delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // Thay đổi value
    rerender({ value: 'updated', delay: 500 })

    // Tua 499ms — chưa đủ 500ms
    act(() => { vi.advanceTimersByTime(499) })
    expect(result.current).toBe('initial') // vẫn là giá trị cũ

    // Tua thêm 1ms — đúng 500ms — timer kích hoạt
    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe('updated') // bây giờ mới update
  })

  // -------------------------------------------------------
  // TC-3: Thay đổi nhanh liên tiếp — chỉ giữ giá trị cuối
  // -------------------------------------------------------
  it('bỏ qua các giá trị trung gian khi value thay đổi nhanh', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: '' } }
    )

    // Simulate gõ từng ký tự — mỗi lần rerender reset timer
    rerender({ value: 'r' })
    act(() => { vi.advanceTimersByTime(100) }) // 100ms — chưa đủ 300ms

    rerender({ value: 're' })
    act(() => { vi.advanceTimersByTime(100) }) // timer bị reset, lại đếm từ 0

    rerender({ value: 'rea' })
    act(() => { vi.advanceTimersByTime(100) }) // timer bị reset lần 2

    // Tổng đã 300ms nhưng mỗi rerender đều reset timer
    // → vẫn chưa có lần nào đủ 300ms liên tục
    expect(result.current).toBe('') // vẫn là initial value

    // Tua đủ 300ms từ lần rerender cuối → chỉ emit giá trị cuối
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe('rea')
  })

  // -------------------------------------------------------
  // TC-4: Cleanup khi unmount — không gọi setState sau unmount
  // -------------------------------------------------------
  it('hủy timer khi unmount trước khi delay hết', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' }) // bắt đầu timer 500ms

    act(() => { vi.advanceTimersByTime(200) }) // tua 200ms — timer chưa xong

    unmount() // cleanup() chạy → clearTimeout — timer bị hủy

    // Tua thêm 300ms sau khi unmount — timer đã bị hủy
    act(() => { vi.advanceTimersByTime(300) })

    // Giá trị không đổi vì clearTimeout đã chặn setDebouncedValue
    expect(result.current).toBe('initial')
    // Không có warning "Can't perform state update on unmounted component"
  })

  // -------------------------------------------------------
  // TC-5: delay thay đổi — timer phải reset theo delay mới
  // -------------------------------------------------------
  it('reset timer khi delay thay đổi', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 500 } }
    )

    // Đổi delay từ 500 → 200
    rerender({ value: 'hello', delay: 200 })

    act(() => { vi.advanceTimersByTime(200) }) // đủ delay mới

    // debouncedValue phải update theo delay mới
    expect(result.current).toBe('hello')
  })
})