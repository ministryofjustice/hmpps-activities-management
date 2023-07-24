import type { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4, validate } from 'uuid'

export default function insertJourneyIdentifier(route: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuid = req.originalUrl.split(route)[1].split('/')[0]
    if (!validate(uuid)) {
      return res.redirect(req.originalUrl.replace(route, `${route}${uuidv4()}/`))
    }
    return next()
  }
}
