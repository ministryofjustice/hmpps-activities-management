import { validate } from 'class-validator'
import { Request, Response } from 'express'
import LocationRoutes, { Location } from './location'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import { Location as BvlsLocation } from '../../../../../@types/bookAVideoLinkApi/types'

jest.mock('../../../../../services/bookAVideoLinkService')

describe('LocationRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let locationRoutes: LocationRoutes

  beforeEach(() => {
    req = {
      session: {
        bookAProbationMeetingJourney: {
          prisoner: { prisonCode: 'PRISON1' },
        },
      },
      body: {},
      params: {},
      query: {},
      routeContext: { mode: 'create' },
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
      ] as BvlsLocation[]
      bookAVideoLinkService.getAppointmentLocations.mockResolvedValue(rooms)

      await locationRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/probation/location', { rooms })
    })
  })

  describe('POST', () => {
    it('persists the preserveHistory query param', async () => {
      req.query.preserveHistory = 'true'

      await locationRoutes.POST(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('schedule?preserveHistory=true')
    })

    it('redirects to schedule when mode is amend', async () => {
      req.routeContext = { mode: 'amend' }

      await locationRoutes.POST(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('schedule')
    })

    it('redirects to meeting details when mode is create', async () => {
      req.routeContext = { mode: 'create' }

      await locationRoutes.POST(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('meeting-details')
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
