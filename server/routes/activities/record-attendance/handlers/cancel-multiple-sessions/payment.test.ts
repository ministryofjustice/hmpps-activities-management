import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import CancelMultipleSessionsPayRoutes, { SessionPayMultipleForm } from './payment'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Cancel Multiple Sessions Payment', () => {
  const handler = new CancelMultipleSessionsPayRoutes(activitiesService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        id: '1',
      },
      journeyData: {
        recordAttendanceJourney: {
          selectedInstanceIds: [1, 2],
          sessionCancellationMultiple: {
            issuePayment: false,
          },
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render with the expected view', async () => {
      const activityInstances = [
        {
          id: 1,
          timeSlot: 'AM',
          activitySchedule: {
            id: 2,
            activity: {
              id: 2,
              paid: true,
            },
          },
        },
        {
          id: 2,
          timeSlot: 'PM',
          activitySchedule: {
            id: 3,
            activity: {
              id: 3,
              paid: true,
            },
          },
        },
      ] as ScheduledActivity[]

      when(activitiesService.getScheduledActivities)
        .calledWith([1, 2], res.locals.user)
        .mockResolvedValue(activityInstances)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/cancel-multiple-sessions/payment', {
        allPaid: true,
        hasExternalEmployerPaid: false,
        paidActivities: activityInstances.map(a => a.activitySchedule.activity),
        allActivities: activityInstances.map(a => a.activitySchedule.activity),
      })
    })
  })

  describe('POST', () => {
    it('redirect and option is saved as expected when the issue pay option is yes', async () => {
      req.body = {
        issuePayOption: 'yes',
      }
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
      expect(req.journeyData.recordAttendanceJourney.sessionCancellationMultiple.issuePayment).toEqual(true)
    })

    it('redirect and option is saved as expected when the issue pay option is no', async () => {
      req.body = {
        issuePayOption: 'no',
      }
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
      expect(req.journeyData.recordAttendanceJourney.sessionCancellationMultiple.issuePayment).toEqual(false)
    })
  })

  describe('Validation', () => {
    it('should pass validation when issue pay option is set to "no"', async () => {
      const body = {
        issuePayOption: 'no',
      }

      const requestObject = plainToInstance(SessionPayMultipleForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([])
    })

    it('should pass validation when issue pay option is set to "yes"', async () => {
      const body = {
        issuePayOption: 'yes',
      }

      const requestObject = plainToInstance(SessionPayMultipleForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([])
    })

    it('should fail validation when issue pay option not provided', async () => {
      const body = {}

      const requestObject = plainToInstance(SessionPayMultipleForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Select if people should be paid for these cancelled sessions',
            property: 'issuePayOption',
          },
        ]),
      )
    })
  })
})
