import { Request, Response, NextFunction, Router } from 'express'
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
    const userRoleCodes = user.roles?.map(r => r?.code)

    if (roles.find(role => userRoleCodes.includes(role))) return next()

    res.status(401)
    return res.render('pages/error', {
      message: 'Unauthorised access',
      status: 401,
      stack:
        `Active user '${user.username}' does not have the required role to access this resource.\n\n` +
        `Authorised roles:\n` +
        `${roles.join('\n')}`,
    })
  }
}
