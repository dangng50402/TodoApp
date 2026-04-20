/**
 * SkeletonList — placeholder khi isLoading = true (useQuery đang fetch lần đầu)
 */
export function SkeletonList({ count = 10 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-pulse rounded-xl"
          style={{
            height: 48,
            background: 'var(--surface)',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}
