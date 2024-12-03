import { Request, Response } from 'express'
import { addDays, subDays } from 'date-fns'
import { when } from 'jest-when'
import createHttpError from 'http-errors'
import AppointmentDetailsRoutes from './appointmentDetails'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import { formatDate, toDateString } from '../../../../utils/utils'
import UserService from '../../../../services/userService'
import atLeast from '../../../../../jest.setup'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import config from '../../../../config'
import { VideoLinkBooking } from '../../../../@types/bookAVideoLinkApi/types'
import LocationMappingService from '../../../../services/locationMappingService'

jest.mock('../../../../services/userService')
jest.mock('../../../../services/bookAVideoLinkService')
jest.mock('../../../../services/locationMappingService')

const userService = new UserService(null, null, null) as jest.Mocked<UserService>
const bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
const locationMappingService = new LocationMappingService(null, null) as jest.Mocked<LocationMappingService>

describe('Route Handlers - Appointment Details', () => {
  const handler = new AppointmentDetailsRoutes(userService, bookAVideoLinkService, locationMappingService)
  const tomorrow = addDays(new Date(), 1)

  let req: Request
  let res: Response
  let appointment: AppointmentDetails

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    appointment = {
      id: 10,
      appointmentSeries: {
        id: 9,
      },
      category: {},
      startDate: formatDate(tomorrow, 'yyyy-MM-dd'),
      startTime: '23:59',
      createdBy: 'joebloggs',
      updatedBy: 'joebloggs',
      cancelledBy: 'joebloggs',
    } as AppointmentDetails

    when(userService.getUserMap)
      .calledWith(atLeast(['joebloggs', 'joebloggs', 'joebloggs']))
      .mockResolvedValue(new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      req = {
        params: {
          id: '10',
        },
        appointment,
      } as unknown as Request

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment/details', {
        appointment,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
      })
    })

    it('should redirect to view a video link booking', async () => {
      config.bookAVideoLinkToggleEnabled = true
      const vlbAppointment = {
        ...appointment,
        attendees: [{ prisoner: { prisonerNumber: 'ABC123' } }],
        category: {
          code: 'VLB',
        },
        prisonCode: 'MDI',
        internalLocation: { id: 1 },
      }

      req = {
        params: {
          id: '10',
        },
        appointment: vlbAppointment,
      } as unknown as Request

      when(locationMappingService.mapNomisLocationIdToDpsKey).calledWith(atLeast(1)).mockResolvedValue('locationKey')

      when(bookAVideoLinkService.matchAppointmentToVideoLinkBooking)
        .calledWith(atLeast('ABC123', 'locationKey'))
        .mockResolvedValue({ videoLinkBookingId: 1 } as VideoLinkBooking)

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('video-link-booking/1')
    })

    it('should render the VLB as an appointment if not found in BVLS API', async () => {
      config.bookAVideoLinkToggleEnabled = true
      const vlbAppointment = {
        ...appointment,
        attendees: [{ prisoner: { prisonerNumber: 'ABC123' } }],
        category: {
          code: 'VLB',
        },
        prisonCode: 'MDI',
        internalLocation: { id: 1 },
      }

      req = {
        params: {
          id: '10',
        },
        appointment: vlbAppointment,
      } as unknown as Request

      locationMappingService.mapNomisLocationIdToDpsKey.mockResolvedValue('locationKey')
      bookAVideoLinkService.matchAppointmentToVideoLinkBooking.mockRejectedValue(createHttpError.NotFound())

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment/details', {
        appointment: vlbAppointment,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
      })
    })
  })

  describe('COPY', () => {
    it('should render the expected view', async () => {
      req = {
        params: {
          id: '10',
        },
        appointment,
      } as unknown as Request

      await handler.COPY(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment/copy', {
        appointment,
      })
    })
  })

  describe('uncancellable appointments', () => {
    it('should render the expected view for an appointment cancelled 5 days ago can be uncancelled', async () => {
      req = {
        params: {
          id: '10',
        },
        appointment,
      } as unknown as Request

      appointment.isCancelled = true
      appointment.startDate = toDateString(subDays(new Date(), 5))

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment/details', {
        appointment,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
        uncancellable: true,
      })
    })

    it('should render the expected view for an appointment cancelled 6 days ago can be cannot be uncancelled', async () => {
      req = {
        params: {
          id: '10',
        },
        appointment,
      } as unknown as Request

      appointment.isCancelled = true
      appointment.startDate = toDateString(subDays(new Date(), 6))

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment/details', {
        appointment,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
        uncancellable: false,
      })
    })
  })
})
