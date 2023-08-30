import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'
import EditStatusRoutes, { EditStatus } from './editStatus'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null)

describe('Route Handlers - Waitlist application - Edit Status', () => {
  const handler = new EditStatusRoutes(activitiesService)
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
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: { applicationId: 1 },
      session: { waitListApplicationJourney: { prisoner: { name: 'Alan Key' } } },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the edit status template', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(`pages/activities/waitlist-application/edit-status`, {
        StatusEnum: {
          APPROVED: 'APPROVED',
          DECLINED: 'DECLINED',
          PENDING: 'PENDING',
        },
      })
    })
  })

  describe('POST', () => {
    it('should patch the application with the new status and redirect', async () => {
      req.body = {
        status: 'PENDING',
      }

      await handler.POST(req, res)

      expect(activitiesService.patchWaitlistApplication).toHaveBeenCalledWith(
        1,
        { status: 'PENDING' },
        { username: 'joebloggs' },
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `view`,
        `You have updated the status of Alan Key's application`,
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not selected', async () => {
      const body = {}

      const requestObject = plainToInstance(EditStatus, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'status', error: 'Select a status for the application' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        status: 'bad value',
      }

      const requestObject = plainToInstance(EditStatus, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'status', error: 'Select a status for the application' }])
    })

    it('validation passes', async () => {
      const body = {
        status: 'PENDING',
      }

      const requestObject = plainToInstance(EditStatus, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors.length).toEqual(0)
    })
  })
})
