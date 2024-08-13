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
      query: {},
    } as unknown as Request
    res = {
      locals: { user: {} },
      render: jest.fn(),
      redirect: jest.fn(),
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
    it('redirects to date and time page', async () => {
      await locationRoutes.POST(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('date-and-time')
    })

    it('persists the preserveHistory query param', async () => {
      req.query.preserveHistory = 'true'

      await locationRoutes.POST(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('date-and-time?preserveHistory=true')
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
