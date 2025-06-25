import { Request, Response } from 'express'
import ScheduleRoutes from './schedule'
import ActivitiesService from '../../../../../services/activitiesService'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import { parseIsoDate } from '../../../../../utils/datePickerUtils'
import { ScheduledEvent } from '../../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../../services/prisonService'
import { Location } from '../../../../../@types/bookAVideoLinkApi/types'
import ProbationBookingService from '../../../../../services/probationBookingService'
import { LocationLenient } from '../../../../../@types/prisonApiImportCustom'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/bookAVideoLinkService')
jest.mock('../../../../../services/probationBookingService')
jest.mock('../../../../../utils/datePickerUtils')

describe('ScheduleRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let activitiesService: jest.Mocked<ActivitiesService>
  let prisonService: jest.Mocked<PrisonService>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let probationBookingService: jest.Mocked<ProbationBookingService>
  let scheduleRoutes: ScheduleRoutes

  beforeEach(() => {
    req = {
      session: {
        bookAProbationMeetingJourney: {
          prisoner: { number: 'A1234BC' },
          date: '2023-10-01',
          locationCode: 'LOCATION_1',
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
    probationBookingService = new ProbationBookingService(null) as jest.Mocked<ProbationBookingService>
    scheduleRoutes = new ScheduleRoutes(
      activitiesService,
      prisonService,
      bookAVideoLinkService,
      probationBookingService,
    )
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
          dpsLocationId: '11111111-1111-1111-1111-111111111111',
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
      prisonService.getInternalLocationByKey.mockResolvedValue({ locationId: 1 } as LocationLenient)
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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/probation/schedule', {
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
      req.routeContext = { mode: 'amend' }
      req.session.bookAProbationMeetingJourney.bookingId = 1

      await scheduleRoutes.POST(req as Request, res as Response)

      expect(probationBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookAProbationMeetingJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/probation/1',
        "You've changed the schedule for this probation meeting",
      )
    })

    it('redirects to cvp link when mode is create', async () => {
      req.routeContext = { mode: 'create' }

      await scheduleRoutes.POST(req as Request, res as Response)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('extra-information')
    })
  })
})
