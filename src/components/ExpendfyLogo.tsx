export function ExpendfyLogo({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/expendfy-logo.png"
      alt="Expendfy logo"
      width={size}
      height={size}
      className="expendfy-logo"
      style={{ objectFit: 'contain', borderRadius: 8 }}
    />
  )
}
