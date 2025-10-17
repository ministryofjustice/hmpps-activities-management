import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import CancelSingleSessionsReasonRoutes, { CancelReasonSingleForm } from './reason'
import CancellationReasons from '../../cancellationReasons'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Cancel Single Session Reason', () => {
  const handler = new CancelSingleSessionsReasonRoutes(activitiesService)

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
      journeyData: {
        recordAttendanceJourney: {
          selectedInstanceIds: [1, 2],
        },
      },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('should render cancel single session reasons page', async () => {
      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          activitySchedule: {
            id: 2,
            activity: {
              id: 2,
              summary: 'Kitchen tasks',
              paid: true,
            },
          },
        } as ScheduledActivity)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/cancel-single-session/cancel-reason',
        {
          activityName: 'Kitchen tasks',
          cancellationReasons: CancellationReasons,
        },
      )
    })

    it('should redirect to record attendance dashboard when record attendance journey data is not available', async () => {
      req = {
        query: {},
        params: {
          id: '1',
        },
        journeyData: {
          recordAttendanceJourney: undefined,
        },
      } as unknown as Request

      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('/activities/attendance')
    })
  })

  describe('POST', () => {
    let addReasonRequest: Request

    beforeEach(() => {
      addReasonRequest = {
        ...req,
        body: {
          activityName: 'Kitchen tasks',
          reason: 'LOCATION_UNAVAILABLE',
          comment: 'A comment',
        },
      } as unknown as Request
    })

    it('should add cancel reason to session and redirect to payment page if payment required', async () => {
      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          activitySchedule: {
            id: 2,
            activity: {
              id: 2,
              summary: 'Kitchen tasks',
              paid: true,
            },
          },
        } as ScheduledActivity)

      await handler.POST(addReasonRequest, res)

      expect(addReasonRequest.journeyData.recordAttendanceJourney.sessionCancellationSingle).toEqual({
        activityName: 'Kitchen tasks',
        reason: CancellationReasons.LOCATION_UNAVAILABLE,
        comment: 'A comment',
        issuePayment: false,
      })

      expect(res.redirect).toHaveBeenCalledWith('payment')
    })

    it('should add cancel reason to session and redirect to check answers page if payment not required', async () => {
      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          activitySchedule: {
            id: 2,
            activity: {
              id: 2,
              summary: 'Kitchen tasks',
              paid: false,
            },
          },
        } as ScheduledActivity)

      await handler.POST(addReasonRequest, res)

      expect(addReasonRequest.journeyData.recordAttendanceJourney.sessionCancellationSingle).toEqual({
        activityName: 'Kitchen tasks',
        reason: CancellationReasons.LOCATION_UNAVAILABLE,
        comment: 'A comment',
        issuePayment: false,
      })

      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('validation', () => {
    it('should require a reason', async () => {
      const body = {}

      const requestObject = plainToInstance(CancelReasonSingleForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'reason', error: "Select why you're cancelling this session" }]),
      )
    })

    it('should require a valid reason', async () => {
      const body = {
        reason: 'AN_INVALID_REASON',
      }

      const requestObject = plainToInstance(CancelReasonSingleForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'reason', error: "Select why you're cancelling this session" }]),
      )
    })

    it("comment shouldn't exceed 100 characters", async () => {
      const body = {
        comment: 'a'.repeat(101),
      }

      const requestObject = plainToInstance(CancelReasonSingleForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'comment', error: 'Details must be 100 characters or less' }]),
      )
    })
  })
})
