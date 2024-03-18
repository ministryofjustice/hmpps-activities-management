import promClient from 'prom-client'
import { serviceCheckFactory } from '../data/healthCheck'
import config from '../config'
import type { AgentConfig } from '../config'

const healthCheckGauge = new promClient.Gauge({
  name: 'upstream_healthcheck',
  help: 'health of an upstream dependency - 1 = healthy, 0 = not healthy',
  labelNames: ['service'],
})

interface HealthCheckStatus {
  name: string
  status: string
  message: unknown
}

interface HealthCheckResult extends Record<string, unknown> {
  healthy: boolean
  checks: Record<string, unknown>
}

export type HealthCheckService = () => Promise<HealthCheckStatus>
export type HealthCheckCallback = (result: HealthCheckResult) => void

function service(name: string, url: string, agentConfig: AgentConfig): HealthCheckService {
  const check = serviceCheckFactory(name, url, agentConfig)
  return () =>
    check()
      .then(result => ({ name, status: 'ok', message: result }))
      .catch(err => ({ name, status: 'ERROR', message: err }))
}

function addAppInfo(result: HealthCheckResult): HealthCheckResult {
  const buildInformation = getBuild()
  const buildInfo = {
    uptime: process.uptime(),
    build: buildInformation,
    version: buildInformation && buildInformation.buildNumber,
  }

  return { ...result, ...buildInfo }
}

function getBuild() {
  try {
    // eslint-disable-next-line import/no-unresolved,global-require
    return require('../../build-info.json')
  } catch (ex) {
    return null
  }
}

function gatherCheckInfo(aggregateStatus: Record<string, unknown>, currentStatus: HealthCheckStatus) {
  return { ...aggregateStatus, [currentStatus.name]: currentStatus.message }
}

const apiChecks = [
  service('hmppsAuth', `${config.apis.hmppsAuth.url}/health/ping`, config.apis.hmppsAuth.agent),
  service('activitiesApi', `${config.apis.activitiesApi.url}/health/ping`, config.apis.activitiesApi.agent),
  service('caseNotesApi', `${config.apis.caseNotesApi.url}/health/ping`, config.apis.caseNotesApi.agent),
  service('prisonApi', `${config.apis.prisonApi.url}/health/ping`, config.apis.prisonApi.agent),
  service('prisonerSearchApi', `${config.apis.prisonerSearchApi.url}/health/ping`, config.apis.prisonerSearchApi.agent),
  service('incentivesApi', `${config.apis.incentivesApi.url}/health/ping`, config.apis.incentivesApi.agent),
  service('frontendComponents', `${config.apis.frontendComponents.url}/health`, config.apis.frontendComponents.agent),
  service('prisonRegisterApi', `${config.apis.prisonRegisterApi.url}/health/ping`, config.apis.prisonRegisterApi.agent),
  service('manageUsersApi', `${config.apis.manageUsersApi.url}/health/ping`, config.apis.manageUsersApi.agent),
  ...(config.apis.tokenVerification.enabled
    ? [
        service(
          'tokenVerification',
          `${config.apis.tokenVerification.url}/health/ping`,
          config.apis.tokenVerification.agent,
        ),
      ]
    : []),
]

export default function healthCheck(callback: HealthCheckCallback, checks = apiChecks): void {
  Promise.all(checks.map(fn => fn())).then(checkResults => {
    const allOk = checkResults.every(item => item.status === 'ok')

    const result = {
      healthy: allOk,
      checks: checkResults.reduce(gatherCheckInfo, {}),
    }

    checkResults.forEach(item => {
      const val = item.status === 'ok' ? 1 : 0
      healthCheckGauge.labels(item.name).set(val)
    })

    callback(addAppInfo(result))
  })
}
