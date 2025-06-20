import type { NextFunction, Request, Response } from 'express'

export default function insertRouteContext(mode: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    req.routeContext = { mode }
    return next()
  }
}
