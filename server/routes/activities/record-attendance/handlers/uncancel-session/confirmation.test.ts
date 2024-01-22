import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ConfirmationRoutes, { UncancelConfirmForm } from './confirmation'
import ActivitiesService from '../../../../../services/activitiesService'
import { associateErrorsWithProperty } from '../../../../../utils/utils'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Uncancel Session Confirmation', () => {
  const handler = new ConfirmationRoutes(activitiesService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          firstName: 'Joe',
          lastName: 'Bloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
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
    it('should render uncancel session confirmation page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/record-attendance/uncancel-session/confirm')
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
      } as unknown as Request
    })

    it('should uncancel scheduled activity', async () => {
      await handler.POST(confirmRequest, res)

      expect(activitiesService.uncancelScheduledActivity).toBeCalledWith(1, {
        username: 'joebloggs',
        firstName: 'Joe',
        lastName: 'Bloggs',
      })

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/attendance/activities/1/attendance-list',
        'Session no longer cancelled',
      )
    })

    it('should redirect back to attendance list if not confirmed', async () => {
      confirmRequest.body.confirm = 'no'
      await handler.POST(confirmRequest, res)

      expect(activitiesService.uncancelScheduledActivity).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith('/activities/attendance/activities/1/attendance-list')
    })
  })

  describe('Validation', () => {
    it('validation fails when confirmation value not selected', async () => {
      const body = {}

      const requestObject = plainToInstance(UncancelConfirmForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'confirm', error: 'Confirm if you want to uncancel the session or not' }])
    })

    it('validation should pass when valid confirmation option selected', async () => {
      const body = {
        confirm: 'yes',
      }

      const requestObject = plainToInstance(UncancelConfirmForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toHaveLength(0)
    })
  })
})
