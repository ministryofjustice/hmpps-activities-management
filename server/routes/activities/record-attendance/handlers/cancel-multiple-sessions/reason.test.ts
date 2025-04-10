import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import CancelMultipleSessionsReasonRoutes, { CancelReasonMultipleForm } from './reason'
import cancellationReasons from '../../cancellationReasons'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Cancel Multiple Sessions Reason', () => {
  const handler = new CancelMultipleSessionsReasonRoutes(activitiesService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      params: {
        id: '1',
      },
      session: {
        recordAttendanceJourney: {
          selectedInstanceIds: [1, 2],
        },
      },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('should render cancel multiple sessions reasons page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/cancel-multiple-sessions/cancel-reason',
        {
          cancellationReasons,
        },
      )
    })
  })

  describe('POST', () => {
    let addReasonRequest: Request

    beforeEach(() => {
      addReasonRequest = {
        ...req,
        body: {
          reason: 'LOCATION_UNAVAILABLE',
          comment: 'A comment',
        },
      } as unknown as Request
    })

    it('should add cancel reason to session and redirect to payment page if payment required', async () => {
      when(activitiesService.getScheduledActivities)
        .calledWith([1, 2], res.locals.user)
        .mockResolvedValue([
          {
            id: 1,
            activitySchedule: {
              id: 2,
              activity: {
                id: 2,
                paid: true,
              },
            },
          } as ScheduledActivity,
          {
            id: 2,
            activitySchedule: {
              id: 2,
              activity: {
                id: 2,
                paid: false,
              },
            },
          } as ScheduledActivity,
        ])

      await handler.POST(addReasonRequest, res)

      expect(addReasonRequest.session.recordAttendanceJourney.sessionCancellationMultiple).toEqual({
        reason: cancellationReasons.LOCATION_UNAVAILABLE,
        comment: 'A comment',
        issuePayment: false,
      })

      expect(res.redirect).toHaveBeenCalledWith('payment')
    })

    it('should add cancel reason to session and redirect to check answers page if payment not required', async () => {
      when(activitiesService.getScheduledActivities)
        .calledWith([1, 2], res.locals.user)
        .mockResolvedValue([
          {
            id: 1,
            activitySchedule: {
              id: 2,
              activity: {
                id: 2,
                paid: false,
              },
            },
          } as ScheduledActivity,
          {
            id: 2,
            activitySchedule: {
              id: 2,
              activity: {
                id: 2,
                paid: false,
              },
            },
          } as ScheduledActivity,
        ])

      await handler.POST(addReasonRequest, res)

      expect(addReasonRequest.session.recordAttendanceJourney.sessionCancellationMultiple).toEqual({
        reason: cancellationReasons.LOCATION_UNAVAILABLE,
        comment: 'A comment',
        issuePayment: false,
      })

      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('validation', () => {
    it('should require a reason', async () => {
      const body = {}

      const requestObject = plainToInstance(CancelReasonMultipleForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'reason', error: "Select why you're cancelling these sessions" }]),
      )
    })

    it('should require a valid reason', async () => {
      const body = {
        reason: 'AN_INVALID_REASON',
      }

      const requestObject = plainToInstance(CancelReasonMultipleForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'reason', error: "Select why you're cancelling these sessions" }]),
      )
    })

    it("comment shouldn't exceed 100 characters", async () => {
      const body = {
        comment: 'a'.repeat(101),
      }

      const requestObject = plainToInstance(CancelReasonMultipleForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'comment', error: 'Details must be 100 characters or less' }]),
      )
    })
  })
})
