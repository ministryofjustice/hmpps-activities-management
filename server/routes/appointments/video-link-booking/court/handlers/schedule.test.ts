import { Request, Response } from 'express'
import ScheduleRoutes from './schedule'
import ActivitiesService from '../../../../../services/activitiesService'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import { parseIsoDate } from '../../../../../utils/datePickerUtils'
import { ScheduledEvent } from '../../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../../services/prisonService'
import { Location } from '../../../../../@types/bookAVideoLinkApi/types'
import CourtBookingService from '../../../../../services/courtBookingService'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/bookAVideoLinkService')
jest.mock('../../../../../services/courtBookingService')
jest.mock('../../../../../utils/datePickerUtils')

describe('ScheduleRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let activitiesService: jest.Mocked<ActivitiesService>
  let prisonService: jest.Mocked<PrisonService>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let courtBookingService: jest.Mocked<CourtBookingService>
  let scheduleRoutes: ScheduleRoutes

  beforeEach(() => {
    req = {
      session: {
        bookACourtHearingJourney: {
          prisoner: { number: 'A1234BC' },
          date: '2023-10-01',
        },
      },
      params: {},
    } as unknown as Request
    res = {
      locals: { user: {} },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response
    activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
    prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    courtBookingService = new CourtBookingService(null) as jest.Mocked<CourtBookingService>
    scheduleRoutes = new ScheduleRoutes(activitiesService, prisonService, bookAVideoLinkService, courtBookingService)
  })

  describe('GET', () => {
    it('renders schedule view with scheduled events, internal location events, and rooms', async () => {
      const scheduledEvents = [
        {
          id: 1,
          type: 'activity',
          cancelled: false,
          prisonCode: 'PRISON1',
          eventSource: 'source1',
          scheduledInstanceId: 1,
          prisonerNumber: 'ABC123',
        },
        {
          id: 2,
          type: 'appointment',
          cancelled: false,
          prisonCode: 'PRISON2',
          eventSource: 'source2',
          appointmentId: 1,
          prisonerNumber: 'ABC123',
        },
      ] as unknown as ScheduledEvent[]
      const internalLocationEvents = [
        {
          id: 1,
          prisonCode: 'PRISON1',
          code: 'LOC1',
          description: 'Location 1',
          events: [
            ...scheduledEvents,
            {
              id: 3,
              type: 'activity',
              cancelled: false,
              prisonCode: 'PRISON1',
              eventSource: 'source1',
              scheduledInstanceId: 1,
              prisonerNumber: 'XYZ321',
            } as unknown as ScheduledEvent,
          ],
        },
      ]
      const rooms = [
        {
          key: 'ROOM1',
          description: 'Room 1',
          enabled: true,
        },
      ] as Location[]
      activitiesService.getScheduledEventsForPrisoners.mockResolvedValue({
        activities: [scheduledEvents[0]],
        appointments: [scheduledEvents[1]],
        courtHearings: [],
        visits: [],
        externalTransfers: [],
        adjudications: [],
      })
      activitiesService.getInternalLocationEvents.mockResolvedValue(internalLocationEvents)
      bookAVideoLinkService.getAppointmentLocations.mockResolvedValue(rooms)
      ;(parseIsoDate as jest.Mock).mockReturnValue(new Date('2023-10-01'))

      await scheduleRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/court/schedule', {
        prisonerScheduledEvents: [scheduledEvents[0], scheduledEvents[1]],
        internalLocationEvents: internalLocationEvents.map(ile => ({
          ...ile,
          events: scheduledEvents,
        })),
        rooms,
      })
    })
  })

  describe('POST', () => {
    it('redirects with success message when mode is amend', async () => {
      req.params.mode = 'amend'
      req.session.bookACourtHearingJourney.bookingId = 1

      await scheduleRoutes.POST(req as Request, res as Response)

      expect(courtBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookACourtHearingJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/court/1',
        "You've changed the schedule for this court hearing",
      )
    })

    it('redirects to cvp link when mode is not amend', async () => {
      req.params.mode = 'create'

      await scheduleRoutes.POST(req as Request, res as Response)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('court-hearing-link')
    })
  })
})
