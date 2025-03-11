import { Request, Response } from 'express'
import VideoLinkDetailsRoutes from './videoLinkDetails'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../../services/prisonService'
import UserService from '../../../../../services/userService'
import { Location, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import { UserDetails } from '../../../../../@types/manageUsersApiImport/types'
import ActivitiesService from '../../../../../services/activitiesService'
import { AppointmentSearchResult } from '../../../../../@types/activitiesAPI/types'
import LocationMappingService from '../../../../../services/locationMappingService'

jest.mock('../../../../../services/bookAVideoLinkService')
jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/userService')
jest.mock('../../../../../services/locationMappingService')

describe('VideoLinkDetailsRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let activitiesService: jest.Mocked<ActivitiesService>
  let prisonService: jest.Mocked<PrisonService>
  let userService: jest.Mocked<UserService>
  let locationMappingService: jest.Mocked<LocationMappingService>
  let videoLinkDetailsRoutes: VideoLinkDetailsRoutes

  beforeEach(() => {
    req = {
      params: { vlbId: '1' },
    } as unknown as Request
    res = {
      locals: { user: {} },
      render: jest.fn(),
    } as unknown as Response
    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
    prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
    userService = new UserService(null, null, null) as jest.Mocked<UserService>
    locationMappingService = new LocationMappingService(null, null) as jest.Mocked<LocationMappingService>

    videoLinkDetailsRoutes = new VideoLinkDetailsRoutes(
      bookAVideoLinkService,
      activitiesService,
      prisonService,
      userService,
      locationMappingService,
    )
  })

  describe('GET', () => {
    it('should render the video link booking details page', async () => {
      const videoBooking = {
        videoLinkBookingId: 1,
        statusCode: 'ACTIVE',
        bookingType: 'COURT',
        prisonAppointments: [
          {
            prisonAppointmentId: 1,
            prisonCode: 'PRISON1',
            prisonerNumber: 'A1234BC',
            appointmentType: 'VLB_COURT_PRE',
            appointmentDate: '2023-10-01',
            startTime: '10:00',
            endTime: '10:30',
          },
          {
            prisonAppointmentId: 2,
            prisonCode: 'PRISON1',
            prisonerNumber: 'A1234BC',
            appointmentType: 'VLB_COURT_MAIN',
            appointmentDate: '2023-10-01',
            startTime: '10:30',
            endTime: '11:00',
          },
          {
            prisonAppointmentId: 3,
            prisonCode: 'PRISON1',
            prisonerNumber: 'A1234BC',
            appointmentType: 'VLB_COURT_POST',
            appointmentDate: '2023-10-01',
            startTime: '11:00',
            endTime: '11:30',
          },
        ],
        createdBy: 'user1',
        amendedBy: 'user2',
        createdAt: '2023-09-01T10:00:00Z',
        amendedAt: '2023-09-02T10:00:00Z',
      } as VideoLinkBooking

      bookAVideoLinkService.getVideoLinkBookingById.mockResolvedValue(videoBooking)
      prisonService.getInmateByPrisonerNumber.mockResolvedValue({
        prisonerNumber: 'A1234BC',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1980-01-01',
        prisonId: 'PRISON1',
      } as Prisoner)
      locationMappingService.mapDpsLocationKeyToNomisId.mockResolvedValue(10001)
      bookAVideoLinkService.getAppointmentLocations.mockResolvedValue([
        { key: 'Room1', description: 'Room 1', enabled: true },
      ] as Location[])
      userService.getUserMap.mockResolvedValue(
        new Map([
          ['user1', { username: 'user1', active: true, name: 'User One', authSource: 'auth', userId: 'user1' }],
          ['user2', { username: 'user2', active: true, name: 'User Two', authSource: 'auth', userId: 'user2' }],
        ]) as Map<string, UserDetails>,
      )
      bookAVideoLinkService.bookingIsAmendable.mockReturnValue(true)
      activitiesService.searchAppointments.mockResolvedValueOnce([])
      activitiesService.searchAppointments.mockResolvedValueOnce([
        {
          appointmentId: 1,
          internalLocation: { id: 10001 },
          startTime: '10:30',
          endTime: '11:00',
        } as AppointmentSearchResult,
      ])

      await videoLinkDetailsRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith(
        'pages/appointments/video-link-booking/court/details',
        expect.objectContaining({
          videoBooking,
          mainAppointmentId: 1,
          preAppointment: videoBooking.prisonAppointments[0],
          mainAppointment: videoBooking.prisonAppointments[1],
          postAppointment: videoBooking.prisonAppointments[2],
          prisoner: {
            prisonerNumber: 'A1234BC',
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1980-01-01',
            prisonId: 'PRISON1',
          },
          rooms: [{ key: 'Room1', description: 'Room 1', enabled: true }],
          userMap: new Map([
            ['user1', { username: 'user1', active: true, name: 'User One', authSource: 'auth', userId: 'user1' }],
            ['user2', { username: 'user2', active: true, name: 'User Two', authSource: 'auth', userId: 'user2' }],
          ]),
          isAmendable: true,
        }),
      )

      expect(activitiesService.searchAppointments).toHaveBeenCalledTimes(2)
    })
  })
})
