import type { Request } from 'express'

const sensitivePathParents = new Set(['offender', 'offenderno', 'offenders', 'prisoner', 'prisoners', 'user', 'users'])

const knownStaticPathSegments = new Set([
  'activities',
  'activity',
  'allocate',
  'allocation-dashboard',
  'allocation',
  'allocations',
  'amend',
  'appointments',
  'attendance',
  'attendance-summary',
  'authenticate',
  'cancel',
  'change-of-circumstances',
  'components',
  'court',
  'create',
  'details',
  'edit',
  'exclude',
  'exclusions',
  'locations',
  'movement-list',
  'non-associations',
  'page',
  'prison',
  'prisoner',
  'prisoner-allocations',
  'prisoner-numbers',
  'prisoner-search',
  'prisoners',
  'prisons',
  'probation',
  'profileImage',
  'remove',
  'scheduled-instances',
  'schedules',
  'search',
  'series',
  'set',
  'start-date',
  'suspend',
  'suspensions',
  'unlock-list',
  'unsuspend',
  'users',
  'video-link-booking',
  'waitlist',
  'waitlist-dashboard',
])

const normaliseUntrustedSegment = (segment: string, allowNamedParameter: boolean): string => {
  if (!segment) return segment
  if (/^:[A-Za-z][A-Za-z0-9_]*$/.test(segment)) return allowNamedParameter ? segment : ':value'
  if (/^[*{]/.test(segment)) return ':path'

  let decoded: string
  try {
    decoded = decodeURIComponent(segment)
  } catch {
    return ':value'
  }

  if (/^\d{4}-\d{2}-\d{2}(?:T.*)?$/i.test(decoded)) return ':date'
  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(decoded)) return ':id'
  if (/^\d+(?:,\d+)*$/.test(decoded)) return ':id'
  if (/^[A-Z][A-Z0-9_.-]*$/.test(decoded)) return ':value'
  if (/\d/.test(decoded) && !/^[a-z]+-v\d+$/i.test(decoded)) return ':value'
  if (knownStaticPathSegments.has(decoded)) return decoded

  return ':value'
}

const normaliseRouteTemplateSegment = (segment: string): string => {
  if (!segment) return segment
  if (/^:[A-Za-z][A-Za-z0-9_]*$/.test(segment)) return segment
  if (/^[*{]/.test(segment)) return ':path'

  let decoded: string
  try {
    decoded = decodeURIComponent(segment)
  } catch {
    return ':value'
  }

  return /^[A-Za-z][A-Za-z0-9-]*$/.test(decoded) ? decoded : ':value'
}

interface NormalisePathOptions {
  allowNamedParameters?: boolean
  trustedRouteTemplate?: boolean
}

const normalisePath = (
  path: string,
  { allowNamedParameters = false, trustedRouteTemplate = false }: NormalisePathOptions = {},
): string => {
  let pathname: string
  try {
    pathname = new URL(path, 'http://local').pathname
  } catch {
    ;[pathname] = path.split('?')
  }

  const rawSegments = pathname.split('/')
  const segments = rawSegments.map((segment, index) => {
    let parentSegment = ''
    try {
      parentSegment = decodeURIComponent(rawSegments[index - 1] ?? '').toLowerCase()
    } catch {
      return ':value'
    }

    if (!trustedRouteTemplate && sensitivePathParents.has(parentSegment)) return ':value'

    return trustedRouteTemplate
      ? normaliseRouteTemplateSegment(segment)
      : normaliseUntrustedSegment(segment, allowNamedParameters)
  })
  const normalised = segments.join('/').replace(/\/{2,}/g, '/')
  return normalised.startsWith('/') ? normalised : `/${normalised}`
}

export const normaliseExpressRoute = (req: Request): string => {
  const rawRequestPath = req.originalUrl || req.url || '/'
  let pathname: string
  try {
    pathname = new URL(rawRequestPath, 'http://local').pathname
  } catch {
    ;[pathname] = rawRequestPath.split('?')
  }

  const parameterNamesByValue = new Map(
    Object.entries(req.params)
      .filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string' && /^[A-Za-z][A-Za-z0-9_]*$/.test(entry[0]),
      )
      .map(([name, value]) => [value, name]),
  )
  const parameterisedPath = pathname
    .split('/')
    .map(segment => {
      try {
        const parameterName = parameterNamesByValue.get(decodeURIComponent(segment))
        return parameterName ? `:${parameterName}` : segment
      } catch {
        return ':value'
      }
    })
    .join('/')
  const requestPath = normalisePath(parameterisedPath, { allowNamedParameters: true })
  const routePath = req.route?.path

  if (typeof routePath !== 'string' || routePath === '/' || routePath.length === 0) {
    return requestPath
  }

  const requestSegments = requestPath.split('/').filter(Boolean)
  const routeSegments = routePath.split('/').filter(Boolean).map(normaliseRouteTemplateSegment)

  if (routeSegments.length > requestSegments.length) return normalisePath(routePath, { trustedRouteTemplate: true })

  return `/${[...requestSegments.slice(0, requestSegments.length - routeSegments.length), ...routeSegments].join('/')}`
}

export const sanitiseDownstreamEndpoint = (path: unknown): string => {
  if (typeof path !== 'string') return '/:unknown'
  return normalisePath(path)
}
