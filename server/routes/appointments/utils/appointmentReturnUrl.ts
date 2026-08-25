export const getAppointmentsDashboardReturnUrl = (returnUrl: unknown): string | undefined => {
  if (typeof returnUrl !== 'string') return undefined

  return returnUrl === '/appointments/search' || returnUrl.startsWith('/appointments/search?') ? returnUrl : undefined
}

export const getAppointmentsDashboardReturnUrlFromReferrer = (referrer?: string): string | undefined => {
  if (!referrer) return undefined

  try {
    const url = new URL(referrer)
    return getAppointmentsDashboardReturnUrl(url.searchParams.get('returnUrl'))
  } catch {
    return undefined
  }
}
