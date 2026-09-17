import express from 'express'
import request from 'supertest'
import { endpointHealthComponent } from '@ministryofjustice/hmpps-monitoring'
import setUpHealthChecks from './setUpHealthChecks'
import config from '../config'
import type { Services } from '../services'

jest.mock('@ministryofjustice/hmpps-monitoring', () => {
  const actual = jest.requireActual('@ministryofjustice/hmpps-monitoring')

  return {
    ...actual,
    endpointHealthComponent: jest.fn(),
  }
})

const mockedEndpointHealthComponent = jest.mocked(endpointHealthComponent)

const applicationInfo = {
  applicationName: 'hmpps-activities-management',
  buildNumber: '1_0_0',
  gitRef: 'abcdef123456',
  gitShortHash: 'abcdef1',
  productId: 'DPS035',
  branchName: 'main',
}

describe('Health check endpoints', () => {
  const originalTokenVerificationEnabled = config.apis.tokenVerification.enabled

  const createApp = (tokenVerificationDown = false) => {
    mockedEndpointHealthComponent.mockImplementation(
      (_logger, name, options) =>
        ({
          isEnabled: () => options.enabled ?? true,
          health: jest.fn().mockResolvedValue(
            name === 'tokenVerification' && tokenVerificationDown
              ? {
                  name,
                  status: 'DOWN',
                  details: { status: 500 },
                }
              : {
                  name,
                  status: 'UP',
                },
          ),
        }) as unknown as ReturnType<typeof endpointHealthComponent>,
    )

    const app = express()

    app.use(
      setUpHealthChecks({
        applicationInfo,
        activitiesService: {
          activeRolledPrisons: jest.fn(),
        },
      } as unknown as Services),
    )

    return app
  }

  beforeEach(() => {
    jest.resetAllMocks()
    config.apis.tokenVerification.enabled = true
  })

  afterAll(() => {
    config.apis.tokenVerification.enabled = originalTokenVerificationEnabled
  })

  it('should report the application as UP when all dependencies are healthy', async () => {
    const response = await request(createApp()).get('/health').expect(200)

    expect(response.body.status).toBe('UP')
  })

  it('should report ping as UP', async () => {
    const response = await request(createApp()).get('/ping').expect(200)

    expect(response.body).toEqual({ status: 'UP' })
  })

  it('should report token verification and the application as DOWN when token verification is unhealthy', async () => {
    const response = await request(createApp(true)).get('/health').expect(500)

    expect(response.body).toMatchObject({
      status: 'DOWN',
      components: {
        hmppsAuth: {
          status: 'UP',
        },
        incentivesApi: {
          status: 'UP',
        },
        tokenVerification: {
          status: 'DOWN',
          details: {
            status: 500,
          },
        },
      },
    })
  })
})
