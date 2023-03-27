import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../utils/utils'
import CancelRoutes, { ConfirmCancelOptions } from './cancel'

describe('Route Handlers - Allocate - Cancel', () => {
  const handler = new CancelRoutes()
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
      session: {
        allocateJourney: {
          inmate: {
            prisonerName: 'Joe Bloggs',
            prisonerNumber: 'ABC123',
            cellLocation: '1-2-001',
            incentiveLevel: 'Enhanced',
          },
          activity: {
            activityId: 1,
            scheduleId: 1,
            name: 'Maths',
            location: 'Education room 1',
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/cancel')
    })
  })

  describe('POST', () => {
    it('should clear the journey from session and redirect back to the candidates page when choice is yes', async () => {
      req.body = {
        choice: 'yes',
      }

      await handler.POST(req, res)

      expect(req.session.allocateJourney).toBeNull()
      expect(res.redirect).toHaveBeenCalledWith('1/allocate')
    })

    it('should redirect back to the check answers page when choice is no', async () => {
      req.body = {
        choice: 'no',
      }

      await handler.POST(req, res)

      expect(req.session.allocateJourney).not.toBeNull()
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(ConfirmCancelOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'choice', error: 'Select either yes or no' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        choice: 'blah blah',
      }

      const requestObject = plainToInstance(ConfirmCancelOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'choice', error: 'Select either yes or no' }])
    })

    it('passes validation', async () => {
      const body = {
        choice: 'yes',
      }

      const requestObject = plainToInstance(ConfirmCancelOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
