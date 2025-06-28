import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../../services/activitiesService'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'
import CheckAndConfirmRoutes from './checkAndConfirm'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const mockInstance = {
  id: 123456,
  date: '2025-06-23',
  startTime: '08:30',
  endTime: '11:45',
  timeSlot: 'AM',
  cancelled: false,
  previousScheduledInstanceId: 294539,
  previousScheduledInstanceDate: '2025-06-22',
  nextScheduledInstanceId: 294814,
  nextScheduledInstanceDate: '2025-06-23',
  attendances: [],
  advanceAttendances: [],
  activitySchedule: {
    id: 518,
    description: 'A Wing Cleaner 2',
    capacity: 8,
    activity: {
      id: 539,
      prisonCode: 'RSI',
      attendanceRequired: true,
      inCell: false,
      onWing: true,
      offWing: false,
      pieceWork: false,
      outsideWork: false,
      payPerSession: 'H',
      summary: 'A Wing Cleaner 2',
      description: 'A Wing Cleaner 2',
      category: [],
      riskLevel: 'low',
      minimumEducationLevel: [],
      endDate: '2026-10-05',
      capacity: 8,
      allocated: 8,
      createdTime: '2023-10-23T09:59:24',
      activityState: 'LIVE',
      paid: true,
    },
    scheduleWeeks: 1,
    slots: [],
    startDate: '2023-10-24',
    endDate: '2026-10-05',
    usePrisonRegimeTime: false,
  },
} as unknown as ScheduledActivity

describe('Route Handlers - Not Required or Excused - Check and Confirm', () => {
  const handler = new CheckAndConfirmRoutes(activitiesService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        id: '1',
      },
      session: {
        recordAttendanceJourney: {
          notRequiredOrExcused: {
            selectedPrisoners: ['A1234BC', 'A2345CD'],
          },
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render with the expected view', async () => {
      when(activitiesService.getScheduledActivity).calledWith(1, res.locals.user).mockResolvedValue(mockInstance)
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/not-required-or-excused/check-and-confirm',
        {
          selectedPrisoners: ['A1234BC', 'A2345CD'],
          instance: mockInstance,
        },
      )
    })
  })
})
