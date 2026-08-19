import express, { Request, Response } from 'express'
import request from 'supertest'
import Create from './createRoutes'
import { Services } from '../../../services'
import TokenStoreInterface from '../../../data/tokenStoreInterface'

jest.mock('isbinaryfile', () => ({
  isBinaryFileSync: jest.fn(),
}))

describe('Create appointment routes', () => {
  const tokenStore = {
    getToken: jest.fn(),
    delToken: jest.fn(),
  } as unknown as jest.Mocked<TokenStoreInterface>

  const services = {
    tokenStore,
    prisonService: {},
    activitiesService: {},
    metricsService: {},
    nonAssociationsService: {},
    alertsService: {},
  } as unknown as Services

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('redirects when posting to a journey step without an appointment journey', async () => {
    tokenStore.getToken.mockResolvedValue(null)

    const app = express()

    app.use(express.urlencoded({ extended: false }))

    app.use((req: Request, res: Response, next) => {
      req.session = {} as Request['session']
      next()
    })

    app.use('/appointments/create/:journeyId', Create(services))

    const response = await request(app).post('/appointments/create/test-journey/date-and-time').send({})

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/appointments')
  })
})
