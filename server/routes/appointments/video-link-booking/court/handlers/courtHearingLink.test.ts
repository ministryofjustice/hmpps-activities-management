import { NextFunction, Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import CourtHearingLinkRoutes, { CourtHearingLink } from './courtHearingLink'
import CourtBookingService from '../../../../../services/courtBookingService'

jest.mock('../../../../../services/courtBookingService')

describe('CourtHearingLinkRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction
  let courtBookingService: jest.Mocked<CourtBookingService>
  let courtHearingLinkRoutes: CourtHearingLinkRoutes

  beforeEach(() => {
    req = {
      session: {
        bookACourtHearingJourney: {
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
    courtBookingService = new CourtBookingService(null) as jest.Mocked<CourtBookingService>
    courtHearingLinkRoutes = new CourtHearingLinkRoutes(courtBookingService)
  })

  describe('GET', () => {
    it('should render the court hearing link page', async () => {
      await courtHearingLinkRoutes.GET(req as Request, res as Response, next)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/court/court-hearing-link')
    })
  })

  describe('POST', () => {
    it(`redirects with success message when mode is amend`, async () => {
      req.body.videoLinkUrl = 'URL'
      req.routeContext = { mode: 'amend' }
      req.session.bookACourtHearingJourney.bookingId = 1

      await courtHearingLinkRoutes.POST(req as Request, res as Response)

      expect(courtBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(req.session.bookACourtHearingJourney)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/court/1',
        "You've changed the hearing link for this court hearing",
      )
    })

    it('redirects to location when mode is not amend', async () => {
      req.body.videoLinkUrl = 'URL'
      req.routeContext = { mode: 'create' }

      await courtHearingLinkRoutes.POST(req as Request, res as Response)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('extra-information')
    })
  })
})

describe('CourtHearingLink', () => {
  it('should validate a valid CourtHearingLink instance - required', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      cvpRequired: 'yes',
      guestPinRequired: 'yes',
      videoLinkUrl: 'valid court link',
      guestPin: '12345678',
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toHaveLength(0)
  })

  it('should validate a valid CourtHearingLink instances - required', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      cvpRequired: 'yes',
      guestPinRequired: 'yes',
      videoLinkUrl: 'valid court link',
      guestPin: '12345678',
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toHaveLength(0)
  })

  it('should validate a valid CourtHearingLink instance - not required', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      cvpRequired: 'no',
      guestPinRequired: 'no',
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toHaveLength(0)
  })

  it('should validate an invalid enum', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      cvpRequired: 'invalid',
      guestPinRequired: 'no',
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([{ error: 'Select yes if you know the court hearing link', property: 'cvpRequired' }]),
    )
  })

  it('should validate a blank video link where it is required', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      cvpRequired: 'yes',
      guestPinRequired: 'no',
      videoLinkUrl: '',
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([
        {
          error: 'Enter number from CVP address or enter full web address (URL)',
          property: 'cvpRequired',
        },
      ]),
    )
  })

  it('should validate a court link which is too long', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      cvpRequired: 'yes',
      guestPinRequired: 'no',
      videoLinkUrl: '1'.repeat(1210),
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([
        {
          error: 'Court hearing link must be 120 characters or less',
          property: 'videoLinkUrl',
        },
      ]),
    )
  })

  it('should validate a HMCTS number which is too long', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      cvpRequired: 'yes',
      guestPinRequired: 'no',
      hmctsNumber: '1'.repeat(9),
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([
        {
          error: 'Number from CVP address must be 8 characters or less',
          property: 'hmctsNumber',
        },
      ]),
    )
  })

  it('should validate a HMCTS number which is not a number', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      cvpRequired: 'yes',
      hmctsNumber: 'X1',
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([
        {
          error: 'Number from CVP address must be a number, like 3457',
          property: 'hmctsNumber',
        },
      ]),
    )
  })

  it('should validate a blank guest pin where it is required', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      cvpRequired: 'no',
      guestPinRequired: 'yes',
      guestPin: '',
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([
        {
          error: 'Enter guest pin',
          property: 'guestPin',
        },
      ]),
    )
  })

  it('should validate a blank guest pin which is too long', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      cvpRequired: 'no',
      guestPinRequired: 'yes',
      guestPin: '1'.repeat(21),
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([
        {
          error: 'Guest pin must be 8 characters or less',
          property: 'guestPin',
        },
      ]),
    )
  })

  it('should validate a guest pin which is not a number', async () => {
    const courtHearingLink = plainToInstance(CourtHearingLink, {
      cvpRequired: 'no',
      guestPinRequired: 'yes',
      guestPin: 'a',
    })

    const errors = await validate(courtHearingLink).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([
        {
          error: 'Guest pin must be a number',
          property: 'guestPin',
        },
      ]),
    )
  })
})
