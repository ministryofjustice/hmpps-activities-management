import { validate } from 'class-validator'
import { Request, Response } from 'express'
import LocationRoutes, { Location } from './location'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/bookAVideoLinkService')

describe('LocationRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let locationRoutes: LocationRoutes

  beforeEach(() => {
    req = {
      session: {
        bookAVideoLinkJourney: {
          prisoner: { prisonCode: 'PRISON1' },
        },
      },
      body: {},
      params: {},
    } as unknown as Request
    res = {
      locals: { user: {} },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response
    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    locationRoutes = new LocationRoutes(bookAVideoLinkService)
  })

  describe('GET', () => {
    it('renders location view with available rooms', async () => {
      const rooms = [
        { key: 'Room 1', description: 'Room 1', enabled: true },
        { key: 'Room 2', description: 'Room 2', enabled: true },
      ]
      bookAVideoLinkService.getAppointmentLocations.mockResolvedValue(rooms)

      await locationRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/location', { rooms })
    })
  })

  describe('POST', () => {
    it('redirects with success message when mode is amend', async () => {
      req.body.location = 'Room 1'
      req.params.mode = 'amend'
      req.session.bookAVideoLinkJourney.bookingId = 1

      await locationRoutes.POST(req as Request, res as Response)

      expect(bookAVideoLinkService.amendVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookAVideoLinkJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/1',
        "You've changed the location for this court hearing",
      )
    })

    it('redirects to date-and-time when mode is not amend', async () => {
      req.body.location = 'Room 1'
      req.params.mode = 'create'

      await locationRoutes.POST(req as Request, res as Response)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('date-and-time')
    })
  })
})

describe('Location', () => {
  it('should be valid when location is provided', async () => {
    const location = new Location()
    location.location = 'Room 1'

    const errors = await validate(location).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors.length).toBe(0)
  })

  it('should be invalid when location is not provided', async () => {
    const location = new Location()

    const errors = await validate(location).then(errs => errs.flatMap(associateErrorsWithProperty))
    expect(errors.length).toBeGreaterThan(0)
    expect(errors).toEqual(
      expect.arrayContaining([{ error: 'Start typing a room name and select from the list', property: 'location' }]),
    )
  })
})
