import express, { Router } from 'express'

import healthcheck from '../services/healthCheck'
import { Services } from '../services'

export default function setUpHealthChecks({ activitiesService, applicationInfo }: Services): Router {
  const router = express.Router()

  router.get('/health', (req, res) => {
    healthcheck(result => {
      if (!result.healthy) {
        res.status(503)
      }
      res.json(result)
    }, applicationInfo)
  })

  router.get('/info', (req, res) => {
    activitiesService.activeRolledPrisons().then(activeAgencies => {
      res.json({
        git: {
          branch: applicationInfo.branchName,
        },
        build: {
          artifact: applicationInfo.applicationName,
          version: applicationInfo.buildNumber,
          name: applicationInfo.applicationName,
        },
        productId: applicationInfo.productId,
        uptime: Math.floor(process.uptime()),
        activeAgencies,
      })
    })
  })

  router.get('/ping', (req, res) =>
    res.send({
      status: 'UP',
    }),
  )

  return router
}
