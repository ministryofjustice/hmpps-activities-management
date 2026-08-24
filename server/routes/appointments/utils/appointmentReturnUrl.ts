const LOCAL_ORIGIN = 'http://localhost'

export const getAppointmentsDashboardReturnUrl = (returnUrl: unknown): string | undefined => {
  if (typeof returnUrl !== 'string') return undefined
  if (!returnUrl.startsWith('/') || returnUrl.startsWith('//')) return undefined

  try {
    const url = new URL(returnUrl, LOCAL_ORIGIN)

    if (url.origin !== LOCAL_ORIGIN || url.pathname !== '/appointments/search') return undefined

    return returnUrl
  } catch {
    return undefined
  }
}

export const getAppointmentsDashboardReturnUrlFromReferrer = (referrer?: string): string | undefined => {
  if (!referrer) return undefined

  try {
    const url = new URL(referrer, LOCAL_ORIGIN)
    return getAppointmentsDashboardReturnUrl(url.searchParams.get('returnUrl'))
  } catch {
    return undefined
  }
}
