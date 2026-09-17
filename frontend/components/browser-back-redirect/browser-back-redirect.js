const stateKey = 'browserBackRedirect'

export default function BrowserBackRedirect(element) {
  const redirectUrl = element.getAttribute('content')
  if (!redirectUrl) return

  if (window.history.state?.[stateKey] !== redirectUrl) {
    window.history.replaceState({ ...(window.history.state || {}), [stateKey]: redirectUrl }, '')
    window.history.pushState({ [stateKey]: redirectUrl }, '', window.location.href)
  }

  window.addEventListener('popstate', () => window.location.assign(redirectUrl))
}
