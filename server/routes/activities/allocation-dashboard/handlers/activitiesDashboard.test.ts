import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import ActivitiesRoutes from './activitiesDashboard'
import { ActivitySummary } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Activities dashboard', () => {
  const handler = new ActivitiesRoutes(activitiesService)
  let req: Request
  let res: Response

  const mockActivitiesData = () => {
    const maths = {
      id: 1,
      activityName: 'Maths level 1',
      capacity: 150,
      allocated: 75,
      waitlisted: 5,
      outsideWork: false,
    } as ActivitySummary
    const maths2 = {
      id: 1,
      activityName: 'Maths level 2',
      capacity: 150,
      allocated: 75,
      waitlisted: 5,
      outsideWork: false,
    } as ActivitySummary
    const english = {
      id: 2,
      activityName: 'English level 1',
      capacity: 200,
      allocated: 100,
      waitlisted: 2,
      outsideWork: false,
    } as ActivitySummary
    const outsideWorkActivity = {
      id: 3,
      activityName: 'Outside Work Activity',
      capacity: 100,
      allocated: 50,
      waitlisted: 10,
      outsideWork: true,
    } as ActivitySummary

    when(activitiesService.getActivities).mockResolvedValue([maths, maths2, english, outsideWorkActivity])
  }

  beforeEach(() => {
    res = {
      locals: {
        user: {
          externalActivitiesRolledOut: true,
        },
      },
      render: jest.fn(),
    } as unknown as Response

    req = {
      params: { categoryId: '1' },
      query: {},
    } as unknown as Request

    mockActivitiesData()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render activities with their allocation summaries', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/allocation-dashboard/activities', {
        activities: expect.arrayContaining([
          {
            activityName: 'English level 1',
            id: 2,
            capacity: 200,
            allocated: 100,
            percentageAllocated: 50,
            vacancies: 100,
            waitlisted: 2,
            outsideWork: false,
          },
          {
            activityName: 'Maths level 1',
            id: 1,
            capacity: 150,
            allocated: 75,
            percentageAllocated: 50,
            vacancies: 75,
            waitlisted: 5,
            outsideWork: false,
          },
          {
            activityName: 'Maths level 2',
            id: 1,
            capacity: 150,
            allocated: 75,
            percentageAllocated: 50,
            vacancies: 75,
            waitlisted: 5,
            outsideWork: false,
          },
        ]),
        total: { allocated: 250, capacity: 500, percentageAllocated: 50, vacancies: 250, waitlisted: 12 },
        filters: { isOutsideWorkFilter: 'false' },
        searchTerm: undefined,
      })
    })

    it('should render searched activities with their allocation summaries', async () => {
      req.query.searchTerm = 'maths'
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/allocation-dashboard/activities', {
        activities: expect.arrayContaining([
          {
            activityName: 'Maths level 1',
            id: 1,
            capacity: 150,
            allocated: 75,
            percentageAllocated: 50,
            vacancies: 75,
            waitlisted: 5,
            outsideWork: false,
          },
          {
            activityName: 'Maths level 2',
            id: 1,
            capacity: 150,
            allocated: 75,
            percentageAllocated: 50,
            vacancies: 75,
            waitlisted: 5,
            outsideWork: false,
          },
        ]),
        total: { allocated: 150, capacity: 300, percentageAllocated: 50, vacancies: 150, waitlisted: 10 },
        filters: { isOutsideWorkFilter: 'false' },
        searchTerm: 'maths',
      })
    })

    it('should render outside work activities', async () => {
      req.query.isOutsideWorkFilter = 'true'
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/allocation-dashboard/activities', {
        activities: expect.arrayContaining([
          {
            activityName: 'Outside Work Activity',
            id: 3,
            capacity: 100,
            allocated: 50,
            percentageAllocated: 50,
            vacancies: 50,
            waitlisted: 10,
            outsideWork: true,
          },
        ]),
        total: { allocated: 50, capacity: 100, percentageAllocated: 50, vacancies: 50, waitlisted: 10 },
        filters: { isOutsideWorkFilter: 'true' },
      })
    })
  })
})
