import express, { Router } from 'express'

import healthcheck from '../services/healthCheck'
import { Services } from '../services'
import rolledOutPrison from '../services/rolledOutPrisonService'

export default function setUpHealthChecks({ activitiesService }: Services): Router {
  const router = express.Router()

  router.get('/health', (req, res) => {
    healthcheck(result => {
      if (!result.healthy) {
        res.status(503)
      }
      res.json(result)
    })
  })

  router.get('/info', rolledOutPrison(activitiesService))

  router.get('/ping', (req, res) =>
    res.send({
      status: 'UP',
    }),
  )

  return router
}
