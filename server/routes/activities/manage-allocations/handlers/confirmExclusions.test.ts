import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import ConfirmExclusionsRoutes from './confirmExclusions'
import atLeast from '../../../../../jest.setup'
import activitySchedule from '../../../../services/fixtures/activity_schedule_bi_weekly_1.json'
import { ActivitySchedule } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocation - Confirm exclusions', () => {
  const handler = new ConfirmExclusionsRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'LEI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      params: { mode: 'create' },
      session: {
        allocateJourney: {
          inmate: {
            prisonerName: 'John Smith',
            prisonerNumber: 'ABC123',
          },
          activity: {
            scheduleId: 1,
            name: 'Test Activity',
          },
          exclusions: [
            {
              weekNumber: 2,
              timeSlot: 'AM',
              monday: false,
              tuesday: true,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['TUESDAY'],
            },
          ],
          updatedExclusions: [
            {
              weekNumber: 2,
              timeSlot: 'AM',
              monday: true,
              tuesday: false,
              wednesday: false,
              thursday: true,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['MONDAY', 'THURSDAY'],
            },
          ],
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue(activitySchedule as unknown as ActivitySchedule)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/confirm-exclusions', {
        addedSlots: {
          2: [
            {
              day: 'TUESDAY',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:30',
                  endTime: '11:30',
                },
              ],
            },
          ],
        },
        excludedSlots: {
          2: [
            {
              day: 'MONDAY',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:30',
                  endTime: '11:30',
                },
              ],
            },
            {
              day: 'THURSDAY',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:30',
                  endTime: '11:30',
                },
              ],
            },
          ],
        },
      })
    })
  })

  describe('POST', () => {
    it('should update the exclusions on the allocation and redirect with success message when in edit mode', async () => {
      req.params.mode = 'edit'
      req.params.allocationId = '1'

      await handler.POST(req, res)

      expect(activitiesService.updateAllocation).toHaveBeenCalledWith(
        1,
        {
          exclusions: [
            {
              weekNumber: 2,
              timeSlot: 'AM',
              monday: true,
              tuesday: false,
              wednesday: false,
              thursday: true,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['MONDAY', 'THURSDAY'],
            },
          ],
        },
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/allocations/view/1',
        'Allocation updated',
        'You have changed when John Smith should attend Test Activity',
      )
    })

    it('should update the exclusions on the allocation and redirect with success message when in exclude mode', async () => {
      req.params.mode = 'exclude'
      req.params.allocationId = '1'

      await handler.POST(req, res)

      expect(activitiesService.updateAllocation).toHaveBeenCalledWith(
        1,
        {
          exclusions: [
            {
              weekNumber: 2,
              timeSlot: 'AM',
              monday: true,
              tuesday: false,
              wednesday: false,
              thursday: true,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['MONDAY', 'THURSDAY'],
            },
          ],
        },
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/exclusions/prisoner/ABC123',
        'You have changed when John Smith should attend Test Activity',
      )
    })

    it('should redirect without updating allocation if there are no changes in edit mode', async () => {
      req.params.mode = 'edit'
      req.params.allocationId = '1'

      req.session.allocateJourney.exclusions = [
        {
          weekNumber: 2,
          timeSlot: 'AM',
          monday: true,
          tuesday: false,
          wednesday: false,
          thursday: true,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['MONDAY', 'THURSDAY'],
        },
      ]
      req.session.allocateJourney.updatedExclusions = [
        {
          weekNumber: 2,
          timeSlot: 'AM',
          monday: true,
          tuesday: false,
          wednesday: false,
          thursday: true,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['MONDAY', 'THURSDAY'],
        },
      ]

      await handler.POST(req, res)

      expect(activitiesService.updateAllocation).toHaveBeenCalledTimes(0)
      expect(res.redirectWithSuccess).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith('/activities/allocations/view/1')
    })

    it('should redirect without updating allocation if there are no changes in exclude mode', async () => {
      req.params.mode = 'exclude'
      req.params.allocationId = '1'

      req.session.allocateJourney.exclusions = [
        {
          weekNumber: 2,
          timeSlot: 'AM',
          monday: true,
          tuesday: false,
          wednesday: false,
          thursday: true,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['MONDAY', 'THURSDAY'],
        },
      ]
      req.session.allocateJourney.updatedExclusions = [
        {
          weekNumber: 2,
          timeSlot: 'AM',
          monday: true,
          tuesday: false,
          wednesday: false,
          thursday: true,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['MONDAY', 'THURSDAY'],
        },
      ]

      await handler.POST(req, res)

      expect(activitiesService.updateAllocation).toHaveBeenCalledTimes(0)
      expect(res.redirectWithSuccess).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith('/activities/exclusions/prisoner/ABC123')
    })
  })
})
