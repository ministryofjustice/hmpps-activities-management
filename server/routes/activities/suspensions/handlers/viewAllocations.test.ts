import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import atLeast from '../../../../../jest.setup'
import { Activity, ActivitySchedule, PrisonerAllocations } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'
import ViewAllocationsRoutes from './viewAllocations'
import { PrisonerSuspensionStatus } from '../../manage-allocations/journey'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Suspensions - View allocations', () => {
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
                activityId: 1,
                prisonerNumber: 'ABC123',
                startDate: '2022-05-19',
                prisonPayBand: { id: 1 },
                exclusions: [{ weekNumber: 1, timeSlot: 'AM', monday: true, daysOfWeek: ['MONDAY'] }],
              },
              {
                id: 2,
                scheduleId: 1,
                activityId: 2,
                prisonerNumber: 'ABC123',
                startDate: '2024-05-19',
                prisonPayBand: { id: 1 },
                exclusions: [],
                plannedSuspension: { plannedStartDate: '2024-12-25' },
              },
            ],
          },
        ] as PrisonerAllocations[])

      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          pay: [
            { incentiveLevel: 'STD', rate: 100 },
            { incentiveLevel: 'ENH', rate: 150 },
          ],
          schedules: [{ id: 1 }],
        } as Activity)

      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue(activitySchedule as unknown as ActivitySchedule)
    })

    it('should render the correct view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/suspensions/view-allocations', {
        activeAllocationIdsForSuspending: [1],
        allocationCount: 2,
        suspendedAllocations: [
          {
            id: 2,
            scheduleId: 1,
            activityId: 2,
            prisonerNumber: 'ABC123',
            startDate: '2024-05-19',
            prisonPayBand: { id: 1 },
            exclusions: [],
            plannedSuspension: { plannedStartDate: '2024-12-25' },
          },
        ],
        activeAllocations: [
          {
            activityId: 1,
            exclusions: [
              {
                daysOfWeek: ['MONDAY'],
                monday: true,
                timeSlot: 'AM',
                weekNumber: 1,
              },
            ],
            id: 1,
            prisonPayBand: {
              id: 1,
            },
            prisonerNumber: 'ABC123',
            scheduleId: 1,
            startDate: '2022-05-19',
          },
        ],
        prisonerName: 'John Smith',
        prisonerNumber: 'ABC123',
      })
    })
    it('should render the correct view - all suspended together', async () => {
      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(['ABC123'], res.locals.user)
        .mockResolvedValue([
          {
            prisonerNumber: 'ABC123',
            allocations: [
              {
                id: 1,
                scheduleId: 1,
                activityId: 1,
                prisonerNumber: 'ABC123',
                startDate: '2022-05-19',
                prisonPayBand: { id: 1 },
                exclusions: [],
                status: PrisonerSuspensionStatus.SUSPENDED_WITH_PAY,
                plannedSuspension: { plannedStartDate: '2024-12-25', paid: true },
              },
              {
                id: 2,
                scheduleId: 1,
                activityId: 2,
                prisonerNumber: 'ABC123',
                startDate: '2024-05-19',
                prisonPayBand: { id: 1 },
                exclusions: [],
                status: PrisonerSuspensionStatus.SUSPENDED_WITH_PAY,
                plannedSuspension: { plannedStartDate: '2024-12-25', paid: true },
              },
              {
                id: 3,
                scheduleId: 1,
                activityId: 3,
                prisonerNumber: 'ABC123',
                startDate: '2024-05-19',
                prisonPayBand: null,
                exclusions: [],
                status: PrisonerSuspensionStatus.SUSPENDED_WITH_PAY,
                plannedSuspension: { plannedStartDate: '2024-12-25', paid: true },
              },
            ],
          },
        ] as unknown as PrisonerAllocations[])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/suspensions/view-allocations', {
        activeAllocationIdsForSuspending: [],
        allocationCount: 3,
        suspendedAllocations: [
          {
            id: 1,
            scheduleId: 1,
            activityId: 1,
            prisonerNumber: 'ABC123',
            startDate: '2022-05-19',
            prisonPayBand: { id: 1 },
            exclusions: [],
            status: PrisonerSuspensionStatus.SUSPENDED_WITH_PAY,
            plannedSuspension: { plannedStartDate: '2024-12-25', paid: true },
          },
          {
            id: 2,
            scheduleId: 1,
            activityId: 2,
            prisonerNumber: 'ABC123',
            startDate: '2024-05-19',
            prisonPayBand: { id: 1 },
            exclusions: [],
            status: PrisonerSuspensionStatus.SUSPENDED_WITH_PAY,
            plannedSuspension: { plannedStartDate: '2024-12-25', paid: true },
          },
          // This bottom one mocks an unpaid activity which has been suspended alongside the others, so it is recorded as being paid
          {
            id: 3,
            scheduleId: 1,
            activityId: 3,
            prisonerNumber: 'ABC123',
            startDate: '2024-05-19',
            prisonPayBand: null,
            exclusions: [],
            status: PrisonerSuspensionStatus.SUSPENDED_WITH_PAY,
            plannedSuspension: { plannedStartDate: '2024-12-25', paid: true },
          },
        ],
        activeAllocations: [],
        prisonerName: 'John Smith',
        prisonerNumber: 'ABC123',
      })
    })
  })
})
