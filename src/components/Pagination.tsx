interface Props {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  const btnStyle = (disabled: boolean) => ({
    background: 'transparent',
    borderColor: 'var(--border)',
    color: disabled ? 'transparent' : 'var(--muted)',
    opacity: disabled ? 0.3 : 1,
    cursor: disabled ? 'default' : 'pointer',
  })

  return (
    <div className="flex items-center justify-center gap-2 mt-5">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="text-xs font-mono px-2.5 py-1.5 rounded-md border transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:pointer-events-none"
        style={btnStyle(currentPage === 1)}
      >
        «
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="text-xs font-mono px-2.5 py-1.5 rounded-md border transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:pointer-events-none"
        style={btnStyle(currentPage === 1)}
      >
        ‹
      </button>

      <span
        className="text-xs font-mono px-2"
        style={{ color: 'var(--muted)' }}
      >
        {currentPage} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="text-xs font-mono px-2.5 py-1.5 rounded-md border transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:pointer-events-none"
        style={btnStyle(currentPage === totalPages)}
      >
        ›
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="text-xs font-mono px-2.5 py-1.5 rounded-md border transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:pointer-events-none"
        style={btnStyle(currentPage === totalPages)}
      >
        »
      </button>
    </div>
  )
}
