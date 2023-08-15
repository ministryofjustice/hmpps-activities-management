import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import StatusRoutes, { Status } from './status'

describe('Route Handlers - Waitlist application - Status', () => {
  const handler = new StatusRoutes()
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
      session: { waitListApplicationJourney: {} },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the status template', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(`pages/activities/waitlist-application/status`, {
        StatusEnum: {
          APPROVED: 'APPROVED',
          DECLINED: 'DECLINED',
          PENDING: 'PENDING',
        },
      })
    })
  })

  describe('POST', () => {
    it('should set the status and comment in session and redirect', async () => {
      req.body = {
        status: 'PENDING',
        comment: 'test comment',
      }

      await handler.POST(req, res)

      expect(req.session.waitListApplicationJourney.status).toEqual('PENDING')
      expect(req.session.waitListApplicationJourney.comment).toEqual('test comment')
      expect(res.redirect).toHaveBeenCalledWith(`check-answers`)
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not selected', async () => {
      const body = {}

      const requestObject = plainToInstance(Status, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'status', error: 'Select a status for the application' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        status: 'bad value',
      }

      const requestObject = plainToInstance(Status, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'status', error: 'Select a status for the application' }])
    })

    it('validation fails if a long comment is entered', async () => {
      const body = {
        status: 'PENDING',
        comment:
          'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus',
      }

      const requestObject = plainToInstance(Status, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'comment', error: 'Comment must be 500 characters or less' }])
    })

    it('validation passes', async () => {
      const body = {
        status: 'PENDING',
      }

      const requestObject = plainToInstance(Status, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors.length).toEqual(0)
    })

    it('transforms blank comment to undefined', async () => {
      const body = {
        status: 'PENDING',
        comment: '',
      }

      const requestObject = plainToInstance(Status, body)

      expect(requestObject.comment).toBeUndefined()
    })

    it('does not transform a non-blank comment', async () => {
      const body = {
        status: 'PENDING',
        comment: 'test comment',
      }

      const requestObject = plainToInstance(Status, body)

      expect(requestObject.comment).toEqual('test comment')
    })
  })
})
