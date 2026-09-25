type BackButtonProps = {
  fallback?: string
  label?: string
  onBack?: () => void
}

export function BackButton({ fallback = '/', label = 'Back', onBack }: BackButtonProps) {
  function handleBack() {
    if (onBack) {
      onBack()
      return
    }

    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.history.pushState({}, '', fallback)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return <button className="back-button" type="button" onClick={handleBack} aria-label={label}>
    <span aria-hidden="true">←</span>
    <span className="back-button-label">{label}</span>
  </button>
}
