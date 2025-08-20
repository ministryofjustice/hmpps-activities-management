import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import EventOrganiser from '../../../../enum/eventOrganisers'
import EventTier from '../../../../enum/eventTiers'
import { AttendanceStatus } from '../../../../@types/appointments'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import DashboardRoutes from './dashboard'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Dashboard', () => {
  const handler = new DashboardRoutes(activitiesService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          activeCaseLoadId: 'MDI',
          username: 'USER1',
          displayName: 'John Smith',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {
        appointmentName: 'Medical & Doctor',
        customAppointmentName: 'Custom Medical & Doctor',
        attendanceState: AttendanceStatus.EVENT_TIER,
        eventTier: EventTier.TIER_1,
        organiserCode: EventOrganiser.EXTERNAL_PROVIDER,
        searchTerm: 'A & B test',
      },
    } as unknown as Request

    activitiesService.getAppointmentCategories.mockReturnValue(
      Promise.resolve([
        {
          code: 'ACTI',
          description: 'Activities',
        },
        {
          code: 'OIC',
          description: 'Adjudication Review',
        },
        {
          code: 'CANT',
          description: 'Canteen',
        },
      ]),
    )

    activitiesService.getAppointmentAttendanceSummaries.mockReturnValue(
      Promise.resolve([
        {
          id: 1,
          prisonCode: 'MDI',
          appointmentName: 'Gym',
          internalLocation: { id: 26149, prisonCode: 'MDI', description: 'Gym' },
          startDate: '2024-06-24',
          startTime: '11:00',
          endTime: '13:30',
          isCancelled: false,
          inCell: true,
          attendeeCount: 3,
          attendedCount: 1,
          nonAttendedCount: 0,
          notRecordedCount: 2,
          attendees: [
            {
              appointmentAttendeeId: 223716,
              prisonerNumber: 'G8438VW',
              bookingId: 1131145,
            },
            {
              appointmentAttendeeId: 223717,
              prisonerNumber: 'G5852GQ',
              bookingId: 550291,
            },
            {
              appointmentAttendeeId: 223718,
              prisonerNumber: 'G0256VF',
              bookingId: 1099208,
            },
          ],
          eventTierType: 'TIER_2',
        },
      ]),
    )
  })

  describe('GET', () => {
    it('should redirect with the current date', async () => {
      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`?date=${formatIsoDate(new Date())}`)
    })

    it('should render with attendance data', async () => {
      req.query.date = new Date().toISOString()
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance-summary-stats/dashboard', {
        appointmentName: 'Medical & Doctor',
        attendanceSummary: {
          attended: 1,
          attendedPercentage: 33,
          attendeeCount: 3,
          foundationCount: 0,
          notAttended: 0,
          notAttendedPercentage: 0,
          notRecorded: 2,
          notRecordedPercentage: 67,
          tier1Count: 0,
          tier2Count: 1,
        },
        cancelledCount: 0,
        categories: [
          {
            code: 'ACTI',
            description: 'Activities',
          },
          {
            code: 'OIC',
            description: 'Adjudication Review',
          },
          {
            code: 'CANT',
            description: 'Canteen',
          },
        ],
        customAppointmentName: 'Custom Medical & Doctor',
        date: req.query.date,
        summariesNotCancelled: [
          {
            appointmentName: 'Gym',
            attendedCount: 1,
            attendeeCount: 3,
            attendees: [
              {
                appointmentAttendeeId: 223716,
                bookingId: 1131145,
                prisonerNumber: 'G8438VW',
              },
              {
                appointmentAttendeeId: 223717,
                bookingId: 550291,
                prisonerNumber: 'G5852GQ',
              },
              {
                appointmentAttendeeId: 223718,
                bookingId: 1099208,
                prisonerNumber: 'G0256VF',
              },
            ],
            endTime: '13:30',
            eventTierType: 'TIER_2',
            id: 1,
            inCell: true,
            internalLocation: {
              description: 'Gym',
              id: 26149,
              prisonCode: 'MDI',
            },
            isCancelled: false,
            nonAttendedCount: 0,
            notRecordedCount: 2,
            prisonCode: 'MDI',
            startDate: '2024-06-24',
            startTime: '11:00',
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should redirect to with appointment details', async () => {
      req = {
        body: {
          date: '9/7/2025',
          appointmentName: 'Medical & Doctor',
          customAppointmentName: 'Custom Medical & Doctor',
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        '?date=2025-07-09&appointmentName=Medical & Doctor&customAppointmentName=Custom Medical & Doctor',
      )
    })

    it('should redirect to without appointment details', async () => {
      req = {
        body: {
          date: '9/7/2025',
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('?date=2025-07-09&appointmentName=&customAppointmentName=')
    })
  })
})
