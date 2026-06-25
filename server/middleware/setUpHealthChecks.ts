import express, { Router } from 'express'

import createMonitoringMiddleware from '../services/healthCheck'
import { Services } from '../services'

export default function setUpHealthChecks({ activitiesService, applicationInfo }: Services): Router {
  const router = express.Router()
  const monitoring = createMonitoringMiddleware(applicationInfo)

  router.get('/health', monitoring.health)

  router.get('/ping', monitoring.ping)

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
