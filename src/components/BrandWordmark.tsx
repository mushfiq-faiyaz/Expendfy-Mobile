type Props = {
  size?: 'sm' | 'md' | 'lg' | 'hero'
  layout?: 'stacked' | 'inline'
  className?: string
}

export function BrandWordmark({ size = 'md', layout = 'stacked', className = '' }: Props) {
  return (
    <div
      className={`brand-wordmark brand-wordmark--${size} brand-wordmark--${layout} ${className}`.trim()}
      aria-label="Expendfy Persona"
    >
      <span className="brand-wordmark__title">Expendfy</span>
      <span className="brand-wordmark__persona">Persona</span>
    </div>
  )
}
