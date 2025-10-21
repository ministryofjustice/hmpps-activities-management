import express, { Request, Response } from 'express'
import request from 'supertest'
import syncJourneyDataToLocals from './syncJourneyDataToLocals'
import { AllocateToActivityJourney } from '../routes/activities/manage-allocations/journey'

describe('syncJourneyDataToLocals middleware', () => {
  it('should copy req.journeyData to res.locals', async () => {
    const app = express()
    app.use((req: Request, res: Response, next) => {
      req.journeyData = {
        allocateJourney: {
          activity: {
            activityId: 539,
            scheduleId: 518,
            name: 'A Wing Cleaner 2',
            startDate: '2023-10-24',
            scheduleWeeks: 1,
          },
        } as AllocateToActivityJourney,
      }
      next()
    })

    app.use(syncJourneyDataToLocals())
    app.get('/', (req, res) => {
      res.json(res.locals)
    })

    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      allocateJourney: {
        activity: {
          activityId: 539,
          scheduleId: 518,
          name: 'A Wing Cleaner 2',
          startDate: '2023-10-24',
          scheduleWeeks: 1,
        },
      } as AllocateToActivityJourney,
    })
  })

  it('should not modify res.locals if req.journeyData is undefined', async () => {
    const app = express()

    app.use(syncJourneyDataToLocals())

    app.get('/', (req, res) => {
      res.json(res.locals)
    })

    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({})
  })
})
