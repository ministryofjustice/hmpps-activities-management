import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { PrisonPayBand } from '../../../../@types/activitiesAPI/types'
import SuspensionPayRoutes, { SuspensionPay } from './pay'
import { YesNo } from '../../../../@types/activities'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Suspensions - Pay', () => {
  const handler = new SuspensionPayRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      body: {},
      query: {},
      session: {
        suspendJourney: {
          inmate: {
            prisonerName: 'Fred Smith',
          },
          allocations: [
            {
              activityId: 1,
              allocationId: 2,
              activityName: 'Activity A1',
              payBand: {} as PrisonPayBand,
            },
          ],
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/suspensions/pay', { extraContent: false })
    })
  })
  describe('POST', () => {
    it('should add YES to the session', async () => {
      req.body = {
        pay: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(req.session.suspendJourney.toBePaid).toEqual(YesNo.YES)
    })
    it('should add NO to the session', async () => {
      req.body = {
        pay: YesNo.NO,
      }

      await handler.POST(req, res)

      expect(req.session.suspendJourney.toBePaid).toEqual(YesNo.NO)
    })
  })
  describe('VALIDATION', () => {
    it('cannot be left blank', async () => {
      const body = {}

      const session = {
        suspendJourney: {
          inmate: {
            prisonerName: 'Fred Smith',
            prisonerNumber: 'G6123VU',
          },
        },
      }

      const requestObject = plainToInstance(SuspensionPay, { ...body, ...session })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            property: 'pay',
            error: `Select yes if Fred Smith should be paid while they’re suspended`,
          },
        ]),
      )
    })

    it('choice cannot be an unknown value', async () => {
      const body = {
        pay: 'unknown',
      }

      const session = {
        suspendJourney: {
          inmate: {
            prisonerName: 'Fred Smith',
            prisonerNumber: 'G6123VU',
          },
        },
      }

      const requestObject = plainToInstance(SuspensionPay, { ...body, ...session })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            property: 'pay',
            error: `Select yes if Fred Smith should be paid while they’re suspended`,
          },
        ]),
      )
    })

    it('passes', async () => {
      const body = {
        pay: YesNo.YES,
      }

      const session = {
        suspendJourney: {
          inmate: {
            prisonerName: 'Fred Smith',
            prisonerNumber: 'G6123VU',
          },
        },
      }

      const requestObject = plainToInstance(SuspensionPay, { ...body, ...session })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
