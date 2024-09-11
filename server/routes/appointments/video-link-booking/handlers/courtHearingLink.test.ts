import { NextFunction, Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { startOfTomorrow, startOfYesterday } from 'date-fns'
import createHttpError from 'http-errors'
import { DateAndTime } from './dateAndTime'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import { YesNo } from '../../../../@types/activities'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import CourtHearingLinkRoutes from './courtHearingLink'

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

describe('DateAndTime', () => {
  const bookAVideoLinkJourney = { type: 'COURT' }

  it('should validate a valid DateAndTime instance', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAVideoLinkJourney,
      date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 11, minute: 30 },
      preRequired: YesNo.NO,
      postRequired: YesNo.NO,
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toHaveLength(0)
  })

  it('should invalidate an instance with a past date', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAVideoLinkJourney,
      date: formatDate(startOfYesterday(), 'dd/MM/yyyy'),
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 11, minute: 30 },
      preRequired: YesNo.NO,
      postRequired: YesNo.NO,
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([{ error: "Enter a date which is on or after today's date", property: 'date' }]),
    )
  })

  it('should invalidate an instance with endTime before startTime', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAVideoLinkJourney,
      date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 9, minute: 30 },
      preRequired: YesNo.NO,
      postRequired: YesNo.NO,
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([{ error: 'Select a end time that is after the start time', property: 'endTime' }]),
    )
  })

  it('should invalidate an instance with missing required fields', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAVideoLinkJourney,
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 11, minute: 30 },
      preRequired: YesNo.NO,
      postRequired: YesNo.NO,
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(expect.arrayContaining([{ error: 'Enter a date', property: 'date' }]))
  })

  it('should invalidate an instance with invalid date format', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAVideoLinkJourney,
      date: 'invalid date',
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 11, minute: 30 },
      preRequired: YesNo.NO,
      postRequired: YesNo.NO,
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(expect.arrayContaining([{ error: 'Enter a valid date', property: 'date' }]))
  })

  it('should invalidate an instance with invalid enum values', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAVideoLinkJourney,
      date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 11, minute: 30 },
      preRequired: 'INVALID_ENUM',
      postRequired: 'INVALID_ENUM',
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([
        { error: 'Select if a pre-court hearing should be added', property: 'preRequired' },
        { error: 'Select if a post-court hearing should be added', property: 'postRequired' },
      ]),
    )
  })

  it('should invalidate where pre and post meetings are required but rooms are not provided', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAVideoLinkJourney,
      date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 11, minute: 30 },
      preRequired: YesNo.YES,
      postRequired: YesNo.YES,
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([
        { error: 'Select a room for the pre-court hearing', property: 'preLocation' },
        { error: 'Select a room for the post-court hearing', property: 'postLocation' },
      ]),
    )
  })

  it('should pass missing pre and post meetings for probation bookings', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAVideoLinkJourney: { type: 'PROBATION' },
      date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 11, minute: 30 },
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual([])
  })
})
