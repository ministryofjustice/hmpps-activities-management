import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import BankHolidayOptionRoutes, { BankHolidayOption } from './bankHoliday'
import { associateErrorsWithProperty } from '../../../utils/utils'
import ActivitiesService from '../../../services/activitiesService'
import atLeast from '../../../../jest.setup'
import activity from '../../../services/fixtures/activity_1.json'
import { Activity } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity schedule - Bank Holiday option', () => {
  const handler = new BankHolidayOptionRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/bank-holiday-option')
    })
  })

  describe('POST', () => {
    it('should save selected option in session and redirect to location page', async () => {
      req.body = {
        runsOnBankHoliday: 'yes',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.runsOnBankHoliday).toEqual(true)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('location')
    })

    it('should save entered end date in database', async () => {
      const updatedActivity = {
        runsOnBankHoliday: true,
      }

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      const runsOnBankHoliday = true

      req = {
        session: {
          createJourney: { activityId: 1, name: 'Maths level 1' },
        },
        query: {
          fromEditActivity: true,
        },
        body: {
          runsOnBankHoliday,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/activities/schedule/activities/1',
        'Activity updated',
        "We've updated the bank holiday option for Maths level 1",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        runsOnBankHoliday: '',
      }

      const requestObject = plainToInstance(BankHolidayOption, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'runsOnBankHoliday', error: 'Choose whether you want the schedule to run on a bank holiday.' },
      ])
    })
  })
})
