import { Router } from 'express'
import { DataAccess } from '../data'

export default function setUpFrontendComponents({ frontendComponentApiClient }: DataAccess): Router {
  const router = Router({ mergeParams: true })

  router.get('*', async (req, res, next) => {
    const { user } = res.locals
    const [header, footer] = await Promise.all([
      frontendComponentApiClient.getComponent('header', user),
      frontendComponentApiClient.getComponent('footer', user),
    ])
    res.locals.feComponents = {
      header: header.html,
      footer: footer.html,
      cssIncludes: [...header.css, ...footer.css],
      jsIncludes: [...header.javascript, ...footer.javascript],
    }
    next()
  })

  return router
}
