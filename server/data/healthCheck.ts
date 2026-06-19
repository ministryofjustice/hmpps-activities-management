import { RestClient } from '@ministryofjustice/hmpps-rest-client'
import logger from '../../logger'
import { AgentConfig } from '../config'

export type ServiceCheck = () => Promise<string>

export class ServiceTimeout {
  response = 1500

  deadline = 2000
}

export function serviceCheckFactory(
  name: string,
  url: string,
  agentOptions: AgentConfig,
  serviceTimeout: ServiceTimeout = new ServiceTimeout(),
): ServiceCheck {
  const client = new RestClient(
    name,
    {
      url,
      timeout: serviceTimeout,
      agent: agentOptions,
    },
    logger,
  )

  return async () => {
    try {
      const result = await client.get(
        {
          path: '',
          raw: true,
          retries: 2,
          retryHandler: () => err => {
            if (err) {
              const maybeError = err as Error & { code?: string }
              logger.info(`Retry handler found API error with ${maybeError.code} ${maybeError.message} when calling ${name}`)
            }
            return undefined
          },
        },
        undefined,
      )

      if (result && typeof result === 'object' && 'status' in result && result.status === 200) {
        return 'OK'
      }

      throw new Error(`Health check for ${name} did not return HTTP 200`)
    } catch (error) {
      const maybeError = error as Error
      logger.error(maybeError.stack, `Error calling ${name}`)
      throw error
    }
  }
}
