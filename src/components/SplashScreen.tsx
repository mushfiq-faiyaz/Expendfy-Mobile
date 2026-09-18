import { useEffect, useState } from 'react'
import { ExpendfyLogo } from './ExpendfyLogo'
import { BrandWordmark } from './BrandWordmark'

export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Remove pre-mount initial splash if present
    const el = document.getElementById('initial-splash')
    if (el) el.remove()

    const fadeTimer = setTimeout(() => {
      setFading(true)
    }, 750)

    const removeTimer = setTimeout(() => {
      setVisible(false)
    }, 1050)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div className={`splash-overlay${fading ? ' splash-overlay--fadingout' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo-wrap">
          <ExpendfyLogo size={68} />
        </div>
        <BrandWordmark size="hero" layout="stacked" className="splash-brand" />
      </div>
    </div>
  )
}
