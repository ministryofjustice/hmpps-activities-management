import { NextFunction, Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import createHttpError from 'http-errors'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import CourtHearingLinkRoutes, { CourtHearingLink } from './courtHearingLink'

jest.mock('../../../../services/bookAVideoLinkService')

describe('CourtHearingLinkRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let courtHearingLinkRoutes: CourtHearingLinkRoutes

  beforeEach(() => {
    req = {
      session: {
        bookAVideoLinkJourney: {
          type: 'COURT',
          prisoner: { prisonCode: 'PRISON1' },
        },
      },
      body: {},
      params: {},
      query: {},
    } as unknown as Request
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectWithSuccess: jest.fn(),
    }
    next = jest.fn()
    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    courtHearingLinkRoutes = new CourtHearingLinkRoutes(bookAVideoLinkService)
  })

  describe('GET', () => {
    it('should render the court hearing link page', async () => {
      await courtHearingLinkRoutes.GET(req as Request, res as Response, next)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/court-hearing-link')
    })

    it('should respond with 404 when the booking is a probation booking', async () => {
      req.session.bookAVideoLinkJourney.type = 'PROBATION'

      await courtHearingLinkRoutes.GET(req as Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(createHttpError.NotFound())
    })
  })

  describe('POST', () => {
    it('redirects with success message when mode is amend', async () => {
      req.body.videoLinkUrl = 'URL'
      req.params.mode = 'amend'
      req.session.bookAVideoLinkJourney.bookingId = 1

      await courtHearingLinkRoutes.POST(req as Request, res as Response)

      expect(bookAVideoLinkService.amendVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookAVideoLinkJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/1',
        "You've changed the hearing link for this court hearing",
      )
    })

    it('redirects to location when mode is not amend', async () => {
      req.body.videoLinkUrl = 'URL'
      req.params.mode = 'create'

      await courtHearingLinkRoutes.POST(req as Request, res as Response)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('extra-information')
    })
  })
})

describe('CourtHearingLink', () => {
  it('should validate a valid CourtHearingLink instance - required', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      required: 'yes',
      videoLinkUrl: 'valid court link',
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toHaveLength(0)
  })

  it('should validate a valid CourtHearingLink instance - not required', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      required: 'no',
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toHaveLength(0)
  })

  it('should validate an invalid enum', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      required: 'invalid',
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(expect.arrayContaining([{ error: 'Select either yes or no', property: 'required' }]))
  })

  it('should validate a blank video link where it is required', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      required: 'yes',
      videoLinkUrl: '',
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([
        {
          error: 'Enter the court hearing link',
          property: 'videoLinkUrl',
        },
      ]),
    )
  })

  it('should validate a court link which is too long', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      required: 'yes',
      videoLinkUrl: 'a'.repeat(121),
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([
        {
          error: 'You must enter a court hearing link which has no more than 120 characters',
          property: 'videoLinkUrl',
        },
      ]),
    )
  })
})
