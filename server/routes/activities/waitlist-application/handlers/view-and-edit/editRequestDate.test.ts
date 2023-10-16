import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'
import EditRequestDateRoutes, { EditRequestDate } from './editRequestDate'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null)

describe('Route Handlers - Waitlist application - Edit Request date', () => {
  const handler = new EditRequestDateRoutes(activitiesService)
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
      session: { waitListApplicationJourney: { prisoner: { name: 'Alan Key' }, createdTime: '2022-12-01' } },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the edit request date template', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(`pages/activities/waitlist-application/edit-request-date`)
    })
  })

  describe('POST', () => {
    it('should patch the application with the new request date and redirect', async () => {
      req.body = {
        requestDate: new Date('2022-12-01'),
      }

      await handler.POST(req, res)

      expect(activitiesService.patchWaitlistApplication).toHaveBeenCalledWith(
        1,
        { applicationDate: '2022-12-01' },
        { username: 'joebloggs' },
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `view`,
        `You have updated the date of request of Alan Key's application`,
      )
    })
  })

  describe('type validation', () => {
    it('validation passes', async () => {
      const requestDate = '01/12/2022'

      const body = {
        requestDate,
        waitListApplicationJourney: {
          createdTime: new Date('2022-12-01').toISOString(),
        },
      }

      const requestObject = plainToInstance(EditRequestDate, { ...body, ...req.session })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors.length).toEqual(0)
    })

    it('validation fails if a value is not entered', async () => {
      const requestDate = ''

      const body = { requestDate }

      const requestObject = plainToInstance(EditRequestDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'requestDate', error: 'Enter a valid request date' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const requestDate = 'a/1/2023'

      const body = { requestDate }

      const requestObject = plainToInstance(EditRequestDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'requestDate', error: 'Enter a valid request date' }])
    })

    it('validation fails if request date is after the original creation date', async () => {
      const body = {
        requestDate: '02/12/2022',
        waitListApplicationJourney: {
          createdTime: new Date('2022-12-01').toISOString(),
        },
      }

      const requestObject = plainToInstance(EditRequestDate, { ...body, ...req.session })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'requestDate',
          error: 'The date cannot be after the date that the application was originally recorded, 01/12/2022',
        },
      ])
    })
  })
})
