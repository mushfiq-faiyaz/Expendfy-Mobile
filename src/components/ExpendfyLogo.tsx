export function ExpendfyLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden
      className="expendfy-logo"
    >
      <rect width="40" height="40" rx="8" fill="#1e293b" />
      <text x="6" y="27" fontSize="20" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#ef4444">
        E
      </text>
      <text x="20" y="27" fontSize="13" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#eab308">
        fy
      </text>
    </svg>
  )
}
