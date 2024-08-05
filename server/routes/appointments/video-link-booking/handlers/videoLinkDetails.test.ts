import { Request, Response } from 'express'
import { when } from 'jest-when'
import VideoLinkDetailsRoutes from './videoLinkDetails'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../services/prisonService'
import UserService from '../../../../services/userService'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'

describe('VideoLinkDetailsRoutes', () => {
  let bookAVideoLinkService: BookAVideoLinkService
  let activitiesService: ActivitiesService
  let prisonService: PrisonService
  let userService: UserService
  let videoLinkDetailsRoutes: VideoLinkDetailsRoutes
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    bookAVideoLinkService = new BookAVideoLinkService(null)
    activitiesService = new ActivitiesService(null)
    prisonService = new PrisonService(null, null, null)
    userService = new UserService(null, null, null)

    videoLinkDetailsRoutes = new VideoLinkDetailsRoutes(
      bookAVideoLinkService,
      activitiesService,
      prisonService,
      userService,
    )

    req = {
      params: {
        vlbId: '123',
      },
    }

    res = {
      locals: {
        user: { username: 'test-user' },
      },
      render: jest.fn(),
    }
  })

  it('should render the video link booking details page with all necessary data', async () => {
    const mockVideoBooking = {
      createdBy: 'user1',
      amendedBy: 'user2',
      statusCode: 'ACTIVE',
      prisonAppointments: [
        {
          appointmentType: 'VLB_COURT_PRE',
          startDate: '2024-07-19',
          startTime: '09:45',
          endTime: '10:00',
          prisonerNumber: 'A1234BC',
        },
        {
          appointmentType: 'VLB_COURT_MAIN',
          startDate: '2024-07-19',
          startTime: '10:00',
          endTime: '11:00',
          prisonerNumber: 'A1234BC',
        },
        {
          appointmentType: 'VLB_COURT_POST',
          startDate: '2024-07-19',
          startTime: '11:00',
          endTime: '11:15',
          prisonerNumber: 'A1234BC',
        },
      ],
    }

    const mockSearchAppointments = [
      { appointmentId: 1, startTime: '09:45', endTime: '10:00' },
      { appointmentId: 2, startTime: '10:00', endTime: '11:00' },
      { appointmentId: 3, startTime: '11:00', endTime: '11:15' },
    ]

    const mockPreAppointment = { id: 1, startDate: '2024-07-19', startTime: '14:00' } as AppointmentDetails
    const mockMainAppointment = {
      id: 2,
      attendees: [{ prisoner: { prisonerNumber: 'A1234BC' } }],
    } as AppointmentDetails
    const mockPostAppointment = { id: 3 } as AppointmentDetails

    const mockPrisoner = { prisonId: 'MDI' }
    const mockRooms = [{ id: 1, description: 'Room 1' }]
    const mockUserMap = { user1: 'User One', user2: 'User Two' }

    bookAVideoLinkService.getVideoLinkBookingById = jest.fn().mockResolvedValue(mockVideoBooking)
    activitiesService.searchAppointments = jest.fn().mockResolvedValue(mockSearchAppointments)
    activitiesService.getAppointmentDetails = jest.fn()
    when(activitiesService.getAppointmentDetails).calledWith(atLeast(1)).mockResolvedValue(mockPreAppointment)
    when(activitiesService.getAppointmentDetails).calledWith(atLeast(2)).mockResolvedValue(mockMainAppointment)
    when(activitiesService.getAppointmentDetails).calledWith(atLeast(3)).mockResolvedValue(mockPostAppointment)
    prisonService.getInmateByPrisonerNumber = jest.fn().mockResolvedValue(mockPrisoner)
    bookAVideoLinkService.getAppointmentLocations = jest.fn().mockResolvedValue(mockRooms)
    userService.getUserMap = jest.fn().mockResolvedValue(mockUserMap)
    bookAVideoLinkService.bookingIsAmendable = jest.fn().mockReturnValue(true)

    await videoLinkDetailsRoutes.GET(req as Request, res as Response)

    expect(bookAVideoLinkService.getVideoLinkBookingById).toHaveBeenCalledWith(123, res.locals.user)
    expect(prisonService.getInmateByPrisonerNumber).toHaveBeenCalledWith('A1234BC', res.locals.user)
    expect(bookAVideoLinkService.getAppointmentLocations).toHaveBeenCalledWith('MDI', res.locals.user)
    expect(userService.getUserMap).toHaveBeenCalledWith(['user1', 'user2'], res.locals.user)
    expect(bookAVideoLinkService.bookingIsAmendable).toHaveBeenCalledWith(
      new Date('2024-07-19'),
      new Date(1970, 0, 1, 14, 0),
      'ACTIVE',
    )

    expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/details', {
      videoBooking: mockVideoBooking,
      preAppointment: mockPreAppointment,
      mainAppointment: mockMainAppointment,
      postAppointment: mockPostAppointment,
      prisoner: mockPrisoner,
      rooms: mockRooms,
      userMap: mockUserMap,
      isAmendable: true,
    })
  })
})
