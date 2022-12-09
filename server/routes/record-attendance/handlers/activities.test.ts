import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import ActivitiesRoutes from './activities'
import ActivitiesService from '../../../services/activitiesService'
import TimeSlot from '../../../enum/timeSlot'
import { ScheduledActivity } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Activities', () => {
  const handler = new ActivitiesRoutes(activitiesService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should redirect to the select period page if date and slot are not provided', async () => {
      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })

    it('should redirect to the select period page if date is not provided', async () => {
      req.query.slot = 'am'
      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })

    it('should redirect to the select period page if time slot is not provided', async () => {
      req.query.date = '2022-12-02'
      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })

    it('should render with the expected view', async () => {
      const dateString = '2022-12-08'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      when(activitiesService.getScheduledActivitiesAtPrison)
        .calledWith(date, date, TimeSlot.AM, res.locals.user)
        .mockResolvedValue([
          {
            id: 1,
            startTime: '10:00',
            endTime: '11:00',
            activitySchedule: {
              activity: { summary: 'Maths level 1' },
              internalLocation: { description: 'Houseblock 1' },
            },
            attendances: [
              { status: 'SCHEDULED' },
              { status: 'COMPLETED', attendanceReason: { code: 'ATT' } },
              { status: 'COMPLETED', attendanceReason: { code: 'ABS' } },
            ],
          } as ScheduledActivity,
        ])

      req.query = {
        date: dateString,
        slot: 'am',
      }
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/activities', {
        activities: [
          {
            allocated: 3,
            attended: 1,
            id: 1,
            location: 'Houseblock 1',
            name: 'Maths level 1',
            notAttended: 1,
            notRecorded: 1,
            time: '10:00 - 11:00',
          },
        ],
        date,
        slot: 'am',
      })
    })
  })
})
