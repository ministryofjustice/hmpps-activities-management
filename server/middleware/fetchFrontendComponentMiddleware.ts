import { Router } from 'express'
import { DataAccess } from '../data'
import logger from '../../logger'
import config from '../config'

export default function setUpFrontendComponents({ frontendComponentApiClient }: DataAccess): Router {
  const router = Router({ mergeParams: true })

  router.get('*', async (req, res, next) => {
    try {
      // Frontend components API is only used when feature toggle is provided
      if (config.frontendComponentsApiToggleEnabled) {
        const { user } = res.locals
        const { header, footer } = await frontendComponentApiClient.getComponents(['header', 'footer'], user)
        res.locals.feComponents = {
          header: header.html,
          footer: footer.html,
          cssIncludes: [...header.css, ...footer.css],
          jsIncludes: [...header.javascript, ...footer.javascript],
        }
      }
    } catch (error) {
      logger.error(error, 'Failed to retrieve front end components')
    }
    next()
  })

  return router
}
