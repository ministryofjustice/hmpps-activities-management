import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ConfirmationRoutes, { CancelConfirmForm } from './confirmation'
import ActivitiesService from '../../../../../services/activitiesService'
import { associateErrorsWithProperty } from '../../../../../utils/utils'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Cancel Session Confirmation', () => {
  const handler = new ConfirmationRoutes(activitiesService)

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
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      params: {
        id: '1',
      },
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('should render cancel session confirmation page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/cancel-session/confirm')
    })
  })

  describe('POST', () => {
    let confirmRequest: Request

    beforeEach(() => {
      confirmRequest = {
        ...req,
        body: {
          confirm: 'yes',
        },
        journeyData: {
          recordAttendanceJourney: {
            sessionCancellation: {
              reason: 'Staff unavailable',
              comment: 'Resume tomorrow',
              issuePayment: true,
            },
          },
        },
      } as unknown as Request
    })

    it('should cancel scheduled activity', async () => {
      await handler.POST(confirmRequest, res)

      expect(activitiesService.cancelScheduledActivities).toHaveBeenCalledWith(
        [1],
        'Staff unavailable',
        true,
        { username: 'joebloggs' },
        'Resume tomorrow',
      )
      expect(res.redirect).toHaveBeenCalledWith('../../1/attendance-list')
    })

    it('should redirect back to attendance list if not confirmed', async () => {
      confirmRequest.body.confirm = 'no'
      await handler.POST(confirmRequest, res)

      expect(activitiesService.cancelScheduledActivities).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('../../1/attendance-list')
    })

    it("should redirect the user back if the reason isn't present on the session", async () => {
      confirmRequest = {
        ...req,
        body: {
          confirm: 'yes',
        },
        journeyData: {
          recordAttendanceJourney: {
            sessionCancellation: {},
          },
        },
      } as unknown as Request

      await handler.POST(confirmRequest, res)

      expect(activitiesService.cancelScheduledActivities).not.toHaveBeenCalledWith()
      expect(res.redirect).toHaveBeenCalledWith('../../1/cancel')
    })
  })

  describe('Validation', () => {
    it('validation fails when confirmation value not selected', async () => {
      const body = {}

      const requestObject = plainToInstance(CancelConfirmForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'confirm', error: 'Confirm if you want to cancel the session or not' }])
    })

    it('validation should pass when valid confirmation option selected', async () => {
      const body = {
        confirm: 'no',
      }

      const requestObject = plainToInstance(CancelConfirmForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toHaveLength(0)
    })
  })
})
