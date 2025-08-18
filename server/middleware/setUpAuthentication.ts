import type { Router } from 'express'
import express from 'express'
import passport from 'passport'
import { getFrontendComponents } from '@ministryofjustice/hmpps-connect-dps-components'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import auth from '../authentication/auth'
import logger from '../../logger'
import { Services } from '../services'

const router = express.Router()

export default function setUpAuth(services: Services): Router {
  auth.init()

  router.use(passport.initialize())
  router.use(passport.session())

  router.get(
    '/autherror',
    getFrontendComponents({
      logger,
      authenticationClient: new AuthenticationClient(config.apis.hmppsAuth, logger, services.tokenStore),
      componentApiConfig: config.apis.componentApi,
      dpsUrl: config.dpsUrl,
    }),
    (req, res) => {
      res.status(401)
      return res.render('pages/autherror')
    },
  )

  router.get('/sign-in', passport.authenticate('oauth2'))

  router.get('/sign-in/callback', (req, res, next) =>
    passport.authenticate('oauth2', {
      successReturnToOrRedirect: req.session.returnTo || '/',
      failureRedirect: '/autherror',
    })(req, res, next),
  )

  const authUrl = config.apis.hmppsAuth.externalUrl
  const authSignOutUrl = `${authUrl}/sign-out?client_id=${config.apis.hmppsAuth.apiClientId}&redirect_uri=${config.domain}`

  router.use('/sign-out', (req, res, next) => {
    if (req.user) {
      req.logout(err => {
        if (err) return next(err)
        return req.session.destroy(() => res.redirect(authSignOutUrl))
      })
    } else res.redirect(authSignOutUrl)
  })

  router.use('/account-details', (req, res) => {
    res.redirect(`${authUrl}/account-details`)
  })

  router.use((req, res, next) => {
    res.locals.user = req.user
    next()
  })

  return router
}
