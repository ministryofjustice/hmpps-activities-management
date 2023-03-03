import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format } from 'date-fns'
import ActivitiesService from '../../../services/activitiesService'
import { PrisonerScheduledEvents, ScheduledActivity } from '../../../@types/activitiesAPI/types'
import PrisonService from '../../../services/prisonService'
import AttendanceListRoutes from './attendanceList'
import { InmateBasicDetails } from '../../../@types/prisonApiImport/types'
import { toDate } from '../../../utils/utils'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/prisonService')

const activitiesService = new ActivitiesService(null, null, null)
const prisonService = new PrisonService(null, null, null, null)

describe('Route Handlers - Attendance List', () => {
  const handler = new AttendanceListRoutes(activitiesService, prisonService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
    } as unknown as Response

    req = {
      params: { id: 1 },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render with the expected view', async () => {
      when(activitiesService.getScheduledActivity)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          date: format(new Date(), '2022-12-08'),
          startTime: '10:00',
          endTime: '11:00',
          activitySchedule: {
            activity: { summary: 'Maths level 1' },
            internalLocation: { description: 'Houseblock 1' },
          },
          attendances: [
            { prisonerNumber: 'ABC123', status: 'SCHEDULED' },
            { prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATT' } },
            { prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'ABS' } },
          ],
        } as ScheduledActivity)

      when(activitiesService.getScheduledEventsForPrisoners)
        .calledWith(new Date(2022, 11, 8), ['ABC123', 'ABC321', 'ZXY123'], res.locals.user)
        .mockResolvedValue({
          activities: [
            { eventId: 1, eventDesc: 'Maths', startTime: '10:00', endTime: '11:00', prisonerNumber: 'ABC123' },
          ],
          appointments: [
            {
              eventId: 2,
              eventDesc: 'Appointment with the guv',
              startTime: '15:00',
              endTime: '16:00',
              prisonerNumber: 'ABC123',
            },
          ],
          courtHearings: [
            { eventId: 3, eventDesc: 'Video link', startTime: '09:00', endTime: '10:00', prisonerNumber: 'ABC123' },
            { eventId: 4, eventDesc: 'Video link', startTime: '10:30', endTime: '11:00', prisonerNumber: 'ABC321' },
          ],
          visits: [{ eventId: 5, eventDesc: 'Visit', startTime: '10:30', endTime: '11:00', prisonerNumber: 'ABC123' }],
        } as PrisonerScheduledEvents)

      when(prisonService.getInmateDetails)
        .calledWith(['ABC123', 'ABC321', 'ZXY123'], res.locals.user)
        .mockResolvedValue([
          { offenderNo: 'ABC123', firstName: 'Joe', lastName: 'Bloggs', assignedLivingUnitDesc: 'MDI-1-001' },
          { offenderNo: 'ABC321', firstName: 'Alan', lastName: 'Key', assignedLivingUnitDesc: 'MDI-1-002' },
          { offenderNo: 'ZXY123', firstName: 'Mr', lastName: 'Blobby', assignedLivingUnitDesc: 'MDI-1-003' },
        ] as InmateBasicDetails[])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/attendance-list', {
        activity: {
          allocated: 3,
          attended: 1,
          date: toDate('2022-12-08'),
          location: 'Houseblock 1',
          name: 'Maths level 1',
          notAttended: 1,
          notRecorded: 1,
          time: '10:00 - 11:00',
        },
        attendees: expect.arrayContaining([
          {
            location: 'MDI-1-001',
            name: 'Joe Bloggs',
            otherEvents: [
              {
                endTime: '11:00',
                eventDesc: 'Visit',
                eventId: 5,
                prisonerNumber: 'ABC123',
                startTime: '10:30',
              },
            ],
            prisonerNumber: 'ABC123',
            attendance: { prisonerNumber: 'ABC123', status: 'SCHEDULED' },
          },
          {
            location: 'MDI-1-002',
            name: 'Alan Key',
            otherEvents: [
              {
                startTime: '10:30',
                endTime: '11:00',
                eventDesc: 'Video link',
                eventId: 4,
                prisonerNumber: 'ABC321',
              },
            ],
            prisonerNumber: 'ABC321',
            attendance: { prisonerNumber: 'ABC321', status: 'COMPLETED', attendanceReason: { code: 'ATT' } },
          },
          {
            location: 'MDI-1-003',
            name: 'Mr Blobby',
            otherEvents: [],
            prisonerNumber: 'ZXY123',
            attendance: { prisonerNumber: 'ZXY123', status: 'COMPLETED', attendanceReason: { code: 'ABS' } },
          },
        ]),
      })
    })
  })
})
