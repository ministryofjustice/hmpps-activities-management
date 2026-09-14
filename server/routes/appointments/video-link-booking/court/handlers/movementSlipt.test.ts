import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../../services/prisonService'
import MovementSlipRoutes from './movementSlip'
import { Location, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../../services/bookAVideoLinkService')
jest.mock('../../../../../services/prisonService')

describe('MovementSlipRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let prisonService: jest.Mocked<PrisonService>
  let movementSlipRoutes: MovementSlipRoutes
  let videoLinkBooking: VideoLinkBooking

  beforeEach(() => {
    req = {
      params: { vlbId: '1' },
    } as unknown as Request
    res = {
      locals: { user: {} },
      render: jest.fn(),
    } as unknown as Response
    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

    movementSlipRoutes = new MovementSlipRoutes(bookAVideoLinkService, prisonService)

    videoLinkBooking = {
      videoLinkBookingId: 1,
      statusCode: 'ACTIVE',
      bookingType: 'COURT',
      prisonAppointments: [],
      createdBy: 'user1',
      amendedBy: 'user2',
      createdAt: '2023-09-01T10:00:00Z',
      amendedAt: '2023-09-02T10:00:00Z',
    } as unknown as VideoLinkBooking

    bookAVideoLinkService.getAppointmentLocations.mockResolvedValue([
      { dpsLocationId: 'LOCATION_ID_1', description: 'Room 1', enabled: true },
      { dpsLocationId: 'LOCATION_ID_2', description: 'Room 2', enabled: true },
      { dpsLocationId: 'LOCATION_ID_3', description: 'Room 3', enabled: true },
    ] as unknown as Location[])

    prisonService.getInmateByPrisonerNumber.mockResolvedValue({
      prisonerNumber: 'A1234BC',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1980-01-01',
      prisonId: 'PRISON1',
    } as Prisoner)
  })

  describe('GET', () => {
    it('should render the movement slip page for pre, main and post hearing', async () => {
      videoLinkBooking = {
        ...videoLinkBooking,
        prisonAppointments: [
          {
            prisonAppointmentId: 1,
            prisonCode: 'PRISON1',
            prisonerNumber: 'A1234BC',
            appointmentType: 'VLB_COURT_PRE',
            appointmentDate: '2023-10-01',
            startTime: '10:00',
            endTime: '10:30',
            dpsLocationId: 'LOCATION_ID_1',
            prisonLocKey: '',
            timeSlot: 'AM',
          },
          {
            prisonAppointmentId: 2,
            prisonCode: 'PRISON1',
            prisonerNumber: 'A1234BC',
            appointmentType: 'VLB_COURT_MAIN',
            appointmentDate: '2023-10-01',
            startTime: '10:30',
            endTime: '11:00',
            dpsLocationId: 'LOCATION_ID_2',
            prisonLocKey: '',
            timeSlot: 'AM',
          },
          {
            prisonAppointmentId: 3,
            prisonCode: 'PRISON1',
            prisonerNumber: 'A1234BC',
            appointmentType: 'VLB_COURT_POST',
            appointmentDate: '2023-10-01',
            startTime: '11:00',
            endTime: '11:30',
            dpsLocationId: 'LOCATION_ID_3',
            prisonLocKey: '',
            timeSlot: 'AM',
          },
        ],
      }

      bookAVideoLinkService.getVideoLinkBookingById.mockResolvedValue(videoLinkBooking)

      await movementSlipRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith(
        'pages/appointments/video-link-booking/court/movement-slip',
        expect.objectContaining({
          preAppointment: {
            ...videoLinkBooking.prisonAppointments[0],
            locationDescription: 'Room 1',
          },
          mainAppointment: {
            ...videoLinkBooking.prisonAppointments[1],
            locationDescription: 'Room 2',
          },
          postAppointment: {
            ...videoLinkBooking.prisonAppointments[2],
            locationDescription: 'Room 3',
          },
          prisoner: {
            prisonerNumber: 'A1234BC',
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1980-01-01',
            prisonId: 'PRISON1',
          },
        }),
      )
    })

    it('should render the movement slip page for pre and main hearing', async () => {
      videoLinkBooking = {
        ...videoLinkBooking,
        prisonAppointments: [
          {
            prisonAppointmentId: 1,
            prisonCode: 'PRISON1',
            prisonerNumber: 'A1234BC',
            appointmentType: 'VLB_COURT_PRE',
            appointmentDate: '2023-10-01',
            startTime: '10:00',
            endTime: '10:30',
            dpsLocationId: 'LOCATION_ID_1',
            prisonLocKey: '',
            timeSlot: 'AM',
          },
          {
            prisonAppointmentId: 2,
            prisonCode: 'PRISON1',
            prisonerNumber: 'A1234BC',
            appointmentType: 'VLB_COURT_MAIN',
            appointmentDate: '2023-10-01',
            startTime: '10:30',
            endTime: '11:00',
            dpsLocationId: 'LOCATION_ID_2',
            prisonLocKey: '',
            timeSlot: 'AM',
          },
        ],
      }

      bookAVideoLinkService.getVideoLinkBookingById.mockResolvedValue(videoLinkBooking)

      await movementSlipRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith(
        'pages/appointments/video-link-booking/court/movement-slip',
        expect.objectContaining({
          preAppointment: {
            ...videoLinkBooking.prisonAppointments[0],
            locationDescription: 'Room 1',
          },
          mainAppointment: {
            ...videoLinkBooking.prisonAppointments[1],
            locationDescription: 'Room 2',
          },
          prisoner: {
            prisonerNumber: 'A1234BC',
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1980-01-01',
            prisonId: 'PRISON1',
          },
        }),
      )
    })
  })

  it('should render the movement slip page for main and post hearing', async () => {
    videoLinkBooking = {
      ...videoLinkBooking,
      prisonAppointments: [
        {
          prisonAppointmentId: 2,
          prisonCode: 'PRISON1',
          prisonerNumber: 'A1234BC',
          appointmentType: 'VLB_COURT_MAIN',
          appointmentDate: '2023-10-01',
          startTime: '10:30',
          endTime: '11:00',
          dpsLocationId: 'LOCATION_ID_2',
          prisonLocKey: '',
          timeSlot: 'AM',
        },
        {
          prisonAppointmentId: 3,
          prisonCode: 'PRISON1',
          prisonerNumber: 'A1234BC',
          appointmentType: 'VLB_COURT_POST',
          appointmentDate: '2023-10-01',
          startTime: '11:00',
          endTime: '11:30',
          dpsLocationId: 'LOCATION_ID_3',
          prisonLocKey: '',
          timeSlot: 'AM',
        },
      ],
    }

    bookAVideoLinkService.getVideoLinkBookingById.mockResolvedValue(videoLinkBooking)

    await movementSlipRoutes.GET(req as Request, res as Response)

    expect(res.render).toHaveBeenCalledWith(
      'pages/appointments/video-link-booking/court/movement-slip',
      expect.objectContaining({
        mainAppointment: {
          ...videoLinkBooking.prisonAppointments[0],
          locationDescription: 'Room 2',
        },
        postAppointment: {
          ...videoLinkBooking.prisonAppointments[1],
          locationDescription: 'Room 3',
        },
        prisoner: {
          prisonerNumber: 'A1234BC',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1980-01-01',
          prisonId: 'PRISON1',
        },
      }),
    )
  })

  it('should render the movement slip page for main hearing', async () => {
    videoLinkBooking = {
      ...videoLinkBooking,
      prisonAppointments: [
        {
          prisonAppointmentId: 2,
          prisonCode: 'PRISON1',
          prisonerNumber: 'A1234BC',
          appointmentType: 'VLB_COURT_MAIN',
          appointmentDate: '2023-10-01',
          startTime: '10:30',
          endTime: '11:00',
          dpsLocationId: 'LOCATION_ID_2',
          prisonLocKey: '',
          timeSlot: 'AM',
        },
      ],
    }

    bookAVideoLinkService.getVideoLinkBookingById.mockResolvedValue(videoLinkBooking)

    await movementSlipRoutes.GET(req as Request, res as Response)

    expect(res.render).toHaveBeenCalledWith(
      'pages/appointments/video-link-booking/court/movement-slip',
      expect.objectContaining({
        mainAppointment: {
          ...videoLinkBooking.prisonAppointments[0],
          locationDescription: 'Room 2',
        },
        prisoner: {
          prisonerNumber: 'A1234BC',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1980-01-01',
          prisonId: 'PRISON1',
        },
      }),
    )
  })
})
