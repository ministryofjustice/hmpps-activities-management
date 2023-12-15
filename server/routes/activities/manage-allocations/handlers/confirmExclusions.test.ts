import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import ConfirmExclusionsRoutes from './confirmExclusions'

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
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/confirm-exclusions', {
        newSlots: {
          2: [
            {
              day: 'MONDAY',
              slots: ['AM'],
            },
            {
              day: 'THURSDAY',
              slots: ['AM'],
            },
          ],
        },
        removedSlots: {
          2: [
            {
              day: 'TUESDAY',
              slots: ['AM'],
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
