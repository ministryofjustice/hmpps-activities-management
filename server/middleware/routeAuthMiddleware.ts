import { Request, Response, NextFunction, Router } from 'express'
import createHttpError from 'http-errors'
import config from '../config'
import { ServiceUser } from '../@types/express'

export default function routeAuthMiddleware(): Router {
  const router = Router({ mergeParams: true })

  config.routeAuth?.forEach(authItem => router.use(authItem.route, authRole(authItem.roles)))

  return router
}

export function authRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user as ServiceUser

    if (roles.find(role => user.roles.includes(role))) return next()

    return next(createHttpError.Forbidden())
  }
}
