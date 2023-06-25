import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import CancelReasonRoutes, { CancelReasonForm } from './reason'
import cancellationReasons from '../../cancellationReasons'
import { associateErrorsWithProperty } from '../../../../../utils/utils'

describe('Route Handlers - Cancel Session Reason', () => {
  const handler = new CancelReasonRoutes()

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
    it('should render cancel session reasons page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/cancel-session/cancel-reason', {
        cancellationReasons,
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

      expect(addReasonRequest.session.recordAttendanceRequests.sessionCancellation).toEqual({
        reason: cancellationReasons.LOCATION_UNAVAILABLE,
        comment: 'A comment',
      })

      expect(res.redirect).toHaveBeenCalledWith('cancel/confirm')
    })
  })

  describe('validation', () => {
    it('should require a reason', async () => {
      const body = {}

      const requestObject = plainToInstance(CancelReasonForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'reason', error: 'Enter a reason for cancelling the session' }]),
      )
    })

    it('should require a valid reason', async () => {
      const body = {
        reason: 'AN_INVALID_REASON',
      }

      const requestObject = plainToInstance(CancelReasonForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'reason', error: 'Invalid cancellation reason' }]))
    })

    it("comment shouldn't exceed 250 characters", async () => {
      const body = {
        comment: new Array(100).fill('test comment. ').reduce((acc, part) => acc + part, ''),
      }

      const requestObject = plainToInstance(CancelReasonForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'comment', error: 'Details must be 250 characters or less' }]),
      )
    })
  })
})
