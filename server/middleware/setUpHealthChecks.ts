import express, { Router } from 'express'

import healthcheck from '../services/healthCheck'
import { Services } from '../services'

export default function setUpHealthChecks({ activitiesService, applicationInfo }: Services): Router {
  const router = express.Router()

  router.get('/health', (req, res, next) => {
    healthcheck(applicationInfo, result => {
      if (result.status !== 'UP') {
        res.status(503)
      }
      res.json(result)
    })
  })

  router.get('/ping', (req, res) => {
    res.json({
      status: 'UP',
    })
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

  return router
}
