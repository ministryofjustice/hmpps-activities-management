import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import atLeast from '../../../../../jest.setup'
import { ActivitySchedule, PrisonerAllocations } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'
import ViewAllocationsRoutes from './viewAllocations'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Exclusions - View allocations', () => {
  const handler = new ViewAllocationsRoutes(activitiesService, prisonService)
  let req: Request
  let res: Response

  const user = {
    username: 'joebloggs',
  }

  beforeEach(() => {
    res = {
      locals: {
        user,
      },
      render: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        prisonerNumber: 'ABC123',
      },
    } as unknown as Request
  })

  describe('GET', () => {
    beforeEach(() => {
      const prisonerInfo = {
        prisonerNumber: 'G4793VF',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
        currentIncentive: {
          level: {
            description: 'Standard',
          },
        },
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('ABC123', res.locals.user)
        .mockResolvedValue(prisonerInfo)

      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(['ABC123'], res.locals.user)
        .mockResolvedValue([
          {
            prisonerNumber: 'ABC123',
            allocations: [
              {
                id: 1,
                scheduleId: 1,
                prisonerNumber: 'ABC123å',
                startDate: '2022-05-19',
                prisonPayBand: { id: 1 },
                exclusions: [{ weekNumber: 1, timeSlot: 'AM', monday: true, daysOfWeek: ['MONDAY'] }],
              },
            ],
          },
        ] as PrisonerAllocations[])

      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue(activitySchedule as unknown as ActivitySchedule)
    })

    it('should render the correct view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/exclusions/view-allocations', {
        activities: [
          {
            activityName: 'Entry level Maths 1',
            allocationId: 1,
            currentWeek: 1,
            scheduledSlots: {
              '1': [
                {
                  day: 'Monday',
                  slots: [],
                },
                {
                  day: 'Tuesday',
                  slots: ['am'],
                },
                {
                  day: 'Wednesday',
                  slots: ['am'],
                },
                {
                  day: 'Thursday',
                  slots: ['am'],
                },
                {
                  day: 'Friday',
                  slots: ['am'],
                },
                {
                  day: 'Saturday',
                  slots: ['am'],
                },
                {
                  day: 'Sunday',
                  slots: ['am'],
                },
              ],
            },
          },
        ],
        prisonerName: 'John Smith',
      })
    })
  })
})
