import express, { NextFunction, Request, Response } from 'express'
import { v4 as uuidV4 } from 'uuid'
import request from 'supertest'
import EventEmitter from 'node:events'
import renderInterceptor from './renderInterceptor'
import errorHandler from '../errorHandler'

const journeyId = uuidV4()
const username = 'BLOGGSJ'

describe('renderInterceptor', () => {
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
  })

  const delay = (ms: number) => {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }

  it('saves journey data and renders when redis is quick', async () => {
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
      res.render = jest.fn()
      next()
    })

    app.use(renderInterceptor(tokenStore))

    app.use(errorHandler(false))

    app.get('/:journeyId/this-location', (req, res) => {
      res.render('view', {})
      res.sendStatus(200)
    })

    await request(app).get(`/${journeyId}/this-location`).expect(200)

    expect(tokenStore.setTokenAndEmit).toHaveBeenCalledWith(
      `journey.${username}.${journeyId}`,
      '{"createJourney":{"activityId":123}}',
      86400,
      expect.any(EventEmitter),
    )
  })

  it('saves journey data and renders when redis is slow', async () => {
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
      res.render = jest.fn()
      next()
    })

    app.use(renderInterceptor(tokenStore))

    app.use(errorHandler(false))

    app.get('/:journeyId/this-location', (req, res) => {
      res.render('view', {})
      res.sendStatus(200)
    })

    await request(app).get(`/${journeyId}/this-location`).expect(200)

    expect(tokenStore.setTokenAndEmit).toHaveBeenCalledWith(
      `journey.${username}.${journeyId}`,
      '{"createJourney":{"activityId":123}}',
      86400,
      expect.any(EventEmitter),
    )
  })

  it('does not save journey data but does render', async () => {
    tokenStore.setTokenAndEmit = jest.fn()

    app.use((req: Request, res: Response, next: NextFunction) => {
      req.user = { username } as Express.User
      req.params = { journeyId }
      req.journeyData = { createJourney: { activityId: 123 } }
      res.render = jest.fn()
      next()
    })

    app.use(renderInterceptor(tokenStore))

    app.use(errorHandler(false))

    app.get('/:journeyId/this-location', (req, res) => {
      res.render('view', {})
      res.sendStatus(200)
    })

    await request(app).get(`/${journeyId}/this-location`).expect(200)

    expect(tokenStore.setToken).not.toHaveBeenCalled()
  })
})
