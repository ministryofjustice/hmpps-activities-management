import { Request, Response } from 'express'
import { when } from 'jest-when'
import { format } from 'date-fns'
import ActivitiesService from '../../../services/activitiesService'
import { ScheduledActivity } from '../../../@types/activitiesAPI/types'
import PrisonService from '../../../services/prisonService'
import AttendanceListRoutes from './attendanceList'
import { InmateBasicDetails } from '../../../@types/prisonApiImport/types'
import { toDate } from '../../../utils/utils'

jest.mock('../../../services/activitiesService')
jest.mock('../../../services/prisonService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>

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
          date: format(new Date(), '08/12/2022'),
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
          prisonerNumbers: ['ABC123', 'ABC321', 'ZXY123'],
          time: '10:00 - 11:00',
        },
        attendees: expect.arrayContaining([
          {
            attendanceLabel: 'Not attended yet',
            location: 'MDI-1-001',
            name: 'Joe Bloggs',
            prisonerNumber: 'ABC123',
          },
          {
            attendanceLabel: 'Attended',
            location: 'MDI-1-002',
            name: 'Alan Key',
            prisonerNumber: 'ABC321',
          },
          {
            attendanceLabel: 'Absent',
            location: 'MDI-1-003',
            name: 'Mr Blobby',
            prisonerNumber: 'ZXY123',
          },
        ]),
      })
    })
  })
})
