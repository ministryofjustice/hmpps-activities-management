import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'
import UpdateCancelledSessionPayRoutes, { SessionPayForm } from './updatePayment'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Update payment for cancelled session', () => {
  const handler = new UpdateCancelledSessionPayRoutes(activitiesService)

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
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('should render the update payment page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/cancel-session/payment')
    })
  })

  describe('POST', () => {
    let addReasonRequest: Request

    it('should update cancellation details and redirect - yes', async () => {
      addReasonRequest = {
        ...req,
        body: {
          issuePayOption: 'yes',
        },
      } as unknown as Request
      await handler.POST(addReasonRequest, res)

      expect(activitiesService.updateCancelledSession).toHaveBeenCalledWith(1, { issuePayment: true }, res.locals.user)

      expect(res.redirect).toHaveBeenCalledWith('../../cancel-multiple/view-edit-details/1')
    })
    it('should update cancellation details and redirect - no', async () => {
      addReasonRequest = {
        ...req,
        body: {
          issuePayOption: 'no',
        },
      } as unknown as Request
      await handler.POST(addReasonRequest, res)

      expect(activitiesService.updateCancelledSession).toHaveBeenCalledWith(1, { issuePayment: false }, res.locals.user)

      expect(res.redirect).toHaveBeenCalledWith('../../cancel-multiple/view-edit-details/1')
    })
  })

  describe('Validation', () => {
    it('should pass validation when issue pay option is set to "no"', async () => {
      const body = {
        issuePayOption: 'no',
      }

      const requestObject = plainToInstance(SessionPayForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([])
    })

    it('should pass validation when issue pay option is set to "yes"', async () => {
      const body = {
        issuePayOption: 'yes',
      }

      const requestObject = plainToInstance(SessionPayForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([])
    })

    it('should fail validation when issue pay option not provided', async () => {
      const body = {}

      const requestObject = plainToInstance(SessionPayForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Select if people should be paid for this cancelled session',
            property: 'issuePayOption',
          },
        ]),
      )
    })
  })
})
