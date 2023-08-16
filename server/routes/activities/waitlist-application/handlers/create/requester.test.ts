import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import RequesterRoutes, { Requester } from './requester'

describe('Route Handlers - Waitlist application - Requester', () => {
  const handler = new RequesterRoutes()
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
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        waitListApplicationJourney: {
          prisoner: { name: 'Alan Key' },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the requester template', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(`pages/activities/waitlist-application/requester`, {
        RequesterEnum: {
          PRISONER: 'PRISONER',
          GUIDANCE_STAFF: 'GUIDANCE_STAFF',
          OTHER: 'OTHER',
        },
        prisonerName: 'Alan Key',
      })
    })
  })

  describe('POST', () => {
    it('should set the requester in session if PRISONER is selected', async () => {
      req.body = {
        requester: 'PRISONER',
      }

      await handler.POST(req, res)

      expect(req.session.waitListApplicationJourney.requester).toEqual('Self-requested')
      expect(res.redirectOrReturn).toHaveBeenCalledWith(`status`)
    })

    it('should set the requester in session if GUIDANCE_STAFF is selected', async () => {
      req.body = {
        requester: 'GUIDANCE_STAFF',
      }

      await handler.POST(req, res)

      expect(req.session.waitListApplicationJourney.requester).toEqual(
        'IAG or CXK careers information, advice and guidance staff',
      )
      expect(res.redirectOrReturn).toHaveBeenCalledWith(`status`)
    })

    it('should set the requester in session if OTHER is selected', async () => {
      req.body = {
        requester: 'OTHER',
        otherRequester: 'Activity leader',
      }

      await handler.POST(req, res)

      expect(req.session.waitListApplicationJourney.requester).toEqual('Activity leader')
      expect(res.redirectOrReturn).toHaveBeenCalledWith(`status`)
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not selected', async () => {
      const body = {}

      const requestObject = plainToInstance(Requester, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'requester', error: 'Select who made the application' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        requester: 'bad value',
      }

      const requestObject = plainToInstance(Requester, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'requester', error: 'Select who made the application' }])
    })

    it('validation fails if an alternative requester is not selected', async () => {
      const body = {
        requester: 'OTHER',
      }

      const requestObject = plainToInstance(Requester, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'otherRequester', error: 'Select who made the application' }])
    })

    it('validation passes if PRISONER selected', async () => {
      const body = {
        requester: 'PRISONER',
      }

      const requestObject = plainToInstance(Requester, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors.length).toEqual(0)
    })

    it('validation passes if other requester is provided', async () => {
      const body = {
        requester: 'OTHER',
        otherRequester: 'Activity leader',
      }

      const requestObject = plainToInstance(Requester, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors.length).toEqual(0)
    })
  })
})
