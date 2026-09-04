import type { Request } from 'express'

const sensitivePathParents = new Set(['offender', 'offenderno', 'offenders', 'prisoner', 'prisoners', 'user', 'users'])

const normaliseSegment = (segment: string): string => {
  if (!segment) return segment
  if (/^:[A-Za-z][A-Za-z0-9_]*$/.test(segment)) return segment
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
  if (decoded.length > 40 || !/^[a-z][a-z-]*$/.test(decoded)) return ':value'

  return decoded
}

const normalisePath = (path: string): string => {
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

    return sensitivePathParents.has(parentSegment) ? ':value' : normaliseSegment(segment)
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
  const requestPath = normalisePath(parameterisedPath)
  const routePath = req.route?.path

  if (typeof routePath !== 'string' || routePath === '/' || routePath.length === 0) {
    return requestPath
  }

  const requestSegments = requestPath.split('/').filter(Boolean)
  const routeSegments = routePath.split('/').filter(Boolean).map(normaliseSegment)

  if (routeSegments.length > requestSegments.length) return normalisePath(routePath)

  return `/${[...requestSegments.slice(0, requestSegments.length - routeSegments.length), ...routeSegments].join('/')}`
}

export const sanitiseDownstreamEndpoint = (path: unknown): string => {
  if (typeof path !== 'string') return '/:unknown'
  return normalisePath(path)
}
