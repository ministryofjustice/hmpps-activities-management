import { endpointHealthComponent, monitoringMiddleware } from '@ministryofjustice/hmpps-monitoring'
import logger from '../../logger'
import config from '../config'
import type { ApplicationInfo } from '../applicationInfo'

export default function createMonitoringMiddleware(applicationInfo: ApplicationInfo) {
  return monitoringMiddleware({
    applicationInfo,
    healthComponents: [
      endpointHealthComponent(logger, 'hmppsAuth', { url: config.apis.hmppsAuth.url, healthPath: '/health/ping' }),
      endpointHealthComponent(logger, 'activitiesApi', {
        url: config.apis.activitiesApi.url,
        healthPath: '/health/ping',
      }),
      endpointHealthComponent(logger, 'caseNotesApi', {
        url: config.apis.caseNotesApi.url,
        healthPath: '/health/ping',
      }),
      endpointHealthComponent(logger, 'prisonApi', { url: config.apis.prisonApi.url, healthPath: '/health/ping' }),
      endpointHealthComponent(logger, 'prisonerSearchApi', {
        url: config.apis.prisonerSearchApi.url,
        healthPath: '/health/ping',
      }),
      endpointHealthComponent(logger, 'incentivesApi', {
        url: config.apis.incentivesApi.url,
        healthPath: '/health/ping',
      }),
      endpointHealthComponent(logger, 'manageUsersApi', {
        url: config.apis.manageUsersApi.url,
        healthPath: '/health/ping',
      }),
      endpointHealthComponent(logger, 'nonAssociationsApi', {
        url: config.apis.nonAssociationsApi.url,
        healthPath: '/health/ping',
      }),
      endpointHealthComponent(logger, 'alertsApi', { url: config.apis.alertsApi.url, healthPath: '/health/ping' }),
      endpointHealthComponent(logger, 'bookAVideoLinkApi', {
        url: config.apis.bookAVideoLinkApi.url,
        healthPath: '/health/ping',
      }),
      endpointHealthComponent(logger, 'locationsInsidePrisonApi', {
        url: config.apis.locationsInsidePrisonApi.url,
        healthPath: '/health/ping',
      }),
      endpointHealthComponent(logger, 'nomisMapping', {
        url: config.apis.nomisMapping.url,
        healthPath: '/health/ping',
      }),
      endpointHealthComponent(logger, 'tokenVerification', {
        url: config.apis.tokenVerification.url,
        healthPath: '/health/ping',
        enabled: config.apis.tokenVerification.enabled,
      }),
    ],
  })
}
