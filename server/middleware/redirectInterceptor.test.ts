import express, { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'crypto'
import request from 'supertest'
import EventEmitter from 'node:events'
import redirectInterceptor from './redirectInterceptor'

const journeyId = randomUUID()
const username = 'BLOGGSJ'

describe('redirectInterceptor', () => {
  let tokenStore
  let app

  beforeEach(() => {
    tokenStore = {
      getToken: jest.fn(),
      setToken: jest.fn(),
      setTokenAndEmit: jest.fn(),
      delToken: jest.fn(),
    }

    app = express()

    app.use(redirectInterceptor(tokenStore))
  })

  const delay = (ms: number) => {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }

  it('saves journey data and redirects when redis is quick', async () => {
    tokenStore.setTokenAndEmit = jest.fn(
      async (key: string, token: string, durationSeconds: number, bus?: EventEmitter): Promise<void> => {
        bus.emit(key)
        return Promise.resolve()
      },
    )

    app.use((req: Request, res: Response, next: NextFunction) => {
      req.user = { username } as Express.User
      req.params = { journeyId }
      req.journeyData = { createJourney: { activityId: 123 } }
      next()
    })

    app.get('/:journeyId/this-location', (req, res) => {
      return res.redirect('/next-location')
    })

    const res = await request(app)
      .get(`/${journeyId}/this-location`)
      .redirects(0) // do not follow
      .expect(302)

    expect(res.header.location).toBe('/next-location')
    expect(tokenStore.setTokenAndEmit).toHaveBeenCalledWith(
      `journey.${username}.${journeyId}`,
      '{"createJourney":{"activityId":123}}',
      28800,
      expect.any(EventEmitter),
    )
  })

  it('saves journey data and redirects when redis is slow', async () => {
    tokenStore.setTokenAndEmit = jest.fn(
      async (key: string, token: string, durationSeconds: number, bus?: EventEmitter): Promise<void> => {
        await delay(100)
        bus.emit(key)
        return Promise.resolve()
      },
    )

    app.use((req: Request, res: Response, next: NextFunction) => {
      req.user = { username } as Express.User
      req.params = { journeyId }
      req.journeyData = { createJourney: { activityId: 123 } }
      next()
    })

    app.get('/:journeyId/this-location', (req, res) => {
      return res.redirect('/next-location')
    })

    const res = await request(app)
      .get(`/${journeyId}/this-location`)
      .redirects(0) // do not follow
      .expect(302)

    expect(res.header.location).toBe('/next-location')
    expect(tokenStore.setTokenAndEmit).toHaveBeenCalledWith(
      `journey.${username}.${journeyId}`,
      '{"createJourney":{"activityId":123}}',
      28800,
      expect.any(EventEmitter),
    )
  })

  it('does not save journey data but redirects', async () => {
    tokenStore.setToken = jest.fn()

    app.use((req: Request, res: Response, next: NextFunction) => {
      req.user = { username } as Express.User
      req.params = { journeyId }
      next()
    })

    app.get('/:journeyId/this-location', (req, res) => {
      return res.redirect('/next-location')
    })

    const res = await request(app)
      .get(`/${journeyId}/this-location`)
      .redirects(0) // do not follow
      .expect(302)

    expect(res.header.location).toBe('/next-location')
    expect(tokenStore.setToken).not.toHaveBeenCalled()
  })
})
