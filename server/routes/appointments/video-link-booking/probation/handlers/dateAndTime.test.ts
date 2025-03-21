import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { startOfTomorrow, startOfYesterday } from 'date-fns'
import DateAndTimeRoutes, { DateAndTime } from './dateAndTime'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import { associateErrorsWithProperty, formatDate } from '../../../../../utils/utils'
import { Location } from '../../../../../@types/bookAVideoLinkApi/types'

jest.mock('../../../../../services/bookAVideoLinkService')

describe('DateAndTimeRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let dateAndTimeRoutes: DateAndTimeRoutes

  beforeEach(() => {
    req = {
      session: {
        bookAProbationMeetingJourney: {
          prisoner: { prisonCode: 'PRISON1' },
        },
      },
      body: {},
      query: {},
    } as unknown as Request
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    }
    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    dateAndTimeRoutes = new DateAndTimeRoutes(bookAVideoLinkService)
  })

  describe('GET', () => {
    it('should render the date and time page with rooms', async () => {
      bookAVideoLinkService.getAppointmentLocations.mockResolvedValue([
        { key: 'Room1', description: 'Room 1', enabled: true },
        { key: 'Room2', description: 'Room 2', enabled: true },
      ] as Location[])

      await dateAndTimeRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/probation/date-and-time', {
        rooms: [
          { key: 'Room1', description: 'Room 1', enabled: true },
          { key: 'Room2', description: 'Room 2', enabled: true },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should redirect to schedule page with preserveHistory query', async () => {
      req.body = {
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
      }
      req.query = { preserveHistory: 'true' }

      await dateAndTimeRoutes.POST(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('schedule?preserveHistory=true')
    })

    it('should redirect to schedule page without preserveHistory query', async () => {
      req.body = {
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
      }

      await dateAndTimeRoutes.POST(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('schedule')
    })
  })
})

describe('DateAndTime', () => {
  const bookAProbationMeetingJourney = {}

  it('should validate a valid DateAndTime instance', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAProbationMeetingJourney,
      date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 11, minute: 30 },
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toHaveLength(0)
  })

  it('should invalidate an instance with a past date', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAProbationMeetingJourney,
      date: formatDate(startOfYesterday(), 'dd/MM/yyyy'),
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 11, minute: 30 },
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([{ error: "Enter a date which is on or after today's date", property: 'date' }]),
    )
  })

  it('should invalidate an instance with endTime before startTime', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAProbationMeetingJourney,
      date: formatDate(startOfTomorrow(), 'dd/MM/yyyy'),
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 9, minute: 30 },
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(
      expect.arrayContaining([{ error: 'Select an end time that is after the start time', property: 'endTime' }]),
    )
  })

  it('should invalidate an instance with missing required fields', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAProbationMeetingJourney,
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 11, minute: 30 },
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(expect.arrayContaining([{ error: 'Enter a date', property: 'date' }]))
  })

  it('should invalidate an instance with invalid date format', async () => {
    const dateAndTime = plainToInstance(DateAndTime, {
      bookAProbationMeetingJourney,
      date: 'invalid date',
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 11, minute: 30 },
    })

    const errors = await validate(dateAndTime).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors).toEqual(expect.arrayContaining([{ error: 'Enter a valid date', property: 'date' }]))
  })
})
