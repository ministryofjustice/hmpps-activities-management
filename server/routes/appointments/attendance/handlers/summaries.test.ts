import { Request, Response } from 'express'
import { subDays } from 'date-fns'
import { when } from 'jest-when'
import SummariesRoutes from './summaries'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentAttendanceSummary } from '../../../../@types/activitiesAPI/types'
import DateOption from '../../../../enum/dateOption'
import { parseIsoDate } from '../../../../utils/datePickerUtils'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import atLeast from '../../../../../jest.setup'
import config from '../../../../config'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Appointment Attendance Summaries', () => {
  const handler = new SummariesRoutes(activitiesService, prisonService)
  let req: Request
  let res: Response

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = subDays(today, 1)
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
    } as unknown as Response

    req = {
      session: {},
    } as unknown as Request

    req.query = {}

    config.appointmentMultipleAttendanceToggleEnabled = true
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    describe('Deprecated', () => {
      // TODO: SAA-2197 Deprecated - remove

      beforeEach(() => {
        config.appointmentMultipleAttendanceToggleEnabled = false
      })

      it('redirects to select date when date is invalid', async () => {
        req.query = {
          dateOption: DateOption.OTHER,
          date: 'invalid',
        }

        await handler.GET(req, res)

        expect(res.redirect).toHaveBeenCalledWith('select-date')
      })

      it('should render the appointment attendance summaries page with no appointment attendance summaries', async () => {
        const dateOption = DateOption.TODAY
        req.query = {
          dateOption,
        }

        const summaries = [] as AppointmentAttendanceSummary[]
        const prisonersDetails = {} as Prisoner

        when(activitiesService.getAppointmentAttendanceSummaries)
          .calledWith(prisonCode, today, res.locals.user)
          .mockResolvedValue(summaries)

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/summaries', {
          dateOption,
          date: today,
          summaries,
          attendanceSummary: {
            attendeeCount: 0,
            attended: 0,
            notAttended: 0,
            notRecorded: 0,
            attendedPercentage: 0,
            notAttendedPercentage: 0,
            notRecordedPercentage: 0,
            foundationCount: 0,
            tier1Count: 0,
            tier2Count: 0,
          },
          prisonersDetails,
        })
      })

      it('should render the appointment attendance summaries page with appointment attendance summaries', async () => {
        const dateOption = DateOption.YESTERDAY
        req.query = {
          dateOption,
        }
        const prisonersDetails = {} as Prisoner

        const summaries = [
          {
            attendeeCount: 1,
            attendedCount: 0,
            nonAttendedCount: 0,
            notRecordedCount: 1,
            attendees: [],
            eventTierType: 'TIER_1',
          },
          {
            attendeeCount: 3,
            attendedCount: 2,
            nonAttendedCount: 1,
            notRecordedCount: 0,
            attendees: [],
            eventTierType: 'TIER_1',
          },
          {
            attendeeCount: 6,
            attendedCount: 3,
            nonAttendedCount: 2,
            notRecordedCount: 1,
            attendees: [],
            eventTierType: 'TIER_2',
          },
        ] as AppointmentAttendanceSummary[]

        when(activitiesService.getAppointmentAttendanceSummaries)
          .calledWith(prisonCode, yesterday, res.locals.user)
          .mockResolvedValue(summaries)

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/summaries', {
          dateOption,
          date: yesterday,
          summaries,
          attendanceSummary: {
            attendeeCount: 10,
            attended: 5,
            notAttended: 3,
            notRecorded: 2,
            attendedPercentage: 50,
            notAttendedPercentage: 30,
            notRecordedPercentage: 20,
            foundationCount: 0,
            tier1Count: 2,
            tier2Count: 3,
          },
          prisonersDetails,
        })
      })

      it('should exclude cancelled appointments', async () => {
        const dateOption = DateOption.OTHER
        req.query = {
          dateOption,
          date: '2023-10-16',
        }
        const prisonersDetails = {} as Prisoner

        const summaries = [
          {
            attendeeCount: 1,
            attendedCount: 0,
            nonAttendedCount: 0,
            notRecordedCount: 1,
            attendees: [],
            eventTierType: 'FOUNDATION',
          },
          {
            isCancelled: true,
            attendeeCount: 3,
            attendedCount: 2,
            nonAttendedCount: 1,
            notRecordedCount: 0,
            attendees: [],
            eventTierType: 'FOUNDATION',
          },
          {
            attendeeCount: 6,
            attendedCount: 3,
            nonAttendedCount: 2,
            notRecordedCount: 1,
            attendees: [],
            eventTierType: 'TIER_2',
          },
        ] as AppointmentAttendanceSummary[]

        when(activitiesService.getAppointmentAttendanceSummaries)
          .calledWith(prisonCode, parseIsoDate('2023-10-16'), res.locals.user)
          .mockResolvedValue(summaries)

        await handler.GET(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/summaries', {
          dateOption,
          date: parseIsoDate('2023-10-16'),
          summaries: [
            {
              attendeeCount: 1,
              attendedCount: 0,
              nonAttendedCount: 0,
              notRecordedCount: 1,
              attendees: [],
              eventTierType: 'FOUNDATION',
            },
            {
              attendeeCount: 6,
              attendedCount: 3,
              nonAttendedCount: 2,
              notRecordedCount: 1,
              attendees: [],
              eventTierType: 'TIER_2',
            },
          ] as AppointmentAttendanceSummary[],
          attendanceSummary: {
            attendeeCount: 7,
            attended: 3,
            notAttended: 2,
            notRecorded: 2,
            attendedPercentage: 43,
            notAttendedPercentage: 29,
            notRecordedPercentage: 29,
            foundationCount: 0,
            tier1Count: 0,
            tier2Count: 3,
          },
          prisonersDetails,
        })
      })

      it('should provide prisoner details for 1 attendee', async () => {
        const dateOption = DateOption.OTHER
        req.query = {
          dateOption,
          date: '2023-10-17',
        }

        const summaries = [
          {
            attendeeCount: 1,
            attendedCount: 0,
            nonAttendedCount: 0,
            notRecordedCount: 1,
            attendees: [
              {
                prisonerNumber: 'A0013DZ',
              },
            ],
          },
          {
            attendeeCount: 3,
            attendedCount: 2,
            nonAttendedCount: 1,
            notRecordedCount: 0,
            attendees: [],
          },
        ] as AppointmentAttendanceSummary[]

        // Mock the response of activitiesService.getAppointmentAttendanceSummaries
        when(activitiesService.getAppointmentAttendanceSummaries)
          .calledWith(prisonCode, parseIsoDate('2023-10-17'), res.locals.user)
          .mockResolvedValue(summaries)

        // Mock the response of prisonService.searchInmatesByPrisonerNumbers
        when(prisonService.searchInmatesByPrisonerNumbers)
          .calledWith(atLeast(['A0013DZ']))
          .mockResolvedValue([
            {
              prisonerNumber: 'A0013DZ',
              firstName: 'RODNEY',
              lastName: 'REINDEER',
              cellLocation: 'MDI-4-2-009',
            },
          ] as Prisoner[])

        // Call the GET method
        await handler.GET(req, res)

        // Define the expected summaries without cancelled appointments
        const expectedSummaries = [
          {
            attendeeCount: 1,
            attendedCount: 0,
            nonAttendedCount: 0,
            notRecordedCount: 1,
            attendees: [
              {
                prisonerNumber: 'A0013DZ',
              },
            ],
          },
          {
            attendeeCount: 3,
            attendedCount: 2,
            nonAttendedCount: 1,
            notRecordedCount: 0,
            attendees: [],
          },
        ] as AppointmentAttendanceSummary[]

        // Define the expected prisoners details
        const expectedPrisonersDetails = {
          A0013DZ: {
            prisonerNumber: 'A0013DZ',
            firstName: 'RODNEY',
            lastName: 'REINDEER',
            cellLocation: 'MDI-4-2-009',
          },
        }

        // Assert that res.render was called with the expected data
        expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/summaries', {
          dateOption,
          date: parseIsoDate('2023-10-17'),
          summaries: expectedSummaries,
          attendanceSummary: {
            attended: 2,
            attendedPercentage: 50,
            attendeeCount: 4,
            notAttended: 1,
            notAttendedPercentage: 25,
            notRecorded: 1,
            notRecordedPercentage: 25,
            foundationCount: 0,
            tier1Count: 0,
            tier2Count: 0,
          },
          prisonersDetails: expectedPrisonersDetails,
        })
      })
    })

    it('redirects to select date when date is invalid', async () => {
      req.query = {
        dateOption: DateOption.OTHER,
        date: 'invalid',
      }

      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('select-date')
    })

    it('should render the appointment attendance summaries page with no appointment attendance summaries', async () => {
      const dateOption = DateOption.TODAY
      req.query = {
        dateOption,
      }

      const summaries = [] as AppointmentAttendanceSummary[]
      const prisonersDetails = {} as Prisoner

      when(activitiesService.getAppointmentAttendanceSummaries)
        .calledWith(prisonCode, today, res.locals.user)
        .mockResolvedValue(summaries)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/summaries-multi-select', {
        date: today,
        summaries,
        attendanceSummary: {
          attendeeCount: 0,
          attended: 0,
          notAttended: 0,
          notRecorded: 0,
          attendedPercentage: 0,
          notAttendedPercentage: 0,
          notRecordedPercentage: 0,
          foundationCount: 0,
          tier1Count: 0,
          tier2Count: 0,
        },
        prisonersDetails,
      })
    })

    it('should render the appointment attendance summaries page with appointment attendance summaries', async () => {
      const dateOption = DateOption.YESTERDAY
      req.query = {
        dateOption,
      }
      const prisonersDetails = {} as Prisoner

      const summaries = [
        {
          attendeeCount: 1,
          attendedCount: 0,
          nonAttendedCount: 0,
          notRecordedCount: 1,
          attendees: [],
          eventTierType: 'TIER_1',
        },
        {
          attendeeCount: 3,
          attendedCount: 2,
          nonAttendedCount: 1,
          notRecordedCount: 0,
          attendees: [],
          eventTierType: 'TIER_1',
        },
        {
          attendeeCount: 6,
          attendedCount: 3,
          nonAttendedCount: 2,
          notRecordedCount: 1,
          attendees: [],
          eventTierType: 'TIER_2',
        },
      ] as AppointmentAttendanceSummary[]

      when(activitiesService.getAppointmentAttendanceSummaries)
        .calledWith(prisonCode, yesterday, res.locals.user)
        .mockResolvedValue(summaries)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/summaries-multi-select', {
        date: yesterday,
        summaries,
        attendanceSummary: {
          attendeeCount: 10,
          attended: 5,
          notAttended: 3,
          notRecorded: 2,
          attendedPercentage: 50,
          notAttendedPercentage: 30,
          notRecordedPercentage: 20,
          foundationCount: 0,
          tier1Count: 2,
          tier2Count: 3,
        },
        prisonersDetails,
      })
    })

    it('should exclude cancelled appointments', async () => {
      const dateOption = DateOption.OTHER
      req.query = {
        dateOption,
        date: '2023-10-16',
      }
      const prisonersDetails = {} as Prisoner

      const summaries = [
        {
          attendeeCount: 1,
          attendedCount: 0,
          nonAttendedCount: 0,
          notRecordedCount: 1,
          attendees: [],
          eventTierType: 'FOUNDATION',
        },
        {
          isCancelled: true,
          attendeeCount: 3,
          attendedCount: 2,
          nonAttendedCount: 1,
          notRecordedCount: 0,
          attendees: [],
          eventTierType: 'FOUNDATION',
        },
        {
          attendeeCount: 6,
          attendedCount: 3,
          nonAttendedCount: 2,
          notRecordedCount: 1,
          attendees: [],
          eventTierType: 'TIER_2',
        },
      ] as AppointmentAttendanceSummary[]

      when(activitiesService.getAppointmentAttendanceSummaries)
        .calledWith(prisonCode, parseIsoDate('2023-10-16'), res.locals.user)
        .mockResolvedValue(summaries)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/summaries-multi-select', {
        date: parseIsoDate('2023-10-16'),
        summaries: [
          {
            attendeeCount: 1,
            attendedCount: 0,
            nonAttendedCount: 0,
            notRecordedCount: 1,
            attendees: [],
            eventTierType: 'FOUNDATION',
          },
          {
            attendeeCount: 6,
            attendedCount: 3,
            nonAttendedCount: 2,
            notRecordedCount: 1,
            attendees: [],
            eventTierType: 'TIER_2',
          },
        ] as AppointmentAttendanceSummary[],
        attendanceSummary: {
          attendeeCount: 7,
          attended: 3,
          notAttended: 2,
          notRecorded: 2,
          attendedPercentage: 43,
          notAttendedPercentage: 29,
          notRecordedPercentage: 29,
          foundationCount: 0,
          tier1Count: 0,
          tier2Count: 3,
        },
        prisonersDetails,
      })
    })

    it('should provide prisoner details for 1 attendee', async () => {
      const dateOption = DateOption.OTHER
      req.query = {
        dateOption,
        date: '2023-10-17',
      }

      const summaries = [
        {
          attendeeCount: 1,
          attendedCount: 0,
          nonAttendedCount: 0,
          notRecordedCount: 1,
          attendees: [
            {
              prisonerNumber: 'A0013DZ',
            },
          ],
        },
        {
          attendeeCount: 3,
          attendedCount: 2,
          nonAttendedCount: 1,
          notRecordedCount: 0,
          attendees: [],
        },
      ] as AppointmentAttendanceSummary[]

      // Mock the response of activitiesService.getAppointmentAttendanceSummaries
      when(activitiesService.getAppointmentAttendanceSummaries)
        .calledWith(prisonCode, parseIsoDate('2023-10-17'), res.locals.user)
        .mockResolvedValue(summaries)

      // Mock the response of prisonService.searchInmatesByPrisonerNumbers
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(atLeast(['A0013DZ']))
        .mockResolvedValue([
          {
            prisonerNumber: 'A0013DZ',
            firstName: 'RODNEY',
            lastName: 'REINDEER',
            cellLocation: 'MDI-4-2-009',
          },
        ] as Prisoner[])

      // Call the GET method
      await handler.GET(req, res)

      // Define the expected summaries without cancelled appointments
      const expectedSummaries = [
        {
          attendeeCount: 1,
          attendedCount: 0,
          nonAttendedCount: 0,
          notRecordedCount: 1,
          attendees: [
            {
              prisonerNumber: 'A0013DZ',
            },
          ],
        },
        {
          attendeeCount: 3,
          attendedCount: 2,
          nonAttendedCount: 1,
          notRecordedCount: 0,
          attendees: [],
        },
      ] as AppointmentAttendanceSummary[]

      // Define the expected prisoners details
      const expectedPrisonersDetails = {
        A0013DZ: {
          prisonerNumber: 'A0013DZ',
          firstName: 'RODNEY',
          lastName: 'REINDEER',
          cellLocation: 'MDI-4-2-009',
        },
      }

      // Assert that res.render was called with the expected data
      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/summaries-multi-select', {
        date: parseIsoDate('2023-10-17'),
        summaries: expectedSummaries,
        attendanceSummary: {
          attended: 2,
          attendedPercentage: 50,
          attendeeCount: 4,
          notAttended: 1,
          notAttendedPercentage: 25,
          notRecorded: 1,
          notRecordedPercentage: 25,
          foundationCount: 0,
          tier1Count: 0,
          tier2Count: 0,
        },
        prisonersDetails: expectedPrisonersDetails,
      })
    })

    it('should filter appointments by search term', async () => {
      const dateOption = DateOption.YESTERDAY
      req.query = {
        dateOption,
        searchTerm: 'ChAp',
      }
      const prisonersDetails = {} as Prisoner

      const summaries = [
        {
          appointmentName: 'Gym',
          attendeeCount: 1,
          attendedCount: 0,
          nonAttendedCount: 0,
          notRecordedCount: 1,
          attendees: [],
          eventTierType: 'TIER_1',
        },
        {
          appointmentName: 'Chaplaincy',
          attendeeCount: 3,
          attendedCount: 2,
          nonAttendedCount: 1,
          notRecordedCount: 0,
          attendees: [],
          eventTierType: 'TIER_1',
        },
        {
          appointmentName: 'ChaPLaincy 2',
          attendeeCount: 6,
          attendedCount: 3,
          nonAttendedCount: 2,
          notRecordedCount: 1,
          attendees: [],
          eventTierType: 'TIER_2',
        },
      ] as AppointmentAttendanceSummary[]

      when(activitiesService.getAppointmentAttendanceSummaries)
        .calledWith(prisonCode, yesterday, res.locals.user)
        .mockResolvedValue(summaries)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance/summaries-multi-select', {
        date: yesterday,
        summaries: [summaries[1], summaries[2]],
        attendanceSummary: {
          attendeeCount: 9,
          attended: 5,
          notAttended: 3,
          notRecorded: 1,
          attendedPercentage: 56,
          notAttendedPercentage: 33,
          notRecordedPercentage: 11,
          foundationCount: 0,
          tier1Count: 2,
          tier2Count: 3,
        },
        prisonersDetails,
      })
    })
  })

  describe('SELECT_APPOINTMENTS', () => {
    beforeEach(() => {
      req.session.recordAppointmentAttendanceJourney = {}
    })

    it('redirects to select date when date is invalid', async () => {
      req.body = {
        appointmentIds: ['1', '2'],
      }

      await handler.SELECT_APPOINTMENTS(req, res)

      expect(res.redirect).toHaveBeenCalledWith('../attendees')
      expect(req.session.recordAppointmentAttendanceJourney.appointmentIds).toEqual([1, 2])
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      req.session.recordAppointmentAttendanceJourney = {}
    })

    it('redirects to GET', async () => {
      req.query = {
        dateOption: DateOption.OTHER,
        date: '2024-11-23',
      }

      req.body = {
        searchTerm: 'CHap',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('summaries?dateOption=other&date=2024-11-23&searchTerm=CHap')
    })
  })
})
