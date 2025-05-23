import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import CancelReasonRoutes, { CancelReasonForm } from './reason'
import CancellationReasons from '../../cancellationReasons'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Cancel Session Reason', () => {
  const handler = new CancelReasonRoutes(activitiesService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      params: {
        id: '1',
      },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    beforeEach(() => {
      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          activitySchedule: {
            id: 2,
            activity: {
              id: 2,
              paid: true,
            },
          },
        } as ScheduledActivity)
    })

    it('should render cancel session reasons page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/cancel-session/cancel-reason', {
        cancellationReasons: CancellationReasons,
        isPayable: true,
        editMode: false,
        instanceId: '1',
      })
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
        session: {},
      } as unknown as Request
    })

    it('should add cancel reason to session and redirect to confirmation page', async () => {
      await handler.POST(addReasonRequest, res)

      expect(addReasonRequest.session.recordAttendanceJourney.sessionCancellation).toEqual({
        reason: CancellationReasons.LOCATION_UNAVAILABLE,
        comment: 'A comment',
      })

      expect(res.redirect).toHaveBeenCalledWith('cancel/confirm')
    })

    it('should update the reason and redirect back to the view/edit page if in edit mode', async () => {
      req.query.editMode = 'true'
      await handler.POST(addReasonRequest, res)

      expect(activitiesService.updateCancelledSession).toHaveBeenCalledWith(
        1,
        {
          cancelledReason: 'Location unavailable',
          comment: 'A comment',
        },
        res.locals.user,
      )

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '../cancel-multiple/view-edit-details/1?detailsEdited=true',
        'Session updated',
        "You've updated the reason for cancelling this session",
      )
    })
  })

  describe('validation', () => {
    it('should require a reason', async () => {
      const body = {}

      const requestObject = plainToInstance(CancelReasonForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'reason', error: "Select why you're cancelling the session" }]),
      )
    })

    it('should require a valid reason', async () => {
      const body = {
        reason: 'AN_INVALID_REASON',
      }

      const requestObject = plainToInstance(CancelReasonForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'reason', error: "Select why you're cancelling the session" }]),
      )
    })

    it("comment shouldn't exceed 100 characters", async () => {
      const body = {
        comment: 'a'.repeat(101),
      }

      const requestObject = plainToInstance(CancelReasonForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'comment', error: 'Details must be 100 characters or less' }]),
      )
    })
  })
})
