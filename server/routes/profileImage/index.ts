import path from 'path'
import express, { Router } from 'express'
import PrisonService from '../../services/prisonService'
import asyncMiddleware from '../../middleware/asyncMiddleware'

export default function profileImageRoutes({ prisonService }: { prisonService: PrisonService }): Router {
  const router = express.Router()

  router.get(
    '/:prisonerNumber/image',
    asyncMiddleware(async (req, res, next) => {
      prisonService
        .getPrisonerImage(req.params.prisonerNumber, res.locals.user)
        .then(data => {
          res.type('image/jpeg')
          data.pipe(res)
        })
        .catch(() => {
          const placeHolder = path.join(process.cwd(), '/frontend/images/image-missing.jpg')
          res.sendFile(placeHolder)
        })
    }),
  )

  return router
}
