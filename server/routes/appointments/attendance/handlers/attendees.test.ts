import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { AppointmentDetails, PrisonerScheduledEvents } from '../../../../@types/activitiesAPI/types'
import AttendeesRoutes from './attendees'
import AttendanceAction from '../../../../enum/attendanceAction'
import { toDate } from '../../../../utils/utils'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { AppointmentFrequency } from '../../../../@types/appointments'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/userService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Record Appointment Attendance', () => {
  const handler = new AttendeesRoutes(activitiesService, prisonService)

  let req: Request
  let res: Response

  const prisonCode = 'RSI'

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: prisonCode,
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      journeyData: {},
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET_MULTIPLE', () => {
    beforeEach(() => {
      const scheduledEvents = {
        activities: [],
        appointments: [],
        courtHearings: [],
        visits: [],
        adjudications: [],
      } as PrisonerScheduledEvents

      activitiesService.getScheduledEventsForPrisoners.mockImplementation(() => {
        return Promise.resolve(scheduledEvents)
      })
    })

    it('should render the attendance page with appointments', async () => {
      req.journeyData.recordAppointmentAttendanceJourney = {
        appointmentIds: [1, 2],
      }

      const appointments = [
        {
          id: 1,
          appointmentName: 'Chaplaincy',
          startDate: '2024-02-25',
          startTime: '15:00',
          attendees: [{ prisoner: { prisonerNumber: 'A1234BC' } }, { prisoner: { prisonerNumber: 'D4444DD' } }],
        },
        {
          id: 2,
          appointmentName: 'Gym',
          startDate: '2024-02-25',
          attendees: [{ prisoner: { prisonerNumber: 'A1234BC' } }],
        },
      ] as AppointmentDetails[]

      when(activitiesService.getAppointments).calledWith([1, 2], res.locals.user).mockResolvedValue(appointments)

      await handler.GET_MULTIPLE(req, res)

      const attendeeRows = [
        {
          ...appointments[0].attendees[0],
          appointment: appointments[0],
          otherEvents: [],
        },
        {
          ...appointments[0].attendees[1],
          appointment: appointments[0],
          otherEvents: [],
        },
        {
          ...appointments[1].attendees[0],
          appointment: appointments[1],
          otherEvents: [],
        },
      ]

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/attendees', {
        attendeeRows,
        appointments,
        attendanceSummary: {
          attendeeCount: 3,
          attended: 0,
          notAttended: 0,
          notRecorded: 3,
          attendedPercentage: 0,
          notAttendedPercentage: 0,
          notRecordedPercentage: 100,
        },
      })
    })

    it('should render the attendance page with appointments that have marked attendances', async () => {
      req.journeyData.recordAppointmentAttendanceJourney = {
        appointmentIds: [1, 2, 3, 4, 5, 6],
      }

      const appointments = [
        {
          id: 1,
          appointmentName: 'Chaplaincy',
          startDate: '2024-02-25',
          startTime: '15:00',
          endTime: '16:00',
          attendees: [
            { prisoner: { prisonerNumber: 'A1234BC' }, attended: true },
            { prisoner: { prisonerNumber: 'D4444DD' }, attended: false },
            { prisoner: { prisonerNumber: 'E5555EE' }, attended: false },
            { prisoner: { prisonerNumber: 'F6666FF' }, attended: null },
            { prisoner: { prisonerNumber: 'G7777GG' }, attended: true },
          ],
        },
        {
          id: 2,
          appointmentName: 'Gym',
          startDate: '2024-02-25',
          attendees: [
            { prisoner: { prisonerNumber: 'A1234BC' }, attended: null },
            { prisoner: { prisonerNumber: 'G7777GG' }, attended: null },
          ],
        },
      ] as AppointmentDetails[]

      when(activitiesService.getAppointments)
        .calledWith([1, 2, 3, 4, 5, 6], res.locals.user)
        .mockResolvedValue(appointments)

      await handler.GET_MULTIPLE(req, res)

      const attendeeRows = [
        {
          ...appointments[0].attendees[0],
          appointment: appointments[0],
          otherEvents: [],
        },
        {
          ...appointments[0].attendees[1],
          appointment: appointments[0],
          otherEvents: [],
        },
        {
          ...appointments[0].attendees[2],
          appointment: appointments[0],
          otherEvents: [],
        },
        {
          ...appointments[0].attendees[3],
          appointment: appointments[0],
          otherEvents: [],
        },
        {
          ...appointments[0].attendees[4],
          appointment: appointments[0],
          otherEvents: [],
        },
        {
          ...appointments[1].attendees[0],
          appointment: appointments[1],
          otherEvents: [],
        },
        {
          ...appointments[1].attendees[1],
          appointment: appointments[1],
          otherEvents: [],
        },
      ]

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/attendees', {
        attendeeRows,
        appointments,
        attendanceSummary: {
          attendeeCount: 7,
          attended: 2,
          notAttended: 2,
          notRecorded: 3,
          attendedPercentage: 29,
          notAttendedPercentage: 29,
          notRecordedPercentage: 43,
        },
      })
    })

    it('should render the attendance page with appointments', async () => {
      req.journeyData.recordAppointmentAttendanceJourney = {
        appointmentIds: [1, 2],
      }

      const appointments = [
        {
          id: 1,
          appointmentName: 'Chaplaincy',
          startDate: '2024-02-25',
          startTime: '15:00',
          endTime: '16:00',
          attendees: [{ prisoner: { prisonerNumber: 'A1234BC' } }],
        },
      ] as AppointmentDetails[]

      const clashingAppointment = {
        appointmentId: 2,
        prisonerNumber: 'A1234BC',
        eventType: 'APPOINTMENT',
        date: '2024-02-25',
        startTime: '15:00',
        endTime: '16:00',
      }

      const nonClashingAppointment = {
        appointmentId: 3,
        eventType: 'APPOINTMENT',
        prisonerNumber: 'A1234DD',
        date: '2024-02-25',
        startTime: '15:00',
        endTime: '16:00',
      }

      const cancelledClashingAppointment = {
        appointmentId: 4,
        prisonerNumber: 'A1234BC',
        eventType: 'APPOINTMENT',
        date: '2024-02-25',
        startTime: '15:00',
        endTime: '16:00',
        cancelled: true,
        appointmentSeriesCancellationStartDate: '2024-02-24',
        appointmentSeriesFrequency: AppointmentFrequency.DAILY,
      }

      const cancelledNonClashingAppointment = {
        appointmentId: 5,
        prisonerNumber: 'A1234BC',
        eventType: 'APPOINTMENT',
        date: '2024-02-25',
        startTime: '15:00',
        endTime: '16:00',
        cancelled: true,
        appointmentSeriesCancellationStartDate: '2024-02-20',
        appointmentSeriesFrequency: AppointmentFrequency.DAILY,
      }

      const clashingActivity = {
        scheduledInstanceId: 1,
        prisonerNumber: 'A1234BC',
        eventType: 'ACTIVITY',
        date: '2024-02-25',
        startTime: '14:30',
        endTime: '15:10',
      }

      const nonClashingActivity = {
        scheduledInstanceId: 2,
        prisonerNumber: 'D4444DD',
        eventType: 'ACTIVITY',
        date: '2024-02-25',
        startTime: '15:30',
        endTime: '16:10',
      }

      const clashingCourtHearing = {
        prisonerNumber: 'A1234BC',
        eventType: 'COURT_HEARING',
        date: '2024-02-25',
        startTime: '15:10',
        endTime: '15:40',
      }

      const nonClashingCourtHearing = {
        prisonerNumber: 'D4444DD',
        eventType: 'COURT_HEARING',
        date: '2024-02-25',
        startTime: '15:10',
        endTime: '15:40',
      }

      const clashingVisit = {
        eventType: 'VISIT',
        prisonerNumber: 'A1234BC',
        date: '2024-02-25',
        startTime: '15:59',
        endTime: '16:40',
      }

      const nonClashingVisit = {
        eventType: 'VISIT',
        prisonerNumber: 'A1234BC',
        date: '2024-02-25',
        startTime: '13:00',
        endTime: '15:00',
      }

      const clashingAdjudication = {
        eventType: 'ADJUDICATION_HEARING',
        prisonerNumber: 'A1234BC',
        date: '2024-02-25',
        startTime: '13:00',
        endTime: '17:00',
      }

      const nonClashingAdjudication = {
        eventType: 'ADJUDICATION_HEARING',
        prisonerNumber: 'A1234BC',
        date: '2024-02-25',
        startTime: '16:01',
        endTime: '18:00',
      }

      const scheduledEvents = {
        activities: [clashingActivity, nonClashingActivity],
        appointments: [
          clashingAppointment,
          nonClashingAppointment,
          cancelledClashingAppointment,
          cancelledNonClashingAppointment,
        ],
        courtHearings: [clashingCourtHearing, nonClashingCourtHearing],
        visits: [clashingVisit, nonClashingVisit],
        adjudications: [clashingAdjudication, nonClashingAdjudication],
      } as PrisonerScheduledEvents

      when(activitiesService.getAppointments).calledWith([1, 2], res.locals.user).mockResolvedValue(appointments)
      when(activitiesService.getScheduledEventsForPrisoners)
        .calledWith(toDate('2024-02-25'), ['A1234BC'], res.locals.user)
        .mockResolvedValue(scheduledEvents)

      await handler.GET_MULTIPLE(req, res)

      const attendeeRows = [
        {
          prisoner: { prisonerNumber: 'A1234BC' },
          appointment: appointments[0],
          otherEvents: [
            clashingActivity,
            clashingAppointment,
            cancelledClashingAppointment,
            clashingCourtHearing,
            clashingVisit,
            clashingAdjudication,
          ],
        },
      ]

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/attendees', {
        attendeeRows,
        appointments,
        attendanceSummary: {
          attendeeCount: 1,
          attended: 0,
          notAttended: 0,
          notRecorded: 1,
          attendedPercentage: 0,
          notAttendedPercentage: 0,
          notRecordedPercentage: 100,
        },
      })
    })

    it('should filter attendees by search term', async () => {
      req.query = {
        searchTerm: 'jO',
      }

      req.journeyData.recordAppointmentAttendanceJourney = {
        appointmentIds: [1, 2],
      }

      const appointments = [
        {
          id: 1,
          appointmentName: 'Chaplaincy',
          startDate: '2024-02-25',
          startTime: '15:00',
          attendees: [
            {
              attended: true,
              prisoner: {
                prisonerNumber: 'A1234BC',
                firstName: 'JOe',
                lastName: 'Smith',
              },
            },
            {
              attended: false,
              prisoner: {
                prisonerNumber: 'D4444DD',
                firstName: 'Jim',
                lastName: 'DeJOHanson',
              },
            },
          ],
        },
        {
          id: 2,
          appointmentName: 'Gym',
          startDate: '2024-02-25',
          attendees: [
            {
              attended: null,
              prisoner: {
                prisonerNumber: 'J3333Jo',
                firstName: 'Jim',
                lastName: 'Smith',
              },
            },
            {
              attended: null,
              prisoner: {
                prisonerNumber: 'J3333Jj',
                firstName: 'Jim',
                lastName: 'Smith',
              },
            },
          ],
        },
      ] as AppointmentDetails[]

      when(activitiesService.getAppointments).calledWith([1, 2], res.locals.user).mockResolvedValue(appointments)

      await handler.GET_MULTIPLE(req, res)

      const attendeeRows = [
        {
          ...appointments[0].attendees[0],
          appointment: appointments[0],
          otherEvents: [],
        },
        {
          ...appointments[0].attendees[1],
          appointment: appointments[0],
          otherEvents: [],
        },
        {
          ...appointments[1].attendees[0],
          appointment: appointments[1],
          otherEvents: [],
        },
      ]

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/attendees', {
        attendeeRows,
        appointments,
        attendanceSummary: {
          attendeeCount: 3,
          attended: 1,
          notAttended: 1,
          notRecorded: 1,
          attendedPercentage: 33,
          notAttendedPercentage: 33,
          notRecordedPercentage: 33,
        },
      })
    })
  })

  describe('GET_MULTIPLE', () => {
    it('should redirect back if the appointmentId has been lost', async () => {
      req.journeyData.recordAppointmentAttendanceJourney = {
        appointmentIds: undefined,
      }

      await handler.GET_MULTIPLE(req, res)

      expect(res.redirect).toHaveBeenCalledWith('../select-date')
    })
  })

  describe('GET_SINGLE', () => {
    it('should update session and redirect', async () => {
      req.params = {
        appointmentId: '33',
      }

      await handler.GET_SINGLE(req, res)

      expect(res.redirect).toHaveBeenCalledWith('../attendees')
      expect(req.journeyData.recordAppointmentAttendanceJourney.appointmentIds).toEqual([33])
    })
  })

  describe('ATTEND', () => {
    it('should record attendance for one attendee', async () => {
      req.body = {
        attendanceIds: ['44-1234BC'],
      }

      const selectedPrisoner = {
        prisonerNumber: '1234BC',
        firstName: 'Aldgorse',
        lastName: 'Ashlinda',
      } as Prisoner
      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('1234BC', res.locals.user)
        .mockResolvedValue(selectedPrisoner)

      await handler.ATTEND(req, res)

      expect(activitiesService.updateMultipleAppointmentAttendances).toHaveBeenCalledWith(
        AttendanceAction.ATTENDED,
        [
          {
            appointmentId: 44,
            prisonerNumbers: ['1234BC'],
          },
        ],
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../attendees',
        'Attendance recorded',
        "You've saved attendance details for Aldgorse Ashlinda",
      )
    })

    it('should record attendance for multiple attendees', async () => {
      req.body = {
        attendanceIds: ['44-1234BC', '32-1234BC', '98-3456DD', '44-3456DD'],
      }

      await handler.ATTEND(req, res)

      expect(activitiesService.updateMultipleAppointmentAttendances).toHaveBeenCalledWith(
        AttendanceAction.ATTENDED,
        [
          {
            appointmentId: 44,
            prisonerNumbers: ['1234BC', '3456DD'],
          },
          {
            appointmentId: 32,
            prisonerNumbers: ['1234BC'],
          },
          {
            appointmentId: 98,
            prisonerNumbers: ['3456DD'],
          },
        ],
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../attendees',
        'Attendance recorded',
        "You've saved attendance details for 4 attendees",
      )
    })
  })

  describe('NON_ATTEND', () => {
    it('should record non-attendance for one attendee', async () => {
      req.body = {
        attendanceIds: ['44-1234BC'],
      }

      const selectedPrisoner = {
        prisonerNumber: 'A1234BC',
        firstName: 'Aldgorse',
        lastName: 'Ashlinda',
      } as Prisoner
      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('A1234BC', res.locals.user)
        .mockResolvedValue(selectedPrisoner)

      await handler.NON_ATTEND(req, res)

      expect(activitiesService.updateMultipleAppointmentAttendances).toHaveBeenCalledWith(
        AttendanceAction.NOT_ATTENDED,
        [
          {
            appointmentId: 44,
            prisonerNumbers: ['1234BC'],
          },
        ],
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../attendees',
        'Non-attendance recorded',
        "You've saved attendance details for Aldgorse Ashlinda",
      )
    })

    it('should record attendance for multiple attendees', async () => {
      req.body = {
        attendanceIds: ['44-1234BC', '32-1234BC', '98-3456DD', '44-3456DD'],
      }

      await handler.NON_ATTEND(req, res)

      expect(activitiesService.updateMultipleAppointmentAttendances).toHaveBeenCalledWith(
        AttendanceAction.NOT_ATTENDED,
        [
          {
            appointmentId: 44,
            prisonerNumbers: ['1234BC', '3456DD'],
          },
          {
            appointmentId: 32,
            prisonerNumbers: ['1234BC'],
          },
          {
            appointmentId: 98,
            prisonerNumbers: ['3456DD'],
          },
        ],
        res.locals.user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../attendees',
        'Non-attendance recorded',
        "You've saved attendance details for 4 attendees",
      )
    })
  })

  describe('POST', () => {
    it('redirects to GET', async () => {
      req.body = {
        searchTerm: 'A & B test',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('attendees?searchTerm=A%20%26%20B%20test')
    })
  })
})
